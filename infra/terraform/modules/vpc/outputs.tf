output "vpc_id" {
  value = data.aws_vpc.default.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs excluding us-east-1e"
  value       = [for s in data.aws_subnet.details : s.id if s.availability_zone != "us-east-1e"]
}

output "cidr_block" {
  description = "CIDR block of this VPC (Lab A) — usado para las reglas cruzadas hacia Lab B"
  value       = data.aws_vpc.default.cidr_block
}

output "main_route_table_id" {
  description = "Route table principal de la VPC default — usado por el VPC Peering"
  value       = data.aws_route_table.main.id
}
