variable "db_password" {
  type      = string
  sensitive = true
  default   = "postgres123!"
}

variable "jwt_secret" {
  type      = string
  sensitive = true
  default   = "prod-secret-key-123"
}

variable "jwt_private_key" {
  type      = string
  sensitive = true
}

variable "jwt_public_key" {
  type      = string
  sensitive = true
}

variable "ghcr_token" {
  type      = string
  sensitive = true
}
