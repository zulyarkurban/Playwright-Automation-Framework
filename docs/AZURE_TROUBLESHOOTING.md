# Azure Playwright Testing - Complete Integration Guide

## 🚀 Overview

This framework integrates with Microsoft Playwright Testing service to run Cucumber BDD tests on Azure cloud browsers with enterprise-scale parallelism (20+ workers).

## ✅ Working Configuration

### Connection Setup
```typescript
// Configure connection URL with OS parameter
let wsEndpoint = process.env.PLAYWRIGHT_SERVICE_URL;
if (wsEndpoint && !wsEndpoint.includes('?os=')) {
  wsEndpoint += '?os=linux';
}

const connectOptions = {
  wsEndpoint: wsEndpoint,
  headers: {
    'Authorization': `Bearer ${process.env.PLAYWRIGHT_SERVICE_ACCESS_TOKEN}`
  }
};
```

### Environment Variables
```bash
PLAYWRIGHT_SERVICE_URL="wss://eastus.api.playwright.microsoft.com/playwrightworkspaces/18d5185e-7f8a-46e0-afa3-002163bd7cef/browsers"
PLAYWRIGHT_SERVICE_ACCESS_TOKEN="your-azure-access-token"
```

## 🔧 Setup Instructions

### 1. Azure Authentication
```bash
# Login to Azure
az login

# Generate access token
az account get-access-token --resource https://management.azure.com/ --query accessToken -o tsv
```

### 2. GitHub Secrets Configuration
- Repository Settings → Secrets and variables → Actions
- Add secret: `PLAYWRIGHT_SERVICE_ACCESS_TOKEN`
- Value: Azure access token from step 1

### 3. Local Testing
```bash
# Set environment variables
export PLAYWRIGHT_SERVICE_URL="wss://eastus.api.playwright.microsoft.com/playwrightworkspaces/18d5185e-7f8a-46e0-afa3-002163bd7cef/browsers"
export PLAYWRIGHT_SERVICE_ACCESS_TOKEN=$(az account get-access-token --resource https://management.azure.com/ --query accessToken -o tsv)

# Run tests
npm run test:azure:parallel
```

## 📊 Performance Benefits

| **Execution Type** | **Workers** | **Time** | **Infrastructure** |
|-------------------|-------------|----------|-------------------|
| Azure Cloud | 20+ | ~45 seconds | Microsoft Azure |
| Local Fallback | 4 | ~5 minutes | GitHub Actions |
| Speed Improvement | 5x faster | 85% reduction | Enterprise scale |

## 🛠️ GitHub Actions Integration

### Workflow Configuration
```yaml
jobs:
  azure-cucumber-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [dev, staging, prod]
    
    steps:
    - name: Install Playwright browsers (fallback)
      run: npx playwright install --with-deps
    
    - name: Run Azure Cucumber tests
      run: npm run test:azure:parallel
      env:
        PLAYWRIGHT_SERVICE_URL: ${{ env.PLAYWRIGHT_SERVICE_URL }}
        PLAYWRIGHT_SERVICE_ACCESS_TOKEN: ${{ secrets.PLAYWRIGHT_SERVICE_ACCESS_TOKEN }}
```

## 🔍 Success Indicators

### Azure Connection Success
```
Attempting to connect to Azure Playwright Testing service...
✅ Successfully connected to Azure cloud browsers
9 scenarios (9 passed)
54 steps (54 passed)
0m45.009s (executing steps: 5m12.317s)
```

### Local Fallback (if Azure fails)
```
❌ Failed to connect to Azure Playwright Testing service: [error]
🔄 Falling back to local browser...
9 scenarios (9 passed)
54 steps (54 passed)
5m30.123s (executing steps: 8m45.678s)
```

## 🐛 Common Issues & Solutions

### 1. OS Parameter Error (FIXED)
**Error:**
```
400 Bad Request
{"status":"Failed","error":{"code":"BadRequest","message":"The operating system (OS) value must be one of the following valid options: Windows, Linux."}}
```

