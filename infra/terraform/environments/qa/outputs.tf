output "bastion_public_ip" {
  description = "GitHub Secret: QA_BASTION_HOST — jump server to reach all private instances"
  value       = module.bastion.public_ip
}

output "auth_private_ip" {
  description = "GitHub Secret: QA_EC2_AUTH_HOST"
  value       = module.auth.private_ip
}

output "user_private_ip" {
  description = "GitHub Secret: QA_EC2_USER_HOST"
  value       = module.user.private_ip
}

output "vehicle_private_ip" {
  description = "GitHub Secret: QA_EC2_VEHICLE_HOST"
  value       = module.vehicle.private_ip
}

output "frontend_elastic_ip" {
  description = "GitHub Secret: QA_EC2_FRONTEND_HOST"
  value       = aws_eip.frontend.public_ip
}

output "gateway_elastic_ip" {
  description = "GitHub Secret: QA_EC2_GATEWAY_HOST"
  value       = aws_eip.gateway.public_ip
}

output "parking_private_ip" {
  description = "GitHub Secret: QA_EC2_PARKING_HOST"
  value       = module.parking.private_ip
}

output "reservation_private_ip" {
  description = "GitHub Secret: QA_EC2_RESERVATION_HOST"
  value       = module.reservation.private_ip
}

output "qa_auth_api_url" {
  description = "GitHub Variable: QA_AUTH_API_URL"
  value       = "http://${aws_eip.gateway.public_ip}:3006/api"
}

output "qa_user_api_url" {
  description = "GitHub Variable: QA_USER_API_URL"
  value       = "http://${aws_eip.gateway.public_ip}:3006/api"
}

output "qa_vehicle_api_url" {
  description = "GitHub Variable: QA_VEHICLE_API_URL"
  value       = "http://${aws_eip.gateway.public_ip}:3006/api"
}

output "qa_parking_api_url" {
  description = "GitHub Variable: QA_PARKING_API_URL"
  value       = "http://${aws_eip.gateway.public_ip}:3006/api"
}

output "qa_reservation_api_url" {
  description = "GitHub Variable: QA_RESERVATION_API_URL"
  value       = "http://${aws_eip.gateway.public_ip}:3006/api"
}

output "qa_gateway_api_url" {
  description = "URL pública del Gateway"
  value       = "http://${aws_eip.gateway.public_ip}:3006/api"
}

output "qa_frontend_url" {
  description = "URL pública del Frontend"
  value       = "http://${aws_eip.frontend.public_ip}:3002"
}

variable "auth_host" {
  type        = string
  description = "IP privada o DNS del auth EC2 (donde corren postgres, redis, kafka). Dejar en blanco en el primer apply."
  default     = "placeholder"
}

output "payment_private_ip" {
  description = "Private IP of payment service EC2"
  value       = module.payment.private_ip
}


output "github_setup_summary" {
  description = "Solo 3 secrets necesarios en GitHub"
  value       = <<-EOT
    ── SECRETS (solo estos 3 son necesarios) ────────────
    QA_EC2_SSH_KEY   = contenido del archivo ${var.key_name}.pem
    QA_BASTION_HOST  = ${module.bastion.public_ip}
    DOCKERHUB_TOKEN  = tu token de Docker Hub

    ── VARIABLES ─────────────────────────────────────────
    QA_AUTH_API_URL        = http://${aws_eip.gateway.public_ip}:3006/api
    QA_USER_API_URL        = http://${aws_eip.gateway.public_ip}:3006/api
    QA_VEHICLE_API_URL     = http://${aws_eip.gateway.public_ip}:3006/api
    QA_PARKING_API_URL     = http://${aws_eip.gateway.public_ip}:3006/api
    QA_RESERVATION_API_URL = http://${aws_eip.gateway.public_ip}:3006/api

    ── ACCESO PÚBLICO ────────────────────────────────────
    Frontend: http://${aws_eip.frontend.public_ip}:3002
    Gateway:  http://${aws_eip.gateway.public_ip}:3006
  EOT
}