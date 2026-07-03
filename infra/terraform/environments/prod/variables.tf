variable "aws_region" {
  type        = string
  description = "The AWS Region to deploy the infrastructure in"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "The environment name"
  default     = "prod"
}

variable "instance_type" {
  type        = string
  description = "The EC2 instance type to launch (instancias privadas + launch template del ASG)"
  default     = "t3.micro"
}

variable "key_name" {
  type        = string
  description = "The SSH key pair name to associate with instances"
}

variable "allowed_ssh_cidr" {
  type        = string
  description = "The CIDR block allowed to access instances via SSH"
  default     = "0.0.0.0/0"
}

variable "dockerhub_user" {
  type        = string
  description = "The Docker Hub user name for pulling docker images"
}

# ── ASG (gateway / frontend) ─────────────────────────────────────────────────
variable "asg_min_size" {
  type        = number
  description = "Tamaño mínimo del ASG para gateway y frontend"
  default     = 1
}

variable "asg_max_size" {
  type        = number
  description = "Tamaño máximo del ASG para gateway y frontend"
  default     = 2
}

variable "asg_desired_capacity" {
  type        = number
  description = "Capacidad deseada del ASG para gateway y frontend"
  default     = 1
}
