variable "environment" {
  type        = string
  description = "Nombre del ambiente (e.g. lab-b)"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block de la nueva VPC — debe ser distinto al de la VPC default (Lab A)"
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  type        = string
  description = "CIDR de la subnet pública dentro de esta VPC"
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  type        = string
  description = "AZ donde se crea la subnet pública"
  default     = "us-east-1a"
}
