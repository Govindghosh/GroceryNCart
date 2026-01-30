# GroceryNCart Makefile
# Simplifies common Docker and deployment commands

.PHONY: help dev prod build up down restart logs clean backup restore health test

# Default target
help:
	@echo "GroceryNCart - Available Commands"
	@echo "=================================="
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-logs     - View development logs"
	@echo "  make dev-down     - Stop development environment"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-logs    - View production logs"
	@echo "  make prod-down    - Stop production environment"
	@echo "  make deploy       - Deploy to production"
	@echo ""
	@echo "Build:"
	@echo "  make build        - Build all images"
	@echo "  make build-server - Build server image"
	@echo "  make build-client - Build client image"
	@echo ""
	@echo "Management:"
	@echo "  make up           - Start all services"
	@echo "  make down         - Stop all services"
	@echo "  make restart      - Restart all services"
	@echo "  make logs         - View all logs"
	@echo "  make ps           - List running containers"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean        - Clean Docker resources"
	@echo "  make backup       - Backup MongoDB"
	@echo "  make restore      - Restore MongoDB"
	@echo "  make health       - Run health checks"
	@echo ""
	@echo "Database:"
	@echo "  make db-shell     - Access MongoDB shell"
	@echo "  make db-backup    - Backup database"
	@echo "  make db-restore   - Restore database"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run all tests"
	@echo "  make test-server  - Run server tests"
	@echo "  make test-client  - Run client tests"

# Development
dev:
	docker-compose -f docker-compose.dev.yml up

dev-build:
	docker-compose -f docker-compose.dev.yml build

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-down:
	docker-compose -f docker-compose.dev.yml down

# Production
prod:
	docker-compose up -d

prod-build:
	docker-compose build --no-cache

prod-logs:
	docker-compose logs -f

prod-down:
	docker-compose down

deploy:
	@if [ -f deploy.sh ]; then \
		chmod +x deploy.sh && ./deploy.sh production; \
	else \
		echo "deploy.sh not found"; \
	fi

# Build
build:
	docker-compose build

build-server:
	docker-compose build server

build-client:
	docker-compose build client

# Management
up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

ps:
	docker-compose ps

# Maintenance
clean:
	docker-compose down -v
	docker system prune -af --volumes

backup:
	@if [ -f scripts/backup.sh ]; then \
		chmod +x scripts/backup.sh && ./scripts/backup.sh; \
	else \
		echo "backup.sh not found"; \
	fi

restore:
	@if [ -f scripts/restore.sh ]; then \
		chmod +x scripts/restore.sh && ./scripts/restore.sh; \
	else \
		echo "restore.sh not found"; \
	fi

health:
	@if [ -f scripts/health-check.sh ]; then \
		chmod +x scripts/health-check.sh && ./scripts/health-check.sh; \
	else \
		echo "health-check.sh not found"; \
	fi

# Database
db-shell:
	docker-compose exec mongodb mongosh -u admin -p

db-backup:
	docker-compose exec mongodb mongodump --out /backup

db-restore:
	docker-compose exec mongodb mongorestore /backup

# Testing
test:
	@echo "Running all tests..."
	@cd server && npm test || echo "Server tests not configured"
	@cd client && npm test || echo "Client tests not configured"

test-server:
	cd server && npm test

test-client:
	cd client && npm test

# Shell access
shell-server:
	docker-compose exec server sh

shell-client:
	docker-compose exec client sh

shell-mongodb:
	docker-compose exec mongodb sh

# Logs for specific services
logs-server:
	docker-compose logs -f server

logs-client:
	docker-compose logs -f client

logs-mongodb:
	docker-compose logs -f mongodb

logs-nginx:
	docker-compose logs -f nginx

# Update
update:
	git pull origin main
	docker-compose pull
	docker-compose up -d --remove-orphans

# SSL Setup (production)
ssl-setup:
	docker-compose --profile production up -d certbot
	@echo "Run: docker-compose exec certbot certbot certonly --webroot --webroot-path=/var/www/certbot --email your-email@example.com --agree-tos -d your-domain.com"

# Environment setup
env-setup:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env file created. Please edit with your values."; \
	else \
		echo ".env file already exists"; \
	fi
