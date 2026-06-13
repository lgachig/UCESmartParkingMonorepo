aws_region       = "us-east-1"
environment      = "qa"
key_name         = "QAUCESmart"
allowed_ssh_cidr = "0.0.0.0/0"
dockerhub_user   = "lgachig"

# elastic IPs from outputs to populate settings
# frontend_url     = "http://0.0.0.0:3002"
# user_service_url = "http://0.0.0.0:3001"
# cors_origins     = "http://0.0.0.0:3002"


frontend_url     = "http://3.214.103.53:3002"
user_service_url = "http://13.223.149.169:3001"
cors_origins = "http://3.214.103.53:3002,http://54.158.247.185:3000,http://13.223.149.169:3001,http://54.80.1.200:3003,http://44.213.160.100:3006,http://52.73.15.38:3004,http://52.203.95.90:3005"