# Pruebas de Carga — Smart Parking (JMeter, ambiente QA en AWS)

Sustituto de LoadRunner: **Apache JMeter** (Java, corre nativo en Apple Silicon).

## 1. Instalación en Mac M2

```bash
brew install openjdk jmeter
# Verifica:
jmeter --version
```

## 2. Archivos de este paquete

| Archivo | Para qué sirve |
|---|---|
| `smart-parking-load-test.jmx` | Plan de pruebas con los 5 casos (Login, Reserva, Check-in/Check-out, Cancelación, Registro), priorizados por riesgo. |
| `usuarios.csv` | 10 usuarios de prueba reutilizados por los escenarios que requieren login. |
| `00-setup-datos-carga.sh` | Crea esos 10 usuarios + 1 vehículo cada uno en el ambiente QA (ejecutar **una sola vez** antes de la primera corrida). |

## 3. Obtener la IP del gateway en AWS QA

```bash
cd smart-parking-o-donde-tengas-el-repo/infra/terraform/environments/qa
terraform output -raw gateway_elastic_ip
```

## 4. Preparar datos (ejecutar justo antes de cada sesión de pruebas)

Este script crea los 10 usuarios + su vehículo, y además genera `tokens.csv`
(login hecho una sola vez por usuario, reutilizado por JMeter). El access
token dura **15 minutos**, así que corre este paso justo antes de lanzar
los 3 perfiles, no horas antes.

```bash
chmod +x 00-setup-datos-carga.sh
HOST=<GATEWAY_ELASTIC_IP> PORT=3006 ./00-setup-datos-carga.sh
```

Debe generar un archivo `tokens.csv` en la misma carpeta con 10 filas
(email, token, vehicleId). Si pasan más de ~15 min antes de correr los
perfiles, vuelve a ejecutar este script para refrescar los tokens.

## 5. Por qué TC-CARGA-02/03/04 ya no hacen login en JMeter

El backend limita el login a **5 solicitudes/minuto por IP**. Como las
5 thread groups corren en paralelo desde una sola máquina (una sola IP),
si cada iteración de cada caso volviera a loguearse, se agotaría el cupo
casi al instante y todo lo demás fallaría en cascada (esto es justo lo
que pasó en las primeras corridas). La solución: los casos de Reserva,
Check-in/Check-out y Cancelación usan el token generado **una sola vez**
en el setup (`tokens.csv`), igual que haría un usuario real que no
vuelve a loguearse en cada clic. El único caso que sigue haciendo login
real y repetido es **TC-CARGA-01 (Login)** — a propósito, porque es el
caso dedicado a medir ese endpoint y su comportamiento bajo throttling.

## 6. Ejecutar el plan (modo no-GUI, recomendado para carga real)

Copia `usuarios.csv` y `tokens.csv` a la misma carpeta desde donde ejecutes el comando.

```bash
mkdir -p resultados
```

### Perfil 1 — Carga normal (uso típico de un día regular)
Simula ~30 usuarios concurrentes distribuidos en los 5 flujos.

```bash
jmeter -n -t smart-parking-load-test.jmx \
  -Jhost=<GATEWAY_ELASTIC_IP> -Jport=3006 \
  -Jthreads=15 -Jrampup=30 -Jloops=5 -Jthink_time=1500 \
  -l resultados/normal.jtl -e -o resultados/dashboard-normal
```

### Perfil 2 — Carga pico (hora punta, entrada/salida de clases)
Simula ~60-80 usuarios concurrentes.

```bash
jmeter -n -t smart-parking-load-test.jmx \
  -Jhost=<GATEWAY_ELASTIC_IP> -Jport=3006 \
  -Jthreads=40 -Jrampup=20 -Jloops=8 -Jthink_time=800 \
  -l resultados/pico.jtl -e -o resultados/dashboard-pico
```

### Perfil 3 — Estrés (encontrar el punto de quiebre)
Sube la carga hasta ver degradación clara (tiempos >3-5s o tasa de error alta).

```bash
jmeter -n -t smart-parking-load-test.jmx \
  -Jhost=<GATEWAY_ELASTIC_IP> -Jport=3006 \
  -Jthreads=100 -Jrampup=15 -Jloops=10 -Jthink_time=300 \
  -l resultados/estres.jtl -e -o resultados/dashboard-estres
```

> `-e -o resultados/dashboard-*` genera un dashboard HTML navegable (abre `resultados/dashboard-*/index.html`).

## 6. ⚠️ Nota importante sobre el rate-limiting (throttling)

El backend (`reservation-service`) tiene `@Throttle` de **5 solicitudes/minuto por IP**
en crear reserva, cancelar, check-in y check-out; y un límite global de 20 req/min por IP.

Como JMeter corre desde **una sola máquina (una sola IP pública)**, todos los hilos
virtuales comparten esa IP ante el gateway. Esto significa:

- Es **esperado y correcto** ver códigos `429 Too Many Requests` en los perfiles de
  carga pico/estrés en los endpoints de reserva/cancelación/check-in/check-out —
  el plan ya lo contempla en el Response Assertion (acepta 201/409/429).
- Esto **no es un defecto de la app**, es un mecanismo de protección anti-abuso
  funcionando correctamente — pero **sí es un hallazgo relevante para el informe**:
  en un campus universitario donde muchos estudiantes salen a internet por la misma
  IP pública (NAT institucional), ese límite por IP podría bloquear a usuarios
  legítimos distintos en horas pico. Vale la pena documentarlo como riesgo/recomendación
  (ej. limitar por usuario/JWT en vez de por IP, o subir el límite).

## 7. Verificación rápida de salud del ambiente

El health check del gateway está en `/health` (sin el prefijo `/api`):

```bash
curl -i http://<GATEWAY_ELASTIC_IP>:3006/health
```

## 8. Qué me envías de vuelta

Después de correr los 3 perfiles, pásame:
- Los 3 archivos `.jtl` (o al menos el resumen que imprime JMeter al final: throughput,
  tiempo promedio, p90/p95, % error).
- Captura o export del dashboard HTML (`Statistics` tab).

Con eso arm o la sección de resultados y conclusiones del **informe de aseguramiento
de calidad** (indicadores: tiempo de respuesta promedio/p95, throughput, tasa de error,
punto de quiebre encontrado en estrés).
