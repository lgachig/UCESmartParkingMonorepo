data "aws_vpc" "selected" {
  id = var.vpc_id
}

resource "aws_security_group" "microservice" {
  for_each    = toset(["auth", "user", "vehicle", "frontend", "gateway", "parking", "reservation","payment"])
  name        = "${var.environment}-${each.value}-sg"
  description = "Security Group for ${var.environment}-${each.value}"
  vpc_id      = var.vpc_id

  lifecycle { create_before_destroy = true }

  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [var.bastion_security_group_id]
    description     = "SSH from bastion only"
  }

  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    self      = true
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

resource "aws_security_group_rule" "frontend_public" {
  type              = "ingress"
  from_port         = 3002
  to_port           = 3002
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.microservice["frontend"].id
  description       = "Frontend public access"
}

resource "aws_security_group_rule" "gateway_public" {
  type              = "ingress"
  from_port         = 3006
  to_port           = 3006
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.microservice["gateway"].id
  description       = "Gateway public access"
}

resource "aws_security_group_rule" "private_from_gateway" {
  for_each = tomap({
    auth        = 3000
    user        = 3001
    vehicle     = 3003
    parking     = 3004
    reservation = 3005
    payment     = 3007
  })
  type                     = "ingress"
  from_port                = each.value
  to_port                  = each.value
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.microservice["gateway"].id
  security_group_id        = aws_security_group.microservice[each.key].id
  description              = "${each.key} accessible from gateway only"
}

resource "aws_security_group_rule" "user_from_auth" {
  type                     = "ingress"
  from_port                = 3001
  to_port                  = 3001
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.microservice["auth"].id
  security_group_id        = aws_security_group.microservice["user"].id
  description              = "user-service accessible from auth-service"
}

resource "aws_security_group_rule" "parking_from_reservation" {
  type                     = "ingress"
  from_port                = 3004
  to_port                  = 3004
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.microservice["reservation"].id
  security_group_id        = aws_security_group.microservice["parking"].id
  description              = "parking accessible from reservation"
}

resource "aws_security_group_rule" "user_from_reservation" {
  type                     = "ingress"
  from_port                = 3001
  to_port                  = 3001
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.microservice["reservation"].id
  security_group_id        = aws_security_group.microservice["user"].id
  description              = "user accessible from reservation"
}

resource "aws_security_group_rule" "vehicle_from_reservation" {
  type                     = "ingress"
  from_port                = 3003
  to_port                  = 3003
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.microservice["reservation"].id
  security_group_id        = aws_security_group.microservice["vehicle"].id
  description              = "vehicle accessible from reservation"
}

resource "aws_security_group_rule" "frontend_from_auth" {
  type                     = "ingress"
  from_port                = 3002
  to_port                  = 3002
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.microservice["auth"].id
  security_group_id        = aws_security_group.microservice["frontend"].id
  description              = "frontend accessible from auth for redirections/callbacks"
}

locals {
  internal_sgs = toset(["user", "vehicle", "gateway", "parking", "reservation", "payment"])
}

resource "aws_security_group_rule" "auth_postgres" {
  for_each                 = local.internal_sgs
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.microservice[each.value].id
  security_group_id        = aws_security_group.microservice["auth"].id
  description              = "PostgreSQL from ${each.value}"
}

resource "aws_security_group_rule" "auth_redis" {
  for_each                 = local.internal_sgs
  type                     = "ingress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.microservice[each.value].id
  security_group_id        = aws_security_group.microservice["auth"].id
  description              = "Redis from ${each.value}"
}

resource "aws_security_group_rule" "auth_kafka" {
  for_each                 = toset(["parking", "reservation", "payment"])
  type                     = "ingress"
  from_port                = 9092
  to_port                  = 9092
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.microservice[each.value].id
  security_group_id        = aws_security_group.microservice["auth"].id
  description              = "Kafka from ${each.value}"
}

resource "aws_security_group_rule" "reservation_from_payment" {
  type                     = "ingress"
  from_port                = 3005
  to_port                  = 3005
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.microservice["payment"].id
  security_group_id        = aws_security_group.microservice["reservation"].id
  description              = "reservation accessible from payment (fee calculation lookup)"
}

resource "aws_security_group_rule" "user_from_payment" {
  type                     = "ingress"
  from_port                = 3001
  to_port                  = 3001
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.microservice["payment"].id
  security_group_id        = aws_security_group.microservice["user"].id
  description              = "user accessible from payment (profile/role lookup)"
}


resource "aws_security_group_rule" "auth_rabbitmq" {
  for_each                 = toset(["payment"])
  type                     = "ingress"
  from_port                = 5672
  to_port                  = 5672
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.microservice[each.value].id
  security_group_id        = aws_security_group.microservice["auth"].id
  description              = "RabbitMQ from ${each.value}"
}

# Fallback QA: tráfico intra-VPC (p. ej. migraciones Prisma desde otras EC2)
resource "aws_security_group_rule" "auth_postgres_vpc" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = [data.aws_vpc.selected.cidr_block]
  security_group_id = aws_security_group.microservice["auth"].id
  description       = "PostgreSQL from VPC"
}

resource "aws_security_group_rule" "auth_redis_vpc" {
  type              = "ingress"
  from_port         = 6379
  to_port           = 6379
  protocol          = "tcp"
  cidr_blocks       = [data.aws_vpc.selected.cidr_block]
  security_group_id = aws_security_group.microservice["auth"].id
  description       = "Redis from VPC"
}

resource "aws_security_group_rule" "auth_kafka_vpc" {
  type              = "ingress"
  from_port         = 9092
  to_port           = 9092
  protocol          = "tcp"
  cidr_blocks       = [data.aws_vpc.selected.cidr_block]
  security_group_id = aws_security_group.microservice["auth"].id
  description       = "Kafka from VPC"
}

resource "aws_security_group_rule" "auth_rabbitmq_vpc" {
  type              = "ingress"
  from_port         = 5672
  to_port           = 5672
  protocol          = "tcp"
  cidr_blocks       = [data.aws_vpc.selected.cidr_block]
  security_group_id = aws_security_group.microservice["auth"].id
  description       = "RabbitMQ from VPC"
}