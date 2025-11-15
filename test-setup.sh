#!/bin/bash

# Test script to verify frontend-backend connection
# Run this after starting docker-compose

set -e

echo "🧪 Testing Mezon Admin Setup"
echo "============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test backend health
echo "1. Testing Backend API..."
if curl -s http://localhost:4000/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend API is responding${NC}"
    echo "   Response: $(curl -s http://localhost:4000/api/health | jq -r '.status' 2>/dev/null || echo 'ok')"
else
    echo -e "${RED}❌ Backend API is not responding${NC}"
    echo -e "${YELLOW}   Make sure docker-compose is running: docker-compose up${NC}"
    exit 1
fi

echo ""

# Test database connection
echo "2. Testing Database Connection..."
if docker-compose exec -T postgres pg_isready -U erp_user -d erp_db > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is ready${NC}"
else
    echo -e "${RED}❌ Database is not ready${NC}"
    exit 1
fi

echo ""

# Test frontend
echo "3. Testing Frontend..."
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✅ Frontend is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend might still be starting...${NC}"
    echo "   Wait a few seconds and check http://localhost:5173"
fi

echo ""

# Test CORS
echo "4. Testing CORS Configuration..."
CORS_ORIGIN=$(curl -s -X OPTIONS http://localhost:4000/api/health \
    -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: GET" \
    -I | grep -i "access-control-allow-origin" || echo "")

if [ ! -z "$CORS_ORIGIN" ]; then
    echo -e "${GREEN}✅ CORS is configured correctly${NC}"
else
    echo -e "${YELLOW}⚠️  CORS might need verification${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 Setup Test Complete!${NC}"
echo ""
echo "📊 Service URLs:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:4000/api"
echo "   Health:    http://localhost:4000/api/health"
echo ""
echo "🔐 Test Login:"
echo "   Email:     admin@mezon.uz"
echo "   Password:  admin123"
echo ""
