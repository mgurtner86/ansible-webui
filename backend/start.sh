#!/bin/sh

echo "🚀 Starting Ansible Tower Backend..."

echo "⏳ Waiting for PostgreSQL to be ready..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "postgres" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' 2>/dev/null; do
  echo "   PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

echo "⏳ Waiting for Redis to be ready..."
until redis-cli -h redis ping 2>/dev/null; do
  echo "   Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

echo "🌱 Seeding database..."
npm run seed

echo "🚀 Starting API Server and Worker..."
node src/api.js &
API_PID=$!

node src/index.js &
WORKER_PID=$!

echo "✅ API Server started (PID: $API_PID)"
echo "✅ Worker started (PID: $WORKER_PID)"

trap "echo '🛑 Stopping services...'; kill $API_PID $WORKER_PID; exit 0" SIGTERM SIGINT

wait
