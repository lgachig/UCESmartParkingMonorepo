output "auth_elastic_ip" {
  description = "GitHub Secret: QA_EC2_AUTH_HOST"
  value       = aws_eip.auth.public_ip
}

output "user_elastic_ip" {
  description = "GitHub Secret: QA_EC2_USER_HOST"
  value       = aws_eip.user.public_ip
}

output "vehicle_elastic_ip" {
  description = "GitHub Secret: QA_EC2_VEHICLE_HOST"
  value       = aws_eip.vehicle.public_ip
}

output "frontend_elastic_ip" {
  description = "GitHub Secret: QA_EC2_FRONTEND_HOST"
  value       = aws_eip.frontend.public_ip
}

output "gateway_elastic_ip" {
  description = "GitHub Secret: QA_EC2_GATEWAY_HOST"
  value       = aws_eip.gateway.public_ip
}

output "parking_elastic_ip" {
  description = "GitHub Secret: QA_EC2_PARKING_HOST"
  value       = aws_eip.parking.public_ip
}

output "reservation_elastic_ip" {
  description = "GitHub Secret: QA_EC2_RESERVATION_HOST"
  value       = aws_eip.reservation.public_ip
}

output "qa_auth_api_url" {
  description = "GitHub Variable: QA_AUTH_API_URL"
  value       = "http://${aws_eip.auth.public_ip}:3000/api"
}

output "qa_user_api_url" {
  description = "GitHub Variable: QA_USER_API_URL"
  value       = "http://${aws_eip.user.public_ip}:3001/api"
}

output "qa_vehicle_api_url" {
  description = "GitHub Variable: QA_VEHICLE_API_URL"
  value       = "http://${aws_eip.vehicle.public_ip}:3003/api"
}

output "qa_parking_api_url" {
  description = "GitHub Variable: QA_PARKING_API_URL"
  value       = "http://${aws_eip.parking.public_ip}:3004/api"
}

output "qa_reservation_api_url" {
  description = "GitHub Variable: QA_RESERVATION_API_URL"
  value       = "http://${aws_eip.reservation.public_ip}:3005/api"
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
    GitHub Environment: qa
    Rama que dispara CI/CD: QA (o qa)

    SECRETS (Environment secrets):
      QA_EC2_SSH_KEY        = contenido del archivo .pem (${var.key_name})
      QA_EC2_AUTH_HOST      = ${aws_eip.auth.public_ip}
      QA_EC2_USER_HOST      = ${aws_eip.user.public_ip}
      QA_EC2_VEHICLE_HOST   = ${aws_eip.vehicle.public_ip}
      QA_EC2_FRONTEND_HOST  = ${aws_eip.frontend.public_ip}
      QA_EC2_GATEWAY_HOST   = ${aws_eip.gateway.public_ip}
      QA_EC2_PARKING_HOST   = ${aws_eip.parking.public_ip}
      QA_EC2_RESERVATION_HOST = ${aws_eip.reservation.public_ip}
      DOCKERHUB_USERNAME    = ${var.dockerhub_user}
      DOCKERHUB_TOKEN       = (token de Docker Hub)

    VARIABLES (Environment variables):
      QA_AUTH_API_URL        = http://${aws_eip.auth.public_ip}:3000/api
      QA_USER_API_URL        = http://${aws_eip.user.public_ip}:3001/api
      QA_VEHICLE_API_URL     = http://${aws_eip.vehicle.public_ip}:3003/api
      QA_PARKING_API_URL     = http://${aws_eip.parking.public_ip}:3004/api
      QA_RESERVATION_API_URL = http://${aws_eip.reservation.public_ip}:3005/api

    Docker Hub tags: smartparking-*:${var.environment}
  EOT
}
