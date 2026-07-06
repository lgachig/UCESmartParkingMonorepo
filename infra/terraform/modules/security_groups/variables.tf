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
  description = "Security group ID of the bastion host (mismo-cuenta). Dejar vacío \"\" si usas bastion_cidr_block en su lugar."
  default     = ""
}

variable "bastion_cidr_block" {
  type        = string
  description = "CIDR desde el que se permite SSH cuando el bastion vive en OTRA cuenta AWS y no se puede referenciar por Security Group ID (p.ej. Lab B referenciando al bastion de Lab A). Dejar vacío \"\" para usar bastion_security_group_id en su lugar."
  default     = ""
}

# ── Soporte ASG + Load Balancer (usado por prod) ──────────────────────────────
variable "enable_frontend_public_direct" {
  type        = bool
  default     = true
  description = "Si es true, abre el puerto del frontend a 0.0.0.0/0 directo a la instancia (modelo QA). Ponlo en false cuando el frontend esté detrás de un ALB (prod)."
}

variable "enable_gateway_public_direct" {
  type        = bool
  default     = true
  description = "Si es true, abre el puerto del gateway a 0.0.0.0/0 directo a la instancia (modelo QA). Ponlo en false cuando el gateway esté detrás de un ALB (prod)."
}

variable "enable_realtime_public_direct" {
  type        = bool
  default     = true
  description = "Si es true, abre el puerto WebSocket de realtime-service a 0.0.0.0/0 directo a la instancia, ya que el frontend se conecta a él directamente (no vía gateway)."
}

