# Test Retry Strategies Guide

This guide covers the comprehensive retry mechanisms for handling failed test cases in the Playwright Cucumber automation framework.

## 🔄 Retry Mechanisms

### 1. Automatic Retries (Built-in)
Cucumber and Playwright automatically retry failed tests based on environment configuration.

### 2. Manual Failed Test Re-execution
Re-run only the tests that failed in the previous execution.

### 3. Smart Retry with Exponential Backoff
Intelligent retry logic that adapts based on error types and system conditions.

## ⚙️ Retry Configuration

### Environment-Specific Retry Settings

#### Development Environment
```json
{
  "test": {
    "retries": 1,
    "retryDelay": 2000,
    "retryOnlyFailures": true,
    "retryTimeoutMultiplier": 1.5,
    "failFast": false
  }
}
```

#### Staging Environment
```json
{
  "test": {
    "retries": 2,
    "retryDelay": 3000,
    "retryOnlyFailures": true,
    "retryTimeoutMultiplier": 2.0,
    "failFast": false
  }
}
```

#### Production Environment
```json
{
  "test": {
    "retries": 3,
    "retryDelay": 5000,
    "retryOnlyFailures": true,
    "retryTimeoutMultiplier": 2.5,
    "failFast": true
  }
}
```

### Configuration Options

- **`retries`**: Maximum number of retry attempts per test
- **`retryDelay`**: Delay between retry attempts (milliseconds)
- **`retryOnlyFailures`**: Only retry failed tests, skip passed ones
- **`retryTimeoutMultiplier`**: Multiply timeouts for retry attempts
- **`failFast`**: Stop execution on first permanent failure

## 🚀 Usage

### Automatic Retry Commands

```bash
# Run tests with automatic retries (environment-based)
npm run test:dev          # 1 retry with 2s delay
npm run test:staging      # 2 retries with 3s delay
npm run test:prod         # 3 retries with 5s delay
```

### Manual Failed Test Retry

```bash
# Retry failed tests from last run
npm run retry:failed

# Retry failed tests in specific environment
npm run retry:dev
npm run retry:staging
npm run retry:prod

# Show retry statistics
npm run retry:stats

# Clear failed tests list
npm run retry:clear
```

### Advanced Retry Options

```bash
# Custom retry configuration
./scripts/retry-failed-tests.sh -e staging -r 5 -d 3

# Retry with specific parameters
./scripts/retry-failed-tests.sh --env prod --retries 10 --delay 5

# Show help for retry script
./scripts/retry-failed-tests.sh --help
```

## 📊 Retry Process Flow

### 1. Test Execution
```
Run Tests → Generate Report → Detect Failures → Save Failed Tests List
```

### 2. Retry Execution
```
Load Failed Tests → Generate Retry Command → Execute Retries → Update Results
```

### 3. Retry Analysis
```
Compare Results → Generate Retry Report → Update Statistics → Clean Up
```

## 🔍 Failed Test Detection

### Automatic Detection
The framework automatically detects failed tests from Cucumber JSON reports:

```typescript
// Automatically called after test execution
const failedTests = RetryHelpers.parseFailedTestsFromReport('reports/cucumber-report.json');
```

### Manual Detection
```bash
# Check for failed tests in last report
node -e "
const RetryHelpers = require('./src/utils/RetryHelpers').RetryHelpers;
const failed = RetryHelpers.parseFailedTestsFromReport('reports/cucumber-report.json');
console.log(\`Found \${failed.length} failed tests\`);
"
```

## 🎯 Retry Strategies

### 1. Immediate Retry
Retry failed tests immediately after detection:

```bash
# Run tests and retry failures automatically
npm run test:dev && npm run retry:failed
```

### 2. Scheduled Retry
Retry failed tests after a delay:

```bash
# Run tests, wait, then retry
npm run test:staging && sleep 30 && npm run retry:staging
```

### 3. Conditional Retry
Retry only specific types of failures:

```typescript
// In step definitions or hooks
if (RetryHelpers.shouldRetryTest(error.message)) {
  await RetryHelpers.retryWithBackoff(async () => {
    await this.gitHubUserSearchPage.searchForUser(username);
  }, 3, 2000);
}
```

## 📈 Retry Reporting

### Retry Statistics
```bash
# View retry statistics
npm run retry:stats
```

**Output Example:**
```
📊 Retry Statistics
================================
Original Failures: 5
Tests Recovered: 3
Still Failing: 2
Success Rate: 60%
Last Retry: 12/1/2024, 9:30:15 PM
================================
```

### Retry Report Structure
```json
{
  "timestamp": "2024-12-01T21:30:15.123Z",
  "originalFailures": 5,
  "retriedTests": 5,
  "stillFailing": 2,
  "recovered": 3,
  "successRate": "60.00",
  "details": {
    "originalFailed": [...],
    "retryResults": [...],
    "recovered": [...]
  }
}
```

