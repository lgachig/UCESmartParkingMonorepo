module "vpc" {
  source = "../../modules/vpc"

  environment          = "prod"
  vpc_cidr             = "10.3.0.0/16"
  public_subnet_cidrs  = ["10.3.1.0/24", "10.3.2.0/24"]
  private_subnet_cidrs = ["10.3.11.0/24", "10.3.12.0/24"]
  availability_zones   = ["us-east-1a", "us-east-1b"]
}

module "security_groups" {
  source      = "../../modules/security_groups"
  environment = "prod"
  vpc_id      = module.vpc.vpc_id
}

locals {
  docker_install_script = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y docker.io docker-compose git
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ubuntu

    # Bootstrap Application
    mkdir -p /home/ubuntu/app
    cd /home/ubuntu/app
    
    # We clone the repo to get the compose files (using public HTTPS or a deploy token if private)
    # Assuming public for the compose files, or we can just download the raw files
    curl -sSL https://raw.githubusercontent.com/JessielCH/scholarship-system-platform/main/deployment/compose/edge.yml -o edge.yml
    curl -sSL https://raw.githubusercontent.com/JessielCH/scholarship-system-platform/main/deployment/compose/core.yml -o core.yml
    curl -sSL https://raw.githubusercontent.com/JessielCH/scholarship-system-platform/main/deployment/compose/compute.yml -o compute.yml

    # Setup Environment Variables for Docker Compose
    echo "DB_PASSWORD=${var.db_password}" > .env
    echo "JWT_SECRET=${var.jwt_secret}" >> .env
    
    mkdir -p keys
    echo "${var.jwt_private_key}" > keys/private.pem
    echo "${var.jwt_public_key}" > keys/public.pem

    # Login to GHCR (Needs a token passed via terraform)
    echo "${var.ghcr_token}" | docker login ghcr.io -u github_user --password-stdin

    # Start the services
    docker-compose -f edge.yml -f core.yml -f compute.yml pull
    docker-compose -f edge.yml -f core.yml -f compute.yml up -d
  EOF
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

module "alb" {
  source          = "../../modules/alb"
  environment     = "prod"
  vpc_id          = module.vpc.vpc_id
  subnets         = module.vpc.public_subnet_ids
  security_groups = [module.security_groups.edge_sg_id]
}

module "asg_core" {
  source        = "../../modules/asg"
  environment   = "prod"
  ami_id        = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
  subnet_ids    = module.vpc.private_subnet_ids
  security_group_ids = [
    module.security_groups.edge_sg_id,
    module.security_groups.core_sg_id,
    module.security_groups.compute_sg_id
  ]
  target_group_arn = module.alb.target_group_arn
  user_data        = local.docker_install_script
  min_size         = 2
  max_size         = 4
  desired_capacity = 2
}

module "ec2_database" {
  source             = "../../modules/ec2"
  environment        = "prod"
  service_name       = "database"
  subnet_id          = module.vpc.private_subnet_ids[0]
  security_group_ids = [module.security_groups.database_sg_id]
  instance_type      = "t2.micro"
  user_data          = local.docker_install_script
  enable_ebs_volume  = true
  ebs_volume_size    = 20
}

module "ec2_security" {
  source             = "../../modules/ec2"
  environment        = "prod"
  service_name       = "security-bastion"
  subnet_id          = module.vpc.public_subnet_ids[0]
  security_group_ids = [module.security_groups.security_sg_id]
  instance_type      = "t2.micro"
  user_data          = local.docker_install_script
  allocate_eip       = true
}
