# Azure Playwright Testing - Troubleshooting Guide

## Common GitHub Actions Errors

### 1. 400 Bad Request - OS Parameter Issue

**Error Message:**
```
400 Bad Request
{"status":"Failed","error":{"code":"BadRequest","message":"The request is invalid. Please review it and try again. The operating system (OS) value must be one of the following valid options: Windows, Linux."}}
```

**Solution:**
Updated connection headers to include proper OS parameter:
```typescript
headers: {
  'x-mpt-access-key': process.env.PLAYWRIGHT_SERVICE_ACCESS_TOKEN || '',
  'User-Agent': 'Playwright/1.40.0',
  ...(process.env.CI && { 'x-mpt-os': 'Linux' })
}
```

### 2. Local Browser Fallback Failure

**Error Message:**
```
Executable doesn't exist at /home/runner/.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell
Please run the following command to download new browsers: npx playwright install
```

**Solution:**
Added Playwright browser installation to GitHub Actions workflow:
```yaml
- name: Install Playwright browsers (fallback)
  run: npx playwright install --with-deps
```

### 3. Authentication Issues

**Common Problems:**
- Missing `PLAYWRIGHT_SERVICE_ACCESS_TOKEN` secret
- Expired Azure access token
- Incorrect token format

**Solutions:**
1. **Generate new token:**
```bash
az account get-access-token --resource https://management.azure.com/ --query accessToken -o tsv
```

2. **Add to GitHub Secrets:**
- Repository Settings → Secrets and variables → Actions
- Name: `PLAYWRIGHT_SERVICE_ACCESS_TOKEN`
- Value: Your Azure access token

3. **Verify token format:**
- Should start with `eyJ`
- No extra spaces or characters

## Updated Configuration

### Connection Headers
```typescript
const connectOptions = {
  wsEndpoint: process.env.PLAYWRIGHT_SERVICE_URL,
  headers: {
    'x-mpt-access-key': process.env.PLAYWRIGHT_SERVICE_ACCESS_TOKEN || '',
    'User-Agent': 'Playwright/1.40.0',
    ...(process.env.CI && { 'x-mpt-os': 'Linux' })
  }
};
```

### GitHub Actions Workflow
```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers (fallback)
  run: npx playwright install --with-deps

- name: Run Azure Cucumber tests
  env:
    PLAYWRIGHT_SERVICE_URL: ${{ env.PLAYWRIGHT_SERVICE_URL }}
    PLAYWRIGHT_SERVICE_ACCESS_TOKEN: ${{ secrets.PLAYWRIGHT_SERVICE_ACCESS_TOKEN }}
```

## Testing the Fix

1. **Commit and push changes**
2. **Check GitHub Actions logs** for:
   - Successful Azure connection: "✅ Successfully connected to Azure cloud browsers"
   - Or successful fallback: "🔄 Falling back to local browser..."
3. **Verify test execution** completes successfully

## Fallback Strategy

The framework automatically falls back to local browsers if Azure connection fails:
1. **Azure Connection Attempt** - Try cloud browsers first
2. **Fallback on Failure** - Switch to local browsers automatically
3. **Browser Installation** - Browsers pre-installed in GitHub Actions
4. **Test Execution** - Continue with local execution

This ensures tests always run, even if Azure service is unavailable.
