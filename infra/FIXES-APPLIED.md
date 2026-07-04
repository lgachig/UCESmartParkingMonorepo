# Fixes aplicados — QA deploy / VPC Peering / Security Groups

## 1. VPC Peering cross-account (causa raíz de "el peering no funciona")

**Problema:** `modules/vpc_peering` usaba `auto_accept = true` con un solo
provider, lo cual **solo funciona si ambas VPCs están en la misma cuenta
AWS**. Lab A y Lab B son dos cuentas AWS Academy distintas, así que la
conexión de peering se quedaba en estado `pending-acceptance` para siempre
— nunca llegaba a `active`, sin importar qué tan bien estuvieran los
security groups o las rutas.

Además, `environments/lab-b/main.tf` leía `data "aws_vpc" "lab_a"` y
`data "aws_route_table" "lab_a_main"` con las credenciales de Lab B (el
único provider que existía en ese folder), buscando la VPC default en la
cuenta equivocada.

**Fix:**
- `modules/vpc_peering`: ahora recibe dos providers (`aws.requester`,
  `aws.accepter`) vía `configuration_aliases`. Crea la conexión del lado
  del requester (`auto_accept = false` + `peer_owner_id`) y la acepta
  explícitamente con `aws_vpc_peering_connection_accepter` usando el
  provider del accepter. Nuevo output `peering_status` para confirmar que
  quedó en `active`.
- `environments/lab-b/providers.tf`: se agregó el provider
  `aws.accepter` (cuenta de Lab A), configurado con variables nuevas.
- `environments/lab-b/variables.tf`: nuevas variables
  `lab_a_access_key`, `lab_a_secret_key`, `lab_a_session_token`
  (sensitive) — pásalas como `TF_VAR_...`, nunca en `terraform.tfvars`.
- `environments/lab-b/main.tf`: las data sources de Lab A ahora usan
  `provider = aws.accepter`; el módulo `peering` recibe explícitamente
  ambos providers.

**Qué tenés que hacer vos:** antes de `terraform apply` en `lab-b`, exportar
las credenciales de AMBAS cuentas (ver `LAB-B-RUNBOOK.md`, nuevo "Paso 0").
Después del apply, correr `terraform output peering_status` (agregalo si
hace falta) o revisar en la consola de CUALQUIERA de las dos cuentas que el
peering figure como **Active**, no como *Pending Acceptance*.

## 2. El timeout a Postgres en el log que mandaste NO es el peering

`psql ... 172.31.7.132:5432 timeout` pasa dentro de Lab A (VPC default),
entre `parking` y `auth` — nunca cruza al peering. El código de
`security_groups` ya tiene tanto la regla específica SG→SG como un
fallback que abre 5432 a todo el CIDR de la VPC. Si sigue fallando después
de este fix, el problema más probable es **drift**: las reglas de
Terraform existen en el código pero no se aplicaron en AWS. Antes de tu
próximo deploy corré:

```bash
cd infra/terraform/environments/qa
terraform plan
```

Si el plan muestra que va a crear reglas de `aws_security_group_rule`
(`auth_postgres`, `auth_postgres_vpc`, etc.), es porque nunca se aplicaron
— corré `terraform apply` antes de reintentar el pipeline de GitHub
Actions.

## 3. Instancias EC2 pueden reemplazarse solas y romper IPs privadas

`modules/ec2` usaba `data.aws_ami` con `most_recent = true` sin fijar la
AMI. El día que AWS publique una AMI nueva de AL2023, el próximo
`terraform apply` (aunque no toques nada tuyo) va a querer reemplazar la
instancia, cambiando su IP privada. El pipeline de CI descubre las IPs en
cada corrida así que no rompe el deploy automático, pero sí puede romper
cualquier cosa que dependa de una IP fija fuera del pipeline.

**Fix:** se agregó `lifecycle { ignore_changes = [ami] }` en
`modules/ec2/main.tf`.

## 4. Script obsoleto de Security Groups

`infra/scripts/apply-security-rules.sh` asumía un esquema viejo de 3 SGs
(gateway/microservices/database) que ya no existe — el esquema actual crea
9 SGs (uno por microservicio) vía Terraform. Se dejó el archivo pero con un
banner grande de "OBSOLETO, no ejecutar" para que nadie lo corra pensando
que es parte del flujo actual y termine creando reglas duplicadas sobre
SGs que ni siquiera existen.

## 5. Runbook actualizado

`LAB-B-RUNBOOK.md` decía "misma cuenta, auto-accept" — se corrigió para
reflejar que son cuentas distintas, y se agregó el "Paso 0" con las
variables de entorno de credenciales que hay que exportar antes del apply.

## Checklist para el próximo intento de deploy

1. `terraform plan` en `environments/qa` — confirmar que no hay drift
   pendiente en `security_groups` (ver punto 2).
2. Exportar credenciales de Lab A y Lab B (ver punto 1) y correr
   `terraform apply` en `environments/lab-b`.
3. Verificar `peering_status = active` (o en la consola AWS de cualquiera
   de las dos cuentas: VPC → Peering connections).
4. Verificar que el key pair (`LABAQAPRUEBAS`) esté importado en AMBAS
   cuentas AWS — son cuentas separadas, el key pair de una no existe en la
   otra automáticamente.
5. Recién ahí volver a correr el pipeline de GitHub Actions (`qa.yml`).
