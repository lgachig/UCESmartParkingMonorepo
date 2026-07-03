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

output "parking_private_ip" {
  description = "GitHub Secret: PROD_EC2_PARKING_HOST"
  value       = module.parking.private_ip
}

output "reservation_private_ip" {
  description = "GitHub Secret: PROD_EC2_RESERVATION_HOST"
  value       = module.reservation.private_ip
}

output "payment_private_ip" {
  description = "GitHub Secret: PROD_EC2_PAYMENT_HOST"
  value       = module.payment.private_ip
}

output "frontend_alb_dns" {
  description = "GitHub Variable: PROD_FRONTEND_URL (agrégale http:// y sin puerto, el ALB escucha en 80)"
  value       = module.frontend_asg.alb_dns_name
}

output "gateway_alb_dns" {
  description = "GitHub Variable/Secret: PROD_GATEWAY_URL (agrégale http:// y sin puerto, el ALB escucha en 80)"
  value       = module.gateway_asg.alb_dns_name
}

output "frontend_asg_name" {
  description = "Nombre del ASG del frontend (para describir/instance-refresh desde el CI/CD)"
  value       = module.frontend_asg.asg_name
}

output "gateway_asg_name" {
  description = "Nombre del ASG del gateway (para describir/instance-refresh desde el CI/CD)"
  value       = module.gateway_asg.asg_name
}

output "prod_gateway_api_url" {
  description = "URL pública del Gateway (vía ALB)"
  value       = "http://${module.gateway_asg.alb_dns_name}/api"
}

output "prod_frontend_url" {
  description = "URL pública del Frontend (vía ALB)"
  value       = "http://${module.frontend_asg.alb_dns_name}"
}

output "github_setup_summary" {
  description = "Resumen de lo que hay que copiar a GitHub (Environment: prod)"
  value       = <<-EOT
    ── SECRETS ────────────────────────────────────────────
    PROD_EC2_SSH_KEY   = contenido del archivo ${var.key_name}.pem
    PROD_BASTION_HOST  = ${module.bastion.public_ip}
    DOCKERHUB_TOKEN    = tu token de Docker Hub

    ── VARIABLES ──────────────────────────────────────────
    PROD_GATEWAY_URL   = http://${module.gateway_asg.alb_dns_name}
    PROD_FRONTEND_URL  = http://${module.frontend_asg.alb_dns_name}

    ── ACCESO PÚBLICO ─────────────────────────────────────
    Frontend (ALB): http://${module.frontend_asg.alb_dns_name}
    Gateway  (ALB): http://${module.gateway_asg.alb_dns_name}

    ── ASG (para instance refresh manual si hace falta) ───
    Frontend ASG: ${module.frontend_asg.asg_name}
    Gateway  ASG: ${module.gateway_asg.asg_name}
  EOT
}
