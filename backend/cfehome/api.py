from datetime import datetime

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
