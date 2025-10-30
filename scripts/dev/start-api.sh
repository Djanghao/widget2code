#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

BACKEND_PORT=${BACKEND_PORT:-8010}

echo "Starting API server on port $BACKEND_PORT..."
cd apps/api
source .venv/bin/activate
python server.py
