variable "environment" {
  type        = string
  description = "Environment name (e.g. prod)"
}

variable "ami_id" {
  type        = string
  description = "AMI ID for the instances"
}

variable "instance_type" {
  type        = string
  description = "Instance type (e.g. t2.micro)"
}

variable "user_data" {
  type        = string
  description = "User data script to initialize the instances"
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs for the ASG"
}

variable "security_group_ids" {
  type        = list(string)
  description = "List of security group IDs for the instances"
}

variable "target_group_arn" {
  type        = string
  description = "ARN of the ALB Target Group to attach the ASG to"
}

variable "min_size" {
  type        = number
  description = "Minimum size of the ASG"
  default     = 1
}

variable "max_size" {
  type        = number
  description = "Maximum size of the ASG"
  default     = 3
}

variable "desired_capacity" {
  type        = number
  description = "Desired capacity of the ASG"
  default     = 2
}

variable "associate_public_ip" {
  type        = bool
  description = "Whether to associate a public IP address"
  default     = false
}
