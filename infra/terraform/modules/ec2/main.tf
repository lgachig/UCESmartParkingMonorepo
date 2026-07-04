

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_instance" "this" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  subnet_id              = var.subnet_id
  vpc_security_group_ids = var.security_group_ids
  user_data              = var.user_data != "" ? var.user_data : null

  root_block_device {
    volume_size           = var.root_volume_size
    volume_type           = "gp3"
    delete_on_termination = true
  }

  # data.aws_ami usa most_recent = true. Sin esto, el DIA que AWS publique
  # una nueva AMI de AL2023, el siguiente `terraform apply` (aunque no
  # cambies nada tuyo) va a querer REEMPLAZAR la instancia -> IP privada
  # nueva -> rompe cualquier URL/DATABASE_URL que ya apuntaba a la IP vieja,
  # hasta que se vuelva a correr el pipeline (discover-ips) o se actualicen
  # a mano los secrets. Ignoramos cambios de AMI: solo se actualiza si vos
  # tocás explícitamente el campo (ver el módulo `ec2` para forzar update).
  lifecycle {
    ignore_changes = [ami]
  }

  tags = merge({
    Name        = "${var.environment}-${var.service_name}"
    Environment = var.environment
  }, var.extra_tags)
}