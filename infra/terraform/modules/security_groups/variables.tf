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
  description = "CIDR block allowed to SSH — kept for compatibility but SSH is now restricted to bastion SG"
  default     = "0.0.0.0/0"
}

variable "bastion_security_group_id" {
  type        = string
  description = "Security group ID of the bastion host. Only the bastion is allowed to SSH into microservice instances."
}
