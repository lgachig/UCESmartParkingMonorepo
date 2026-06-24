output "security_group_ids" {
  description = "A map of security group IDs indexed by service name"
  value       = { for k, v in aws_security_group.microservice : k => v.id }
}
