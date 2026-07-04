# ── VPC propia de Lab B (10.0.0.0/16 por defecto) ─────────────────────────────
module "vpc" {
  source            = "../../modules/vpc_lab"
  environment       = var.environment
  vpc_cidr          = var.vpc_cidr
  subnet_cidr       = var.subnet_cidr
  availability_zone = var.availability_zone
}

# ── Datos de Lab A (VPC default) — para el peering, sin tocar su estado ──────
data "aws_vpc" "lab_a" {
  default = true
}

data "aws_route_table" "lab_a_main" {
  vpc_id = data.aws_vpc.lab_a.id

  filter {
    name   = "association.main"
    values = ["true"]
  }
}

# ── VPC Peering Lab B <-> Lab A ────────────────────────────────────────────
module "peering" {
  source = "../../modules/vpc_peering"

  requester_vpc_id         = module.vpc.vpc_id
  requester_cidr           = module.vpc.cidr_block
  requester_route_table_id = module.vpc.route_table_id
  requester_name           = var.environment

  accepter_vpc_id         = data.aws_vpc.lab_a.id
  accepter_cidr           = data.aws_vpc.lab_a.cidr_block
  accepter_route_table_id = data.aws_route_table.lab_a_main.id
  accepter_name           = var.lab_a_environment
}

# ── Bastion y Gateway de Lab A, ubicados por tag (para las reglas cruzadas) ──
# Requiere que los Security Groups de Lab A tengan el tag Name de siempre
# ("<lab_a_environment>-bastion-sg", "<lab_a_environment>-gateway-sg").
# Esta referencia cross-VPC de Security Groups SOLO funciona porque el
# peering está en la MISMA región (us-east-1) y la MISMA cuenta.
data "aws_security_group" "lab_a_bastion" {
  filter {
    name   = "tag:Name"
    values = ["${var.lab_a_environment}-bastion-sg"]
  }
}

data "aws_security_group" "lab_a_gateway" {
  filter {
    name   = "tag:Name"
    values = ["${var.lab_a_environment}-gateway-sg"]
  }
}

# ── Security Groups de Lab B (reservation, payment, realtime) ───────────────
# Reutiliza el mismo módulo que Lab A; crea SGs para los 9 servicios pero
# solo adjuntamos instancias a reservation/payment/realtime — el resto
# quedan vacíos y no generan ningún costo ni riesgo.
module "security_groups" {
  source                    = "../../modules/security_groups"
  environment               = var.environment
  vpc_id                    = module.vpc.vpc_id
  bastion_security_group_id = data.aws_security_group.lab_a_bastion.id
}

# ── Reglas cruzadas: tráfico que llega DESDE Lab A hacia Lab B ──────────────
resource "aws_security_group_rule" "reservation_from_lab_a_gateway" {
  type                     = "ingress"
  from_port                = 3005
  to_port                  = 3005
  protocol                 = "tcp"
  source_security_group_id = data.aws_security_group.lab_a_gateway.id
  security_group_id        = module.security_groups.security_group_ids["reservation"]
  description              = "reservation accesible desde el gateway de Lab A (peering)"
}

resource "aws_security_group_rule" "payment_from_lab_a_gateway" {
  type                     = "ingress"
  from_port                = 3007
  to_port                  = 3007
  protocol                 = "tcp"
  source_security_group_id = data.aws_security_group.lab_a_gateway.id
  security_group_id        = module.security_groups.security_group_ids["payment"]
  description              = "payment accesible desde el gateway de Lab A (peering)"
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
