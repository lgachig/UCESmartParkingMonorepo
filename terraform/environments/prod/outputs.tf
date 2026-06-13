output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "asg_name" {
  description = "Name of the Auto Scaling Group"
  value       = module.asg_core.asg_name
}

output "database_private_ip" {
  description = "Private IP of the Database Node"
  value       = module.ec2_database.private_ip
}

output "bastion_public_ip" {
  description = "Public IP (Elastic IP) of the Bastion Security Node"
  value       = module.ec2_security.public_ip
}
