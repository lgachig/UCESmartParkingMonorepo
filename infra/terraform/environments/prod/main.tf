terraform {
  required_version = ">= 1.5.0"
  # Estado local — ver environments/qa/main.tf
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = { Project = "uce-smartparking", Environment = var.environment, ManagedBy = "terraform" }
  }
}

module "auth" {
  source             = "../../modules/microservice-ec2"
  name               = "auth"
  environment        = var.environment
  instance_type      = var.instance_type
  key_name           = var.key_name
  allowed_ssh_cidr   = var.allowed_ssh_cidr
  service_port       = 3000
  dockerhub_user     = var.dockerhub_user
  docker_image       = "smartparking-auth"
  docker_image_tag   = var.environment
  env_content        = <<-EOF
    DOCKERHUB_USER=${var.dockerhub_user}
    PORT=3000
    DATABASE_URL=postgresql://admin:admin@postgres:5432/smartparking
    REDIS_URL=redis://redis:6379
    JWT_SECRET=${var.jwt_secret}
    JWT_REFRESH_SECRET=${var.jwt_refresh_secret}
    USER_SERVICE_URL=${var.user_service_url}
    INTERNAL_SERVICE_KEY=${var.internal_service_key}
    FRONTEND_URL=${var.frontend_url}
    CORS_ORIGINS=${var.cors_origins}
    EOF
}

module "user" {
  source             = "../../modules/microservice-ec2"
  name               = "user"
  environment        = var.environment
  instance_type      = var.instance_type
  key_name           = var.key_name
  allowed_ssh_cidr   = var.allowed_ssh_cidr
  service_port       = 3001
  dockerhub_user     = var.dockerhub_user
  docker_image       = "smartparking-user"
  docker_image_tag   = var.environment
  env_content        = <<-EOF
    DOCKERHUB_USER=${var.dockerhub_user}
    USER_SERVICE_PORT=3001
    USER_DATABASE_URL=postgresql://admin:admin@${module.auth.elastic_ip}:5432/userdb
    REDIS_URL=redis://${module.auth.elastic_ip}:6379
    JWT_SECRET=${var.jwt_secret}
    INTERNAL_SERVICE_KEY=${var.internal_service_key}
    CORS_ORIGINS=${var.cors_origins}
    EOF
}

module "vehicle" {
  source             = "../../modules/microservice-ec2"
  name               = "vehicle"
  environment        = var.environment
  instance_type      = var.instance_type
  key_name           = var.key_name
  allowed_ssh_cidr   = var.allowed_ssh_cidr
  service_port       = 3003
  dockerhub_user     = var.dockerhub_user
  docker_image       = "smartparking-vehicle"
  docker_image_tag   = var.environment
  env_content        = <<-EOF
    DOCKERHUB_USER=${var.dockerhub_user}
    VEHICLE_SERVICE_PORT=3003
    VEHICLE_DATABASE_URL=postgresql://admin:admin@${module.auth.elastic_ip}:5432/vehicledb
    REDIS_URL=redis://${module.auth.elastic_ip}:6379
    JWT_SECRET=${var.jwt_secret}
    INTERNAL_SERVICE_KEY=${var.internal_service_key}
    CORS_ORIGINS=${var.cors_origins}
    EOF
}

module "frontend" {
  source             = "../../modules/microservice-ec2"
  name               = "frontend"
  environment        = var.environment
  instance_type      = var.instance_type
  key_name           = var.key_name
  allowed_ssh_cidr   = var.allowed_ssh_cidr
  service_port       = 3002
  dockerhub_user     = var.dockerhub_user
  docker_image       = "smartparking-frontend"
  docker_image_tag   = var.environment
  env_content        = "DOCKERHUB_USER=${var.dockerhub_user}"
}
