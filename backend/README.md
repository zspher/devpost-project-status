# API backend


## Run & Install
1. Install all deps
```sh
cd backend
uv sync
```
2. Migrate & run django server
```sh
cd backend
uv run python manage.py migrate
uv run python manage.py runserver
```
3. Open [http://localhost:8000](http://localhost:8000) to see the result.
