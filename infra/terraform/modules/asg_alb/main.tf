data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

# ── Security Group del ALB (público) ──────────────────────────────────────────
resource "aws_security_group" "alb" {
  name        = "${var.environment}-${var.service_name}-alb-sg"
  description = "SG para el ALB de ${var.environment}-${var.service_name}"
  vpc_id      = var.vpc_id

  lifecycle { create_before_destroy = true }

  ingress {
    from_port   = var.app_port
    to_port     = var.app_port
    protocol    = "tcp"
    cidr_blocks = var.allowed_alb_cidr
    description = "Acceso publico al ${var.service_name}"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-${var.service_name}-alb-sg"
    Environment = var.environment
  }
}

# ── Application Load Balancer ─────────────────────────────────────────────────
resource "aws_lb" "this" {
  name               = "${var.environment}-${var.service_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  tags = {
    Name        = "${var.environment}-${var.service_name}-alb"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "this" {
  name        = "${var.environment}-${var.service_name}-tg"
  port        = var.app_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    path                = var.health_check_path
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name        = "${var.environment}-${var.service_name}-tg"
    Environment = var.environment
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this.arn
  }
}

# ── Launch Template (mismo user-data.sh.tpl que EC2 de QA) ───────────────────
resource "aws_launch_template" "this" {
  name_prefix   = "${var.environment}-${var.service_name}-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids = var.instance_security_group_ids

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = var.root_volume_size
      volume_type            = "gp3"
      delete_on_termination  = true
    }
  }

  user_data = base64encode(var.user_data)

  tag_specifications {
    resource_type = "instance"
    tags = merge({
      Name        = "${var.environment}-${var.service_name}"
      Environment = var.environment
      Service     = var.service_name
    }, var.extra_tags)
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ── Auto Scaling Group ────────────────────────────────────────────────────────
resource "aws_autoscaling_group" "this" {
  name_prefix               = "${var.environment}-${var.service_name}-asg-"
  vpc_zone_identifier        = var.public_subnet_ids
  min_size                   = var.min_size
  max_size                   = var.max_size
  desired_capacity           = var.desired_capacity
  health_check_type          = "ELB"
  health_check_grace_period  = 120

  launch_template {
    id      = aws_launch_template.this.id
    version = "$Latest"
  }

  target_group_arns = [aws_lb_target_group.this.arn]

  tag {
    key                 = "Name"
    value               = "${var.environment}-${var.service_name}"
    propagate_at_launch = true
  }
  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
  tag {
    key                 = "Service"
    value               = var.service_name
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ── Escalado automático por CPU (target tracking, 60%) ───────────────────────
resource "aws_autoscaling_policy" "cpu_scaling" {
  name                   = "${var.environment}-${var.service_name}-cpu-scaling"
  autoscaling_group_name = aws_autoscaling_group.this.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 60.0
  }
}
