#!/bin/bash
set -euxo pipefail

dnf update -y
dnf install -y docker
systemctl enable docker && systemctl start docker
usermod -aG docker ec2-user

curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

mkdir -p /opt/smartparking

cat > /opt/smartparking/.env <<ENVEOF
${env_content}
ENVEOF
chown -R ec2-user:ec2-user /opt/smartparking
chmod 644 /opt/smartparking/.env

cat > /opt/smartparking/deploy.sh <<'DEPLOY'
#!/usr/bin/env bash
set -euo pipefail
cd /opt/smartparking
if [ -n "$${DOCKERHUB_TOKEN:-}" ] && [ -n "$${DOCKERHUB_USER:-}" ]; then
  echo "$${DOCKERHUB_TOKEN}" | docker login -u "$${DOCKERHUB_USER}" --password-stdin
fi
docker-compose pull
docker-compose up -d --force-recreate
docker-compose ps
DEPLOY
chmod +x /opt/smartparking/deploy.sh

%{ if is_auth ~}
cat > /opt/smartparking/postgres-init.sql <<'SQL'
CREATE DATABASE userdb;
CREATE DATABASE vehicledb;
SQL

cat > /opt/smartparking/docker-compose.yml <<'COMPOSE'
services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin
      POSTGRES_DB: smartparking
    ports: ["5432:5432"]
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres-init.sql:/docker-entrypoint-initdb.d/init.sql
  redis:
    image: redis:7
    restart: unless-stopped
    ports: ["6379:6379"]
  auth-service:
    image: ${dockerhub_user}/${docker_image}:qa
    restart: unless-stopped
    env_file: [.env]
    ports: ["${service_port}:${service_port}"]
    depends_on: [postgres, redis]
volumes:
  postgres_data:
COMPOSE
%{ else ~}
cat > /opt/smartparking/docker-compose.yml <<COMPOSE
services:
  app:
    image: ${dockerhub_user}/${docker_image}:qa
    restart: unless-stopped
    env_file: [.env]
    ports: ["${service_port}:${service_port}"]
COMPOSE
%{ endif ~}

docker-compose -f /opt/smartparking/docker-compose.yml pull || true
docker-compose -f /opt/smartparking/docker-compose.yml up -d --force-recreate || true
