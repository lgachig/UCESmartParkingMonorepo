# Guía de Verificación — Smart Parking (100% sobre AWS) — COMPLETA

## PASO 0 — IPs reales

```bash
cd infra/terraform/environments/qa
terraform output
export BASTION=$(terraform output -raw bastion_public_ip)
export AUTH_IP=$(terraform output -raw auth_private_ip)
export USER_IP=$(terraform output -raw user_private_ip)
export VEHICLE_IP=$(terraform output -raw vehicle_private_ip)
export PARKING_IP=$(terraform output -raw parking_private_ip)
export NOTIFICATION_IP=$(terraform output -raw notification_private_ip)
export AUDIT_IP=$(terraform output -raw audit_private_ip)
export GATEWAY_IP=$(terraform output -raw gateway_elastic_ip)
export FRONTEND_IP=$(terraform output -raw frontend_elastic_ip)

cd ../lab-b
export RESERVATION_IP=$(terraform output -raw reservation_private_ip)
export PAYMENT_IP=$(terraform output -raw payment_private_ip)
export REALTIME_IP=$(terraform output -raw realtime_elastic_ip)
export AI_IP=$(terraform output -raw ai_private_ip)
```

---

## PARTE 1 — 11 microservicios en AWS
**Código**: `smart-parking/apps/` (11 carpetas) + `infra/terraform/environments/qa/main.tf`.
**AWS Console**: EC2 → Instances → `tag:Environment=qa`.
```bash
aws ec2 describe-instances \
  --filters "Name=tag:Environment,Values=qa" "Name=instance-state-name,Values=running" \
  --query "Reservations[].Instances[].{Name:Tags[?Key=='Name']|[0].Value,Private:PrivateIpAddress,Public:PublicIpAddress}" \
  --output table
```
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP "docker ps --format 'table {{.Names}}\t{{.Status}}'"
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$PARKING_IP "docker ps --format 'table {{.Names}}\t{{.Status}}'"
```
**Frontend**: `http://$FRONTEND_IP:3002`

---

## PARTE 2 — Seguridad

### 2.1 Bastion
**Código**: `infra/terraform/modules/bastion/main.tf` — SG solo puerto 22.
```bash
aws ec2 describe-instances --filters "Name=tag:Role,Values=bastion" \
  --query "Reservations[].Instances[].{ID:InstanceId,IP:PublicIpAddress,State:State.Name}"

ssh -i tu-key.pem ec2-user@$AUTH_IP                                  # falla, sin bastion
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP "echo OK"   # funciona
```

### 2.2 Security Groups
**Código**: `infra/terraform/modules/security_groups/main.tf`.
```bash
aws ec2 describe-security-groups --filters "Name=group-name,Values=qa-auth-sg" \
  --query "SecurityGroups[].IpPermissions"

curl --max-time 5 http://$PARKING_IP:3004/health   # debe fallar/timeout
```

### 2.3 CORS
**Código**: `smart-parking/shared/cors.ts`.
```bash
curl -i -X OPTIONS http://$GATEWAY_IP:3006/api/vehicles \
  -H "Origin: http://sitio-no-permitido.com" -H "Access-Control-Request-Method: GET"
```
**Frontend**: `http://$FRONTEND_IP:3002` con DevTools → Network → confirma que las requests llevan `Origin: http://$FRONTEND_IP:3002` y responden `Access-Control-Allow-Origin` igual a ese origin (nunca `*`).

### 2.4 JWT
**Código**: `apps/auth-service/src/app/auth/strategies/jwt.strategy.ts`, `guards/jwt-auth.guard.ts`.
```bash
curl -i http://$GATEWAY_IP:3006/api/vehicles
curl -i http://$GATEWAY_IP:3006/api/vehicles -H "Authorization: Bearer <token>"
```
**Frontend**: login en `http://$FRONTEND_IP:3002/login` → DevTools → Application/Local Storage → copia `access_token` real → pégalo en el segundo `curl` → 200. Borra el token en Local Storage y refresca una ruta protegida → redirige a `/login`.

