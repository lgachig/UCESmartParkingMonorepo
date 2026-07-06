#!/usr/bin/env bash
# Imprime qué copiar en GitHub después de terraform apply.
# Uso: ./infra/scripts/print-github-setup.sh qa
#      ./infra/scripts/print-github-setup.sh prod
#      ./infra/scripts/print-github-setup.sh lab-b
set -euo pipefail

ENV_NAME="${1:-}"
if [[ "$ENV_NAME" != "qa" && "$ENV_NAME" != "prod" && "$ENV_NAME" != "lab-b" ]]; then
  echo "Uso: $0 qa|prod|lab-b"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TF_DIR="$ROOT/infra/terraform/environments/$ENV_NAME"

if [[ ! -d "$TF_DIR" ]]; then
  echo "No existe $TF_DIR"
  exit 1
fi

cd "$TF_DIR"
if [[ ! -f terraform.tfstate ]]; then
  echo "No hay terraform.tfstate. Ejecuta antes: terraform apply -var-file=terraform.tfvars"
  exit 1
fi

if [[ "$ENV_NAME" == "lab-b" ]]; then
  SUMMARY_OUTPUT="lab_b_setup_summary"
else
  SUMMARY_OUTPUT="github_setup_summary"
fi

echo ""
echo "========== GitHub setup ($ENV_NAME) =========="
terraform output -raw "$SUMMARY_OUTPUT" 2>/dev/null || terraform output
echo ""
echo "========== Outputs individuales =========="
terraform output