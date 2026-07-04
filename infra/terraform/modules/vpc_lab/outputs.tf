output "vpc_id" {
  value = aws_vpc.this.id
}

output "cidr_block" {
  value = aws_vpc.this.cidr_block
}

output "public_subnet_id" {
  value = aws_subnet.public.id
}

output "route_table_id" {
  description = "Route table pública — usado por el VPC Peering para agregar la ruta hacia Lab A"
  value       = aws_route_table.public.id
}
