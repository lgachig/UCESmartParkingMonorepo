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

# ── prod-lab-b (Account B) — completar tras el apply de environments/prod-lab-b ──
variable "lab_b_reservation_private_ip" {
  type        = string
  description = "IP privada de reservation en prod-lab-b. Vacío en el primer apply de prod."
  default     = ""
}

variable "lab_b_payment_private_ip" {
  type        = string
  description = "IP privada de payment en prod-lab-b. Vacío en el primer apply de prod."
  default     = ""
}

variable "lab_b_realtime_public_ip" {
  type        = string
  description = "Elastic IP de realtime en prod-lab-b (WebSocket público)."
  default     = ""
}

variable "lab_b_ai_private_ip" {
  type        = string
  description = "IP privada de ai en prod-lab-b."
  default     = ""
}