#!/bin/sh
set -e

echo "🔄 Running Prisma DB Push..."
npx prisma db push --skip-generate

echo "🚀 Starting Hydra AI Server..."
exec node server.js
