#!/bin/bash

# MongoDB Restore Script for GroceryNCart
# Usage: ./restore.sh <backup-file>

set -e

# Configuration
CONTAINER_NAME="groceryncart-mongodb"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MongoDB Restore Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide backup file${NC}"
    echo -e "${YELLOW}Usage: ./restore.sh <backup-file>${NC}"
    echo -e "${YELLOW}Available backups:${NC}"
    ls -lh ./backups/
    exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Check if MongoDB container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}Error: MongoDB container is not running${NC}"
    exit 1
fi

# Confirm restore
echo -e "${YELLOW}WARNING: This will replace the current database!${NC}"
echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled${NC}"
    exit 0
fi

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    echo -e "${GREEN}Decompressing backup...${NC}"
    gunzip -c "$BACKUP_FILE" > /tmp/restore.archive
    RESTORE_FILE=/tmp/restore.archive
else
    RESTORE_FILE=$BACKUP_FILE
fi

# Restore backup
echo -e "${GREEN}Restoring database...${NC}"
docker exec -i $CONTAINER_NAME sh -c 'mongorestore --archive --drop' < "$RESTORE_FILE"

# Clean up temp file
if [ -f /tmp/restore.archive ]; then
    rm /tmp/restore.archive
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database restored successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
