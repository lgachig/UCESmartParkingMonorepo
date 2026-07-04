aws_region           = "us-east-1"
environment          = "qa"
instance_type        = "t3.medium"
key_name             = "LAB2QA"
allowed_ssh_cidr     = "0.0.0.0/0"
dockerhub_user       = "lgachig"

asg_min_size         = 1
asg_max_size         = 2
asg_desired_capacity = 1
