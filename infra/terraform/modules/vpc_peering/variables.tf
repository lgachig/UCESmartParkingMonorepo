variable "requester_vpc_id" {
  type        = string
  description = "VPC que inicia el peering (Lab B)"
}

variable "requester_cidr" {
  type        = string
  description = "CIDR de la VPC requester (Lab B)"
}

variable "requester_route_table_id" {
  type        = string
  description = "Route table de la VPC requester (Lab B), donde se agrega la ruta hacia Lab A"
}

variable "requester_name" {
  type    = string
  default = "lab-b"
}

variable "accepter_vpc_id" {
  type        = string
  description = "VPC que acepta el peering (Lab A / VPC default)"
}

variable "accepter_cidr" {
  type        = string
  description = "CIDR de la VPC accepter (Lab A)"
}

variable "accepter_route_table_id" {
  type        = string
  description = "Route table principal de la VPC accepter (Lab A), donde se agrega la ruta hacia Lab B"
}

variable "accepter_name" {
  type    = string
  default = "lab-a"
}

variable "accepter_region" {
  type        = string
  description = "Región de la cuenta accepter, solo si es distinta a la del requester (peering inter-región). Dejar \"\" si es la misma región (caso normal de este proyecto)."
  default     = ""
}
