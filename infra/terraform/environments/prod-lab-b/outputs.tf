output "peering_connection_id" {
  value = module.peering.peering_connection_id
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "vpc_cidr" {
  value = module.vpc.cidr_block
}

output "reservation_private_ip" {
  description = "GitHub Secret: PROD_EC2_RESERVATION_HOST"
  value       = module.reservation.private_ip
}

output "payment_private_ip" {
  description = "GitHub Secret: PROD_EC2_PAYMENT_HOST"
  value       = module.payment.private_ip
}

output "realtime_elastic_ip" {
  description = "GitHub Secret: PROD_EC2_REALTIME_HOST"
  value       = aws_eip.realtime.public_ip
}

output "ai_private_ip" {
  description = "GitHub Secret: PROD_EC2_AI_HOST"
  value       = module.ai.private_ip
}

output "prod_lab_b_setup_summary" {
  value = <<-EOT
    ── prod-lab-b desplegado (Account B) ───────────────────────
    VPC:               ${module.vpc.vpc_id} (${module.vpc.cidr_block})
    Peering con prod:  ${module.peering.peering_connection_id}

    reservation (private): ${module.reservation.private_ip}:3005
    payment     (private): ${module.payment.private_ip}:3007
    realtime    (pública): ${aws_eip.realtime.public_ip}:3008
    ai          (private): ${module.ai.private_ip}:3009

    Re-aplicar environments/prod con:
      lab_b_reservation_private_ip = ${module.reservation.private_ip}
      lab_b_payment_private_ip     = ${module.payment.private_ip}
      lab_b_realtime_public_ip     = ${aws_eip.realtime.public_ip}
      lab_b_ai_private_ip          = ${module.ai.private_ip}

    GitHub Secrets (Environment: prod):
      PROD_EC2_RESERVATION_HOST = ${module.reservation.private_ip}
      PROD_EC2_PAYMENT_HOST     = ${module.payment.private_ip}
      PROD_EC2_REALTIME_HOST    = ${aws_eip.realtime.public_ip}
      PROD_EC2_AI_HOST          = ${module.ai.private_ip}

    GitHub Secrets adicionales para CI/CD (prod.yml):
      AWS_ACCESS_KEY_ID_LAB_B / AWS_SECRET_ACCESS_KEY_LAB_B / AWS_SESSION_TOKEN_LAB_B
      PROD_REALTIME_URL = http://<realtime_elastic_ip>:3008
  EOT
}
