# ── VPC propia de Lab B (10.0.0.0/16 por defecto) ─────────────────────────────
module "vpc" {
  source            = "../../modules/vpc_lab"
  environment       = var.environment
  vpc_cidr          = var.vpc_cidr
  subnet_cidr       = var.subnet_cidr
  availability_zone = var.availability_zone
}

# ── Datos de Lab A (VPC default) ─────────────────────────────────────────────
# CRITICO: estas data sources deben resolverse con las credenciales de Lab A
# (provider = aws.accepter), NO con las de Lab B (el provider por defecto de
# este folder). Antes se leían con el provider default (Lab B) — eso buscaba
# la "VPC default" en la cuenta EQUIVOCADA y era una de las causas de que el
# peering nunca terminara de armarse bien.
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

# ── VPC Peering Lab B <-> Lab A (cross-account) ─────────────────────────────
module "peering" {
  source = "../../modules/vpc_peering"

  providers = {
    aws.requester = aws            # cuenta de Lab B (provider default de este folder)
    aws.accepter  = aws.accepter   # cuenta de Lab A
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

# ── CIDR de Lab A, usado en vez de referencias cruzadas por Security Group ID ──
# Referenciar un SG por ID solo funciona de forma confiable dentro de la
# MISMA cuenta AWS. Si Lab A y Lab B están en cuentas distintas (caso
# Academy con dos Learner Labs), un `data "aws_security_group"` aquí busca
# en la cuenta equivocada y falla con "no matching EC2 Security Group
# found". Usar el CIDR de la VPC de Lab A evita ese problema por completo,
# sin necesitar un segundo provider con credenciales de la otra cuenta.

# ── Security Groups de Lab B (reservation, payment, realtime) ───────────────
# Reutiliza el mismo módulo que Lab A; crea SGs para los 9 servicios pero
# solo adjuntamos instancias a reservation/payment/realtime — el resto
# quedan vacíos y no generan ningún costo ni riesgo.
module "security_groups" {
  source             = "../../modules/security_groups"
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  bastion_cidr_block = var.lab_a_vpc_cidr
}

# ── Reglas cruzadas: tráfico que llega DESDE Lab A hacia Lab B ──────────────
resource "aws_security_group_rule" "reservation_from_lab_a_gateway" {
  type              = "ingress"
  from_port         = 3005
  to_port           = 3005
  protocol          = "tcp"
  cidr_blocks       = [var.lab_a_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["reservation"]
  description       = "reservation accesible desde el gateway de Lab A (peering)"
}

resource "aws_security_group_rule" "payment_from_lab_a_gateway" {
  type              = "ingress"
  from_port         = 3007
  to_port           = 3007
  protocol          = "tcp"
  cidr_blocks       = [var.lab_a_vpc_cidr]
  security_group_id = module.security_groups.security_group_ids["payment"]
  description       = "payment accesible desde el gateway de Lab A (peering)"
}

# ── EIP para realtime (el frontend se conecta directo, igual que en Lab A) ──
resource "aws_eip" "realtime" { domain = "vpc" }

# ── 1) Reservation EC2 ───────────────────────────────────────────────────────
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
    docker_image_tag = var.lab_a_environment # imagen sigue tageada como "qa" en el CI/CD
    service_port     = 3005
    is_auth          = false
    env_content      = "DOCKERHUB_USER=${var.dockerhub_user}"
  })
}

# ── 2) Payment EC2 ───────────────────────────────────────────────────────────
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

# ── 3) Realtime EC2 ──────────────────────────────────────────────────────────
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
