#!/usr/bin/env bash
# ==============================================================================
# Script: patch_env.sh
# Purpose: Atomically update key-value pairs in a .env configuration file.
# Usage: ./patch_env.sh <path_to_env_file> KEY1=VAL1 KEY2=VAL2 ...
# ==============================================================================

set -euo pipefail

# Print usage if no arguments are provided
if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <path_to_env_file> KEY1=VAL1 KEY2=VAL2 [KEY3=VAL3 ...]"
  exit 1
fi

ENV_FILE="$1"
shift

# Ensure the destination directory exists
mkdir -p "$(dirname "$ENV_FILE")"

# Create a temporary file in the same directory (ensures they are on the same filesystem for atomic mv)
TEMP_FILE=$(mktemp "${ENV_FILE}.tmp.XXXXXX")

# If the target .env already exists, initialize the temp file with its current content
if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$TEMP_FILE"
else
  touch "$TEMP_FILE"
fi

# Process each KEY=VALUE pair
for arg in "$@"; do
  # Extract key and value
  if [[ "$arg" != *"="* ]]; then
    echo "❌ ERROR: Invalid argument format: '$arg'. Must be in KEY=VALUE format."
    rm -f "$TEMP_FILE"
    exit 1
  fi

  key="${arg%%=*}"
  val="${arg#*=}"

  # Validation: block empty or placeholder values
  if [ -z "$val" ] || [ "$val" = "None" ] || [ "$val" = "null" ]; then
    echo "❌ ERROR: Blocked invalid/empty value for key '${key}' (value: '${val}')."
    rm -f "$TEMP_FILE"
    exit 1
  fi

  # Delete any existing occurrence of the key in the temp file
  sed -i "/^${key}=/d" "$TEMP_FILE"

  # Append the new key-value pair
  printf '%s=%s\n' "$key" "$val" >> "$TEMP_FILE"
  echo "  ✔ ${key} patched successfully."
done

# Perform atomic swap
mv "$TEMP_FILE" "$ENV_FILE"

# Set correct read/write permissions
chmod 644 "$ENV_FILE"

echo "✅ Environment file updated atomically at: $ENV_FILE"