### 2.5 Rate Limiting
**Código**: `apps/gateway-service/src/app/app.module.ts` (`THROTTLE_TTL=60000`, `THROTTLE_LIMIT=200`).
```bash
for i in $(seq 1 220); do curl -s -o /dev/null -w "%{http_code}\n" http://$GATEWAY_IP:3006/api/parking/slots; done | sort | uniq -c
```
**Frontend**: con el `for` corriendo, refresca `/admin/slots` al mismo tiempo → deja de cargar data o muestra error hasta que expira `THROTTLE_TTL`.

### 2.6 Firewall Cloudflare — ❌ No cumple
No hay provider `cloudflare/cloudflare` ni WAF en todo el repo.

---

## PARTE 3 — API Gateway
**Código**: `apps/gateway-service/src/app/proxy/proxy.module.ts`.
```bash
curl -I http://$GATEWAY_IP:3006/docs
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$GATEWAY_IP "docker stop smartparking-app"
# refresca frontend -> falla
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$GATEWAY_IP "docker start smartparking-app"
```
**Frontend**: DevTools → Network en `http://$FRONTEND_IP:3002` → navega por todas las páginas (login, reservas, vehículos, admin) → confirma que **todo** el tráfico va a `http://$GATEWAY_IP:3006/api/...`, nunca directo a otra IP/puerto. Con el gateway detenido (paso de arriba), refresca cualquier página del frontend → falla/spinner infinito; al reiniciarlo, vuelve a funcionar sin tocar el frontend.

---

## PARTE 4 — ACID (Postgres, dentro de las transacciones Prisma)

**Código**: `apps/reservation-service/src/app/reservation/reservations.service.ts` (igual en `parking-service/slots.service.ts` y `payment-service/payments.service.ts`).

### 4.1 Atomicidad
```ts
const reservation = await this.prisma.$transaction(async (tx) => {
  const created = await tx.reservation.create({ ... });
  await this.audit.log({ ... }, tx);
  await this.outbox.record(tx, 'RESERVATION_CREATED', created.id, { ... });
  return created;
});
```
Mismo `tx` en las 3 escrituras → todo o nada. Presente en `create()`, `cancel()`, `adminCancel()`, `checkIn()`, `checkOut()`, `expireReservations()`.

**Prueba**: fuerza un error dentro del `$transaction` (ej. duplica `reservationCode` a mano en la DB) y confirma que ni `reservations` ni `outbox_events` ni `audit_logs` insertan nada.

**Frontend — ciclo de vida completo de una reserva (así se ven las 4 transacciones reales, una por acción)**:
1. Login en `http://$FRONTEND_IP:3002/login`.
2. **Crear reserva** (`POST /reservations`) desde la vista de reservar un slot → dispara `create()` → status `PENDING`.
3. **Cancelar** (`PATCH /reservations/:id/cancel`) desde "Mis reservas" → dispara `cancel()` → status `CANCELLED`.
4. En otra reserva nueva: **Check-in** (`PATCH /reservations/:id/checkin`) desde el detalle de la reserva → dispara `checkIn()` → status `ACTIVE`.
5. **Check-out** (`PATCH /reservations/:id/checkout`) → dispara `checkOut()` → status `COMPLETED` + `durationMinutes` calculado.
6. Después de cada clic, refresca DBeaver (túnel de la Parte 10) en `reservations`, `audit_logs` y `outbox_events` → debe aparecer una fila nueva sincronizada en las 3 tablas, con el mismo `id`/`aggregateId`, en el mismo instante — esa es la atomicidad de la transacción, vista desde afuera.

### 4.2 Consistencia
**Código**: `smart-parking/prisma/reservation/schema.prisma` — `enum ReservationStatus`.
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP \
  "docker exec smartparking-postgres psql -U admin -d reservationdb -c \"INSERT INTO reservations(status) VALUES ('INVALIDO');\""
