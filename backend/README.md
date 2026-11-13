# API backend


## Run & Install
1. install all deps
```sh
cd backend
uv sync
```
2. migrate & run django server
```sh
cd backend
uv run python manage.py migrate
uv run python manage.py runserver
```
