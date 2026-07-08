variable "lab_b_vpc_cidr" {
  type        = string
  description = "CIDR de la VPC de Lab B (Account B), para las reglas de SG en Lab A"
  default     = "10.0.0.0/16"
}

# parking, user y vehicle ahora reciben llamadas de reservation, que vive en Lab B
resource "aws_security_group_rule" "parking_from_labb" {
  type              = "ingress"
  from_port         = 3004
  to_port           = 3004
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["parking"]
  description       = "parking accesible desde Lab B (reservation), via peering"
}

resource "aws_security_group_rule" "user_from_labb" {
  type              = "ingress"
  from_port         = 3001
  to_port           = 3001
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["user"]
  description       = "user accesible desde Lab B (reservation, payment), via peering"
}

resource "aws_security_group_rule" "vehicle_from_labb" {
  type              = "ingress"
  from_port         = 3003
  to_port           = 3003
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["vehicle"]
  description       = "vehicle accesible desde Lab B (reservation), via peering"
}

# auth (que hostea postgres/redis/kafka/rabbitmq) ahora recibe conexiones
# de reservation, payment y realtime desde Lab B
resource "aws_security_group_rule" "auth_postgres_from_labb" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["auth"]
  description       = "PostgreSQL desde Lab B, via peering"
}

resource "aws_security_group_rule" "auth_redis_from_labb" {
  type              = "ingress"
  from_port         = 6379
  to_port           = 6379
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["auth"]
  description       = "Redis desde Lab B, via peering"
}

resource "aws_security_group_rule" "auth_kafka_from_labb" {
  type              = "ingress"
  from_port         = 9092
  to_port           = 9092
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["auth"]
  description       = "Kafka desde Lab B, via peering"
}

resource "aws_security_group_rule" "auth_rabbitmq_from_labb" {
  type              = "ingress"
  from_port         = 5672
  to_port           = 5672
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["auth"]
  description       = "RabbitMQ desde Lab B (payment), via peering"
}

resource "aws_security_group_rule" "auth_mongo_from_labb" {
  type              = "ingress"
  from_port         = 27017
  to_port           = 27017
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["auth"]
  description       = "MongoDB desde Lab B (ai), via peering"
}

resource "aws_security_group_rule" "ai_http_from_labb" {
  type              = "ingress"
  from_port         = 3009
  to_port           = 3009
  protocol          = "tcp"
  cidr_blocks       = [var.lab_b_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["ai"]
  description       = "ai accesible desde Lab B (gateway), via peering"
}