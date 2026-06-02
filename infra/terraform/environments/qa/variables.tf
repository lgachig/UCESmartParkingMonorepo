variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "qa"
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "key_name" {
  type = string
}

variable "allowed_ssh_cidr" {
  type    = string
  default = "0.0.0.0/0"
}

variable "dockerhub_user" {
  type = string
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "jwt_refresh_secret" {
  type      = string
  sensitive = true
}

variable "internal_service_key" {
  type      = string
  sensitive = true
}

variable "frontend_url" {
  type        = string
  description = "e.g. http://<frontend-eip>:3002 — update after first apply"
}

variable "user_service_url" {
  type        = string
  description = "e.g. http://<user-eip>:3001 — update after first apply"
}

variable "cors_origins" {
  type        = string
  description = "Comma-separated origins for all EC2 public URLs"
}
