variable "environment" {
  type        = string
  description = "Environment name (e.g. prod)"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID where the ALB will be created"
}

variable "subnets" {
  type        = list(string)
  description = "List of public subnet IDs for the ALB"
}

variable "security_groups" {
  type        = list(string)
  description = "List of security group IDs for the ALB"
}
