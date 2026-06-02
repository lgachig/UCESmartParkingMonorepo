variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "state_bucket_name" {
  type        = string
  description = "Globally unique S3 bucket for Terraform remote state"
}

variable "state_lock_table_name" {
  type    = string
  default = "smartparking-terraform-locks"
}

output "state_bucket_name" {
  value = aws_s3_bucket.terraform_state.id
}

output "state_lock_table_name" {
  value = aws_dynamodb_table.terraform_locks.name
}

output "backend_config" {
  value = <<-EOT
    bucket         = "${aws_s3_bucket.terraform_state.id}"
    key            = "qa/terraform.tfstate"
    region         = "${var.aws_region}"
    dynamodb_table = "${aws_dynamodb_table.terraform_locks.name}"
    encrypt        = true
  EOT
}
