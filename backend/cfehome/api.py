import shutil
from datetime import datetime

import pygit2
from django.db.models import Q
from django.shortcuts import get_object_or_404
from ninja import ModelSchema, NinjaAPI, Schema

from helpers import GitUtils
from tracker.models import Commit, Project, Status

api = NinjaAPI()


def user_or_anon(request):
    return request.user


@api.get("/hello/", auth=user_or_anon)
def hello(request):
    return {"message": "Hello World"}


class CommitSchema(Schema):
    id: int
    date: datetime
    hash: str


class ProjectSchema(ModelSchema):
    last_commit: CommitSchema | None = None
    first_commit: CommitSchema | None = None
    second_commit: CommitSchema | None = None

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "git_url",
            "devpost_url",
            "lines_of_code",
            "total_commits",
            "status",
        )


@api.get("/projects/", auth=user_or_anon, response=list[ProjectSchema])
def list_projects(request):
    return Project.objects.select_related(
        "last_commit", "first_commit", "second_commit"
    ).all()


@api.get("/projects/{project_id}", auth=user_or_anon, response=ProjectSchema)
def get_project(request, project_id: int):
    qs = Project.objects.select_related("last_commit", "first_commit", "second_commit")
    return get_object_or_404(qs, id=project_id)


class ProjectCreateSchema(Schema):
    name: str
    git_url: str
    devpost_url: str


def _update_commit_fields(project: Project, git: GitUtils) -> None:
    """Extract boundary commits from an already-cloned repo and update the project."""
    count, first, second, last = git.get_boundary_commits()

    project.total_commits = count
    project.status = Status.COMPLETE

    if first:
        project.first_commit, _ = Commit.objects.get_or_create(
            hash=str(first.id),
            defaults={"date": datetime.fromtimestamp(first.commit_time)},
        )
    if second:
        project.second_commit, _ = Commit.objects.get_or_create(
            hash=str(second.id),
            defaults={"date": datetime.fromtimestamp(second.commit_time)},
        )
    if last:
        project.last_commit, _ = Commit.objects.get_or_create(
            hash=str(last.id),
            defaults={"date": datetime.fromtimestamp(last.commit_time)},
        )


def _sync_project_git(project: Project) -> None:
    """Clone the repo and populate commit metadata. Sets status accordingly."""
    try:
        git = GitUtils(giturl=project.git_url, name=f"{project.id}-{project.name}")
        git.clone()
        _update_commit_fields(project, git)
    except pygit2.GitError:
        project.status = Status.NO_ACCESS
    project.save()


@api.post("/projects/", auth=user_or_anon, response={201: ProjectSchema, 409: dict})
def create_project(request, payload: ProjectCreateSchema):
    if Project.objects.filter(devpost_url=payload.devpost_url).exists():
        return 409, {"detail": "A project with this devpost URL already exists."}
    project = Project.objects.create(
        name=payload.name, git_url=payload.git_url, devpost_url=payload.devpost_url
    )
    _sync_project_git(project)
    return 201, project


@api.put(
    "/projects/{project_id}",
    auth=user_or_anon,
    response={200: ProjectSchema, 409: dict},
)
def update_project(request, project_id: int, payload: ProjectCreateSchema):
    if (
        Project.objects.filter(devpost_url=payload.devpost_url)
        .exclude(id=project_id)
        .exists()
    ):
        return 409, {"detail": "A project with this devpost URL already exists."}
    project = get_object_or_404(Project, id=project_id)
    project.name = payload.name
    project.git_url = payload.git_url
    project.devpost_url = payload.devpost_url
    project.save()
    _sync_project_git(project)
    return 200, project


@api.post("/projects/{project_id}/refresh", auth=user_or_anon, response=ProjectSchema)
def refresh_project(request, project_id: int):
    project = get_object_or_404(Project, id=project_id)
    try:
        git = GitUtils(giturl=project.git_url, name=f"{project.id}-{project.name}")
        if git.path.exists():
            git.pull()
        else:
            git.clone()
        _update_commit_fields(project, git)
    except pygit2.GitError:
        project.status = Status.NO_ACCESS
    project.save()
    return project


@api.delete("/projects/{project_id}", auth=user_or_anon, response={204: None})
def delete_project(request, project_id: int):
    project = get_object_or_404(Project, id=project_id)

    # Collect commits to check for orphans after deletion
    commits = [
        c
        for c in [project.first_commit, project.second_commit, project.last_commit]
        if c
    ]

    # Remove local clone
    git = GitUtils(giturl=project.git_url, name=f"{project.id}-{project.name}")
    if git.path.exists():
        shutil.rmtree(git.path)

    project.delete()

    # Delete orphaned commits not referenced by any other project
    for commit in commits:
        still_referenced = Project.objects.filter(
            Q(first_commit=commit) | Q(second_commit=commit) | Q(last_commit=commit)
        ).exists()
        if not still_referenced:
            commit.delete()

    return 204, None
