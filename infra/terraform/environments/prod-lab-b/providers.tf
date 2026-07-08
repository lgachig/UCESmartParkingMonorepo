terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

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
