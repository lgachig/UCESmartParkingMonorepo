data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "this" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  subnet_id     = var.subnet_id

  vpc_security_group_ids = var.security_group_ids
  key_name               = var.key_name
  user_data              = var.user_data != "" ? var.user_data : null

  # AWS Academy compatibilidad: se ignora el iam_instance_profile para evitar AccessDenied
  # iam_instance_profile = "LabInstanceProfile"

  tags = {
    Name        = "${var.environment}-${var.service_name}"
    Environment = var.environment
  }

  dynamic "ebs_block_device" {
    for_each = var.enable_ebs_volume ? [1] : []
    content {
      device_name           = "/dev/sdf"
      volume_size           = var.ebs_volume_size
      volume_type           = "gp3"
      delete_on_termination = false
      encrypted             = true
    }
  }
}

resource "aws_eip" "this" {
  count    = var.allocate_eip ? 1 : 0
  instance = aws_instance.this.id
  domain   = "vpc"


  tags = {
    Name        = "${var.environment}-${var.service_name}-eip"
    Environment = var.environment
  }
}
