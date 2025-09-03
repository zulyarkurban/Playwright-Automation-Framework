# GitHub Secrets Setup for Azure Playwright Testing

This guide explains how to configure GitHub Secrets for Azure Playwright Testing service integration.

## 🔐 Required GitHub Secrets

### 1. PLAYWRIGHT_SERVICE_ACCESS_TOKEN

This secret contains the Azure access token required to authenticate with Microsoft Playwright Testing service.

## 📋 Setup Instructions

### Step 1: Generate Azure Access Token

```bash
# Login to Azure (if not already logged in)
az login

# Generate access token for Azure management
az account get-access-token --resource https://management.azure.com/ --query accessToken -o tsv
```

Copy the generated token (it will be a long string starting with `eyJ...`).

### Step 2: Add Secret to GitHub Repository

1. **Navigate to your GitHub repository**
2. **Go to Settings** → **Secrets and variables** → **Actions**
3. **Click "New repository secret"**
4. **Add the secret:**
   - **Name**: `PLAYWRIGHT_SERVICE_ACCESS_TOKEN`
   - **Value**: Paste the Azure access token from Step 1
5. **Click "Add secret"**

### Step 3: Verify Secret Configuration

The secret should now be available in your GitHub Actions workflows as:
```yaml
env:
  PLAYWRIGHT_SERVICE_ACCESS_TOKEN: ${{ secrets.PLAYWRIGHT_SERVICE_ACCESS_TOKEN }}
```

## 🚀 GitHub Actions Workflows

### Azure Playwright Testing Workflow

The new workflow file `.github/workflows/azure-playwright-tests.yml` includes:

- **Azure Cucumber BDD Tests** - Run your existing feature files on Azure cloud
- **Azure Native Playwright Tests** - Run Playwright tests with 20+ parallel workers
- **Local Fallback Tests** - Automatic fallback if Azure authentication fails
- **Multi-environment Testing** - Test across dev/staging/prod environments

### Workflow Triggers

- **Push to main/master** - Automatic execution
- **Pull Requests** - Test validation
- **Manual Dispatch** - On-demand execution
- **Scheduled Runs** - Daily at 6:00 AM UTC (weekdays)

## 🔧 Environment Variables

### Required Variables
```yaml
env:
  PLAYWRIGHT_SERVICE_URL: 'wss://eastus.api.playwright.microsoft.com/playwrightworkspaces/18d5185e-7f8a-46e0-afa3-002163bd7cef/browsers'
  PLAYWRIGHT_SERVICE_ACCESS_TOKEN: ${{ secrets.PLAYWRIGHT_SERVICE_ACCESS_TOKEN }}
```

### Optional Variables
```yaml
env:
  NODE_VERSION: 'lts/*'
  CUCUMBER_WORKERS: 20
  TEST_ENV: dev
```

## 📊 Benefits of Azure Integration

- **20+ Parallel Workers** - Massive scalability on Azure cloud
- **Cross-Browser Testing** - Chrome, Firefox, Safari, Mobile devices
- **No Local Dependencies** - No browser installation required
- **Enterprise Scale** - Handle large test suites efficiently
- **Automatic Fallback** - Falls back to local browsers if Azure fails

## 🛠️ Token Management

### Token Expiration
Azure access tokens typically expire after 1 hour. For production use, consider:

1. **Service Principal Authentication** (recommended for production)
2. **Managed Identity** (for Azure-hosted runners)
3. **Token Refresh Logic** (automated token renewal)

### Service Principal Setup (Production)
```bash
# Create service principal
az ad sp create-for-rbac --name "playwright-testing-sp" --role contributor

# Use the output to create these GitHub secrets:
# AZURE_CLIENT_ID
# AZURE_CLIENT_SECRET
# AZURE_TENANT_ID
```

## 🔍 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Verify token is correctly copied to GitHub Secrets
   - Check token hasn't expired
   - Ensure proper Azure permissions

2. **Token Format Issues**
   - Token should start with `eyJ`
   - No extra spaces or characters
   - Complete token copied

3. **Workflow Failures**
   - Check Actions logs for detailed error messages
   - Verify secret name matches exactly: `PLAYWRIGHT_SERVICE_ACCESS_TOKEN`
   - Ensure Azure subscription is active

### Debug Commands
```bash
# Test token locally
export PLAYWRIGHT_SERVICE_ACCESS_TOKEN="your-token-here"
npm run test:azure:parallel

# Verify Azure login
az account show
```

## 📚 Related Documentation

- [Azure Playwright Testing Service](https://docs.microsoft.com/en-us/azure/playwright-testing/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Azure CLI Authentication](https://docs.microsoft.com/en-us/cli/azure/authenticate-azure-cli)
