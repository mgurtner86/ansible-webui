#!/bin/sh

echo "Waiting for database to be ready..."
sleep 5

echo "Seeding database..."
npm run seed

echo "Starting application..."
npm start
