# ══════════════════════════════════════════════════════════════════════════
# PASO 3 del runbook — activar SOLO después de que `lab-b` ya esté aplicado
# (necesitas el CIDR de la VPC de Lab B, que ya conoces: 10.0.0.0/16).
#
# Cómo activarlo:
#   mv lab-b-integration.tf.step3 lab-b-integration.tf   (o borra el .step3
#     viejo y usa este archivo)
#   terraform plan   (en environments/qa, con credenciales de Lab A)
#   terraform apply
#
# POR QUÉ ESTA VERSIÓN Y NO LA DE "data aws_security_group":
# Los Security Groups de reservation/payment/realtime viven en Account B,
# una cuenta distinta a la que usa esta carpeta (Account A). Referenciarlos
# por ID cruzando cuentas requiere un segundo provider con credenciales de
# Account B (que también son temporales en Academy y expiran) y no está
# garantizado que el recurso aws_security_group_rule soporte esa referencia
# cruzada sin especificar el owner account ID, que este recurso no expone.
#
# En vez de eso, esta versión abre los puertos por CIDR de red — el CIDR de
# la VPC de Lab B (10.0.0.0/16) — que es la única cosa que necesitas conocer
# de la otra cuenta, y no depende de nada dinámico ni de credenciales extra.
# Es ligeramente menos preciso (permite el rango completo de Lab B, no solo
# las 3 instancias puntuales) pero para un entorno de QA/Academy es
# suficiente, y evita por completo el error "no matching EC2 Security Group
# found".
# ══════════════════════════════════════════════════════════════════════════

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

# El bastion de Lab A también necesita poder llegar por SSH a las
# instancias de Lab B — esto vive del lado de Lab B, no aquí (ver nota
# abajo), pero lo dejamos documentado para que no se te olvide verificarlo.
#
# En el SG de reservation/payment/realtime (creado por `lab-b`), la regla de
# entrada al puerto 22 debe permitir el CIDR de Lab A (el de tu VPC default,
# normalmente 172.31.0.0/16) — o, si esa carpeta usa el mismo patrón de
# CIDR, la IP privada específica del bastion. Si ese archivo también usa
# `data aws_security_group` para referenciar cruzado, aplica el mismo
# criterio: usa CIDR en vez de SG-por-ID.
