output "public_ip" {
  description = "Public Elastic IP of the bastion host — use as QA_BASTION_HOST / PROD_BASTION_HOST in GitHub Secrets"
  value       = aws_eip.bastion.public_ip
}

output "instance_id" {
  description = "Instance ID of the bastion host"
  value       = aws_instance.bastion.id
}

output "security_group_id" {
  description = "Security group ID of the bastion host (used to allow bastion → private instances)"
  value       = aws_security_group.bastion.id
}
