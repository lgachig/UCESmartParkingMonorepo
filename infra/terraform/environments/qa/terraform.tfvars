aws_region       = "us-east-1"
environment      = "qa"
instance_type    = "t3.medium"
key_name         = "practicaUPro"
allowed_ssh_cidr = "0.0.0.0/0"
dockerhub_user   = "lgachig"

# Segundo apply — URLs con tus Elastic IP:
frontend_url     = "http://23.22.208.51:3002"
user_service_url = "http://100.50.63.232:3001"
cors_origins     = "http://23.22.208.51:3002,http://32.199.64.38:3000,http://100.50.63.232:3001,http://34.204.142.7:3003"

# Secrets — pasar por CLI, no commitear valores reales:
# export TF_VAR_jwt_secret="X8umzNqwbWdPz3kg3XlSF/JIlzh8AxUCZnWW/sXclnjSlNvTPz3cqMVKSWo3tdpH"
# export TF_VAR_jwt_refresh_secret="YFtneynAbzYyMx3PBQ7Pc8dpPXowCicoi023K4Lo1tOYIGJ20xVHVco5sF+a8tmR"
# export TF_VAR_internal_service_key="AeFKk6/TFYUFddDlxGZx03pg7Q4teA/XkDDV90aEnRo3TGCh2qrq12aqggGm0P7"
