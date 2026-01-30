# GitHub Actions Setup Guide

## 📋 Overview

Your GroceryNCart project has a complete CI/CD pipeline configured with GitHub Actions. This guide will help you set it up and use it effectively.

## 🎯 What the Pipeline Does

### On Pull Requests
1. ✅ **Tests Backend** - Runs linting and tests for server
2. ✅ **Tests Frontend** - Runs linting and builds client
3. ✅ **Docker Build Test** - Validates Docker configurations

### On Push to Main Branch
1. ✅ **Tests** - Runs all tests (backend + frontend)
2. ✅ **Builds Docker Images** - Creates production images
3. ✅ **Pushes to Registry** - Uploads to GitHub Container Registry (ghcr.io)
4. ✅ **Deploys** - Automatically deploys to production server
5. ✅ **Notifies** - Sends Slack notification (optional)

## 🔧 Setup Instructions

### Step 1: Enable GitHub Actions

1. Go to your GitHub repository
2. Click on **Settings** → **Actions** → **General**
3. Under "Actions permissions", select **Allow all actions and reusable workflows**
4. Click **Save**

### Step 2: Configure Repository Secrets

Go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets:

#### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VITE_API_URL` | Frontend API URL | `https://api.yourdomain.com` or `http://localhost:3000` |
| `DEPLOY_HOST` | Production server IP/hostname | `123.45.67.89` or `server.yourdomain.com` |
| `DEPLOY_USER` | SSH username for deployment | `ubuntu` or `root` |
| `DEPLOY_SSH_KEY` | Private SSH key for deployment | Your private key content |
| `DEPLOY_PATH` | Path to project on server | `/home/ubuntu/GroceryNCart` |

#### Optional Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DEPLOY_PORT` | SSH port (default: 22) | `22` or `2222` |
| `SLACK_WEBHOOK` | Slack webhook for notifications | `https://hooks.slack.com/services/...` |

### Step 3: Generate SSH Key for Deployment

On your local machine or server:

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub user@your-server

# Display private key (copy this to DEPLOY_SSH_KEY secret)
cat ~/.ssh/github_actions_deploy
```

**Important**: Copy the entire private key including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### Step 4: Enable GitHub Container Registry

1. Go to **Settings** → **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Select **Read and write permissions**
4. Check **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

### Step 5: Configure Package Visibility (Optional)

1. Go to your profile → **Packages**
2. Find your packages (server/client images)
3. Click **Package settings**
4. Set visibility to **Public** or **Private** as needed

## 🚀 How to Use

### Triggering the Pipeline

#### For Testing (Pull Requests)
```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/my-feature

# Create Pull Request on GitHub
# Pipeline will run tests automatically
```

#### For Deployment (Push to Main)
```bash
# Merge PR or push directly to main
git checkout main
git merge feature/my-feature
git push origin main

# Pipeline will:
# 1. Run tests
# 2. Build Docker images
# 3. Push to ghcr.io
# 4. Deploy to production
```

### Monitoring Pipeline

1. Go to **Actions** tab in your repository
2. Click on the workflow run to see details
3. View logs for each job
4. Check for errors or warnings

## 📊 Pipeline Workflow

```
┌─────────────────────────────────────────────┐
│         Push/PR to main/develop             │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│Test Backend │  │Test Frontend│
│  - Lint     │  │  - Lint     │
│  - Tests    │  │  - Build    │
└──────┬──────┘  └──────┬──────┘
       │                │
       └───────┬────────┘
               │
    ┌──────────▼──────────┐
    │  Build & Push       │
    │  Docker Images      │
    │  (only on main)     │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  Deploy to          │
    │  Production         │
    │  (only on main)     │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  Slack Notification │
    │  (optional)         │
    └─────────────────────┘
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Tests Failing

**Problem**: Tests fail in CI but work locally

**Solution**:
```bash
# Run tests locally first
cd server && npm test
cd client && npm test

# Fix any failing tests
# Commit and push again
```

#### 2. Docker Build Fails

**Problem**: Docker build fails in CI

**Solution**:
```bash
# Test Docker build locally
docker build -t test-server ./server
docker build -t test-client ./client

# Check Dockerfile syntax
# Ensure all dependencies are in package.json
```

