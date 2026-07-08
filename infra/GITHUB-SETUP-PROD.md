# GitHub Environment `prod` — secrets y variables

Configura todo en: **Repo → Settings → Environments → `prod` → Environment secrets**

Los nombres compartidos con QA (`EMAILJS_*`, `STRIPE_*`, `DOCKERHUB_*`, `AWS_*`) usan **el mismo nombre** en ambos environments. Solo cambian los prefijos `QA_*` vs `PROD_*` para URLs y JWT.

---

## Secrets obligatorios (Environment `prod`)

### Docker Hub (mismo nombre que QA)

| Secret | Descripción |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Usuario Docker Hub |
| `DOCKERHUB_TOKEN` | Token de acceso Docker Hub |

### AWS — Account A (prod)

| Secret | Descripción |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | Credenciales Lab A / prod |
| `AWS_SECRET_ACCESS_KEY` | Idem |
| `AWS_SESSION_TOKEN` | Idem (Academy / STS) |

### AWS — Account B (prod-lab-b)

| Secret | Descripción |
|--------|-------------|
| `AWS_ACCESS_KEY_ID_LAB_B` | Credenciales Lab B |
| `AWS_SECRET_ACCESS_KEY_LAB_B` | Idem |
| `AWS_SESSION_TOKEN_LAB_B` | Idem |

### SSH y bastion

| Secret | Descripción |
|--------|-------------|
| `PROD_EC2_SSH_KEY` | Contenido completo del `.pem` (misma llave que QA, ej. `conexionAB.pem`) |
| `PROD_BASTION_HOST` | IP pública del bastion (`terraform output bastion_public_ip`) |

### URLs públicas (ALB prod)

| Secret | Ejemplo | Equivalente QA |
|--------|---------|----------------|
| `PROD_GATEWAY_URL` | `http://smartparking-prod-gateway-xxx.us-east-1.elb.amazonaws.com` | `QA_GATEWAY_URL` |
| `PROD_FRONTEND_URL` | `http://smartparking-prod-frontend-xxx.us-east-1.elb.amazonaws.com` | `http://${QA_FRONTEND_EIP}:3002` |
| `PROD_REALTIME_URL` | `http://<eip-realtime-prod-lab-b>:3008` | `QA_REALTIME_URL` |

### JWT y clave interna (prefijo PROD_, no QA_)

| Secret | Equivalente QA |
|--------|----------------|
| `PROD_JWT_SECRET` | `QA_JWT_SECRET` |
| `PROD_JWT_REFRESH_SECRET` | `QA_JWT_REFRESH_SECRET` |
| `PROD_INTERNAL_SERVICE_KEY` | `QA_INTERNAL_SERVICE_KEY` |

### Stripe (mismo nombre que QA)

| Secret | Usado en |
|--------|----------|
| `STRIPE_SECRET_KEY` | payment-service |
| `STRIPE_PUBLIC_KEY` | payment-service |
| `STRIPE_WEBHOOK_SECRET` | payment-service |

### EmailJS (mismo nombre que QA) — notification-service

| Secret | Usado en |
|--------|----------|
| `EMAILJS_SERVICE_ID` | notification-service |
| `EMAILJS_TEMPLATE_ID` | notification-service |
| `EMAILJS_PUBLIC_KEY` | notification-service |
| `EMAILJS_PRIVATE_KEY` | notification-service |

> **Dónde poner EMAILJS en prod:** Environment **`prod`** → **Secrets**, con los **mismos nombres** que en QA. El workflow `prod.yml` los inyecta al desplegar `notification-service` (igual que `qa.yml`).

---

## Tabla comparativa QA ↔ prod

| QA (environment `qa`) | prod (environment `prod`) | Notas |
|------------------------|---------------------------|-------|
| `QA_GATEWAY_URL` | `PROD_GATEWAY_URL` | ALB gateway |
| `QA_REALTIME_URL` | `PROD_REALTIME_URL` | EIP realtime en prod-lab-b |
| `QA_FRONTEND_EIP` | — | QA usa solo la IP |
| — | `PROD_FRONTEND_URL` | prod usa URL completa del ALB frontend |
| `QA_JWT_SECRET` | `PROD_JWT_SECRET` | |
| `QA_JWT_REFRESH_SECRET` | `PROD_JWT_REFRESH_SECRET` | |
| `QA_INTERNAL_SERVICE_KEY` | `PROD_INTERNAL_SERVICE_KEY` | |
| `QA_EC2_SSH_KEY` | `PROD_EC2_SSH_KEY` | Misma llave `.pem` |
| `QA_BASTION_HOST` | `PROD_BASTION_HOST` | |
| `EMAILJS_*` | `EMAILJS_*` | **Mismo nombre** |
| `STRIPE_*` | `STRIPE_*` | **Mismo nombre** |
| `DOCKERHUB_*` | `DOCKERHUB_*` | **Mismo nombre** |
| `AWS_*` | `AWS_*` | Account A |
| `AWS_*_LAB_B` | `AWS_*_LAB_B` | Account B |

---

## Orden de despliegue infra

1. `terraform apply` → `environments/prod` (Account A)
2. Importar key pair en Account B (misma `.pub` que QA)
3. `terraform apply` → `environments/prod-lab-b` (Account B)
4. Re-aplicar `prod` con IPs de Lab B en `terraform.tfvars`
5. Configurar secrets arriba en GitHub Environment `prod`
6. Push/merge → **PROD CI/CD**

---

## Obtener valores desde Terraform

```bash
cd infra/terraform/environments/prod
terraform output bastion_public_ip
terraform output gateway_alb_dns      # → PROD_GATEWAY_URL con http://
terraform output frontend_alb_dns     # → PROD_FRONTEND_URL con http://

cd ../prod-lab-b
terraform output realtime_elastic_ip  # → PROD_REALTIME_URL con http://<ip>:3008
```
