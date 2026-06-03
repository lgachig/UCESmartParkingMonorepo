# GitHub Environment `prod` — copiar y pegar

Generado a partir de `terraform output` (PROD). **No subas este archivo si tiene datos sensibles.**

## 1. Crear environment

Repo → **Settings** → **Environments** → **New environment** → nombre: `prod`

## 2. Secrets (Environment secrets)

| Secret | Valor |
|--------|--------|
| `DOCKERHUB_USERNAME` | `lgachig` |
| `DOCKERHUB_TOKEN` | *(tu token de Docker Hub)* |
| `PROD_EC2_SSH_KEY` | *(contenido completo de `practicaUPro.pem`)* |
| `PROD_EC2_AUTH_HOST` | `50.19.32.236` |
| `PROD_EC2_USER_HOST` | `52.200.249.238` |
| `PROD_EC2_VEHICLE_HOST` | `32.194.131.109` |
| `PROD_EC2_FRONTEND_HOST` | `52.70.19.170` |

## 3. Variables (Environment variables)

| Variable | Valor |
|----------|--------|
| `PROD_AUTH_API_URL` | `http://50.19.32.236:3000/api` |
| `PROD_USER_API_URL` | `http://52.200.249.238:3001/api` |
| `PROD_VEHICLE_API_URL` | `http://32.194.131.109:3003/api` |

## 4. Segundo apply Terraform (CORS en EC2)

```bash
cd infra/terraform/environments/prod
export TF_VAR_jwt_secret="..."
export TF_VAR_jwt_refresh_secret="..."
export TF_VAR_internal_service_key="..."
terraform apply -var-file=terraform.tfvars
```

## 5. Desplegar aplicación

```bash
git push origin PROD
```

O merge un PR hacia `PROD` → **Actions** → **PROD CI/CD**.

## 6. Probar

- Frontend: http://52.70.19.170:3002
- Auth API: http://50.19.32.236:3000/api/health
