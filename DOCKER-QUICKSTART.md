# Docker & Deployment Quick Reference

## 🚀 Quick Commands

### Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

### Production
```bash
# Deploy to production (Linux/Mac)
./deploy.sh production

# Deploy to production (Windows)
.\deploy.ps1 -Environment production

# Manual deployment
docker-compose up -d
```

## 📁 File Structure

```
GroceryNCart/
├── .github/
│   └── workflows/
│       ├── ci-cd.yml              # Main CI/CD pipeline
│       └── docker-build.yml       # Docker build tests
├── .gitlab-ci.yml                 # GitLab CI/CD config
├── nginx/
│   └── nginx.conf                 # Main Nginx reverse proxy
├── client/
│   ├── Dockerfile                 # Frontend Docker image
│   ├── .dockerignore             # Frontend Docker ignore
│   └── nginx.conf                # Frontend Nginx config
├── server/
│   ├── Dockerfile                # Backend Docker image
│   └── .dockerignore            # Backend Docker ignore
├── docker-compose.yml            # Production compose
├── docker-compose.dev.yml        # Development compose
├── .env.example                  # Environment template
├── deploy.sh                     # Linux/Mac deploy script
├── deploy.ps1                    # Windows deploy script
└── DEPLOYMENT.md                 # Full documentation
```

## 🌐 Service Ports

| Service | Development | Production |
|---------|-------------|------------|
| Frontend | 5173 | 80 (via Nginx) |
| Backend | 3000 | 3000 |
| MongoDB | 27017 | 27017 |
| Nginx | - | 80, 443 |

## 🔑 Required Environment Variables

```env
MONGODB_URI=mongodb://...
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RESEND_API=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

## 🐛 Quick Troubleshooting

```bash
# View logs
docker-compose logs -f [service-name]

# Restart service
docker-compose restart [service-name]

# Rebuild service
docker-compose build --no-cache [service-name]

# Clean everything
docker system prune -af --volumes
```

## 📊 Health Checks

```bash
# Check all services
docker-compose ps

# Check specific service health
docker inspect [container-name] | grep -A 10 Health
```

## 🔄 CI/CD Secrets

### GitHub Actions
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PATH`
- `VITE_API_URL`
- `SLACK_WEBHOOK` (optional)

### GitLab CI/CD
- Same as GitHub Actions
- Plus: `SSH_PRIVATE_KEY_STAGING`
- `DEPLOY_HOST_STAGING`
- `DEPLOY_USER_STAGING`

---

For detailed documentation, see [DEPLOYMENT.md](./DEPLOYMENT.md)
