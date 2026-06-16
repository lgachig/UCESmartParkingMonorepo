variable "environment" {
  type        = string
  description = "The environment name (e.g. qa, prod)"
}

variable "vpc_id" {
  type        = string
  description = "The VPC ID where the bastion will be placed"
}

variable "subnet_id" {
  type        = string
  description = "A public subnet ID for the bastion host"
}

variable "key_name" {
  type        = string
  description = "The SSH key pair name to associate with the bastion"
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type for the bastion (t3.micro is enough)"
  default     = "t3.micro"
}

variable "allowed_ssh_cidr" {
  type        = list(string)
  description = "List of CIDRs allowed to SSH into the bastion. Restrict to your team's IPs in prod."
  default     = ["0.0.0.0/0"]
}
