# GroceryNCart Deployment Script for Windows
# Run with: .\deploy.ps1 -Environment production

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("production", "development", "dev")]
    [string]$Environment = "production"
)

# Colors
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"

# Configuration
$ComposeFile = "docker-compose.yml"
if ($Environment -eq "dev" -or $Environment -eq "development") {
    $ComposeFile = "docker-compose.dev.yml"
}

Write-Host "========================================" -ForegroundColor $Green
Write-Host "GroceryNCart Deployment Script" -ForegroundColor $Green
Write-Host "Environment: $Environment" -ForegroundColor $Green
Write-Host "========================================" -ForegroundColor $Green

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Docker is not installed" -ForegroundColor $Red
    exit 1
}

# Check if Docker Compose is installed
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Docker Compose is not installed" -ForegroundColor $Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path .env) -and $Environment -eq "production") {
    Write-Host "Warning: .env file not found" -ForegroundColor $Yellow
    if (Test-Path .env.example) {
        Write-Host "Creating from .env.example..." -ForegroundColor $Yellow
        Copy-Item .env.example .env
        Write-Host "Please edit .env file with your actual values" -ForegroundColor $Yellow
        exit 1
    } else {
        Write-Host "Error: .env.example not found" -ForegroundColor $Red
        exit 1
    }
}

# Pull latest changes
Write-Host "Pulling latest changes from git..." -ForegroundColor $Green
try {
    git pull origin main
} catch {
    Write-Host "Warning: Could not pull from git" -ForegroundColor $Yellow
}

# Stop existing containers
Write-Host "Stopping existing containers..." -ForegroundColor $Green
docker-compose -f $ComposeFile down

# Pull latest images
Write-Host "Pulling latest Docker images..." -ForegroundColor $Green
try {
    docker-compose -f $ComposeFile pull
} catch {
    Write-Host "Warning: Could not pull images" -ForegroundColor $Yellow
}

# Build images
Write-Host "Building Docker images..." -ForegroundColor $Green
docker-compose -f $ComposeFile build --no-cache

# Start containers
Write-Host "Starting containers..." -ForegroundColor $Green
docker-compose -f $ComposeFile up -d

# Wait for services to be healthy
Write-Host "Waiting for services to be healthy..." -ForegroundColor $Green
Start-Sleep -Seconds 10

# Check container status
Write-Host "Container status:" -ForegroundColor $Green
docker-compose -f $ComposeFile ps

# Show logs
Write-Host "Recent logs:" -ForegroundColor $Green
docker-compose -f $ComposeFile logs --tail=50

# Clean up
Write-Host "Cleaning up unused Docker resources..." -ForegroundColor $Green
docker system prune -af --volumes

Write-Host "========================================" -ForegroundColor $Green
Write-Host "Deployment completed successfully!" -ForegroundColor $Green
Write-Host "========================================" -ForegroundColor $Green

# Health check
Write-Host "Running health checks..." -ForegroundColor $Green
Start-Sleep -Seconds 5

$runningContainers = docker-compose -f $ComposeFile ps | Select-String "Up"
if ($runningContainers) {
    Write-Host "✓ Services are running" -ForegroundColor $Green
} else {
    Write-Host "✗ Some services are not running" -ForegroundColor $Red
    docker-compose -f $ComposeFile logs
    exit 1
}

Write-Host "Deployment successful!" -ForegroundColor $Green
