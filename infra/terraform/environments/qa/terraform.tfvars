aws_region       = "us-east-1"
environment      = "qa"
key_name         = "QAUCESmart"
allowed_ssh_cidr = "0.0.0.0/0"
dockerhub_user   = "lgachig"

# Primer apply: valores temporales
frontend_url     = "http://98.95.177.52:3002"
user_service_url = "http://172.31.88.93:3001"
cors_origins     = "http://98.95.177.52:3002,http://34.236.240.173:3006,http://172.31.21.250:3000,http://172.31.88.93:3001,http://172.31.68.81:3003,http://172.31.70.157:3004,http://172.31.22.95:3005"


# Segundo apply: reemplazar con las Elastic IP de terraform output
# frontend_url     = "http://54.12.34.56:3002"
# user_service_url = "http://54.12.34.57:3001"
# cors_origins     = "http://54.12.34.56:3002,http://54.12.34.58:3000,http://54.12.34.57:3001,http://54.12.34.59:3003,http://54.12.34.60:3006,http://54.12.34.61:3004,http://54.12.34.62:3005"

# Secretos (NO poner aquí — exportar en terminal):
# export TF_VAR_jwt_secret="..."
# export TF_VAR_jwt_refresh_secret="..."
# export TF_VAR_internal_service_key="..."