# debe rechazar por tipo enum
```

### 4.3 Aislamiento
**Código**: patrón `updateMany({where:{id,status:X}})` + `count===0` en `cancel/checkIn/checkOut`.
```bash
# dos requests simultáneos al mismo check-in
curl -X PATCH http://$GATEWAY_IP:3006/api/reservations/<id>/checkin -H "Authorization: Bearer <t>" &
curl -X PATCH http://$GATEWAY_IP:3006/api/reservations/<id>/checkin -H "Authorization: Bearer <t>" &
wait
# uno responde 200, el otro 409 ConflictException
```
Lock adicional en Redis: `this.redis.acquireLock(lockKey, 30)` en `create()`.

**Frontend**: abre la misma reserva PENDING en dos pestañas del navegador (mismo usuario logueado) → haz clic en "Check-in" en ambas casi al mismo tiempo → una pestaña muestra éxito (status ACTIVE), la otra muestra el error de conflicto (409) en pantalla. Para el lock de slot: intenta reservar el mismo slot desde dos usuarios distintos (dos navegadores/incógnito) casi simultáneo → solo uno logra crear la reserva, el otro recibe "Slot is being reserved by another user".

### 4.4 Durabilidad
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP "docker inspect smartparking-postgres --format '{{json .Mounts}}'"
# crea reserva -> docker restart smartparking-postgres -> vuelve a consultarla -> sigue ahí
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP "docker restart smartparking-postgres"
```
**Frontend**: crea una reserva desde `http://$FRONTEND_IP:3002` → reinicia Postgres con el comando de arriba → refresca "Mis reservas" en el frontend → la reserva sigue apareciendo igual (no se perdió nada al reiniciar el contenedor).

---

## PARTE 5 — Kafka / Event-Driven / Transactional Outbox

**Código**:
- `apps/{parking,reservation,payment,notification,audit,realtime,ai}-service/src/app/kafka/`
- Outbox: `apps/{reservation,parking,payment}-service/src/app/outbox/` (`outbox.service.ts`, `outbox-processor.service.ts`, `outbox-summary.controller.ts`)
- Tabla: `OutboxEvent` en `smart-parking/prisma/{reservation,parking,payment}/schema.prisma` (`status`: PENDING/PROCESSED/FAILED, `retryCount`, `n8nStatus`, `n8nRetryCount`)

```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP \
  "docker exec smartparking-kafka kafka-topics --bootstrap-server localhost:9092 --list"

ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP \
  "docker exec -it smartparking-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic reservation.created --from-beginning"
```

**Frontend + Kafka en vivo (evento por cada acción del ciclo de vida)**:
1. Deja corriendo en una terminal el `kafka-console-consumer` de arriba, pero suscrito a `--topic reservation.created` en una terminal, `reservation.cancelled` en otra, `reservation.checkin` y `reservation.checkout` en otras dos (o usa `--whitelist 'reservation\..*'` si tu versión de kafka-console-consumer lo soporta).
2. Desde `http://$FRONTEND_IP:3002`: crea una reserva → debe aparecer el JSON del evento en la consola `reservation.created` casi al instante (por el cron de 10s del outbox-processor).
3. Cancélala → aparece en `reservation.cancelled`.
4. Crea otra, haz check-in → aparece en `reservation.checkin`.
5. Haz check-out → aparece en `reservation.checkout` con `durationMinutes` calculado.
Cada clic en el frontend = una fila nueva en `outbox_events` = un mensaje nuevo en el topic correspondiente — esa correlación en vivo es la prueba de Event-Driven completa.

**Prueba de resiliencia del Outbox (con Kafka caído)**:
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP "docker stop smartparking-kafka"
```
**Frontend**: crea una reserva desde `http://$FRONTEND_IP:3002` con Kafka apagado → el frontend NO se entera de nada, la reserva se crea normal (porque la transacción local de Postgres no depende de Kafka).
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP \
  "docker exec smartparking-postgres psql -U admin -d reservationdb -c \"SELECT event_type, status, retry_count FROM outbox_events ORDER BY created_at DESC LIMIT 5;\""
