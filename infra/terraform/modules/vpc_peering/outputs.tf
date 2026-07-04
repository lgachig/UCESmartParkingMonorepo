output "peering_connection_id" {
  value = aws_vpc_peering_connection.this.id
}

output "peering_status" {
  description = "Debe ser 'active' luego del apply. Si queda en 'pending-acceptance', revisa las credenciales del provider aws.accepter."
  value       = aws_vpc_peering_connection_accepter.this.accept_status
}
