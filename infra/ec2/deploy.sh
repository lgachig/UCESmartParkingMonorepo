set -euo pipefail

cd /opt/smartparking

if [ -n "${DOCKERHUB_TOKEN:-}" ] && [ -n "${DOCKERHUB_USER:-}" ]; then
  echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USER}" --password-stdin
fi

if docker compose version &>/dev/null; then
  docker compose pull
  docker compose up -d --force-recreate
  docker compose ps
else
  docker-compose pull
  docker-compose up -d --force-recreate
  docker-compose ps
fi