## 🛠️ Implementation Examples

### Step Definition with Retry Logic

```typescript
When('I search for user {string}', async function (this: CustomWorld, username: string) {
  await RetryHelpers.retryWithBackoff(async () => {
    await this.gitHubUserSearchPage.searchForUser(username);
    await this.gitHubUserSearchPage.waitForSearchResults(15000);
  }, 3, 1000);
});
```

### Page Object with Retry Methods

```typescript
export class GitHubUserSearchPage extends BasePage {
  async searchForUserWithRetry(username: string, maxRetries: number = 3): Promise<void> {
    await RetryHelpers.retryWithBackoff(async () => {
      await this.searchForUser(username);
      
      // Verify search completed successfully
      if (!await this.areSearchResultsDisplayed()) {
        throw new Error('Search results not displayed');
      }
    }, maxRetries, 2000);
  }
}
```

### Cucumber Hook for Failed Test Handling

```typescript
// In hooks.ts
import { After } from '@cucumber/cucumber';
import { RetryHelpers } from '../../utils/RetryHelpers';

After(async function (scenario) {
  if (scenario.result?.status === 'FAILED') {
    const failedTest = {
      scenarioName: scenario.pickle.name,
      featureFile: scenario.gherkinDocument?.uri || 'unknown',
      line: scenario.pickle.astNodeIds?.[0] || 0,
      error: scenario.result.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      attempt: 1
    };
    
    RetryHelpers.saveFailedTest(failedTest);
  }
});
```

## 🔧 Advanced Configuration

### Custom Retry Logic

```typescript
// Custom retry configuration
const customRetryConfig = {
  maxRetries: 5,
  retryDelay: 1000,
  retryOnlyFailures: true,
  retryTimeoutMultiplier: 2.0,
  failFast: false
};

// Apply custom configuration
await RetryHelpers.retryWithBackoff(
  () => this.performTestAction(),
  customRetryConfig.maxRetries,
  customRetryConfig.retryDelay
);
```

### Environment Variable Overrides

```bash
# Override retry settings via environment variables
MAX_RETRIES=5 RETRY_DELAY=3000 npm run test:dev

# Disable retries
RETRIES=0 npm run test:staging

# Enable fail-fast mode
FAIL_FAST=true npm run test:prod
```

## 🐛 Troubleshooting Retries

### Common Retry Issues

**Infinite Retry Loops**
```bash
# Check retry configuration
npm run env:dev
# Ensure maxRetries is reasonable (1-5)
```

**Memory Issues During Retries**
```bash
# Reduce parallel workers for retries
CUCUMBER_WORKERS=1 npm run retry:failed

# Clear browser cache between retries
# (implemented automatically in retry logic)
```

**Flaky Test Detection**
```bash
# Analyze retry patterns
cat reports/retry-report.json | jq '.details.recovered'

# Identify consistently failing tests
cat reports/retry-report.json | jq '.details.retryResults'
```

### Retry Best Practices

1. **Reasonable Retry Limits**: Use 1-3 retries to avoid masking real issues
2. **Smart Error Detection**: Only retry transient failures (timeouts, network issues)
3. **Progressive Delays**: Use exponential backoff for retry delays
4. **Failure Analysis**: Monitor retry patterns to identify flaky tests
5. **Environment Tuning**: Use different retry strategies per environment

## 📋 Retry Workflow Examples

### Complete Test and Retry Workflow

```bash
# 1. Run initial test suite
npm run test:dev:parallel

# 2. Check for failures and retry
npm run retry:failed

# 3. View retry statistics
npm run retry:stats

# 4. Clear failed tests for next run
npm run retry:clear
```

### CI/CD Integration

```yaml
# In GitHub Actions
- name: Run tests with retries
  run: |
    npm run test:prod || true
    npm run retry:prod
    
- name: Upload retry reports
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: retry-reports-${{ github.run_number }}
    path: |
      reports/retry-report.json
      test-results/failed-tests.json
```

### Monitoring and Alerting

```bash
# Check if retries are needed
if npm run retry:stats | grep -q "Original Failures: 0"; then
  echo "✅ No retries needed"
else
  echo "⚠️ Failed tests detected, initiating retry"
  npm run retry:failed
fi
```

## 📊 Retry Metrics

### Key Performance Indicators

- **Retry Success Rate**: Percentage of failed tests that pass on retry
- **Flaky Test Ratio**: Tests that fail initially but pass on retry
- **Permanent Failure Rate**: Tests that fail consistently across retries
- **Retry Efficiency**: Time saved by selective retry vs full re-run

### Monitoring Commands

```bash
# Get retry statistics
npm run retry:stats

# Analyze retry patterns
cat reports/retry-report.json | jq '.successRate'

# Check system resources during retries
node -e "console.log(require('./src/utils/ParallelHelpers').ParallelHelpers.getSystemInfo())"
```
