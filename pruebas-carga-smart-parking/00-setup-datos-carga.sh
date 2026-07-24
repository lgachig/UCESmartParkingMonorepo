#!/usr/bin/env bash
# =====================================================================
# Setup de datos para pruebas de carga - Smart Parking
# Crea 10 usuarios de prueba (usuarios.csv) + 1 vehiculo por usuario,
# y genera tokens.csv (email,token,vehicleId) para que JMeter NO tenga
# que hacer login en tiempo de ejecucion en los casos de Reserva,
# Check-in/Check-out y Cancelacion (evita chocar contra el limite de
# 5 logins/min por IP, que compite entre las 4 thread groups a la vez).
#
# IMPORTANTE: el access token dura 15 minutos. Corre este script
# INMEDIATAMENTE ANTES de lanzar los 3 perfiles de carga (normal, pico,
# estres); si pasan mas de ~15 min entre el setup y una corrida,
# vuelve a correr este script para refrescar tokens.csv.
#
# Uso:
#   chmod +x 00-setup-datos-carga.sh
#   HOST=<GATEWAY_ELASTIC_IP> PORT=3006 ./00-setup-datos-carga.sh
# =====================================================================
set -euo pipefail

HOST="${HOST:?Debes exportar HOST=<gateway_elastic_ip> (ver terraform output en infra/terraform/environments/qa)}"
PORT="${PORT:-3006}"
BASE="http://${HOST}:${PORT}"

echo "Usando gateway: ${BASE}"
echo

echo "email,token,vehicleId" > tokens.csv

while IFS=',' read -r email password; do
  [ "$email" = "email" ] && continue   # saltar cabecera del csv

  echo "== Usuario: ${email} =="

  # 1) Registrar (si ya existe, el 409 es esperado y se ignora)
  reg_code=$(curl -s -o /tmp/reg_resp.json -w "%{http_code}" -X POST "${BASE}/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${password}\",\"firstName\":\"Carga\",\"lastName\":\"Test\",\"role\":\"STUDENT\"}")
  echo "  registro -> HTTP ${reg_code}"

  # 2) Login para obtener el token
  login_resp=$(curl -s -X POST "${BASE}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${password}\"}")
  token=$(echo "$login_resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('accessToken',''))")

  if [ -z "$token" ]; then
    echo "  ⚠️  No se pudo obtener token para ${email}. Respuesta cruda del login:"
    echo "     $login_resp"
    continue
  fi

  # 3) Verificar si ya tiene vehiculo; si no, crearlo
  veh_code=$(curl -s -o /tmp/veh_resp.json -w "%{http_code}" "${BASE}/api/vehicles/me" \
    -H "Authorization: Bearer ${token}")

  if [ "$veh_code" = "200" ]; then
    vehicle_id=$(python3 -c "import json; print(json.load(open('/tmp/veh_resp.json')).get('data',{}).get('id',''))")
    echo "  vehiculo -> ya existe (id ${vehicle_id})"
  else
    plate="CRG-$(printf '%04d' $((RANDOM % 9999)))"
    veh_create_code=$(curl -s -o /tmp/veh_create_resp.json -w "%{http_code}" -X POST "${BASE}/api/vehicles/me" \
      -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" \
      -d "{\"registrationNumber\":\"${plate}\",\"plate\":\"${plate}\",\"color\":\"Blanco\",\"model\":\"Generico\",\"year\":2022}")
    vehicle_id=$(python3 -c "import json; print(json.load(open('/tmp/veh_create_resp.json')).get('data',{}).get('id',''))")
    echo "  vehiculo -> HTTP ${veh_create_code} (placa ${plate}, id ${vehicle_id})"
  fi

  if [ -n "$vehicle_id" ]; then
    echo "${email},${token},${vehicle_id}" >> tokens.csv
  else
    echo "  ⚠️  No se pudo obtener vehicleId para ${email}, no se agrega a tokens.csv"
  fi

  echo
  sleep 13   # el login tiene limite de 5 req/min por IP; con 13s entre usuarios nos quedamos seguros por debajo
done < usuarios.csv

echo "Setup finalizado. tokens.csv generado con $(($(wc -l < tokens.csv) - 1)) usuarios listos."
echo "Ya puedes correr el plan JMeter (smart-parking-load-test.jmx) durante los proximos 15 minutos."
