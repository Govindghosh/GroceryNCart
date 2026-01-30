# ✅ GitHub Actions Setup Checklist

## 🎯 Quick Setup (5 Minutes)

### Step 1: Enable GitHub Actions
- [ ] Go to repository **Settings** → **Actions** → **General**
- [ ] Select "Allow all actions and reusable workflows"
- [ ] Click **Save**

### Step 2: Enable Container Registry Permissions
- [ ] Go to **Settings** → **Actions** → **General**
- [ ] Scroll to "Workflow permissions"
- [ ] Select "Read and write permissions"
- [ ] Check "Allow GitHub Actions to create and approve pull requests"
- [ ] Click **Save**

### Step 3: Add Repository Secrets
Go to **Settings** → **Secrets and variables** → **Actions**

#### Required Secrets (for deployment):
- [ ] `VITE_API_URL` - Your API URL (e.g., `https://api.yourdomain.com`)
- [ ] `DEPLOY_HOST` - Server IP or hostname
- [ ] `DEPLOY_USER` - SSH username
- [ ] `DEPLOY_SSH_KEY` - Private SSH key (see below)
- [ ] `DEPLOY_PATH` - Project path on server (e.g., `/home/ubuntu/GroceryNCart`)

#### Optional Secrets:
- [ ] `DEPLOY_PORT` - SSH port (default: 22)
- [ ] `SLACK_WEBHOOK` - For deployment notifications

### Step 4: Generate SSH Key for Deployment

Run on your local machine:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions.pub user@your-server

# Display private key (copy this to GitHub secret)
cat ~/.ssh/github_actions
```

**Copy the ENTIRE private key** including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

Paste this into the `DEPLOY_SSH_KEY` secret.

### Step 5: Test the Pipeline

```bash
# Create a test branch
git checkout -b test-github-actions

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "Test GitHub Actions"
git push origin test-github-actions

# Create Pull Request on GitHub
# Watch the Actions tab - tests should run!
```

## 🚀 What Happens Next?

### On Pull Requests:
✅ Runs tests for backend and frontend  
✅ Validates Docker builds  
✅ Shows status in PR (✓ or ✗)

### On Push to Main:
✅ Runs all tests  
✅ Builds Docker images  
✅ Pushes to GitHub Container Registry  
✅ Deploys to production server  
✅ Sends Slack notification (if configured)

## 📊 Monitoring

- **View Runs**: Go to **Actions** tab in GitHub
- **Check Logs**: Click on any workflow run → Click on job → Expand steps
- **Status Badge**: Add to README.md:
  ```markdown
  ![CI/CD](https://github.com/yourusername/GroceryNCart/workflows/CI/CD%20Pipeline/badge.svg)
  ```

## 🔧 Quick Commands

```bash
# Push to trigger deployment
git push origin main

# View workflow status
gh run list  # (requires GitHub CLI)

# View workflow logs
gh run view --log
```

## ⚠️ Important Notes

1. **First Run**: May take 10-15 minutes (building Docker images)
2. **Subsequent Runs**: Faster due to caching (3-5 minutes)
3. **Failed Deployment**: Check server has Docker installed and running
4. **Permission Errors**: Verify all secrets are correctly set

## 🎯 Success Indicators

✅ Green checkmark in Actions tab  
✅ Docker images appear in Packages  
✅ Application deployed and running on server  
✅ Slack notification received (if configured)

## 🆘 Troubleshooting

### Tests Fail
```bash
# Run locally first
cd server && npm test
cd client && npm test
```

### Docker Build Fails
```bash
# Test locally
docker build -t test ./server
docker build -t test ./client
```

### Deployment Fails
```bash
# Test SSH connection
ssh -i ~/.ssh/github_actions user@server

# Check server
docker --version
docker-compose --version
```

### Can't Push to Container Registry
- Verify "Read and write permissions" is enabled
- Check repository visibility settings

## 📚 Full Documentation

For detailed information, see:
- **[GITHUB-ACTIONS-GUIDE.md](./GITHUB-ACTIONS-GUIDE.md)** - Complete guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment documentation
- **[.github/workflows/ci-cd.yml](./.github/workflows/ci-cd.yml)** - Pipeline configuration

---

## ✨ You're All Set!

Once you complete this checklist:
1. Every PR will be automatically tested
2. Every push to main will deploy to production
3. You'll have a fully automated CI/CD pipeline

**Happy Coding! 🚀**
