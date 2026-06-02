variable "name" {
  type = string
}

variable "environment" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "key_name" {
  type = string
}

variable "allowed_ssh_cidr" {
  type = string
}

variable "service_port" {
  type = number
}

variable "dockerhub_user" {
  type = string
}

variable "docker_image" {
  type = string
}

variable "docker_image_tag" {
  type        = string
  description = "Docker Hub tag, e.g. qa or prod (usually same as environment)"
}

variable "env_content" {
  type      = string
  sensitive = true
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_security_group" "this" {
  name_prefix = "${var.environment}-${var.name}-sg-"
  description = "SG for ${var.environment}-${var.name}"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.environment}-${var.name}-sg"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    from_port   = var.service_port
    to_port     = var.service_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "ingress" {
    for_each = var.name == "auth" ? [5432, 6379] : []
    content {
      from_port   = ingress.value
      to_port     = ingress.value
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "this" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.this.id]

  user_data = templatefile("${path.module}/user-data.sh.tpl", {
    dockerhub_user   = var.dockerhub_user
    docker_image     = var.docker_image
    docker_image_tag = var.docker_image_tag
    service_port     = var.service_port
    env_content      = var.env_content
    is_auth          = var.name == "auth"
  })

  tags = { Name = "${var.environment}-${var.name}" }
}

resource "aws_eip" "this" {
  domain = "vpc"
  tags   = { Name = "${var.environment}-${var.name}-eip" }
}

resource "aws_eip_association" "this" {
  instance_id   = aws_instance.this.id
  allocation_id = aws_eip.this.id
}

output "elastic_ip" {
  value = aws_eip.this.public_ip
}
