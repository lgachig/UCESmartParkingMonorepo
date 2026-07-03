variable "environment" {
  type        = string
  description = "The environment name (e.g. prod)"
}

variable "service_name" {
  type        = string
  description = "The name of the service (e.g. gateway, frontend)"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID donde se crean ALB, target group y ASG"
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "Subnets públicas (mínimo 2 AZ) para el ALB y las instancias del ASG"
}

variable "instance_type" {
  type        = string
  description = "Tipo de instancia EC2 para el launch template"
}

variable "key_name" {
  type        = string
  description = "SSH key pair name"
}

variable "instance_security_group_ids" {
  type        = list(string)
  description = "Security groups a asociar a las instancias del ASG (SG del microservicio, ya debe permitir tráfico desde el ALB)"
}

variable "user_data" {
  type        = string
  description = "Script de arranque (mismo user-data.sh.tpl usado en QA)"
}

variable "app_port" {
  type        = number
  description = "Puerto en el que escucha el contenedor de la app"
}

variable "health_check_path" {
  type        = string
  description = "Path HTTP usado por el ALB para el health check"
  default     = "/"
}

variable "root_volume_size" {
  type        = number
  description = "Tamaño del disco raíz en GB"
  default     = 30
}

variable "min_size" {
  type        = number
  description = "Tamaño mínimo del ASG"
  default     = 1
}

variable "max_size" {
  type        = number
  description = "Tamaño máximo del ASG"
  default     = 2
}

variable "desired_capacity" {
  type        = number
  description = "Capacidad deseada del ASG"
  default     = 1
}

variable "allowed_alb_cidr" {
  type        = list(string)
  description = "CIDRs permitidos para llegar al ALB (0.0.0.0/0 para exponerlo públicamente)"
  default     = ["0.0.0.0/0"]
}

variable "extra_tags" {
  type        = map(string)
  default     = {}
  description = "Tags adicionales para las instancias (discovery dinámico por el CI/CD)"
}
