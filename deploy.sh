#!/bin/bash

# GroceryNCart Deployment Script
# This script automates the deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "development" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}GroceryNCart Deployment Script${NC}"
echo -e "${GREEN}Environment: $ENVIRONMENT${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ] && [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo -e "${YELLOW}Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env file with your actual values${NC}"
        exit 1
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
fi

# Pull latest changes
echo -e "${GREEN}Pulling latest changes from git...${NC}"
git pull origin main || echo -e "${YELLOW}Warning: Could not pull from git${NC}"

# Stop existing containers
echo -e "${GREEN}Stopping existing containers...${NC}"
docker-compose -f $COMPOSE_FILE down

# Pull latest images
echo -e "${GREEN}Pulling latest Docker images...${NC}"
docker-compose -f $COMPOSE_FILE pull || echo -e "${YELLOW}Warning: Could not pull images${NC}"

# Build images
echo -e "${GREEN}Building Docker images...${NC}"
docker-compose -f $COMPOSE_FILE build --no-cache

# Start containers
echo -e "${GREEN}Starting containers...${NC}"
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo -e "${GREEN}Waiting for services to be healthy...${NC}"
sleep 10

# Check container status
echo -e "${GREEN}Container status:${NC}"
docker-compose -f $COMPOSE_FILE ps

# Show logs
echo -e "${GREEN}Recent logs:${NC}"
docker-compose -f $COMPOSE_FILE logs --tail=50

# Clean up
echo -e "${GREEN}Cleaning up unused Docker resources...${NC}"
docker system prune -af --volumes

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"

# Health check
echo -e "${GREEN}Running health checks...${NC}"
sleep 5

if docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Services are running${NC}"
else
    echo -e "${RED}✗ Some services are not running${NC}"
    docker-compose -f $COMPOSE_FILE logs
    exit 1
fi

echo -e "${GREEN}Deployment successful!${NC}"
