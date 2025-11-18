#!/bin/bash

# Mezon Admin - Quick Setup Script
# This script helps set up the project locally

set -e

echo "🚀 Mezon Admin - Setup Script"
echo "=============================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found"
    echo "📝 Creating .env from template..."
    
    cat > .env << 'EOF'
# PostgreSQL Database Configuration
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=postgres_password_123
    POSTGRES_DB=erp_db
    POSTGRES_APP_USER=erp_user
    POSTGRES_APP_PASSWORD=erp_password_123

# Backend API Configuration
    DATABASE_URL="postgresql://erp_user:erp_password_123@postgres:5432/erp_db?schema=public"
PORT=4000
JWT_SECRET="your_super_secret_jwt_key_that_is_long_and_secure"
NODE_ENV=development

# Frontend Configuration
VITE_API_URL=http://localhost:4000/api
EOF
    
    echo "✅ .env file created"
else
    echo "✅ .env file exists"
fi

echo ""
echo "🐳 Starting Docker containers..."
echo ""

# Stop any existing containers
docker-compose down 2>/dev/null || true

# Build and start containers
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ All services are running!"
    echo ""
    echo "📊 Service URLs:"
    echo "   Frontend:  http://localhost:5173"
    echo "   Backend:   http://localhost:4000"
    echo "   Database:  localhost:5432"
    echo ""
    echo "🔐 Default login credentials:"
    echo "   Admin:     admin@mezon.uz / admin123"
    echo "   Director:  director@mezon.uz / director123"
    echo "   Teacher:   teacher@mezon.uz / teacher123"
    echo ""
    echo "📝 Useful commands:"
    echo "   View logs:    docker-compose logs -f"
    echo "   Stop:         docker-compose down"
    echo "   Restart:      docker-compose restart"
    echo ""
else
    echo ""
    echo "❌ Some services failed to start"
    echo "   Check logs with: docker-compose logs"
    exit 1
fi
