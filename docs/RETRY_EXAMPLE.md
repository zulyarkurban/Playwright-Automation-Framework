# Failed Test Retry Example

This example demonstrates how to handle failed test cases and retry them automatically.

## 🎯 Complete Retry Workflow

### 1. Run Tests and Handle Failures

```bash
# Run tests in development environment
npm run test:dev:parallel

# If some tests fail, retry them automatically
npm run retry:failed

# Check retry statistics
npm run retry:stats
```

### 2. Environment-Specific Retry Examples

```bash
# Development environment (1 retry, 2s delay)
npm run test:dev && npm run retry:dev

# Staging environment (2 retries, 3s delay)
npm run test:staging && npm run retry:staging

# Production environment (3 retries, 5s delay)
npm run test:prod && npm run retry:prod
```

### 3. Custom Retry Configuration

```bash
# Retry with custom settings
./scripts/retry-failed-tests.sh -e dev -r 5 -d 2

# Advanced retry options
./scripts/retry-failed-tests.sh --env staging --retries 10 --delay 3
```

## 📊 Expected Output

### Initial Test Run with Failures
```
Feature: GitHub User Search
  ✓ Search for user "torvalds" (2.1s)
  ✗ Navigate to repositories (timeout after 30s)
  ✓ Verify user profile (1.5s)

3 scenarios (2 passed, 1 failed)
15 steps (13 passed, 1 failed, 1 skipped)

💾 Saved failed test: Navigate to repositories
```

### Retry Execution
```
🔄 Retry Failed Tests Script
================================
📋 Checking for failed tests...
🔍 Analyzing test report for failures...
Found 1 failed tests

🔄 Retrying 1 failed tests...
Environment: dev
Max Retries: 3
Retry Delay: 2s

Retry attempt 1/3
✅ Retry attempt 1 succeeded

🎉 All failed tests recovered!
```

### Retry Statistics
```
📊 Retry Statistics
================================
Original Failures: 1
Tests Recovered: 1
Still Failing: 0
Success Rate: 100%
Last Retry: 12/1/2024, 9:30:15 PM
================================
```

## 🔧 Integration Examples

### CI/CD Pipeline with Retries

```yaml
# .github/workflows/ci-cd.yml
- name: Run tests with automatic retry
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

### Monitoring Script

```bash
#!/bin/bash
# monitor-tests.sh

echo "🔍 Running test suite with retry monitoring..."

# Run initial tests
npm run test:staging

# Check for failures and retry if needed
if npm run retry:stats | grep -q "Original Failures: 0"; then
  echo "✅ All tests passed - no retries needed"
else
  echo "⚠️ Failed tests detected - initiating retry"
  npm run retry:staging
  
  # Final check
  if npm run retry:stats | grep -q "Still Failing: 0"; then
    echo "🎉 All tests recovered after retry"
  else
    echo "❌ Some tests still failing after retry"
    exit 1
  fi
fi
```

## 📁 Generated Files

After running tests with failures and retries, you'll see:

```
test-results/
├── failed-tests.json           # List of failed tests
└── .last-run.json             # Execution metadata

reports/
├── cucumber-report.json        # Main test report
├── retry-report.json          # Retry execution summary
├── retry-1.json               # First retry attempt results
└── retry-2.json               # Second retry attempt results (if needed)
```

## 🎯 Best Practices

1. **Run retries immediately** after test execution for quick feedback
2. **Monitor retry patterns** to identify flaky tests
3. **Use environment-appropriate retry settings** (more retries in prod)
4. **Clear failed tests list** between major test runs
5. **Analyze retry statistics** to improve test stability
