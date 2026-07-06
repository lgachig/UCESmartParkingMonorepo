terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ── Provider por defecto: cuenta de Lab B (donde vive este environment) ──────
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "uce-smartparking"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ── Provider alias: cuenta de Lab A (VPC default / qa) ───────────────────────
# Necesario porque Lab A y Lab B son DOS CUENTAS AWS DISTINTAS (dos Learner
# Labs de AWS Academy). Cualquier recurso que viva del lado de Lab A (aceptar
# el peering, agregar la ruta en su route table) tiene que crearse con ESTAS
# credenciales, no con las de Lab B.
#
# Cómo obtenerlas: son las mismas credenciales temporales que usas para
# `environments/qa` (AWS Academy -> "AWS Details" -> download .csv / copiar
# access key, secret key y session token). Pásalas por variable de entorno,
# NUNCA las pongas en terraform.tfvars:
#
#   export TF_VAR_lab_a_access_key="..."
#   export TF_VAR_lab_a_secret_key="..."
#   export TF_VAR_lab_a_session_token="..."
#
# Igual que las credenciales de Lab B, las de AWS Academy expiran cada pocas
# horas — si el apply falla con "ExpiredToken" o "InvalidClientTokenId",
# vuelve a copiar unas frescas del panel de Academy para AMBAS cuentas.
provider "aws" {
  alias      = "accepter"
  region     = var.aws_region
  access_key = var.lab_a_access_key
  secret_key = var.lab_a_secret_key
  token      = var.lab_a_session_token

  default_tags {
    tags = {
      Project     = "uce-smartparking"
      Environment = var.lab_a_environment
      ManagedBy   = "terraform"
    }
  }
}
