set -euo pipefail

cd /opt/smartparking

cleanup_migrations() {
  local base="$1"

  for dir in \
    20260626191746_init \
    20260626191801_init \
    20260626191816_init \
    20260626191829_init \
    20260626191842_init \
    20260626191854_init
  do
    if [ -d "${base}/${dir}" ]; then
      echo "🧹 Eliminando ${base}/${dir}"
      rm -rf "${base}/${dir}"
    fi
  done
}

cleanup_migrations prisma/auth/migrations
cleanup_migrations prisma/user/migrations
cleanup_migrations prisma/vehicle/migrations
cleanup_migrations prisma/parking/migrations
cleanup_migrations prisma/reservation/migrations
cleanup_migrations prisma/payment/migrations

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