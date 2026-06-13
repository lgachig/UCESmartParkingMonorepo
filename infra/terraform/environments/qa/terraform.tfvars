aws_region       = "us-east-1"
environment      = "qa"
key_name         = "QAUCESmart"
allowed_ssh_cidr = "0.0.0.0/0"
dockerhub_user   = "lgachig"

# elastic IPs from outputs to populate settings
frontend_url     = "http://107.21.254.134:3002"
user_service_url = "http://52.5.39.181:3001"
cors_origins     = "http://107.21.254.134:3002,http://98.95.46.236:3000,http://52.5.39.181:3001,http://32.198.202.70:3003"
