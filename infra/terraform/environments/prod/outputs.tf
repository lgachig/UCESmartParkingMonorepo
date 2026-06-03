output "auth_elastic_ip" {
  description = "GitHub Secret: PROD_EC2_AUTH_HOST"
  value       = module.auth.elastic_ip
}

output "user_elastic_ip" {
  description = "GitHub Secret: PROD_EC2_USER_HOST"
  value       = module.user.elastic_ip
}

output "vehicle_elastic_ip" {
  description = "GitHub Secret: PROD_EC2_VEHICLE_HOST"
  value       = module.vehicle.elastic_ip
}

output "frontend_elastic_ip" {
  description = "GitHub Secret: PROD_EC2_FRONTEND_HOST"
  value       = module.frontend.elastic_ip
}

output "prod_auth_api_url" {
  description = "GitHub Variable: PROD_AUTH_API_URL"
  value       = "http://${module.auth.elastic_ip}:3000/api"
}

output "prod_user_api_url" {
  description = "GitHub Variable: PROD_USER_API_URL"
  value       = "http://${module.user.elastic_ip}:3001/api"
}

output "prod_vehicle_api_url" {
  description = "GitHub Variable: PROD_VEHICLE_API_URL"
  value       = "http://${module.vehicle.elastic_ip}:3003/api"
}

output "prod_frontend_url" {
  value = "http://${module.frontend.elastic_ip}:3002"
}

output "docker_image_tag" {
  value = var.environment
}

output "github_setup_summary" {
  value = <<-EOT
    GitHub Environment: prod
    Rama que dispara CI/CD: PROD (o prod)

    SECRETS:
      PROD_EC2_SSH_KEY       = .pem (${var.key_name})
      PROD_EC2_AUTH_HOST     = ${module.auth.elastic_ip}
      PROD_EC2_USER_HOST     = ${module.user.elastic_ip}
      PROD_EC2_VEHICLE_HOST  = ${module.vehicle.elastic_ip}
      PROD_EC2_FRONTEND_HOST = ${module.frontend.elastic_ip}
      DOCKERHUB_USERNAME     = ${var.dockerhub_user}
      DOCKERHUB_TOKEN        = (Docker Hub)

    VARIABLES:
      PROD_AUTH_API_URL      = http://${module.auth.elastic_ip}:3000/api
      PROD_USER_API_URL      = http://${module.user.elastic_ip}:3001/api
      PROD_VEHICLE_API_URL   = http://${module.vehicle.elastic_ip}:3003/api

    Docker Hub tags: smartparking-*:${var.environment}
  EOT
}
