[parallel]
start: start-backend start-frontend

start-backend:
    cd backend && uv run python manage.py runserver

start-frontend:
    cd frontend && bun dev

