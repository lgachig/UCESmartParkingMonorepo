output "alb_dns_name" {
  description = "DNS público del ALB — úsalo como PROD_..._HOST en lugar de una IP fija"
  value       = aws_lb.this.dns_name
}

output "alb_security_group_id" {
  description = "SG del ALB — se pasa a security_groups.alb_security_group_ids para permitir el tráfico ALB -> instancia"
  value       = aws_security_group.alb.id
}

output "asg_name" {
  description = "Nombre del Auto Scaling Group (útil para instance refresh / describe desde el CI/CD)"
  value       = aws_autoscaling_group.this.name
}

output "target_group_arn" {
  description = "ARN del target group"
  value       = aws_lb_target_group.this.arn
}
