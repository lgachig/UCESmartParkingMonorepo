# Split Lab A / Lab B con VPC Peering

## Qué se agregó / cambió

- `terraform/modules/vpc_lab/` → módulo nuevo: crea una VPC **propia** (no la
  default de la cuenta) con CIDR `10.0.0.0/16`, subnet pública, IGW y route table.
- `terraform/modules/vpc_peering/` → módulo nuevo: crea el `aws_vpc_peering_connection`
  (auto-accept, misma cuenta/región) + la ruta en cada lado.
- `terraform/modules/vpc/` (Lab A) → se agregaron los outputs `cidr_block` y
  `main_route_table_id` (antes no existían, los necesita el peering).
- `terraform/environments/lab-b/` → ambiente nuevo, completo: VPC propia,
  peering con Lab A, Security Groups, y las instancias de
  **reservation, payment, realtime**.
- `terraform/environments/qa/main.tf` → se **quitaron** los módulos
  `reservation`, `payment`, `realtime` (y el EIP de realtime). Con eso Lab A
  queda en: bastion + auth, user, vehicle, frontend, gateway, parking = **7
  instancias** (antes 10).
- `terraform/environments/qa/lab-b-integration.tf.step3` → reglas de
  Security Group que permiten el tráfico cruzado Lab A ⇄ Lab B (ver Paso 3).

Todo el resto de Lab A (bastion, security_groups, EIPs de frontend/gateway,
etc.) queda intacto — no se toca su estado.

## Cómo funciona la conexión

- Lab A sigue siendo la VPC **default** de la cuenta (como ya la tenías).
- Lab B es una VPC nueva `10.0.0.0/16`, sin solape con la default (que
  normalmente es `172.31.0.0/16`, pero el CIDR real se resuelve solo con
  `data "aws_vpc" "lab_a" { default = true }`, no hace falta hardcodearlo).
- El peering es auto-aceptado (misma cuenta + misma región `us-east-1`), y
  como ambas VPCs están en la misma región, los Security Groups de un lado
  **sí pueden referenciarse desde el otro** (`source_security_group_id`
  cruzado) — por eso reutilicé ese patrón en vez de reglas por CIDR sueltas.
- SSH a las instancias de Lab B: **no necesitas un bastion nuevo**. El SG de
  reservation/payment/realtime en Lab B permite SSH desde el SG del bastion
  de Lab A (referencia cruzada vía peering), así que sigues saltando desde
  el mismo bastion de siempre.
- El tag Docker de las imágenes (`docker_image_tag`) se dejó apuntando a
  `qa` en las 3 instancias de Lab B — siguen siendo el mismo ambiente QA,
  solo cambia dónde vive la VPC. No necesitas un pipeline de CI/CD nuevo.

## Orden de aplicación (¡importante, en este orden!)

### Paso 1 — Sacar reservation/payment/realtime de Lab A
```bash
cd infra/terraform/environments/qa
terraform plan   # vas a ver que destruye 3 instancias + 1 EIP
terraform apply
```
Esto te deja con 7 instancias en Lab A (bajo el límite de 9).
Guarda cualquier dato de esas instancias que necesites antes de aplicar
(volúmenes EBS se destruyen con la instancia, `delete_on_termination = true`).

### Paso 2 — Levantar Lab B
```bash
cd infra/terraform/environments/lab-b
cp terraform.tfvars.example terraform.tfvars
# edita terraform.tfvars: key_name, dockerhub_user

terraform init
terraform plan
terraform apply
```
Esto crea: la VPC 10.0.0.0/16, el peering, los Security Groups, y las 3
instancias (reservation, payment, realtime).

### Paso 3 — Conectar las reglas de Security Group entre ambos labs
Recién ahora existen los SGs de Lab B, así que puedes activar las reglas
cruzadas en Lab A:
```bash
cd infra/terraform/environments/qa
mv lab-b-integration.tf.step3 lab-b-integration.tf
terraform plan
terraform apply
```

### Paso 4 — Actualizar GitHub Secrets/Variables
Los outputs de `lab-b` (`terraform output`) te dan las nuevas IPs:
- `QA_EC2_RESERVATION_HOST` → IP privada nueva (en 10.0.x.x)
- `QA_EC2_PAYMENT_HOST` → IP privada nueva (en 10.0.x.x)
- `QA_EC2_REALTIME_HOST` → IP pública (EIP) nueva

El bastion y el SSH key siguen siendo los mismos de Lab A — no hay que
tocar `QA_EC2_SSH_KEY` ni `QA_BASTION_HOST`.

## Ir agregando más instancias a Lab B

Cualquier servicio nuevo que quieras sumar más adelante va en
`environments/lab-b/main.tf`, siguiendo el mismo patrón que reservation/
payment/realtime: subnet = `module.vpc.public_subnet_id`,
security group = `module.security_groups.security_group_ids["<nombre>"]`.
Si ese servicio necesita hablar con algo que vive en Lab A (por ejemplo el
gateway o auth), agrega la regla de SG cruzada correspondiente en
`qa/lab-b-integration.tf` (mismo patrón que las que ya están ahí).