# status = PENDING/FAILED (el dato de negocio sí existe, el evento aún no salió)
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP "docker start smartparking-kafka"
# espera ~15s (cron cada 10s), repite el SELECT -> status = PROCESSED, y el mensaje aparece en el consumer de Kafka
```

**Outbox en parking-service y payment-service** (mismo patrón, mismas tablas):
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$PARKING_IP \
  "docker exec smartparking-postgres psql -U admin -d parkingdb -c \"SELECT event_type,status FROM outbox_events ORDER BY created_at DESC LIMIT 5;\""

ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$PAYMENT_IP \
  "docker exec smartparking-postgres psql -U admin -d paymentdb -c \"SELECT event_type,status FROM outbox_events ORDER BY created_at DESC LIMIT 5;\""
```

---

## PARTE 6 — WebSocket (realtime-service)
**Código**: `apps/realtime-service/src/app/realtime/realtime.gateway.ts`, `redis-io.adapter.ts`.
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$REALTIME_IP "docker ps"
```
**Frontend — prueba completa con dos pestañas**:
1. Abre `http://$FRONTEND_IP:3002/admin/slots` en dos pestañas (o dos navegadores), ambas logueadas.
2. DevTools → Network → filtro `WS` en ambas pestañas → confirma que hay una conexión WebSocket abierta (`101 Switching Protocols`) contra `$REALTIME_IP`.
3. En la pestaña A: crea una reserva de un slot disponible (o haz check-in/check-out de una existente).
4. En la pestaña B, **sin refrescar**: el estado del slot cambia solo (disponible → reservado/ocupado) — eso confirma que el evento viaja `reservation-service → Kafka → consumer de realtime-service → WebSocket → navegador`, no polling.
5. **Prueba de dependencia**:
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$REALTIME_IP "docker stop smartparking-app"
```
Repite el paso 3 → la pestaña B ya NO se actualiza sola (hay que refrescar a mano) → confirma que el live-update depende 100% de `realtime-service`.
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$REALTIME_IP "docker start smartparking-app"
```

---

## PARTE 7 — RabbitMQ
**Código**: `apps/payment-service/src/app/rabbitmq/`, `apps/notification-service/src/app/rabbitmq/`.
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP "docker exec smartparking-rabbitmq rabbitmqctl list_queues"
```
**Frontend**: haz un pago de prueba desde `http://$FRONTEND_IP:3002/payment` (Stripe test mode) → repite el `rabbitmqctl list_queues` → debe verse el mensaje encolado/consumido (contador de mensajes sube y baja) al momento del pago, y debe llegar la notificación correspondiente (revisa `notification-service` o el email de EmailJS si está configurado).

---

## PARTE 8 — Redis (caché)
**Código**: `apps/parking-service/src/app/redis/redis.service.ts`.
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP "docker exec smartparking-redis redis-cli KEYS '*'"
```
**Frontend**: abre `/admin/slots` → repite el `KEYS '*'` → debe aparecer una key tipo `slot:*` o similar cacheada. Reserva un slot desde el frontend → repite el `KEYS`/`GET` de esa key → confirma que se invalidó/actualizó (cache-aside).
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP "docker stop smartparking-redis"
```
Refresca `/admin/slots` en el frontend real → debe fallar o degradarse (dependiendo de si hay fallback a DB).
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP "docker start smartparking-redis"
```

---

## PARTE 9 — 10 bases de datos
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP "docker exec smartparking-postgres psql -U admin -l"
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP "docker exec smartparking-mongo mongosh --eval 'show dbs'"
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AUTH_IP "docker exec smartparking-redis redis-cli PING"
```

---

## PARTE 10 — TÚNEL SSH (ver datos desde tu PC, GUI local)

### 10.1 Postgres (DBeaver / pgAdmin / TablePlus)
```bash
ssh -i tu-key.pem -N -L 5433:localhost:5432 -J ec2-user@$BASTION ec2-user@$AUTH_IP
```
Conectar en tu GUI:
```
Host: localhost
Port: 5433
User: admin
Pass: <POSTGRES_PASSWORD de tus secrets/.env>
DB:   reservationdb   (o userdb, parkingdb, paymentdb, auditdb)
```

### 10.2 Mongo (ai-service)
```bash
ssh -i tu-key.pem -N -L 27018:localhost:27017 -J ec2-user@$BASTION ec2-user@$AI_IP
```
Compass: `mongodb://localhost:27018` → DB `aidb`

