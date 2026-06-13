variable "environment" {
  type = string
}

variable "service_name" {
  type = string
}

variable "security_group_ids" {
  type = list(string)
}

variable "subnet_id" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t2.micro" # Requisito de capa gratuita / AWS Academy
}

variable "key_name" {
  type    = string
  default = "vockey" # Clave SSH inyectada por defecto en AWS Academy
}

variable "user_data" {
  description = "User data script to run on instance boot"
  type        = string
  default     = ""
}

variable "allocate_eip" {
  description = "Whether to allocate an Elastic IP for this instance"
  type        = bool
  default     = false
}

variable "enable_ebs_volume" {
  type        = bool
  description = "Whether to attach a persistent EBS volume"
  default     = false
}

variable "ebs_volume_size" {
  type        = number
  description = "Size of the persistent EBS volume in GB"
  default     = 20
}
