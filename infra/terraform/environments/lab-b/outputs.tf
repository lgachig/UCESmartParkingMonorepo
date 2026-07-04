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
  description = "GitHub Secret: QA_EC2_RESERVATION_HOST (reemplaza el valor anterior de Lab A)"
  value       = module.reservation.private_ip
}

output "payment_private_ip" {
  description = "GitHub Secret: QA_EC2_PAYMENT_HOST"
  value       = module.payment.private_ip
}

output "realtime_elastic_ip" {
  description = "GitHub Secret: QA_EC2_REALTIME_HOST (IP pública, el frontend se conecta directo)"
  value       = aws_eip.realtime.public_ip
}

output "lab_b_setup_summary" {
  value = <<-EOT
    ── Lab B desplegado ──────────────────────────────────────────
    VPC:              ${module.vpc.vpc_id} (${module.vpc.cidr_block})
    Peering con Lab A: ${module.peering.peering_connection_id}

    reservation (private): ${module.reservation.private_ip}:3005
    payment     (private): ${module.payment.private_ip}:3007
    realtime    (pública): ${aws_eip.realtime.public_ip}:3008

    Actualiza en GitHub:
      QA_EC2_RESERVATION_HOST = ${module.reservation.private_ip}
      QA_EC2_PAYMENT_HOST     = ${module.payment.private_ip}
      QA_EC2_REALTIME_HOST    = ${aws_eip.realtime.public_ip}

    SSH a estas instancias: seguís usando el MISMO bastion de Lab A
    (el peering + las reglas de SG ya permiten el salto).
  EOT
}
