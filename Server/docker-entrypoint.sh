#!/bin/sh
set -e

echo "🚀 Starting Chess RPG API..."
echo "⏳ Waiting for database to be ready..."

# Extract database connection params from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')

# Wait for PostgreSQL to be ready (max 60 seconds)
timeout=60
counter=0
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; do
  counter=$((counter + 1))
  if [ $counter -gt $timeout ]; then
    echo "❌ Database failed to start within $timeout seconds"
    exit 1
  fi
  echo "⏳ Waiting... (attempt $counter/$timeout)"
  sleep 1
done

echo "✅ Database is ready!"

# Run migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma Client (ensure it's up to date)
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "✨ Starting Node.js server..."
exec node index.js
