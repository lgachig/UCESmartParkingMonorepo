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

output "notification_private_ip" {
  description = "IP privada de notification (Account A prod)"
  value       = module.notification.private_ip
}

output "audit_private_ip" {
  description = "IP privada de audit (Account A prod)"
  value       = module.audit.private_ip
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
  description = "Nombre del ASG del frontend (para instance-refresh desde CI/CD)"
  value       = module.frontend_asg.asg_name
}

output "gateway_asg_name" {
  description = "Nombre del ASG del gateway (para instance-refresh desde CI/CD)"
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

output "lab_b_tfvars_hint" {
  description = "Valores para re-aplicar prod tras desplegar prod-lab-b"
  value       = <<-EOT
    lab_b_reservation_private_ip = "<output prod-lab-b reservation_private_ip>"
    lab_b_payment_private_ip     = "<output prod-lab-b payment_private_ip>"
    lab_b_realtime_public_ip     = "<output prod-lab-b realtime_elastic_ip>"
    lab_b_ai_private_ip          = "<output prod-lab-b ai_private_ip>"
  EOT
}

output "github_setup_summary" {
  description = "Resumen de lo que hay que copiar a GitHub (Environment: prod)"
  value       = <<-EOT
    ── SECRETS (Account A — prod) ───────────────────────────
    PROD_EC2_SSH_KEY   = contenido del archivo ${var.key_name}.pem
    PROD_BASTION_HOST  = ${module.bastion.public_ip}
    DOCKERHUB_TOKEN    = tu token de Docker Hub

    ── SECRETS (Account B — prod-lab-b, tras su apply) ─────
    PROD_EC2_RESERVATION_HOST = <prod-lab-b reservation_private_ip>
    PROD_EC2_PAYMENT_HOST     = <prod-lab-b payment_private_ip>
    PROD_EC2_REALTIME_HOST    = <prod-lab-b realtime_elastic_ip>
    PROD_EC2_AI_HOST          = <prod-lab-b ai_private_ip>

    ── VARIABLES ─────────────────────────────────────────────
    PROD_GATEWAY_URL   = http://${module.gateway_asg.alb_dns_name}
    PROD_FRONTEND_URL  = http://${module.frontend_asg.alb_dns_name}

    ── ACCESO PÚBLICO ──────────────────────────────────────
    Frontend (ALB): http://${module.frontend_asg.alb_dns_name}
    Gateway  (ALB): http://${module.gateway_asg.alb_dns_name}

    ── ORDEN DE APPLY ──────────────────────────────────────
    1. environments/prod
    2. environments/prod-lab-b
    3. environments/prod (con IPs de prod-lab-b en tfvars)
  EOT
}
