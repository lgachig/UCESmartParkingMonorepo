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

output "github_setup_summary" {
  description = "Resumen para configurar GitHub Actions (environment qa)"
  value       = <<-EOT
    ╔══════════════════════════════════════════════════════════════╗
    ║          GitHub Environment: qa  |  Rama: QA / qa           ║
    ╚══════════════════════════════════════════════════════════════╝

    ── SECRETS (Settings → Secrets → Actions → Environment: qa) ──

      DOCKERHUB_USERNAME        = ${var.dockerhub_user}
      DOCKERHUB_TOKEN           = (token de Docker Hub)
      QA_EC2_SSH_KEY            = (contenido del .pem — ${var.key_name})

      QA_BASTION_HOST           = ${module.bastion.public_ip}

      QA_EC2_AUTH_HOST          = ${module.auth.private_ip}
      QA_EC2_USER_HOST          = ${module.user.private_ip}
      QA_EC2_VEHICLE_HOST       = ${module.vehicle.private_ip}
      QA_EC2_FRONTEND_HOST      = ${aws_eip.frontend.public_ip}
      QA_EC2_GATEWAY_HOST       = ${aws_eip.gateway.public_ip}
      QA_EC2_PARKING_HOST       = ${module.parking.private_ip}
      QA_EC2_RESERVATION_HOST   = ${module.reservation.private_ip}

    ── VARIABLES (Settings → Variables → Actions → Environment: qa) ──

      QA_AUTH_API_URL           = http://${aws_eip.gateway.public_ip}:3006/api
      QA_USER_API_URL           = http://${aws_eip.gateway.public_ip}:3006/api
      QA_VEHICLE_API_URL        = http://${aws_eip.gateway.public_ip}:3006/api
      QA_PARKING_API_URL        = http://${aws_eip.gateway.public_ip}:3006/api
      QA_RESERVATION_API_URL    = http://${aws_eip.gateway.public_ip}:3006/api
  EOT
}