#### 3. Deployment Fails

**Problem**: SSH connection or deployment fails

**Solution**:
- Verify `DEPLOY_HOST`, `DEPLOY_USER`, and `DEPLOY_SSH_KEY` secrets
- Test SSH connection manually:
  ```bash
  ssh -i ~/.ssh/github_actions_deploy user@server
  ```
- Ensure server has Docker and Docker Compose installed
- Check server has enough disk space

#### 4. Permission Denied on GitHub Container Registry

**Problem**: Cannot push to ghcr.io

**Solution**:
- Go to Settings → Actions → General
- Enable "Read and write permissions"
- Re-run the workflow

### Viewing Logs

```bash
# In GitHub Actions UI
1. Go to Actions tab
2. Click on failed workflow
3. Click on failed job
4. Expand failed step to see logs

# On production server (if deployed)
ssh user@server
cd /path/to/project
docker-compose logs
```

## 🎨 Customizing the Pipeline

### Modify Workflow File

Edit `.github/workflows/ci-cd.yml`:

```yaml
# Change Node.js version
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change to '18' or '22'

# Add environment variables
env:
  NODE_ENV: production
  CUSTOM_VAR: value

# Change deployment script
script: |
  cd ${{ secrets.DEPLOY_PATH }}
  ./custom-deploy.sh
```

### Add More Jobs

```yaml
# Add database migration job
migrate-database:
  name: Migrate Database
  runs-on: ubuntu-latest
  needs: deploy
  steps:
    - name: Run migrations
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.DEPLOY_HOST }}
        username: ${{ secrets.DEPLOY_USER }}
        key: ${{ secrets.DEPLOY_SSH_KEY }}
        script: |
          cd ${{ secrets.DEPLOY_PATH }}
          docker-compose exec -T server npm run migrate
```

### Conditional Deployment

```yaml
# Deploy only on specific tags
if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')

# Deploy to staging on develop branch
if: github.ref == 'refs/heads/develop'
```

## 📈 Best Practices

### 1. Branch Protection

Enable branch protection for `main`:
- Settings → Branches → Add rule
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date

### 2. Secrets Management

- ✅ Never commit secrets to repository
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate SSH keys regularly
- ✅ Use different keys for different environments

### 3. Testing

- ✅ Write comprehensive tests
- ✅ Test locally before pushing
- ✅ Use test coverage tools
- ✅ Fix failing tests immediately

### 4. Deployment

- ✅ Test in staging before production
- ✅ Use health checks after deployment
- ✅ Keep deployment logs
- ✅ Have rollback plan ready

## 🔔 Slack Notifications (Optional)

### Setup Slack Webhook

1. Go to your Slack workspace
2. Create an Incoming Webhook:
   - https://api.slack.com/messaging/webhooks
3. Copy the webhook URL
4. Add to GitHub Secrets as `SLACK_WEBHOOK`

### Customize Notification

Edit `.github/workflows/ci-cd.yml`:

```yaml
- name: Notify deployment status
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: |
      Deployment to production ${{ job.status }}
      Repository: ${{ github.repository }}
      Branch: ${{ github.ref }}
      Commit: ${{ github.sha }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 📝 Workflow Files

Your project has two workflow files:

### 1. `ci-cd.yml` - Main Pipeline
- Runs on push to main/develop
- Runs on pull requests
- Handles testing, building, and deployment

### 2. `docker-build.yml` - Docker Tests
- Runs on pull requests
- Tests Docker builds
- Validates docker-compose configurations

## 🎯 Next Steps

1. ✅ Add all required secrets to GitHub
2. ✅ Test with a pull request
3. ✅ Merge to main to trigger deployment
4. ✅ Monitor the Actions tab
5. ✅ Set up Slack notifications (optional)
6. ✅ Configure branch protection rules

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [SSH Action Documentation](https://github.com/appleboy/ssh-action)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

## 🆘 Getting Help

If you encounter issues:

1. Check the Actions tab for error messages
2. Review the logs for each failed step
3. Verify all secrets are correctly configured
4. Test components locally before pushing
5. Check the troubleshooting section above

---

**Your CI/CD pipeline is ready to use! 🚀**

Push your code to GitHub and watch the magic happen! ✨
