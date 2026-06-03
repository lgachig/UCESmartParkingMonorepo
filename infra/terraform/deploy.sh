#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  deploy.sh <qa|prod> [--profile PROFILE] [--force-unlock-id LOCK_ID] [--lock-timeout DURATION]

Variables requeridas:
  TF_VAR_jwt_secret
  TF_VAR_jwt_refresh_secret
  TF_VAR_internal_service_key

Autenticacion AWS:
  - Exporta AWS_PROFILE, o
  - Exporta AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN

Ejemplo:
  AWS_PROFILE=develop \
  TF_VAR_jwt_secret='...' \
  TF_VAR_jwt_refresh_secret='...' \
  TF_VAR_internal_service_key='...' \
  ./deploy.sh qa --profile develop
EOF
}

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "No se encontró el comando '$1' en PATH."
}

check_required_env() {
  local var_name
  for var_name in TF_VAR_jwt_secret TF_VAR_jwt_refresh_secret TF_VAR_internal_service_key; do
    if [[ -z "${!var_name:-}" ]]; then
      fail "Falta exportar $var_name."
    fi
  done
}

terraform_output_raw() {
  local output_name="$1"
  local output_value
  local output_error

  output_error="$(mktemp)"
  if ! output_value="$(terraform output -raw "$output_name" 2>"$output_error")"; then
    cat "$output_error" >&2
    rm -f "$output_error"
    fail "No se pudo leer el output '$output_name'."
  fi
  rm -f "$output_error"
  printf '%s' "$output_value"
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
environment=""
aws_profile_arg=""
force_unlock_id=""
lock_timeout="${TF_LOCK_TIMEOUT:-5m}"

while (($#)); do
  case "$1" in
    qa|prod)
      if [[ -n "$environment" ]]; then
        fail "Solo puedes indicar un ambiente."
      fi
      environment="$1"
      ;;
    --profile)
      [[ $# -ge 2 ]] || fail "Falta el valor para --profile."
      aws_profile_arg="$2"
      shift
      ;;
    --force-unlock-id)
      [[ $# -ge 2 ]] || fail "Falta el valor para --force-unlock-id."
      force_unlock_id="$2"
      shift
      ;;
    --lock-timeout)
      [[ $# -ge 2 ]] || fail "Falta el valor para --lock-timeout."
      lock_timeout="$2"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "Argumento desconocido: $1"
      ;;
  esac
  shift
done

[[ -n "$environment" ]] || { usage; exit 1; }

env_dir="$script_dir/environments/$environment"
backend_file="$env_dir/backend.hcl"
tfvars_file="$env_dir/terraform.tfvars"

[[ -d "$env_dir" ]] || fail "No existe el directorio del ambiente: $env_dir"
[[ -f "$backend_file" ]] || fail "No existe backend.hcl en $env_dir"
[[ -f "$tfvars_file" ]] || fail "No existe terraform.tfvars en $env_dir"

require_command terraform
require_command aws
check_required_env

if [[ -n "$aws_profile_arg" ]]; then
  export AWS_PROFILE="$aws_profile_arg"
fi

if [[ -n "${AWS_PROFILE:-}" ]]; then
  printf 'Usando perfil AWS: %s\n' "$AWS_PROFILE"
fi

if [[ -z "${AWS_PROFILE:-}" && -z "${AWS_ACCESS_KEY_ID:-}" && -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
  fail "No hay credenciales AWS activas. Exporta AWS_PROFILE o las variables AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY."
fi

aws sts get-caller-identity >/dev/null

export TF_IN_AUTOMATION=1

temp_override_file=""
cleanup() {
  if [[ -n "$temp_override_file" && -f "$temp_override_file" ]]; then
    rm -f "$temp_override_file"
  fi
}
trap cleanup EXIT

cd "$env_dir"

if [[ -n "$force_unlock_id" ]]; then
  printf 'Liberando estado con lock id %s...\n' "$force_unlock_id"
  terraform force-unlock -force "$force_unlock_id"
fi

printf 'Inicializando backend para %s...\n' "$environment"
terraform init -reconfigure -backend-config=backend.hcl

printf 'Aplicando primera pasada para %s...\n' "$environment"
terraform apply -auto-approve -lock-timeout="$lock_timeout" -var-file=terraform.tfvars

auth_ip="$(terraform_output_raw auth_elastic_ip)"
user_ip="$(terraform_output_raw user_elastic_ip)"
vehicle_ip="$(terraform_output_raw vehicle_elastic_ip)"
frontend_ip="$(terraform_output_raw frontend_elastic_ip)"
auth_ip="$(terraform_output_raw auth_elastic_ip)"

temp_override_file="$(mktemp)"
cat > "$temp_override_file" <<EOF
frontend_url = "http://${frontend_ip}:3002"
user_service_url = "http://${user_ip}:3001"
cors_origins = "http://${frontend_ip}:3002,http://${auth_ip}:3000,http://${user_ip}:3001,http://${vehicle_ip}:3003"
EOF

printf 'Aplicando segunda pasada con URLs reales...\n'
terraform apply -auto-approve -lock-timeout="$lock_timeout" -var-file=terraform.tfvars -var-file="$temp_override_file"

printf '\nDespliegue completado. Outputs finales:\n'
terraform output