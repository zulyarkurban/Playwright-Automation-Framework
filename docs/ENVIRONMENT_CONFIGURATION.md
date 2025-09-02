# Environment Configuration Guide

This guide explains how to use the environment configuration system to manage different testing environments (dev, staging, production) with specific URLs, settings, and test data.

## 📁 Configuration Structure

```
src/config/
├── environments/
│   ├── base.json          # Base configuration (shared settings)
│   ├── dev.json           # Development environment
│   ├── staging.json       # Staging environment
│   └── prod.json          # Production environment
├── EnvironmentConfig.ts   # TypeScript configuration manager
└── environment-loader.js  # Node.js script for npm integration
```

## 🌍 Available Environments

### Development (`dev`)
- **Purpose**: Local development and debugging
- **Browser**: Non-headless with slow motion for visibility
- **Workers**: 1 (sequential execution)
- **Logging**: Debug level with full tracing
- **Default User**: `torvalds`

### Staging (`staging`)
- **Purpose**: Pre-production testing
- **Browser**: Headless with minimal slow motion
- **Workers**: 2 (parallel execution)
- **Logging**: Info level with screenshots
- **Default User**: `torvalds`

### Production (`prod`)
- **Purpose**: Production environment testing
- **Browser**: Headless, optimized for speed
- **Workers**: 4 (maximum parallel execution)
- **Logging**: Warning level, minimal artifacts
- **Default User**: `torvalds`

## 🚀 Usage

### NPM Scripts (Recommended)

```bash
# Run tests in different environments
npm run test:dev          # Development environment (HTML report)
npm run test:staging      # Staging environment (parallel)
npm run test:prod         # Production environment (CI optimized)

# Parallel execution variants
npm run test:dev:parallel    # Dev with parallel execution
npm run test:staging:fast    # Staging with 6 workers

# Environment information
npm run env:info          # Show available environments
npm run env:dev           # Load and display dev config
npm run env:staging       # Load and display staging config
npm run env:prod          # Load and display prod config
```

### Environment Variables

You can override the environment using:

```bash
# Set environment via TEST_ENV
TEST_ENV=staging npm run test:cucumber

# Or use NODE_ENV
NODE_ENV=prod npm run test:cucumber:parallel
```

### TypeScript/JavaScript Code

```typescript
import { environmentConfig } from '../config/EnvironmentConfig';

// Load configuration for current environment
const config = environmentConfig.getConfig();

// Get specific configuration values
const baseUrl = environmentConfig.getBaseUrl();
const defaultUser = environmentConfig.getDefaultUser();
const browserConfig = environmentConfig.getBrowserConfig();

// Check environment
if (environmentConfig.isDevelopment()) {
  console.log('Running in development mode');
}

// Print configuration summary
environmentConfig.printConfigSummary();
```

## ⚙️ Configuration Options

### Application Settings
```json
{
  "application": {
    "baseUrl": "https://github.com",
    "searchUrl": "https://github.com/search", 
    "apiUrl": "https://api.github.com"
  }
}
```

### Browser Settings
```json
{
  "browser": {
    "headless": true,
    "slowMo": 0,
    "timeout": 30000,
    "viewport": {
      "width": 1280,
      "height": 720
    }
  }
}
```

### Test Configuration
```json
{
  "test": {
    "timeout": 60000,
    "retries": 2,
    "workers": 4,
    "reporter": "html"
  }
}
```

### User Data
```json
{
  "users": {
    "defaultUser": "torvalds",
    "testUsers": ["torvalds", "nadvolod", "microsoft"]
  }
}
```

### Logging Configuration
```json
{
  "logging": {
    "level": "info",
    "enableScreenshots": true,
    "enableVideo": false,
    "enableTrace": false
  }
}
```

## 🔧 Customization

### Adding New Environments

1. Create a new JSON file in `src/config/environments/`:
```bash
cp src/config/environments/dev.json src/config/environments/qa.json
```

2. Modify the configuration as needed:
```json
{
  "environment": {
    "name": "qa",
    "description": "QA environment for quality assurance testing"
  },
  "application": {
    "baseUrl": "https://qa.github.com",
    "searchUrl": "https://qa.github.com/search",
    "apiUrl": "https://qa-api.github.com"
  }
}
```

3. Add npm script in `package.json`:
```json
{
  "scripts": {
    "test:qa": "node src/config/environment-loader.js qa && npm run test:cucumber:parallel"
  }
}
```

### Modifying Existing Environments

Edit the respective JSON file in `src/config/environments/` and restart your tests.

### Environment-Specific Features

Use the environment configuration in your step definitions:

```typescript
When('I search for the default user for current environment', async function (this: CustomWorld) {
  const config = environmentConfig.getConfig();
  const defaultUser = config.users.defaultUser;
  console.log(`Searching for default user for ${config.environment.name} environment: ${defaultUser}`);
  
  await this.gitHubUserSearchPage.searchForUser(defaultUser);
});
```

## 🐛 Troubleshooting

### Configuration Not Found
```bash
❌ Environment configuration not found: invalid-env
Available environments: dev, staging, prod
```
**Solution**: Use a valid environment name or create the missing configuration file.

### Invalid JSON
```bash
❌ Failed to load environment config for 'dev': SyntaxError: Unexpected token
```
**Solution**: Validate your JSON syntax in the configuration file.

### Missing Base Configuration
```bash
❌ Configuration file not found: /path/to/base.json
```
**Solution**: Ensure `src/config/environments/base.json` exists.

## 📊 Best Practices

1. **Environment Isolation**: Keep environment-specific settings separate
2. **Sensible Defaults**: Use base.json for common configuration
3. **Security**: Never commit sensitive data like API keys to configuration files
4. **Documentation**: Document any custom configuration changes
5. **Validation**: Test configuration changes in development first

## 🔍 Examples

### Running Tests in Different Environments

```bash
# Development (slow, visible, detailed logging)
npm run test:dev

# Staging (moderate speed, parallel execution)
npm run test:staging

# Production (fast, headless, minimal logging)
npm run test:prod
```

### Checking Current Configuration

```bash
# Show environment info
npm run env:info

# Load specific environment and show config
npm run env:staging
```

### Custom Environment Variables

```bash
# Override specific settings
HEADLESS=false TEST_ENV=prod npm run test:cucumber
BASE_URL=https://custom.github.com npm run test:dev
```
