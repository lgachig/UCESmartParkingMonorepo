variable "lab_b_vpc_cidr" {
  type        = string
  description = "CIDR de la VPC de prod-lab-b (Account B), para reglas de SG en prod (Account A)"
  default     = "10.0.0.0/16"
}

resource "aws_security_group_rule" "parking_from_labb" {
  type              = "ingress"
  from_port         = 3004
  to_port           = 3004
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["parking"]
  description       = "parking accesible desde prod-lab-b (reservation), via peering"
}

resource "aws_security_group_rule" "user_from_labb" {
  type              = "ingress"
  from_port         = 3001
  to_port           = 3001
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["user"]
  description       = "user accesible desde prod-lab-b (reservation, payment), via peering"
}

resource "aws_security_group_rule" "vehicle_from_labb" {
  type              = "ingress"
  from_port         = 3003
  to_port           = 3003
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["vehicle"]
  description       = "vehicle accesible desde prod-lab-b (reservation), via peering"
}

resource "aws_security_group_rule" "auth_postgres_from_labb" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["auth"]
  description       = "PostgreSQL desde prod-lab-b, via peering"
}

resource "aws_security_group_rule" "auth_redis_from_labb" {
  type              = "ingress"
  from_port         = 6379
  to_port           = 6379
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["auth"]
  description       = "Redis desde prod-lab-b, via peering"
}

resource "aws_security_group_rule" "auth_kafka_from_labb" {
  type              = "ingress"
  from_port         = 9092
  to_port           = 9092
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["auth"]
  description       = "Kafka desde prod-lab-b, via peering"
}

resource "aws_security_group_rule" "auth_rabbitmq_from_labb" {
  type              = "ingress"
  from_port         = 5672
  to_port           = 5672
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["auth"]
  description       = "RabbitMQ desde prod-lab-b (payment), via peering"
}

resource "aws_security_group_rule" "auth_mongo_from_labb" {
  type              = "ingress"
  from_port         = 27017
  to_port           = 27017
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["auth"]
  description       = "MongoDB desde prod-lab-b (ai), via peering"
}

resource "aws_security_group_rule" "ai_http_from_labb" {
  type              = "ingress"
  from_port         = 3009
  to_port           = 3009
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["ai"]
  description       = "ai SG en prod (Account A) - reservado; instancia ai vive en prod-lab-b"
}
