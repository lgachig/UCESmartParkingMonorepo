output "vpc_id" {
  value = data.aws_vpc.default.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs excluding us-east-1e"
  value       = [for s in data.aws_subnet.details : s.id if s.availability_zone != "us-east-1e"]
}
