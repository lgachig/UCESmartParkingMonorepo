resource "aws_security_group" "microservice" {
  for_each    = toset(["auth", "user", "vehicle", "frontend", "gateway", "parking", "reservation"])
  name        = "${var.environment}-${each.value}-sg"
  description = "Security Group for ${var.environment}-${each.value}"
  vpc_id      = var.vpc_id

  lifecycle {
    create_before_destroy = true
  }

  # SSH only from the bastion security group (no public SSH access)
  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [var.bastion_security_group_id]
    description     = "SSH from bastion only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-${each.value}-sg"
    Environment = var.environment
  }
}

resource "aws_security_group_rule" "service_port" {
  for_each = tomap({
    auth        = 3000
    user        = 3001
    frontend    = 3002
    vehicle     = 3003
    parking     = 3004
    reservation = 3005
    gateway     = 3006
  })
  type              = "ingress"
  from_port         = each.value
  to_port           = each.value
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.microservice[each.key].id
}

resource "aws_security_group_rule" "auth_postgres" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.microservice["auth"].id
}

resource "aws_security_group_rule" "auth_redis" {
  type              = "ingress"
  from_port         = 6379
  to_port           = 6379
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.microservice["auth"].id
}

resource "aws_security_group_rule" "auth_kafka" {
  type              = "ingress"
  from_port         = 9092
  to_port           = 9092
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.microservice["auth"].id
}
