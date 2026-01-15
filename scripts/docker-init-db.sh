#!/bin/bash
# Скрипт для инициализации БД в Docker контейнере

set -e

echo "Waiting for PostgreSQL to be ready..."
sleep 5

echo "Running initial database migration..."
psql -U postgres -d savage_movie -f /docker-entrypoint-initdb.d/init_db.sql

echo "Running admin tables migration..."
psql -U postgres -d savage_movie -f /docker-entrypoint-initdb.d/add_admin_tables.sql

echo "Database initialization complete!"
