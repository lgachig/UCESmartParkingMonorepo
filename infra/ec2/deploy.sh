#!/usr/bin/env bash
# Ejecutado en la EC2 por el CD (GitHub Actions) tras publicar imágenes en Docker Hub.
set -euo pipefail

cd /opt/smartparking

if [ -n "${DOCKERHUB_TOKEN:-}" ] && [ -n "${DOCKERHUB_USER:-}" ]; then
  echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USER}" --password-stdin
fi

docker-compose pull
docker-compose up -d
docker-compose ps
