module "vpc" {
  source      = "../../modules/vpc"
  environment = var.environment
}

# ── Bastion Host ────────────────────────────────────────────────────────────
# Single public EC2 that acts as the SSH jump server.
# Only the bastion has a public SSH port open; all microservice instances
# allow SSH only from the bastion security group.
module "bastion" {
  source           = "../../modules/bastion"
  environment      = var.environment
  vpc_id           = module.vpc.vpc_id
  subnet_id        = element(module.vpc.public_subnet_ids, 0)
  key_name         = var.key_name
  instance_type    = "t3.micro"
  allowed_ssh_cidr = [var.allowed_ssh_cidr]
}


module "security_groups" {
  source                    = "../../modules/security_groups"
  environment               = var.environment
  vpc_id                    = module.vpc.vpc_id
  allowed_ssh_cidr          = var.allowed_ssh_cidr
  bastion_security_group_id = module.bastion.security_group_id
}

# ── Elastic IPs (only frontend and gateway need public static IPs, others use private IPs) ──
resource "aws_eip" "frontend"    { domain = "vpc" }
resource "aws_eip" "gateway"     { domain = "vpc" }

# ── 1) Auth EC2 — auth-service + postgres + redis + kafka ──────────────────
module "auth" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "auth"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 0)
  security_group_ids = [module.security_groups.security_group_ids["auth"]]
  root_volume_size   = 20
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-auth"
    docker_image_tag = var.environment
    service_port     = 3000
    is_auth          = true
    env_content      = <<-EOF
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
  })
}

# ── 2) User EC2 ─────────────────────────────────────────────────────────────
module "user" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "user"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 1)
  security_group_ids = [module.security_groups.security_group_ids["user"]]
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-user"
    docker_image_tag = var.environment
    service_port     = 3001
    is_auth          = false
    env_content      = <<-EOF
      DOCKERHUB_USER=${var.dockerhub_user}
      USER_SERVICE_PORT=3001
      USER_DATABASE_URL=postgresql://admin:admin@${module.auth.private_ip}:5432/userdb
      REDIS_URL=redis://${module.auth.private_ip}:6379
      JWT_SECRET=${var.jwt_secret}
      INTERNAL_SERVICE_KEY=${var.internal_service_key}
      CORS_ORIGINS=${var.cors_origins}
      EOF
  })
}

# ── 3) Vehicle EC2 ──────────────────────────────────────────────────────────
module "vehicle" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "vehicle"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 2)
  security_group_ids = [module.security_groups.security_group_ids["vehicle"]]
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-vehicle"
    docker_image_tag = var.environment
    service_port     = 3003
    is_auth          = false
    env_content      = <<-EOF
      DOCKERHUB_USER=${var.dockerhub_user}
      VEHICLE_SERVICE_PORT=3003
      VEHICLE_DATABASE_URL=postgresql://admin:admin@${module.auth.private_ip}:5432/vehicledb
      REDIS_URL=redis://${module.auth.private_ip}:6379
      JWT_SECRET=${var.jwt_secret}
      INTERNAL_SERVICE_KEY=${var.internal_service_key}
      CORS_ORIGINS=${var.cors_origins}
      EOF
  })
}

# ── 4) Frontend EC2 ─────────────────────────────────────────────────────────
module "frontend" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "frontend"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 0)
  security_group_ids = [module.security_groups.security_group_ids["frontend"]]
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-frontend"
    docker_image_tag = var.environment
    service_port     = 3002
    is_auth          = false
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  })
}

resource "aws_eip_association" "frontend" {
  instance_id   = module.frontend.instance_id
  allocation_id = aws_eip.frontend.id
}

# ── 5) Gateway EC2 ──────────────────────────────────────────────────────────
module "gateway" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "gateway"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 1)
  security_group_ids = [module.security_groups.security_group_ids["gateway"]]
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-gateway"
    docker_image_tag = var.environment
    service_port     = 3006
    is_auth          = false
    env_content      = <<-EOF
      GATEWAY_PORT=3006
      JWT_SECRET=${var.jwt_secret}
      REDIS_URL=redis://${module.auth.private_ip}:6379
      AUTH_SERVICE_URL=http://${module.auth.private_ip}:3000
      USER_SERVICE_URL=http://${module.user.private_ip}:3001
      VEHICLE_SERVICE_URL=http://${module.vehicle.private_ip}:3003
      PARKING_SERVICE_URL=http://${module.parking.private_ip}:3004
      RESERVATION_SERVICE_URL=http://${module.reservation.private_ip}:3005
      CORS_ORIGINS=${var.cors_origins}
      THROTTLE_TTL=60000
      THROTTLE_LIMIT=60
      EOF
  })
}

resource "aws_eip_association" "gateway" {
  instance_id   = module.gateway.instance_id
  allocation_id = aws_eip.gateway.id
}

# ── 6) Parking EC2 ──────────────────────────────────────────────────────────
module "parking" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "parking"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 2)
  security_group_ids = [module.security_groups.security_group_ids["parking"]]
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-parking"
    docker_image_tag = var.environment
    service_port     = 3004
    is_auth          = false
    env_content      = <<-EOF
      DOCKERHUB_USER=${var.dockerhub_user}
      PARKING_SERVICE_PORT=3004
      PARKING_DATABASE_URL=postgresql://admin:admin@${module.auth.private_ip}:5432/parkingdb
      REDIS_URL=redis://${module.auth.private_ip}:6379
      KAFKA_BROKERS=${module.auth.private_ip}:9092
      JWT_SECRET=${var.jwt_secret}
      INTERNAL_SERVICE_KEY=${var.internal_service_key}
      CORS_ORIGINS=${var.cors_origins}
      EOF
  })
}

# ── 7) Reservation EC2 ──────────────────────────────────────────────────────
module "reservation" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "reservation"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 0)
  security_group_ids = [module.security_groups.security_group_ids["reservation"]]
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-reservation"
    docker_image_tag = var.environment
    service_port     = 3005
    is_auth          = false
    env_content      = <<-EOF
      DOCKERHUB_USER=${var.dockerhub_user}
      RESERVATION_SERVICE_PORT=3005
      RESERVATION_DATABASE_URL=postgresql://admin:admin@${module.auth.private_ip}:5432/reservationdb
      REDIS_URL=redis://${module.auth.private_ip}:6379
      KAFKA_BROKERS=${module.auth.private_ip}:9092
      JWT_SECRET=${var.jwt_secret}
      INTERNAL_SERVICE_KEY=${var.internal_service_key}
      PARKING_SERVICE_URL=http://${module.parking.private_ip}:3004
      USER_SERVICE_URL=http://${module.user.private_ip}:3001
      VEHICLE_SERVICE_URL=http://${module.vehicle.private_ip}:3003
      CORS_ORIGINS=${var.cors_origins}
      RESERVATION_EXPIRY_MINUTES=15
      EOF
  })
}
