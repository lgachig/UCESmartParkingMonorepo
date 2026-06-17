aws_region       = "us-east-1"
environment      = "qa"
instance_type    = "t3.micro"
key_name         = "QAUCESmartParking"
allowed_ssh_cidr = "0.0.0.0/0"
dockerhub_user   = "lgachig"

# Primer apply: valores temporales
frontend_url = "http://52.200.64.142:3002"
user_service_url = "http://172.31.30.191:3001"
cors_origins = "http://52.200.64.142:3002,http://34.225.129.123:3006"

# Segundo apply: reemplazar con las Elastic IP de terraform output
# frontend_url     = "http://54.12.34.56:3002"
# user_service_url = "http://54.12.34.57:3001"
# cors_origins     = "http://54.12.34.56:3002,http://54.12.34.58:3000,http://54.12.34.57:3001,http://54.12.34.59:3003,http://54.12.34.60:3006,http://54.12.34.61:3004,http://54.12.34.62:3005"

# Secretos (NO poner aquí — exportar en terminal):
# export TF_VAR_jwt_secret="..."
# export TF_VAR_jwt_refresh_secret="..."
# export TF_VAR_internal_service_key="..."
