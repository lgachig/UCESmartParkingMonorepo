variable "aws_region" {
  type        = string
  description = "Debe ser la MISMA región que Lab A (qa) para que el VPC Peering funcione"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Nombre de este ambiente"
  default     = "lab-b"
}

# ── Nombre del ambiente de Lab A, usado para ubicar sus recursos por tag ──────
# (bastion y gateway de Lab A, buscados por tag Name = "<lab_a_environment>-bastion-sg" etc.)
variable "lab_a_environment" {
  type        = string
  description = "Nombre del ambiente de Lab A (el que ya tienes corriendo, normalmente 'qa')"
  default     = "qa"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR de la nueva VPC de Lab B — no debe solaparse con el CIDR de Lab A"
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  type        = string
  description = "CIDR de la subnet pública de Lab B"
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  type        = string
  description = "AZ de la subnet de Lab B"
  default     = "us-east-1a"
}

variable "instance_type" {
  type        = string
  description = "Tipo de instancia EC2 para los servicios de Lab B"
  default     = "t3.micro"
}

variable "key_name" {
  type        = string
  description = "Key pair EC2 (usa el MISMO que Lab A si quieres acceder con la misma .pem vía bastion)"
}

variable "dockerhub_user" {
  type        = string
  description = "Docker Hub user para pull de imágenes"
}