### 10.3 Redis
```bash
ssh -i tu-key.pem -N -L 6380:localhost:6379 -J ec2-user@$BASTION ec2-user@$AUTH_IP
```
RedisInsight: `localhost:6380`

### 10.4 Varios puertos en un solo túnel
```bash
ssh -i tu-key.pem -N \
  -L 5433:localhost:5432 \
  -L 6380:localhost:6379 \
  -J ec2-user@$BASTION ec2-user@$AUTH_IP
```

### 10.5 Ver en vivo lo que agrega el frontend
1. Abre el túnel 10.1.
2. Conecta DBeaver a `reservationdb`, tabla `reservations` y `outbox_events`, orden `created_at desc`.
3. Ve a `http://$FRONTEND_IP:3002`, crea una reserva.
4. Refresca DBeaver → fila nueva en `reservations` + fila hermana en `outbox_events` (PENDING → PROCESSED en ~10s).

---

## PARTE 11 — Terraform
```bash
cd infra/terraform/environments/qa
terraform init
terraform plan
terraform state list
```

---

## PARTE 12 — ELB (ALB) y ASG — solo PROD
```bash
cd infra/terraform/environments/prod
terraform output gateway_alb_dns
terraform output gateway_asg_name
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names $(terraform output -raw gateway_asg_name) \
  --query "AutoScalingGroups[].{Min:MinSize,Max:MaxSize,Desired:DesiredCapacity,Instances:Instances[].InstanceId}"

aws ec2 terminate-instances --instance-ids <ID_DE_UNA_INSTANCIA_DEL_ASG>
# espera 2-3 min, repite describe-auto-scaling-groups -> repuesta automática
```

---

## PARTE 13 — CI/CD (GitHub Actions)
**Código**: `.github/workflows/ci.yml`, `qa.yml`, `prod.yml`, `sonarqube.yml`.
GitHub → Actions → última corrida de QA → job `deploy` → IPs coinciden con Paso 0.
Docker Hub → `smartparking-<servicio>:qa` coincide con `docker ps` en la instancia.

---

## PARTE 14 — Circuit Breaker (ai-service → search-service)

**Código**: `apps/ai-service/src/app/search-client/search-client.service.ts` (librería `opossum`), métrica en `apps/ai-service/src/app/metrics/metrics.service.ts` (`circuitBreakerTrips`).

Confirmado en el código fuente: el breaker se crea con `timeout: 2000`, `errorThresholdPercentage: 50`, `resetTimeout: 15000`, `rollingCountTimeout: 10000`, escucha los eventos `open` / `halfOpen` / `close`, define un `fallback(() => null)`, e incrementa la métrica Prometheus `circuitBreakerTrips` cada vez que se abre.

### 14.1 Verificación de la existencia del breaker
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AI_IP \
  "docker exec smartparking-app cat -A /dev/null; docker exec smartparking-app node -e \"console.log(require('/app/node_modules/opossum/package.json').version)\""