**Solution:**
OS parameter must be in the URL, not headers:
```typescript
wsEndpoint += '?os=linux';
```

### 2. Authentication Issues
**Symptoms:**
- 401 Unauthorized errors
- Connection timeouts
- Missing token errors

**Solutions:**
- Verify GitHub secret `PLAYWRIGHT_SERVICE_ACCESS_TOKEN` exists
- Regenerate Azure access token (expires after 1 hour)
- Check token format (starts with `eyJ`)

### 3. Local Fallback Failure
**Error:**
```
Executable doesn't exist at /home/runner/.cache/ms-playwright/chromium_headless_shell
```

**Solution:**
GitHub Actions workflow includes browser installation:
```yaml
- name: Install Playwright browsers (fallback)
  run: npx playwright install --with-deps
```

## 🎯 Test Execution Flow

1. **Azure Connection Attempt**
   - Connect to Microsoft Playwright Testing service
   - Use Bearer token authentication
   - Add `?os=linux` parameter to WebSocket URL

2. **Success Path**
   - 20+ parallel workers on Azure cloud
   - Cross-browser testing (Chrome, Firefox, Safari, Mobile)
   - Enterprise-scale infrastructure
   - ~45 second execution time

3. **Fallback Path**
   - Automatic fallback to local browsers
   - 4 parallel workers on GitHub Actions
   - Pre-installed browsers
   - ~5 minute execution time

## 📋 File Structure

```
├── src/src/tests/support/
│   ├── world-azure.ts          # Azure connection logic
│   └── hooks-azure.ts          # Azure-specific hooks
├── .github/workflows/
│   └── azure-playwright-tests.yml  # Azure CI/CD pipeline
├── cucumber.azure.config.js    # Azure Cucumber configuration
├── playwright.service.config.ts # Azure Playwright configuration
└── docs/
    ├── AZURE_TROUBLESHOOTING.md    # This file
    └── GITHUB_SECRETS_SETUP.md     # GitHub setup guide
```

## 🚀 Commands

```bash
# Local Azure testing
npm run test:azure:parallel

# Setup script (includes authentication)
./setup-azure-playwright.sh cucumber

# GitHub Actions (automatic on push/PR)
# Triggers: push to main/master, PR, manual dispatch, scheduled runs
```

## 📈 Monitoring & Reports

- **GitHub Actions**: Real-time logs and status
- **PR Comments**: Automatic test result summaries
- **Artifacts**: HTML/JSON reports (30-day retention)
- **Notifications**: Email/Slack integration available

This integration provides enterprise-scale testing capabilities with automatic fallback, ensuring tests always run regardless of Azure service availability.

## 📧 Email Notification Issues

### Gmail SMTP Authentication Error (535-5.7.8)
**Problem:** `Username and Password not accepted` error when using Gmail SMTP.

**Solution:**
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account → Security → 2-Step Verification
   - Scroll to "App passwords" → Select "Mail"
   - Generate 16-character app password
3. **Update GitHub Secrets:**
   ```
   SMTP_USERNAME: your-gmail@gmail.com
   SMTP_PASSWORD: your-16-character-app-password  # NOT regular password
   EMAIL_FROM: your-gmail@gmail.com
   EMAIL_TO: recipient@email.com
   ```

### Alternative SMTP Providers
If Gmail doesn't work, try these alternatives:

**Outlook/Hotmail:**
```yaml
server_address: smtp-mail.outlook.com
server_port: 587
secure: true
```

**SendGrid:**
```yaml
server_address: smtp.sendgrid.net
server_port: 587
secure: true
username: apikey
password: your-sendgrid-api-key
```

### General Email Issues
- Verify SMTP credentials are correctly set in GitHub secrets
- Check email server settings match your provider
- Ensure no firewall/network restrictions blocking SMTP ports
