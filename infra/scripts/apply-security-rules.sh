#!/usr/bin/env bash
# ==============================================================================
# Script: apply-security-rules.sh
# Purpose: Authorize AWS Security Group rules for least-privilege network access.
# Usage: Modify the SG IDs below and run this script from your terminal.
# ==============================================================================

set -euo pipefail

# --- PLACEHOLDERS (REPLACE WITH YOUR ACTUAL SECURITY GROUP IDs) ---
SG_GATEWAY_ID="sg-xxxxxxgateway"
SG_MICROSERVICES_ID="sg-xxxxxxmicroservices"
SG_DATABASE_ID="sg-xxxxxxdatabase"
SG_BASTION_ID="sg-xxxxxxbastion"

echo "Applying AWS Security Group rules..."

# ------------------------------------------------------------------------------
# 1. API GATEWAY SECURITY GROUP (sg-gateway)
# ------------------------------------------------------------------------------
echo "Configuring Gateway Security Group ($SG_GATEWAY_ID)..."

# Allow public ingress on port 3006
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_GATEWAY_ID" \
    --protocol tcp \
    --port 3006 \
    --cidr 0.0.0.0/0 \
    --query 'Return' --output text || echo "Rule already exists."

# ------------------------------------------------------------------------------
# 2. MICROSERVICES SECURITY GROUP (sg-microservices)
# ------------------------------------------------------------------------------
echo "Configuring Microservices Security Group ($SG_MICROSERVICES_ID)..."

# Allow traffic on application ports (3000-3005) only coming from the Gateway SG
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_MICROSERVICES_ID" \
    --protocol tcp \
    --port 3000-3005 \
    --source-group "$SG_GATEWAY_ID" \
    --query 'Return' --output text || echo "Rule already exists."

# Allow SSH ingress (port 22) only coming from the Bastion SG
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_MICROSERVICES_ID" \
    --protocol tcp \
    --port 22 \
    --source-group "$SG_BASTION_ID" \
    --query 'Return' --output text || echo "Rule already exists."

# ------------------------------------------------------------------------------
# 3. DATABASE SECURITY GROUP (sg-database)
# ------------------------------------------------------------------------------
echo "Configuring Database Security Group ($SG_DATABASE_ID)..."

# Allow PostgreSQL ingress (port 5432) only coming from the Microservices SG
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_DATABASE_ID" \
    --protocol tcp \
    --port 5432 \
    --source-group "$SG_MICROSERVICES_ID" \
    --query 'Return' --output text || echo "Rule already exists."

# Allow SSH ingress (port 22) only coming from the Bastion SG
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_DATABASE_ID" \
    --protocol tcp \
    --port 22 \
    --source-group "$SG_BASTION_ID" \
    --query 'Return' --output text || echo "Rule already exists."

# ------------------------------------------------------------------------------
# 4. OPTIONAL: Egress (Salida) Least-Privilege Rules
# (Only enable if you want to revoke default all-open egress: 0.0.0.0/0)
# ------------------------------------------------------------------------------
#
# # Revoke all default outbound traffic for Database Group
# aws ec2 revoke-security-group-egress \
#     --group-id "$SG_DATABASE_ID" \
#     --ip-permissions '[{"IpProtocol": "-1", "IpRanges": [{"CidrIp": "0.0.0.0/0"}]}]'
#
# # Revoke all default outbound traffic for Microservices Group
# aws ec2 revoke-security-group-egress \
#     --group-id "$SG_MICROSERVICES_ID" \
#     --ip-permissions '[{"IpProtocol": "-1", "IpRanges": [{"CidrIp": "0.0.0.0/0"}]}]'
#
# # Limit Microservices outbound traffic only to database port 5432 inside database SG
# aws ec2 authorize-security-group-egress \
#     --group-id "$SG_MICROSERVICES_ID" \
#     --protocol tcp \
#     --port 5432 \
#     --source-group "$SG_DATABASE_ID"
#

echo "✅ Security Group rules applied successfully!"
