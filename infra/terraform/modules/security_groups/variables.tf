variable "environment" {
  type        = string
  description = "The environment name (e.g. qa)"
}

variable "vpc_id" {
  type        = string
  description = "The VPC ID where the security groups will be created"
}

variable "allowed_ssh_cidr" {
  type        = string
  description = "CIDR block allowed to SSH into the instances"
}
