#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.production"
NAMESPACE="${NAMESPACE:-mailqueue}"
SECRET_NAME="${SECRET_NAME:-mailqueue-app-env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

kubectl -n "$NAMESPACE" create secret generic "$SECRET_NAME" \
  --from-env-file="$ENV_FILE" \
  --dry-run=client \
  -o yaml | kubectl apply -f -

echo "Updated secret ${SECRET_NAME} in namespace ${NAMESPACE}"
