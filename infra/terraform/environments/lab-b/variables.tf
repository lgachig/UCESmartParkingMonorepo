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

variable "lab_a_vpc_cidr" {
  type        = string
  description = "CIDR de la VPC default de Lab A (Account A) — usado en las reglas de SG hacia Lab B en vez de referenciar el SG por ID"
  default     = "172.31.0.0/16"
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

# ── Credenciales de la cuenta de Lab A (accepter del peering) ────────────────
# OBLIGATORIAS para que el VPC Peering funcione cross-account. Pásalas como
# variables de entorno TF_VAR_..., no las escribas en terraform.tfvars.
variable "lab_a_access_key" {
  type        = string
  description = "Access Key de la cuenta de Lab A (para aceptar el peering y crear la ruta en su route table). Exportar como TF_VAR_lab_a_access_key."
  sensitive   = true
}

variable "lab_a_secret_key" {
  type        = string
  description = "Secret Key de la cuenta de Lab A. Exportar como TF_VAR_lab_a_secret_key."
  sensitive   = true
}

variable "lab_a_session_token" {
  type        = string
  description = "Session Token de la cuenta de Lab A (AWS Academy usa credenciales temporales; dejar vacio si tu cuenta usa credenciales IAM permanentes sin token)."
  sensitive   = true
  default     = ""
}
