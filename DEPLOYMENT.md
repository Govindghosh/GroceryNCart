# GroceryNCart - Docker & Deployment Guide

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Nginx Configuration](#nginx-configuration)
- [CI/CD Setup](#cicd-setup)
- [Troubleshooting](#troubleshooting)
- [Useful Commands](#useful-commands)

---

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (v24.0 or higher)
- **Docker Compose** (v2.20 or higher)
- **Git**
- **Node.js** (v20 or higher) - for local development

### Installing Docker

#### Windows
Download and install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)

#### macOS
Download and install [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/GroceryNCart.git
cd GroceryNCart
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Start the Application
```bash
# For development
docker-compose -f docker-compose.dev.yml up -d

# For production
docker-compose up -d
```

### 4. Access the Application
- **Frontend**: http://localhost (production) or http://localhost:5173 (development)
- **Backend API**: http://localhost:3000
- **MongoDB**: localhost:27017

---

## 💻 Development Setup

### Using Docker (Recommended)

1. **Start development environment**:
```bash
docker-compose -f docker-compose.dev.yml up
```

This will:
- Start MongoDB on port 27017
- Start backend server on port 3000 with hot-reload
- Start frontend on port 5173 with hot-reload
- Mount source code for live changes

2. **View logs**:
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

3. **Stop services**:
```bash
docker-compose -f docker-compose.dev.yml down
```

### Local Development (Without Docker)

#### Backend
```bash
cd server
npm install
npm run dev
```

#### Frontend
```bash
cd client
npm install
npm run dev
```

---

## 🌐 Production Deployment

### Option 1: Using Deployment Scripts

#### Linux/macOS
```bash
chmod +x deploy.sh
./deploy.sh production
```

#### Windows (PowerShell)
```powershell
.\deploy.ps1 -Environment production
```

### Option 2: Manual Deployment

1. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env with production values
```

2. **Build and start services**:
```bash
docker-compose build --no-cache
docker-compose up -d
```

3. **Verify deployment**:
```bash
docker-compose ps
docker-compose logs
```

### Environment Variables

Create a `.env` file with the following variables:

```env
# MongoDB
MONGO_ROOT_PASSWORD=your_secure_password
MONGODB_URI=mongodb://admin:password@mongodb:27017/groceryncart?authSource=admin

# Server
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-domain.com

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=48h
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Resend)
RESEND_API=your_resend_api_key

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_ENPOINT_WEBHOOK_SECRET_KEY=your_webhook_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Session
SESSION_SECRET=your_session_secret
```

---

## 🔒 Nginx Configuration

### SSL/HTTPS Setup with Let's Encrypt

1. **Update nginx configuration**:
Edit `nginx/nginx.conf` and uncomment the HTTPS server block.

2. **Update domain name**:
Replace `your-domain.com` with your actual domain.

3. **Obtain SSL certificate**:
```bash
docker-compose --profile production up -d certbot
docker-compose exec certbot certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d your-domain.com \
  -d www.your-domain.com
```

4. **Restart Nginx**:
```bash
docker-compose restart nginx
```

### Custom Nginx Configuration

The Nginx configuration includes:
- **Reverse proxy** for frontend and backend
- **Rate limiting** to prevent abuse
- **Security headers** (HSTS, XSS protection, etc.)
- **Gzip compression** for better performance
- **Static asset caching**
- **SSL/TLS configuration** for HTTPS

---

## 🔄 CI/CD Setup

### GitHub Actions

1. **Add repository secrets**:
   - Go to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `DEPLOY_HOST`: Your server IP/hostname
     - `DEPLOY_USER`: SSH username
     - `DEPLOY_SSH_KEY`: Private SSH key
     - `DEPLOY_PATH`: Deployment directory path
     - `VITE_API_URL`: Frontend API URL
     - `SLACK_WEBHOOK`: (Optional) Slack webhook for notifications

2. **Enable GitHub Container Registry**:
   - The pipeline automatically pushes images to `ghcr.io`
   - Images are tagged with branch name and commit SHA

3. **Workflow triggers**:
   - **Push to main**: Runs tests, builds images, and deploys to production
   - **Push to develop**: Runs tests and builds images
   - **Pull requests**: Runs tests only

### GitLab CI/CD

1. **Add CI/CD variables**:
   - Go to Settings → CI/CD → Variables
   - Add the same variables as GitHub Actions

2. **Configure runners**:
   - Ensure you have Docker-enabled runners

3. **Pipeline stages**:
   - **Test**: Runs linting and tests
   - **Build**: Builds Docker images
   - **Deploy**: Deploys to production/staging

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
sudo lsof -i :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows

# Kill the process or change port in .env
```

#### 2. MongoDB Connection Failed
```bash
# Check MongoDB container
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

#### 3. Permission Denied (Linux)
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### 4. Build Failures
```bash
# Clean Docker cache
docker system prune -af --volumes

# Rebuild without cache
docker-compose build --no-cache
```

#### 5. Container Health Check Failing
```bash
# Check container logs
docker-compose logs [service-name]

# Inspect container
docker inspect [container-name]

# Restart specific service
docker-compose restart [service-name]
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client

# Last 100 lines
docker-compose logs --tail=100
```

---

## 📝 Useful Commands

### Docker Compose

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View running containers
docker-compose ps

# Execute command in container
docker-compose exec server sh
docker-compose exec mongodb mongosh

# Scale services
docker-compose up -d --scale server=3

# Update and restart
docker-compose pull
docker-compose up -d --remove-orphans
```

### Docker

```bash
# List images
docker images

# Remove unused images
docker image prune -a

# List containers
docker ps -a

# Remove stopped containers
docker container prune

# View container logs
docker logs [container-id]

# Execute command in container
docker exec -it [container-id] sh

# System cleanup
docker system prune -af --volumes
```

### Database Management

```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p your_password

# Backup database
docker-compose exec mongodb mongodump --out /backup

# Restore database
docker-compose exec mongodb mongorestore /backup

# Export database
docker exec [mongodb-container] sh -c 'mongodump --archive' > db.dump

# Import database
docker exec -i [mongodb-container] sh -c 'mongorestore --archive' < db.dump
```

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong passwords** for MongoDB and JWT secrets
3. **Enable HTTPS** in production with valid SSL certificates
4. **Keep Docker images updated** regularly
5. **Use non-root users** in containers (already configured)
6. **Enable rate limiting** in Nginx (already configured)
7. **Regular backups** of MongoDB data
8. **Monitor logs** for suspicious activity

---

## 📊 Monitoring

### Health Checks

All services include health checks:
- **MongoDB**: Database ping
- **Backend**: HTTP endpoint check
- **Frontend**: HTTP endpoint check
- **Nginx**: HTTP endpoint check

View health status:
```bash
docker-compose ps
docker inspect [container-name] | grep -A 10 Health
```

### Resource Usage

```bash
# Container resource usage
docker stats

# Disk usage
docker system df
```

---

## 🚀 Performance Optimization

### Production Optimizations

1. **Multi-stage builds**: Reduces image size
2. **Layer caching**: Faster builds
3. **Gzip compression**: Faster page loads
4. **Static asset caching**: Reduced server load
5. **Connection pooling**: Better database performance

### Scaling

```bash
# Scale backend servers
docker-compose up -d --scale server=3

# Use load balancer (Nginx already configured)
```

---

## 📞 Support

For issues and questions:
- **GitHub Issues**: [Create an issue](https://github.com/yourusername/GroceryNCart/issues)
- **Documentation**: Check this guide
- **Logs**: Always check logs first with `docker-compose logs`

---

## 📄 License

This project is licensed under the MIT License.

---

**Happy Deploying! 🎉**
