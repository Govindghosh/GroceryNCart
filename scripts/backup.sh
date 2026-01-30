#!/bin/bash

# MongoDB Backup Script for GroceryNCart
# Usage: ./backup.sh [backup-name]

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME=${1:-"backup_$TIMESTAMP"}
CONTAINER_NAME="groceryncart-mongodb"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MongoDB Backup Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Create backup directory
mkdir -p $BACKUP_DIR

# Check if MongoDB container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}Error: MongoDB container is not running${NC}"
    exit 1
fi

# Create backup
echo -e "${GREEN}Creating backup: $BACKUP_NAME${NC}"
docker exec $CONTAINER_NAME sh -c 'mongodump --archive' > "$BACKUP_DIR/$BACKUP_NAME.archive"

# Compress backup
echo -e "${GREEN}Compressing backup...${NC}"
gzip "$BACKUP_DIR/$BACKUP_NAME.archive"

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.archive.gz" | cut -f1)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup completed successfully!${NC}"
echo -e "${GREEN}Location: $BACKUP_DIR/$BACKUP_NAME.archive.gz${NC}"
echo -e "${GREEN}Size: $BACKUP_SIZE${NC}"
echo -e "${GREEN}========================================${NC}"

# List all backups
echo -e "${YELLOW}Available backups:${NC}"
ls -lh $BACKUP_DIR/

# Clean old backups (keep last 7)
echo -e "${YELLOW}Cleaning old backups (keeping last 7)...${NC}"
cd $BACKUP_DIR
ls -t *.gz | tail -n +8 | xargs -r rm --
cd ..

echo -e "${GREEN}Backup process completed!${NC}"
