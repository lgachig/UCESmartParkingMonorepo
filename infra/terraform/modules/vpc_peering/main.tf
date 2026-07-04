/**
 * modules/vpc_peering
 *
 * Conecta dos VPCs de la MISMA cuenta y MISMA región (us-east-1) con
 * VPC Peering + auto-accept, y agrega la ruta correspondiente en la route
 * table pública de cada lado. Con esto, las instancias de un lado pueden
 * hablar por IP privada con las del otro lado (y, al estar en la misma
 * región, los Security Groups de un lado pueden referenciarse como
 * source_security_group_id desde el otro lado).
 */

resource "aws_vpc_peering_connection" "this" {
  vpc_id      = var.requester_vpc_id   # Lab B (el nuevo)
  peer_vpc_id = var.accepter_vpc_id    # Lab A (VPC default)
  auto_accept = true                  # misma cuenta + misma región -> se acepta solo

  tags = {
    Name = "${var.requester_name}-to-${var.accepter_name}-peering"
  }
}

# Ruta en Lab B -> hacia el CIDR de Lab A
resource "aws_route" "requester_to_accepter" {
  route_table_id            = var.requester_route_table_id
  destination_cidr_block    = var.accepter_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.this.id
}

# Ruta en Lab A -> hacia el CIDR de Lab B
resource "aws_route" "accepter_to_requester" {
  route_table_id            = var.accepter_route_table_id
  destination_cidr_block    = var.requester_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.this.id
}
