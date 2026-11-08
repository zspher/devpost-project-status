from datetime import datetime

from ninja import ModelSchema, NinjaAPI, Schema
from tracker.models import Project

api = NinjaAPI()


def user_or_anon(request):
    return request.user


@api.get("/hello/", auth=user_or_anon)
def hello(request):
    return {"message": "Hello World"}
