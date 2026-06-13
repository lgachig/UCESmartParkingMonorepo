output "edge_public_ip" {
  description = "IP Publica de la instancia Edge (Gateway)"
  value       = module.ec2_edge.public_ip
}

output "edge_private_ip" {
  description = "IP Privada de la instancia Edge"
  value       = module.ec2_edge.private_ip
}

output "core_private_ip" {
  description = "IP Privada de la instancia Core"
  value       = module.ec2_core.private_ip
}

output "security_private_ip" {
  description = "IP Privada de la instancia Security"
  value       = module.ec2_security.private_ip
}

output "compute_private_ip" {
  description = "IP Privada de la instancia Compute"
  value       = module.ec2_compute.private_ip
}

output "database_private_ip" {
  description = "IP Privada de la instancia Database"
  value       = module.ec2_database.private_ip
}
