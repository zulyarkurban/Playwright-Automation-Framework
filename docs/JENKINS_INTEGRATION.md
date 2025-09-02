# Jenkins CI/CD Integration

This document provides comprehensive setup and configuration instructions for integrating the Playwright automation framework with Jenkins CI/CD pipelines.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Jenkins Setup](#jenkins-setup)
- [Pipeline Configuration](#pipeline-configuration)
- [Environment Variables](#environment-variables)
- [Pipeline Parameters](#pipeline-parameters)
- [Retry Integration](#retry-integration)
- [Reporting and Artifacts](#reporting-and-artifacts)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Jenkins Requirements
- Jenkins 2.400+ with Pipeline plugin
- Node.js plugin for Jenkins
- HTML Publisher plugin for test reports
- Workspace Cleanup plugin (recommended)

### System Requirements
- Node.js 18+ on Jenkins agents
- Git access to repository
- Sufficient disk space for browser installations

## 🚀 Jenkins Setup

### 1. Install Required Plugins

Install these Jenkins plugins:
```
- Pipeline
- NodeJS
- HTML Publisher
- Workspace Cleanup
- Build Timeout
- Timestamper
```

### 2. Configure Node.js

1. Go to **Manage Jenkins** → **Global Tool Configuration**
2. Add Node.js installation:
   - Name: `Node18`
   - Version: `18.x`
   - Install automatically: ✅

### 3. Create Pipeline Job

1. **New Item** → **Pipeline**
2. **Pipeline Definition**: Pipeline script from SCM
3. **SCM**: Git
4. **Repository URL**: Your repository URL
5. **Script Path**: `Jenkinsfile`

## ⚙️ Pipeline Configuration

### Pipeline Parameters

The Jenkins pipeline supports these configurable parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ENVIRONMENT` | Choice | `dev` | Target environment (dev/staging/prod) |
| `TEST_TYPE` | Choice | `full` | Test suite type (full/smoke/regression/parallel) |
| `MAX_RETRIES` | String | `3` | Maximum retry attempts for failed tests |
| `PARALLEL_WORKERS` | String | `4` | Number of parallel workers |
| `ENABLE_RETRY` | Boolean | `true` | Enable automatic retry of failed tests |
| `GENERATE_REPORTS` | Boolean | `true` | Generate HTML and JSON reports |

### Pipeline Stages

1. **Checkout** - Clone repository and validate branch
2. **Setup Environment** - Install dependencies and browsers
3. **Run Tests** - Execute test suite with parallel execution
4. **Retry Failed Tests** - Automatic retry with exponential backoff
5. **Generate Reports** - Create HTML reports and archive artifacts
6. **Notify Results** - Send notifications and status updates

## 🔄 Retry Integration

The Jenkins pipeline fully integrates with the existing retry mechanism:

### Automatic Retry Flow
```bash
# 1. Initial test execution
npm run test:${ENVIRONMENT}:${TEST_TYPE}

# 2. If tests fail, automatic retry
./scripts/retry-failed-tests.sh -e ${ENVIRONMENT} -r ${MAX_RETRIES}

# 3. Generate retry statistics
npm run retry:stats
```

### Retry Configuration
```groovy
stage('Retry Failed Tests') {
    when {
        allOf {
            expression { params.ENABLE_RETRY }
            expression { currentBuild.result == 'UNSTABLE' }
        }
    }
    steps {
        sh """
            ./scripts/retry-failed-tests.sh \\
                -e ${params.ENVIRONMENT} \\
                -r ${params.MAX_RETRIES} \\
                -d 3
        """
    }
}
```

## 🌍 Environment Variables

### Required Environment Variables
```bash
# Set in Jenkins Global Properties or Pipeline
NODE_VERSION=18
PLAYWRIGHT_BROWSERS_PATH=0
TEST_ENV=dev
```

### Optional Environment Variables
```bash
# Browser configuration
HEADLESS=true
BROWSER=chromium

# Test configuration
TIMEOUT=30000
RETRY_DELAY=2000
FAIL_FAST=false

# Reporting
REPORT_FORMAT=html,json
SCREENSHOT_MODE=only-on-failure
VIDEO_MODE=retain-on-failure
```

## 📊 Reporting and Artifacts

### Archived Artifacts
- **Test Reports**: `reports/cucumber-report.html`
- **JSON Reports**: `reports/cucumber-report.json`
- **Screenshots**: `test-results/**/screenshots/`
- **Videos**: `test-results/**/videos/`
- **Traces**: `test-results/**/traces/`

### HTML Publisher Configuration
```groovy
publishHTML([
    allowMissing: false,
    alwaysLinkToLastBuild: true,
    keepAll: true,
    reportDir: 'reports',
    reportFiles: 'cucumber-report.html',
    reportName: 'Playwright Test Report'
])
```

## 🔧 Advanced Configuration

### Multi-Branch Pipeline

For multi-branch setups, add to `Jenkinsfile`:
```groovy
when {
    anyOf {
        branch 'main'
        branch 'develop'
        branch 'feature/*'
    }
}
```

### Parallel Environment Testing
```groovy
stage('Multi-Environment Tests') {
    parallel {
        stage('Development') {
            steps {
                sh 'npm run test:dev'
            }
        }
        stage('Staging') {
            steps {
                sh 'npm run test:staging'
            }
        }
    }
}
```

### Scheduled Execution
```groovy
triggers {
    // Run every night at 2 AM
    cron('0 2 * * *')
    
    // Run on SCM changes
    pollSCM('H/5 * * * *')
}
```

## 🚨 Troubleshooting

### Common Issues

#### Browser Installation Failures
```bash
# Solution: Ensure sufficient disk space and permissions
npx playwright install --with-deps chromium
```

#### Node.js Version Conflicts
```groovy
// Add to pipeline
tools {
    nodejs 'Node18'
}
```

#### Permission Issues
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

#### Memory Issues
```groovy
// Add to agent configuration
agent {
    label 'large-memory'
}
```

### Debug Commands
```bash
# Check environment configuration
npm run env:info

# Validate retry mechanism
npm run retry:demo

# Check parallel execution
npm run test:dev:parallel --dry-run
```

## 📈 Best Practices

### 1. Resource Management
- Use appropriate agent labels for browser testing
- Configure timeouts for long-running tests
- Clean up workspace after builds

### 2. Retry Strategy
- Enable retries for staging and production
- Use higher retry counts for critical environments
- Monitor retry statistics for test stability

### 3. Reporting
- Always archive artifacts for debugging
- Use HTML reports for visual analysis
- Keep JSON reports for integration

### 4. Notifications
- Configure Slack/Teams notifications
- Set up email alerts for failures
- Use different notification channels per environment

## 🔗 Integration Examples

### Slack Notification
```groovy
post {
    failure {
        slackSend(
            color: 'danger',
            message: "❌ Playwright tests failed in ${params.ENVIRONMENT}"
        )
    }
}
```

### Email Notification
```groovy
post {
    always {
        emailext(
            subject: "Playwright Test Results - ${params.ENVIRONMENT}",
            body: "Test execution completed with status: ${currentBuild.result}",
            to: "${env.CHANGE_AUTHOR_EMAIL}"
        )
    }
}
```

### Jira Integration
```groovy
post {
    failure {
        jiraComment(
            issueKey: "${env.JIRA_ISSUE}",
            body: "Automated tests failed. See build ${env.BUILD_URL}"
        )
    }
}
```

## 📚 Related Documentation

- [Environment Configuration](ENVIRONMENT_CONFIGURATION.md)
- [Parallel Execution](PARALLEL_EXECUTION.md)
- [Retry Strategies](RETRY_STRATEGIES.md)
- [Test Reporting](REPORTING.md)
