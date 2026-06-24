output "bastion_public_ip" {
  description = "GitHub Secret: PROD_BASTION_HOST — jump server to reach all private instances"
  value       = module.bastion.public_ip
}

output "auth_private_ip" {
  description = "GitHub Secret: PROD_EC2_AUTH_HOST"
  value       = module.auth.private_ip
}

output "user_private_ip" {
  description = "GitHub Secret: PROD_EC2_USER_HOST"
  value       = module.user.private_ip
}

output "vehicle_private_ip" {
  description = "GitHub Secret: PROD_EC2_VEHICLE_HOST"
  value       = module.vehicle.private_ip
}

output "frontend_elastic_ip" {
  description = "GitHub Secret: PROD_EC2_FRONTEND_HOST"
  value       = aws_eip.frontend.public_ip
}

output "gateway_elastic_ip" {
  description = "GitHub Secret: PROD_EC2_GATEWAY_HOST"
  value       = aws_eip.gateway.public_ip
}

output "parking_private_ip" {
  description = "GitHub Secret: PROD_EC2_PARKING_HOST"
  value       = module.parking.private_ip
}

output "reservation_private_ip" {
  description = "GitHub Secret: PROD_EC2_RESERVATION_HOST"
  value       = module.reservation.private_ip
}

output "prod_auth_api_url" {
  description = "GitHub Variable: PROD_AUTH_API_URL"
  value       = "http://${aws_eip.gateway.public_ip}:3006/api"
}

output "prod_user_api_url" {
  description = "GitHub Variable: PROD_USER_API_URL"
  value       = "http://${aws_eip.gateway.public_ip}:3006/api"
}

output "prod_vehicle_api_url" {
  description = "GitHub Variable: PROD_VEHICLE_API_URL"
  value       = "http://${aws_eip.gateway.public_ip}:3006/api"
}

output "prod_parking_api_url" {
  description = "GitHub Variable: PROD_PARKING_API_URL"
  value       = "http://${aws_eip.gateway.public_ip}:3006/api"
}

output "prod_reservation_api_url" {
  description = "GitHub Variable: PROD_RESERVATION_API_URL"
  value       = "http://${aws_eip.gateway.public_ip}:3006/api"
}

output "prod_gateway_api_url" {
  description = "URL pública del Gateway"
  value       = "http://${aws_eip.gateway.public_ip}:3006/api"
}

output "prod_frontend_url" {
  description = "URL pública del Frontend"
  value       = "http://${aws_eip.frontend.public_ip}:3002"
}

output "github_setup_summary" {
  description = "Resumen para configurar GitHub Actions (environment prod)"
  value       = <<-EOT
    GitHub Environment: prod
    Rama que dispara CI/CD: PROD (o prod)

    SECRETS (Environment secrets):
      PROD_EC2_SSH_KEY        = contenido del archivo .pem (${var.key_name})
      PROD_BASTION_HOST       = ${module.bastion.public_ip}
      PROD_EC2_AUTH_HOST      = ${module.auth.private_ip}
      PROD_EC2_USER_HOST      = ${module.user.private_ip}
      PROD_EC2_VEHICLE_HOST   = ${module.vehicle.private_ip}
      PROD_EC2_FRONTEND_HOST  = ${module.frontend.private_ip}
      PROD_EC2_GATEWAY_HOST   = ${module.gateway.private_ip}
      PROD_EC2_PARKING_HOST   = ${module.parking.private_ip}
      PROD_EC2_RESERVATION_HOST = ${module.reservation.private_ip}
      DOCKERHUB_USERNAME      = ${var.dockerhub_user}
      DOCKERHUB_TOKEN         = (token de Docker Hub)

    VARIABLES (Environment variables):
      PROD_AUTH_API_URL        = http://${aws_eip.gateway.public_ip}:3006/api
      PROD_USER_API_URL        = http://${aws_eip.gateway.public_ip}:3006/api
      PROD_VEHICLE_API_URL     = http://${aws_eip.gateway.public_ip}:3006/api
      PROD_PARKING_API_URL     = http://${aws_eip.gateway.public_ip}:3006/api
      PROD_RESERVATION_API_URL = http://${aws_eip.gateway.public_ip}:3006/api

    Docker Hub tags: smartparking-*:${var.environment}
  EOT
}

output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = aws_lb.prod_alb.dns_name
}

output "prod_frontend_url_alb" {
  description = "Frontend public URL via ALB"
  value       = "http://${aws_lb.prod_alb.dns_name}"
}

output "prod_gateway_api_url_alb" {
  description = "Gateway API URL via ALB"
  value       = "http://${aws_lb.prod_alb.dns_name}:3006/api"
}

