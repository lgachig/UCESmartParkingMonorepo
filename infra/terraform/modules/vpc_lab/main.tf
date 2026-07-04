/**
 * modules/vpc_lab
 *
 * Crea una VPC propia (no la default de la cuenta) para un laboratorio nuevo,
 * pensada para conectarse por VPC Peering con la VPC default (Lab A / qa).
 *
 * Reglas:
 *  - El CIDR debe ser distinto al de la VPC default (Lab A), si no el
 *    peering fallará ("overlapping CIDR").
 *  - Se crea 1 sola subnet pública + IGW, igual de simple que el modelo
 *    actual de QA (todas las instancias con IP pública/privada en la misma AZ).
 */

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${var.environment}-vpc"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name        = "${var.environment}-igw"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.environment}-public-subnet"
    Environment = var.environment
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = {
    Name        = "${var.environment}-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
