# ---------------------------------------------------------------------------
# Copia estos valores en GitHub → Settings → Environments → qa
# Ejecuta: terraform output (desde environments/qa)
# ---------------------------------------------------------------------------

output "auth_elastic_ip" {
  description = "GitHub Secret: QA_EC2_AUTH_HOST (solo IP, sin http)"
  value       = module.auth.elastic_ip
}

output "user_elastic_ip" {
  description = "GitHub Secret: QA_EC2_USER_HOST"
  value       = module.user.elastic_ip
}

output "vehicle_elastic_ip" {
  description = "GitHub Secret: QA_EC2_VEHICLE_HOST"
  value       = module.vehicle.elastic_ip
}

output "frontend_elastic_ip" {
  description = "GitHub Secret: QA_EC2_FRONTEND_HOST"
  value       = module.frontend.elastic_ip
}

output "qa_auth_api_url" {
  description = "GitHub Variable: QA_AUTH_API_URL"
  value       = "http://${module.auth.elastic_ip}:3000/api"
}

output "qa_user_api_url" {
  description = "GitHub Variable: QA_USER_API_URL"
  value       = "http://${module.user.elastic_ip}:3001/api"
}

output "qa_vehicle_api_url" {
  description = "GitHub Variable: QA_VEHICLE_API_URL"
  value       = "http://${module.vehicle.elastic_ip}:3003/api"
}

output "qa_frontend_url" {
  description = "URL pública del frontend"
  value       = "http://${module.frontend.elastic_ip}:3002"
}

output "docker_image_tag" {
  description = "Tag usado en Docker Hub y EC2 (debe coincidir con environment en tfvars)"
  value       = var.environment
}

output "github_setup_summary" {
  description = "Resumen para configurar GitHub Actions (environment qa)"
  value       = <<-EOT
    GitHub Environment: qa
    Rama que dispara CI/CD: QA (o qa)

    SECRETS (Environment secrets):
      QA_EC2_SSH_KEY        = contenido del archivo .pem (${var.key_name})
      QA_EC2_AUTH_HOST      = ${module.auth.elastic_ip}
      QA_EC2_USER_HOST      = ${module.user.elastic_ip}
      QA_EC2_VEHICLE_HOST   = ${module.vehicle.elastic_ip}
      QA_EC2_FRONTEND_HOST  = ${module.frontend.elastic_ip}
      DOCKERHUB_USERNAME    = ${var.dockerhub_user}
      DOCKERHUB_TOKEN       = (token de Docker Hub)

    VARIABLES (Environment variables):
      QA_AUTH_API_URL       = http://${module.auth.elastic_ip}:3000/api
      QA_USER_API_URL       = http://${module.user.elastic_ip}:3001/api
      QA_VEHICLE_API_URL    = http://${module.vehicle.elastic_ip}:3003/api

    Docker Hub tags: smartparking-*:${var.environment}
  EOT
}
