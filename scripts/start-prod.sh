#!/bin/sh
set -eu

echo "Sincronizando esquema de base de datos..."
pnpm db:push

if [ -n "${BOOTSTRAP_ADMIN_EMAIL:-}" ] && [ -n "${BOOTSTRAP_ADMIN_PASSWORD:-}" ]; then
  echo "Verificando administrador inicial..."
  pnpm db:bootstrap
fi

echo "Iniciando app..."
exec pnpm next start -H 0.0.0.0 -p "${PORT:-3000}"
