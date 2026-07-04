/**
 * modules/vpc_peering
 *
 * Conecta dos VPCs por VPC Peering, soportando el caso real de este
 * proyecto: Lab A y Lab B viven en DOS CUENTAS AWS DISTINTAS (dos AWS
 * Academy Learner Labs), aunque en la MISMA región (us-east-1).
 *
 * IMPORTANTE — por qué ya no usamos `auto_accept = true`:
 * `auto_accept` solo funciona cuando el requester y el accepter son la
 * MISMA cuenta AWS. Entre cuentas distintas, AWS deja la conexión en
 * estado "pending-acceptance" para siempre si nadie la acepta del lado
 * del accepter — y ESO es lo que estaba pasando: el peering nunca llegaba
 * a "active", así que ninguna ruta ni SG rule que dependiera de él servía.
 *
 * La forma correcta cross-account es:
 *   1) Crear `aws_vpc_peering_connection` con el provider del REQUESTER
 *      (Lab B), auto_accept = false, indicando peer_owner_id (cuenta de
 *      Lab A).
 *   2) Aceptarla explícitamente con `aws_vpc_peering_connection_accepter`
 *      usando el provider del ACCEPTER (Lab A).
 *   3) Agregar la ruta en cada lado usando el provider correspondiente a
 *      la cuenta dueña de esa route table.
 *
 * El módulo recibe DOS providers (ver `configuration_aliases` abajo):
 *   - aws.requester -> credenciales de la cuenta que inicia el peering (Lab B)
 *   - aws.accepter  -> credenciales de la cuenta que lo acepta (Lab A)
 *
 * Si algún día Lab A y Lab B terminan siendo la MISMA cuenta, este mismo
 * módulo sigue funcionando sin cambios: solo pasas el mismo provider dos
 * veces al invocarlo.
 */

terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.requester, aws.accepter]
    }
  }
}

# Cuenta dueña de la VPC accepter (Lab A) — necesaria para peer_owner_id
data "aws_caller_identity" "accepter" {
  provider = aws.accepter
}

resource "aws_vpc_peering_connection" "this" {
  provider = aws.requester

  vpc_id        = var.requester_vpc_id   # Lab B (el nuevo)
  peer_vpc_id   = var.accepter_vpc_id    # Lab A (VPC default)
  peer_owner_id = data.aws_caller_identity.accepter.account_id
  peer_region   = var.accepter_region != "" ? var.accepter_region : null

  # NUNCA true cross-account: se acepta explícitamente abajo.
  auto_accept = false

  tags = {
    Name = "${var.requester_name}-to-${var.accepter_name}-peering"
  }
}

# Aceptación explícita del lado de Lab A, con las credenciales de Lab A.
# Sin este recurso la conexión se queda en pending-acceptance para siempre.
resource "aws_vpc_peering_connection_accepter" "this" {
  provider = aws.accepter

  vpc_peering_connection_id = aws_vpc_peering_connection.this.id
  auto_accept                = true

  tags = {
    Name = "${var.requester_name}-to-${var.accepter_name}-peering-accepter"
  }
}

# Ruta en Lab B -> hacia el CIDR de Lab A (provider de Lab B)
resource "aws_route" "requester_to_accepter" {
  provider = aws.requester

  route_table_id            = var.requester_route_table_id
  destination_cidr_block    = var.accepter_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.this.id

  depends_on = [aws_vpc_peering_connection_accepter.this]
}

# Ruta en Lab A -> hacia el CIDR de Lab B (provider de Lab A)
resource "aws_route" "accepter_to_requester" {
  provider = aws.accepter

  route_table_id            = var.accepter_route_table_id
  destination_cidr_block    = var.requester_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.this.id

  depends_on = [aws_vpc_peering_connection_accepter.this]
}
