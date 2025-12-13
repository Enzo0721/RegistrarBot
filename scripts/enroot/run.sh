#!/usr/bin/env bash

set -e

IMAGE_NAME=registrarbot
PORT=${SERVER_PORT:-3000}

echo "Starting RegistrarBot Enroot container on port $PORT"

enroot start \
  --rw \
  --env SERVER_PORT=$PORT \
  $IMAGE_NAME
