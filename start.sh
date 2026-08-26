#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Pushing database schema..."
  npx prisma db push --accept-data-loss --url "$DATABASE_URL" || echo "Schema push failed, continuing anyway..."

  echo "Seeding database..."
  npx prisma db seed || echo "Seed failed, continuing anyway..."
else
  echo "Warning: DATABASE_URL not set, skipping schema push"
fi

echo "Starting application..."
exec npm start
