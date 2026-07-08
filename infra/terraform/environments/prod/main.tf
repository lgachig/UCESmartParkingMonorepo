# ── VPC ───────────────────────────────────────────────────────────────────────

locals {
  lab_b_reservation_url = var.lab_b_reservation_private_ip != "" ? "http://${var.lab_b_reservation_private_ip}:3005" : ""
  lab_b_payment_url     = var.lab_b_payment_private_ip != "" ? "http://${var.lab_b_payment_private_ip}:3007" : ""
  lab_b_realtime_url    = var.lab_b_realtime_public_ip != "" ? "http://${var.lab_b_realtime_public_ip}:3008" : ""
  lab_b_ai_url          = var.lab_b_ai_private_ip != "" ? "http://${var.lab_b_ai_private_ip}:3009" : ""
}

module "vpc" {
  source      = "../../modules/vpc"
  environment = var.environment
}

# ── Bastion ───────────────────────────────────────────────────────────────────
module "bastion" {
  source           = "../../modules/bastion"
  environment      = var.environment
  vpc_id           = module.vpc.vpc_id
  subnet_id        = element(module.vpc.public_subnet_ids, 0)
  key_name         = var.key_name
  instance_type    = "t3.micro"
  allowed_ssh_cidr = [var.allowed_ssh_cidr]
}

# ── Security Groups ────────────────────────────────────────────────────────────
# frontend y gateway ya NO reciben el puerto público directo (0.0.0.0/0):
# ahora solo el ALB de cada uno puede llegarles (reglas from_alb más abajo).
module "security_groups" {
  source                        = "../../modules/security_groups"
  environment                   = var.environment
  vpc_id                        = module.vpc.vpc_id
  allowed_ssh_cidr              = var.allowed_ssh_cidr
  bastion_security_group_id     = module.bastion.security_group_id
  enable_frontend_public_direct = false
  enable_gateway_public_direct  = false
}

# ── 1) Auth EC2 (instancia única, igual que QA) ────────────────────────────────
module "auth" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "auth"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 0)
  security_group_ids = [module.security_groups.security_group_ids["auth"]]
  root_volume_size   = 30
  extra_tags         = { Service = "auth" }
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-auth"
    docker_image_tag = var.environment
    service_port     = 3000
    is_auth          = true
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  })
}

# ── 2) User EC2 (instancia única, igual que QA) ────────────────────────────────
module "user" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "user"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 0)
  security_group_ids = [module.security_groups.security_group_ids["user"]]
  extra_tags         = { Service = "user" }
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-user"
    docker_image_tag = var.environment
    service_port     = 3001
    is_auth          = false
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  })
}

# ── 3) Vehicle EC2 (instancia única, igual que QA) ─────────────────────────────
module "vehicle" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "vehicle"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 0)
  security_group_ids = [module.security_groups.security_group_ids["vehicle"]]
  extra_tags         = { Service = "vehicle" }
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-vehicle"
    docker_image_tag = var.environment
    service_port     = 3003
    is_auth          = false
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  })
}

# ── 4) Frontend → ASG + ALB ─────────────────────────────────────────────────────
module "frontend_asg" {
  source                      = "../../modules/asg_alb"
  environment                 = var.environment
  service_name                = "frontend"
  vpc_id                      = module.vpc.vpc_id
  public_subnet_ids           = module.vpc.public_subnet_ids
  instance_type               = var.instance_type
  key_name                    = var.key_name
  instance_security_group_ids = [module.security_groups.security_group_ids["frontend"]]
  app_port                    = 3002
  health_check_path           = "/"
  min_size                    = var.asg_min_size
  max_size                    = var.asg_max_size
  desired_capacity            = var.asg_desired_capacity
  extra_tags                  = { Service = "frontend" }
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-frontend"
    docker_image_tag = var.environment
    service_port     = 3002
    is_auth          = false
    env_content      = <<-ENV
      DOCKERHUB_USER=${var.dockerhub_user}
      PORT=3002
      # NOTA: Las variables NEXT_PUBLIC_* son inlineadas en el build de Next.js (Docker build en GitHub Actions).
      # La fuente de verdad real es el build-arg NEXT_PUBLIC_GATEWAY_URL provisto en el workflow de GitHub Actions
      # (.github/workflows/prod.yml) a partir del secret PROD_GATEWAY_URL (al cual se le concatena /api).
      # Se mantiene y alinea aquí solo por consistencia para peticiones Server-Side (SSR) en runtime y documentación.
      NEXT_PUBLIC_GATEWAY_URL=http://${module.gateway_asg.alb_dns_name}/api
      NEXT_PUBLIC_REALTIME_URL=${local.lab_b_realtime_url != "" ? local.lab_b_realtime_url : "http://localhost:3008"}
    ENV
  })
}

# frontend solo acepta tráfico desde su propio ALB
resource "aws_security_group_rule" "frontend_from_alb" {
  type                     = "ingress"
  from_port                = 3002
  to_port                  = 3002
  protocol                 = "tcp"
  source_security_group_id = module.frontend_asg.alb_security_group_id
  security_group_id        = module.security_groups.security_group_ids["frontend"]
  description              = "frontend accesible solo desde su ALB"
}

# ── 5) Gateway → ASG + ALB ───────────────────────────────────────────────────────
module "gateway_asg" {
  source                      = "../../modules/asg_alb"
  environment                 = var.environment
  service_name                = "gateway"
  vpc_id                      = module.vpc.vpc_id
  public_subnet_ids           = module.vpc.public_subnet_ids
  instance_type               = var.instance_type
  key_name                    = var.key_name
  instance_security_group_ids = [module.security_groups.security_group_ids["gateway"]]
  app_port                    = 3006
  health_check_path           = "/health"
  min_size                    = var.asg_min_size
  max_size                    = var.asg_max_size
  desired_capacity            = var.asg_desired_capacity
  extra_tags                  = { Service = "gateway" }
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-gateway"
    docker_image_tag = var.environment
    service_port     = 3006
    is_auth          = false
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  })
}

resource "aws_security_group_rule" "gateway_from_alb" {
  type                     = "ingress"
  from_port                = 3006
  to_port                  = 3006
  protocol                 = "tcp"
  source_security_group_id = module.gateway_asg.alb_security_group_id
  security_group_id        = module.security_groups.security_group_ids["gateway"]
  description              = "gateway accesible solo desde su ALB"
}

# ── 6) Parking EC2 (instancia única, igual que QA) ─────────────────────────────
module "parking" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "parking"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 0)
  security_group_ids = [module.security_groups.security_group_ids["parking"]]
  extra_tags         = { Service = "parking" }
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-parking"
    docker_image_tag = var.environment
    service_port     = 3004
    is_auth          = false
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  })
}

# ── 7) Notification EC2 (Account A — igual que QA) ────────────────────────────
module "notification" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "notification"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 0)
  security_group_ids = [module.security_groups.security_group_ids["notification"]]
  extra_tags         = { Service = "notification" }
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-notification"
    docker_image_tag = var.environment
    service_port     = 3011
    is_auth          = false
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  })
}

# ── 8) Audit EC2 (Account A — igual que QA) ───────────────────────────────────
module "audit" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "audit"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 0)
  security_group_ids = [module.security_groups.security_group_ids["audit"]]
  extra_tags         = { Service = "audit" }
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-audit"
    docker_image_tag = var.environment
    service_port     = 3012
    is_auth          = false
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  })
}