```
```bash
curl -s http://$AI_IP:3010/metrics | grep circuit_breaker
# debe existir la serie circuit_breaker_trips_total{target="search-service"}
```

### 14.2 Provocar la apertura del circuito (estado OPEN)
Detén o bloquea el servicio de búsqueda externo (`SEARCH_SERVICE_URL`) para forzar timeouts/errores:
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AI_IP "docker stop smartparking-search"
# o, si el search-service corre en otra instancia:
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AI_IP "iptables -A OUTPUT -p tcp --dport <PUERTO_SEARCH> -j DROP"
```
Genera varias solicitudes seguidas al endpoint de recomendaciones (para superar el `errorThresholdPercentage: 50` dentro de la ventana `rollingCountTimeout: 10000`):
```bash
for i in $(seq 1 10); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    "http://$GATEWAY_IP:3006/api/ai/recommendations?userId=<ID>&lat=-0.21&lng=-78.5"
done
```
Revisa los logs del servicio, deben aparecer las transiciones de estado:
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AI_IP "docker logs --tail 50 smartparking-app | grep -i 'circuit breaker'"
# Circuit breaker OPEN for search-service
```

### 14.3 Confirmar el fallback (no se propaga el error al usuario)
Con el breaker abierto, repite una solicitud de recomendación desde el frontend o vía curl:
```bash
curl -i "http://$GATEWAY_IP:3006/api/ai/recommendations?userId=<ID>&lat=-0.21&lng=-78.5"
# debe responder 200 (o el código que use ai-service para "sin recomendación"), nunca 500/504
```
**Frontend**: recarga la vista de recomendaciones cercanas → la UI debe degradarse con gracia (sin recomendación de slot cercano) en vez de mostrar un error o quedarse cargando indefinidamente.

### 14.4 Confirmar el estado HALF-OPEN y el cierre (CLOSE)
Restaura el servicio de búsqueda y espera el `resetTimeout` (15s):
```bash
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AI_IP "docker start smartparking-search"
# o retira la regla de iptables si se usó ese método
sleep 16
```
Vuelve a lanzar una solicitud de recomendación y revisa logs:
```bash
curl -i "http://$GATEWAY_IP:3006/api/ai/recommendations?userId=<ID>&lat=-0.21&lng=-78.5"
ssh -i tu-key.pem -J ec2-user@$BASTION ec2-user@$AI_IP "docker logs --tail 20 smartparking-app | grep -i 'circuit breaker'"
# Circuit breaker HALF-OPEN for search-service, retrying
# Circuit breaker CLOSED for search-service
```
La métrica `circuit_breaker_trips_total` debe haberse incrementado en el ciclo de apertura y no volver a subir mientras el estado permanezca cerrado:
```bash
curl -s http://$AI_IP:3010/metrics | grep circuit_breaker_trips_total
```

---

## Checklist de demo en orden

1. `terraform output` (qa) → IPs reales.
2. `aws ec2 describe-instances` → instancias corriendo.
3. Login en frontend real → roles + JWT en DevTools (Local Storage).
4. DevTools Network → confirmar que todo pasa por `$GATEWAY_IP:3006` (nunca directo a otra IP).
5. Abrir túnel SSH (Parte 10) → conectar DBeaver a `reservationdb`.
6. **Ciclo completo de reserva desde el frontend**: crear → cancelar (otra reserva) → check-in → check-out; después de cada clic, refrescar DBeaver y ver la fila sincronizada en `reservations` + `audit_logs` + `outbox_events` (atomicidad en vivo).
7. Con los `kafka-console-consumer` abiertos por topic, repetir el ciclo del punto 6 → ver cada evento aparecer en su topic (`reservation.created/cancelled/checkin/checkout`).
8. Apagar Kafka → crear otra reserva desde el frontend (se crea igual) → ver `outbox_events` en PENDING/FAILED → prender Kafka → ver PROCESSED y el mensaje llegar al consumer.
9. Dos pestañas en `/admin/slots` → reservar/check-in en una → ver el update en vivo en la otra (WebSocket) → apagar `realtime-service` → repetir → ya no se actualiza sola.
10. Dos clics simultáneos de check-in sobre la misma reserva (dos pestañas o dos `curl`) → uno 200, otro 409 (aislamiento).
11. `docker restart smartparking-postgres` → reserva creada antes sigue existiendo en el frontend (durabilidad).
12. Rate limiting real contra `$GATEWAY_IP`, refrescando el frontend al mismo tiempo.
13. Pago de prueba desde `/payment` → ver cola de RabbitMQ subir/bajar.
14. GitHub Actions → última corrida `qa.yml` → mismas IPs.
15. Apagar `search-service` (o bloquear su puerto) → disparar varias solicitudes de recomendación → ver en logs `OPEN` y respuesta con fallback (sin error 5xx) → confirmar métrica `circuit_breaker_trips_total` → restaurar el servicio → esperar 15s → ver `HALF-OPEN` y `CLOSED` en logs.
16. (Prod) terminar instancia del ASG → repone sola sin caída.
17. Puntos que NO se pueden demostrar hoy: Cloudflare, CQRS explícito, PaaS real, Load/E2E testing, Prometheus/Grafana desplegados, backup on-premise, hexagonal completa (falta domain/ports).