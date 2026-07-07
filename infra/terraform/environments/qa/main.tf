# ── VPC ───────────────────────────────────────────────────────────────────────
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

# ── Security Groups ───────────────────────────────────────────────────────────
module "security_groups" {
  source                    = "../../modules/security_groups"
  environment               = var.environment
  vpc_id                    = module.vpc.vpc_id
  allowed_ssh_cidr          = var.allowed_ssh_cidr
  bastion_security_group_id = module.bastion.security_group_id
}

# ── EIPs ───────────────────────────────
resource "aws_eip" "frontend" { domain = "vpc" }
resource "aws_eip" "gateway"  { domain = "vpc" }

# ── 1) Auth EC2 ───────────────────────────────────────────────────────────────
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

# ── 2) User EC2 ───────────────────────────────────────────────────────────────
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

# ── 3) Vehicle EC2 ────────────────────────────────────────────────────────────
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

# ── 4) Frontend EC2 ───────────────────────────────────────────────────────────
module "frontend" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "frontend"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 0)
  security_group_ids = [module.security_groups.security_group_ids["frontend"]]
  extra_tags         = { Service = "frontend" }
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

# ── 5) Gateway EC2 ────────────────────────────────────────────────────────────
module "gateway" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "gateway"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 0)
  security_group_ids = [module.security_groups.security_group_ids["gateway"]]
  extra_tags         = { Service = "gateway" }
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-gateway"
    docker_image_tag = var.environment
    service_port     = 3006
    is_auth          = false
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  })
}

resource "aws_eip_association" "gateway" {
  instance_id   = module.gateway.instance_id
  allocation_id = aws_eip.gateway.id
}

# ── 6) Parking EC2 ────────────────────────────────────────────────────────────
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

# ── 7) Notification EC2 ───────────────────────────────────────────────────────
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