module "vpc" {
  source      = "../../modules/vpc"
  environment = var.environment
}

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
  source           = "../../modules/security_groups"
  environment      = var.environment
  vpc_id           = module.vpc.vpc_id
  allowed_ssh_cidr          = var.allowed_ssh_cidr
  bastion_security_group_id = module.bastion.security_group_id
}

resource "aws_eip" "frontend" { domain = "vpc" }
resource "aws_eip" "gateway" { domain = "vpc" }

module "auth" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "auth"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 0)
  security_group_ids = [module.security_groups.security_group_ids["auth"]]
  root_volume_size   = 30
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
      PAYMENT_SERVICE_URL=http://${module.payment.private_ip}:3007
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

module "payment" {
  source             = "../../modules/ec2"
  environment        = var.environment
  service_name       = "payment"
  instance_type      = var.instance_type
  key_name           = var.key_name
  subnet_id          = element(module.vpc.public_subnet_ids, 0)
  security_group_ids = [module.security_groups.security_group_ids["payment"]]
  user_data = templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-payment"
    docker_image_tag = var.environment
    service_port     = 3007
    is_auth          = false
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  })
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_security_group" "prod_alb_sg" {
  name        = "prod-alb-sg"
  description = "Security Group for Production ALB (Ports 80 & 443)"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "prod-alb-sg"
    Environment = "prod"
  }
}

resource "aws_lb" "prod_alb" {
  name               = "prod-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.prod_alb_sg.id]
  subnets            = module.vpc.public_subnet_ids

  tags = {
    Name        = "prod-alb"
    Environment = "prod"
  }
}

resource "aws_lb_target_group" "prod_frontend_tg" {
  name     = "prod-frontend-tg"
  port     = 3002
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    protocol            = "HTTP"
    matcher             = "200-399"
  }

  tags = {
    Name        = "prod-frontend-tg"
    Environment = "prod"
  }
}

resource "aws_lb_target_group" "prod_gateway_tg" {
  name     = "prod-gateway-tg"
  port     = 3006
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    protocol            = "HTTP"
    matcher             = "200-399"
  }

  tags = {
    Name        = "prod-gateway-tg"
    Environment = "prod"
  }
}

resource "aws_lb_listener" "frontend_http" {
  load_balancer_arn = aws_lb.prod_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.prod_frontend_tg.arn
  }
}

resource "aws_lb_listener" "gateway_http" {
  load_balancer_arn = aws_lb.prod_alb.arn
  port              = 3006
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.prod_gateway_tg.arn
  }
}

resource "aws_lb_target_group_attachment" "frontend_static" {
  target_group_arn = aws_lb_target_group.prod_frontend_tg.arn
  target_id        = module.frontend.instance_id
  port             = 3002
}

resource "aws_lb_target_group_attachment" "gateway_static" {
  target_group_arn = aws_lb_target_group.prod_gateway_tg.arn
  target_id        = module.gateway.instance_id
  port             = 3006
}

resource "aws_launch_template" "prod_frontend_lt" {
  name_prefix   = "prod-frontend-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  key_name      = var.key_name

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [module.security_groups.security_group_ids["frontend"]]
  }

  user_data = base64encode(templatefile("${path.module}/templates/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = "smartparking-frontend"
    docker_image_tag = var.environment
    service_port     = 3002
    is_auth          = false
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "prod-frontend-asg"
      Environment = "prod"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_launch_template" "prod_gateway_lt" {
  name_prefix   = "prod-gateway-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  key_name      = var.key_name

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [module.security_groups.security_group_ids["gateway"]]
  }

  user_data = base64encode(templatefile("${path.module}/templates/user-data.sh.tpl", {
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
      PAYMENT_SERVICE_URL=http://${module.payment.private_ip}:3007
      CORS_ORIGINS=http://${aws_lb.prod_alb.dns_name},http://${aws_lb.prod_alb.dns_name}:3006,http://${aws_eip.frontend.public_ip}:3002,http://${aws_eip.gateway.public_ip}:3006
      THROTTLE_TTL=60000
      THROTTLE_LIMIT=60
      EOF
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "prod-gateway-asg"
      Environment = "prod"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "prod_frontend_asg" {
  name                      = "prod-frontend-asg"
  min_size                  = 1
  max_size                  = 2
  desired_capacity          = 1
  vpc_zone_identifier       = module.vpc.public_subnet_ids
  health_check_type         = "ELB"
  health_check_grace_period = 120

  launch_template {
    id      = aws_launch_template.prod_frontend_lt.id
    version = "$Latest"
  }

  target_group_arns = [aws_lb_target_group.prod_frontend_tg.arn]

  tag {
    key                 = "Name"
    value               = "prod-frontend-asg"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = "prod"
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_group" "prod_gateway_asg" {
  name                      = "prod-gateway-asg"
  min_size                  = 1
  max_size                  = 2
  desired_capacity          = 1
  vpc_zone_identifier       = module.vpc.public_subnet_ids
  health_check_type         = "ELB"
  health_check_grace_period = 120

  launch_template {
    id      = aws_launch_template.prod_gateway_lt.id
    version = "$Latest"
  }

  target_group_arns = [aws_lb_target_group.prod_gateway_tg.arn]

  tag {
    key                 = "Name"
    value               = "prod-gateway-asg"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = "prod"
    propagate_at_launch = true
  }
}
