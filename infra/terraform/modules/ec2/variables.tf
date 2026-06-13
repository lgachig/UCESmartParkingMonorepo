variable "environment" {
  type        = string
  description = "The environment name (e.g. qa)"
}

variable "service_name" {
  type        = string
  description = "The name of the service (e.g. auth, user)"
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type"
}

variable "key_name" {
  type        = string
  description = "The SSH key pair name"
}

variable "subnet_id" {
  type        = string
  description = "The subnet ID to launch the instance in"
}

variable "security_group_ids" {
  type        = list(string)
  description = "The list of security group IDs to associate with the instance"
}

variable "user_data" {
  type        = string
  description = "The user data script to run on boot"
  default     = ""
}
