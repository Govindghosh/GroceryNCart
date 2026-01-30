#!/bin/bash

# Health Check Script for GroceryNCart
# Checks if all services are running and healthy

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}GroceryNCart Health Check${NC}"
echo -e "${GREEN}========================================${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose is installed${NC}"

# Check if containers are running
echo -e "\n${YELLOW}Checking containers...${NC}"
CONTAINERS=$(docker-compose ps -q)

if [ -z "$CONTAINERS" ]; then
    echo -e "${RED}✗ No containers are running${NC}"
    exit 1
fi

# Check each service
SERVICES=("mongodb" "server" "client" "nginx")
ALL_HEALTHY=true

for SERVICE in "${SERVICES[@]}"; do
    CONTAINER=$(docker-compose ps -q $SERVICE 2>/dev/null)
    
    if [ -z "$CONTAINER" ]; then
        echo -e "${YELLOW}⚠ $SERVICE: Not found (may not be in compose file)${NC}"
        continue
    fi
    
    STATUS=$(docker inspect --format='{{.State.Status}}' $CONTAINER 2>/dev/null)
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER 2>/dev/null)
    
    if [ "$STATUS" = "running" ]; then
        if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "" ]; then
            echo -e "${GREEN}✓ $SERVICE: Running${NC}"
        else
            echo -e "${RED}✗ $SERVICE: Running but unhealthy ($HEALTH)${NC}"
            ALL_HEALTHY=false
        fi
    else
        echo -e "${RED}✗ $SERVICE: Not running ($STATUS)${NC}"
        ALL_HEALTHY=false
    fi
done

# Check endpoints
echo -e "\n${YELLOW}Checking endpoints...${NC}"

# Check backend
if curl -f -s http://localhost:3000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API: Responding${NC}"
else
    echo -e "${RED}✗ Backend API: Not responding${NC}"
    ALL_HEALTHY=false
fi

# Check frontend
if curl -f -s http://localhost/ > /dev/null 2>&1 || curl -f -s http://localhost:5173/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend: Responding${NC}"
else
    echo -e "${RED}✗ Frontend: Not responding${NC}"
    ALL_HEALTHY=false
fi

# Check MongoDB
if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ MongoDB: Responding${NC}"
else
    echo -e "${RED}✗ MongoDB: Not responding${NC}"
    ALL_HEALTHY=false
fi

# Resource usage
echo -e "\n${YELLOW}Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Final status
echo -e "\n${GREEN}========================================${NC}"
if [ "$ALL_HEALTHY" = true ]; then
    echo -e "${GREEN}✓ All services are healthy!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some services are unhealthy${NC}"
    echo -e "${YELLOW}Run 'docker-compose logs' for more details${NC}"
    exit 1
fi
