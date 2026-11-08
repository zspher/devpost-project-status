from datetime import datetime

from django.shortcuts import get_object_or_404
from ninja import ModelSchema, NinjaAPI, Schema

from tracker.models import Project

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
    last_commit: CommitSchema | None
    first_commit: CommitSchema | None
    second_commit: CommitSchema | None

    class Meta:
        model = Project
        fields = ["id", "name", "git_url", "lines_of_code", "status"]


@api.get("/projects/", auth=user_or_anon, response=list[ProjectSchema])
def list_projects(request):
    return Project.objects.select_related(
        "last_commit", "first_commit", "second_commit"
    ).all()


@api.get("/projects/{project_id}", auth=user_or_anon, response=ProjectSchema)
def get_project(request, project_id: int):
    qs = Project.objects.select_related("last_commit", "first_commit", "second_commit")
    return get_object_or_404(qs, id=project_id)
