# Producción — dos cuentas AWS (como QA + lab-b)

## Carpetas

| Carpeta | Cuenta | Contenido |
|---|---|---|
| `terraform/environments/prod` | A | auth, user, vehicle, parking, frontend ASG+ALB, gateway ASG+ALB, bastion, SGs, `lab-b-integration.tf` |
| `terraform/environments/prod-lab-b` | B | VPC 10.0.0.0/16, peering, reservation, payment, realtime+EIP, ai |

Los módulos compartidos viven en `terraform/modules/` (sin duplicar).

## Orden de apply

```bash
# 1) Account A — prod
cd infra/terraform/environments/prod
terraform init && terraform apply

# 2) Account B — prod-lab-b (credenciales B + TF_VAR_lab_a_* de Account A)
cd ../prod-lab-b
export TF_VAR_lab_a_access_key="..."
export TF_VAR_lab_a_secret_key="..."
export TF_VAR_lab_a_session_token="..."   # si Academy usa token
terraform init && terraform apply

# 3) Account A — reglas de peering hacia Lab B (si no corrieron en paso 1)
cd ../prod
terraform apply   # lab-b-integration.tf

# 4) Account A — inyectar IPs de prod-lab-b en gateway/frontend ASG
# Añadir a terraform.tfvars (o -var):
#   lab_b_reservation_private_ip = "<output>"
#   lab_b_payment_private_ip     = "<output>"
#   lab_b_realtime_public_ip     = "<output>"
#   lab_b_ai_private_ip          = "<output>"
terraform apply

# 5) Instance refresh del gateway ASG (user_data actualizado) o patch_env vía CI
```

## GitHub

Tras el apply de `prod-lab-b`, copiar outputs a secrets `PROD_EC2_*` y re-aplicar prod con las variables `lab_b_*`.

Para deploy a instancias de Account B, el workflow prod necesita credenciales `AWS_*_LAB_B` (mismo patrón que `qa.yml`).

## Zip de entrega

Solo producción:

```bash
cd infra
zip -r prod-infra.zip terraform/modules terraform/environments/prod terraform/environments/prod-lab-b PROD-RUNBOOK.md \
  -x "*.terraform/*" -x "*terraform.tfstate*"
```
