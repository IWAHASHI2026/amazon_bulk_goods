#!/bin/bash
set -e

# Run migrations only if migration files exist
if ls alembic/versions/*.py 1>/dev/null 2>&1; then
    echo "Running Alembic migrations..."
    alembic upgrade head
else
    echo "No migration files found, skipping Alembic migrations."
fi

echo "Starting Uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
