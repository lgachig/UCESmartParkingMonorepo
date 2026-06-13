variable "environment" {
  description = "The environment for the security groups"
  type        = string
}

variable "vpc_id" {
  description = "The ID of the VPC where security groups will be created"
  type        = string
}
