variable "aws_region" {
  type        = string
  description = "Debe ser la MISMA región que prod (Account A) para que el VPC Peering funcione"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Nombre de este ambiente (Account B de producción)"
  default     = "prod-lab-b"
}

variable "lab_a_environment" {
  type        = string
  description = "Nombre del ambiente de prod en Account A"
  default     = "prod"
}

variable "lab_a_vpc_cidr" {
  type        = string
  description = "CIDR de la VPC default de prod (Account A)"
  default     = "172.31.0.0/16"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR de la VPC de prod-lab-b — no debe solaparse con Account A"
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  type        = string
  description = "CIDR de la subnet pública de prod-lab-b"
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  type        = string
  description = "AZ de la subnet de prod-lab-b"
  default     = "us-east-1a"
}

variable "instance_type" {
  type        = string
  description = "Tipo de instancia EC2 para los servicios de prod-lab-b"
  default     = "t3.micro"
}

variable "key_name" {
  type        = string
  description = "Key pair EC2 en Account B (misma .pem que prod si se importó la misma clave pública)"
}

variable "dockerhub_user" {
  type        = string
  description = "Docker Hub user para pull de imágenes"
}

variable "lab_a_access_key" {
  type        = string
  description = "Access Key de prod (Account A) para aceptar el peering. TF_VAR_lab_a_access_key."
  sensitive   = true
}

variable "lab_a_secret_key" {
  type        = string
  description = "Secret Key de prod (Account A). TF_VAR_lab_a_secret_key."
  sensitive   = true
}

variable "lab_a_session_token" {
  type        = string
  description = "Session Token de prod (Account A) si aplica. TF_VAR_lab_a_session_token."
  sensitive   = true
  default     = ""
}
