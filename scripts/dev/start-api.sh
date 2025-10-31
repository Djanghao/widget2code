#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

BACKEND_PORT=${BACKEND_PORT:-8010}

echo "Starting API server on port $BACKEND_PORT..."
cd apps/api
source .venv/bin/activate
python server.py
