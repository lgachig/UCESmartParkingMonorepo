# ── VPC prod-lab-b (Account B) ───────────────────────────────────────────────
module "vpc" {
  source            = "../../modules/vpc_lab"
  environment       = var.environment
  vpc_cidr          = var.vpc_cidr
  subnet_cidr       = var.subnet_cidr
  availability_zone = var.availability_zone
}

data "aws_vpc" "lab_a" {
  provider = aws.accepter
  default  = true
}

data "aws_route_table" "lab_a_main" {
  provider = aws.accepter
  vpc_id   = data.aws_vpc.lab_a.id

  filter {
    name   = "association.main"
    values = ["true"]
  }
}

module "peering" {
  source = "../../modules/vpc_peering"

  providers = {
    aws.requester = aws
    aws.accepter  = aws.accepter
  }

  requester_vpc_id         = module.vpc.vpc_id
  requester_cidr           = module.vpc.cidr_block
  requester_route_table_id = module.vpc.route_table_id
  requester_name           = var.environment

  accepter_vpc_id         = data.aws_vpc.lab_a.id
  accepter_cidr           = data.aws_vpc.lab_a.cidr_block
  accepter_route_table_id = data.aws_route_table.lab_a_main.id
  accepter_name           = var.lab_a_environment
}

module "security_groups" {
  source             = "../../modules/security_groups"
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  bastion_cidr_block = var.lab_a_vpc_cidr
}

resource "aws_security_group_rule" "reservation_from_lab_a_gateway" {
  type              = "ingress"
  from_port         = 3005
  to_port           = 3005
  protocol          = "tcp"
  cidr_blocks       = [var.lab_a_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["reservation"]
  description       = "reservation accesible desde prod gateway (peering)"
}

resource "aws_security_group_rule" "payment_from_lab_a_gateway" {
  type              = "ingress"
  from_port         = 3007
  to_port           = 3007
  protocol          = "tcp"
  cidr_blocks       = [var.lab_a_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["payment"]
  description       = "payment accesible desde prod gateway (peering)"
}

resource "aws_security_group_rule" "ai_from_lab_a_gateway" {
  type              = "ingress"
  from_port         = 3009
  to_port           = 3009
  protocol          = "tcp"
  cidr_blocks       = [var.lab_a_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["ai"]
  description       = "ai accesible desde prod gateway (peering)"
}

resource "aws_eip" "realtime" {
  domain = "vpc"
}

module "reservation" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "reservation"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = module.vpc.public_subnet_id
  security_group_ids = [module.security_groups.security_group_ids["reservation"]]
  extra_tags         = { Service = "reservation" }
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-reservation"
    docker_image_tag = var.lab_a_environment
    service_port     = 3005
    is_auth          = false
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  })
}

module "payment" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "payment"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = module.vpc.public_subnet_id
  security_group_ids = [module.security_groups.security_group_ids["payment"]]
  extra_tags         = { Service = "payment" }
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-payment"
    docker_image_tag = var.lab_a_environment
    service_port     = 3007
    is_auth          = false
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  })
}

module "realtime" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "realtime"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = module.vpc.public_subnet_id
  security_group_ids = [module.security_groups.security_group_ids["realtime"]]
  extra_tags         = { Service = "realtime" }
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-realtime"
    docker_image_tag = var.lab_a_environment
    service_port     = 3008
    is_auth          = false
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  })
}

resource "aws_eip_association" "realtime" {
  instance_id   = module.realtime.instance_id
  allocation_id = aws_eip.realtime.id
}

module "ai" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "ai"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = module.vpc.public_subnet_id
  security_group_ids = [module.security_groups.security_group_ids["ai"]]
  extra_tags         = { Service = "ai" }
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-ai"
    docker_image_tag = var.lab_a_environment
    service_port     = 3009
    is_auth          = false
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  })
}
