variable "aws_region" {
  type        = string
  description = "The AWS Region to deploy the infrastructure in"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "The environment name (e.g. qa)"
  default     = "qa"
}

variable "instance_type" {
  type        = string
  description = "The EC2 instance type to launch"
  default     = "t3.micro"
}

variable "key_name" {
  type        = string
  description = "The SSH key pair name to associate with instances"
}

variable "allowed_ssh_cidr" {
  type        = string
  description = "The CIDR block allowed to access instances via SSH"
  default     = "0.0.0.0/0"
}

variable "dockerhub_user" {
  type        = string
  description = "The Docker Hub user name for pulling docker images"
}

variable "jwt_secret" {
  type        = string
  sensitive   = true
  description = "JWT Secret token for API validation"
}

variable "jwt_refresh_secret" {
  type        = string
  sensitive   = true
  description = "JWT Refresh Secret token"
}

variable "internal_service_key" {
  type        = string
  sensitive   = true
  description = "Secure internal service authorization key"
}

variable "frontend_url" {
  type        = string
  description = "Public URL of the frontend (e.g. http://<frontend-eip>:3002)"
}

variable "user_service_url" {
  type        = string
  description = "Public URL of the user-service (e.g. http://<user-eip>:3001)"
}

variable "cors_origins" {
  type        = string
  description = "Comma-separated list of allowed CORS origins"
}

