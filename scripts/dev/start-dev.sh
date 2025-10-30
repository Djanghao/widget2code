#!/bin/bash
set -e

# Load .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-3060}

echo "Starting Widget Factory development server on port $FRONTEND_PORT..."
npm run dev
