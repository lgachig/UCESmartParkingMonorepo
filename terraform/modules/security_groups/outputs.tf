output "edge_sg_id" {
  value = aws_security_group.edge.id
}

output "core_sg_id" {
  value = aws_security_group.core.id
}

output "security_sg_id" {
  value = aws_security_group.security.id
}

output "compute_sg_id" {
  value = aws_security_group.compute.id
}

output "database_sg_id" {
  value = aws_security_group.database.id
}
