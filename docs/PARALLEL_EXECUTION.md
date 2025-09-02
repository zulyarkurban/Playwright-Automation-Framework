# Parallel Execution Guide

This guide explains how to run Playwright Cucumber tests in parallel to reduce execution time and improve efficiency.

## Overview

The project supports parallel execution at multiple levels:
- **Cucumber Workers**: Multiple Cucumber processes running scenarios in parallel
- **Playwright Workers**: Multiple browser instances within each Cucumber process
- **CI/CD Parallelization**: GitHub Actions matrix builds for distributed execution

## Quick Start

### Run Tests in Parallel Locally

```bash
# Run with 4 workers (recommended for most systems)
npm run test:parallel

# Run with 6 workers for faster execution (high-performance systems)
npm run test:parallel:fast

# Run sequentially (single worker)
npm run test:sequential
```

### Environment Variables

Control parallel execution with these environment variables:

```bash
# Set number of Cucumber workers
export CUCUMBER_WORKERS=4

# Set number of Playwright workers per Cucumber process
export PLAYWRIGHT_WORKERS=2

# Set test environment
export TEST_ENV=dev

# Enable headless mode
export HEADLESS=true
```

## Configuration

### Cucumber Configuration

The `cucumber.config.js` supports parallel execution:

```javascript
module.exports = {
  default: {
    parallel: parseInt(process.env.CUCUMBER_WORKERS) || 1,
    retry: 2,
    // ... other options
  }
};
```

### Playwright Configuration

The `playwright.config.ts` enables parallel browsers:

```typescript
export default defineConfig({
  workers: process.env.PLAYWRIGHT_WORKERS ? parseInt(process.env.PLAYWRIGHT_WORKERS) : 2,
  fullyParallel: true,
  // ... other options
});
```

## Performance Optimization

### System Resource Management

The `ParallelHelpers` utility automatically calculates optimal worker counts based on:
- CPU cores available
- System memory
- CI environment detection

```typescript
import { ParallelHelpers } from './src/utils/ParallelHelpers';

// Get recommended worker count
const workers = ParallelHelpers.getRecommendedWorkerCount();

// Print execution summary
ParallelHelpers.printExecutionSummary(workers, scenarioCount);
```

### Recommended Worker Counts

| System Type | CPU Cores | Recommended Workers | Notes |
|-------------|-----------|-------------------|-------|
| Local Dev | 4-8 cores | 2-4 workers | Conservative for stability |
| High-End Local | 8+ cores | 4-6 workers | Maximum performance |
| CI Environment | 2-4 cores | 2 workers | Resource-constrained |
| GitHub Actions | 2 cores | 2 workers | Standard runner |

## CI/CD Integration

### GitHub Actions Matrix Strategy

The workflow runs tests across multiple workers:

```yaml
strategy:
  matrix:
    worker-id: [1, 2, 3, 4]
  fail-fast: false

env:
  CUCUMBER_WORKERS: 2
  WORKER_ID: ${{ matrix.worker-id }}
  TOTAL_WORKERS: 4
```

### Available Scripts

| Script | Description | Workers | Environment |
|--------|-------------|---------|-------------|
| `test:parallel` | Standard parallel execution | 4 | Local |
| `test:parallel:fast` | High-performance execution | 6 | Local |
| `test:parallel:ci` | CI-optimized execution | 2 | CI/CD |
| `test:sequential` | Single worker execution | 1 | Debug |

## Performance Benefits

### Estimated Time Reduction

With 30-second average scenario time:

| Scenarios | Sequential | 2 Workers | 4 Workers | 6 Workers | Reduction |
|-----------|------------|-----------|-----------|-----------|-----------|
| 10 | 5 min | 2.5 min | 1.25 min | 1 min | 80% |
| 20 | 10 min | 5 min | 2.5 min | 1.7 min | 83% |
| 50 | 25 min | 12.5 min | 6.25 min | 4.2 min | 83% |

## Troubleshooting

### Common Issues

**1. Resource Exhaustion**
```bash
# Reduce worker count
export CUCUMBER_WORKERS=2
export PLAYWRIGHT_WORKERS=1
```

**2. Flaky Tests**
```bash
# Run sequentially for debugging
npm run test:sequential
```

**3. Memory Issues**
```bash
# Check system resources
node -e "console.log(require('./src/utils/ParallelHelpers').ParallelHelpers.getSystemInfo())"
```

### Debug Mode

Run with detailed logging:

```bash
DEBUG=pw:api npm run test:parallel
```

### Validation

Check worker configuration:

```bash
node -e "
const { ParallelHelpers } = require('./src/utils/ParallelHelpers');
const validation = ParallelHelpers.validateWorkerConfig(4);
console.log(validation);
"
```

## Best Practices

### Test Design
- Keep tests independent and stateless
- Avoid shared test data dependencies
- Use unique test data per scenario
- Implement proper cleanup in hooks

### Resource Management
- Monitor system resources during execution
- Adjust worker counts based on available resources
- Use CI-specific configurations for cloud environments

### Data Management
- Use dynamic test data from external files
- Implement data isolation between parallel workers
- Avoid hardcoded test data that could cause conflicts

## Advanced Configuration

### Custom Worker Distribution

```typescript
import { ParallelHelpers } from './src/utils/ParallelHelpers';

const scenarios = ['scenario1', 'scenario2', 'scenario3'];
const workerCount = 3;
const chunks = ParallelHelpers.splitScenariosAcrossWorkers(scenarios, workerCount);
```

### Environment-Specific Settings

```bash
# Development
export CUCUMBER_WORKERS=4
export PLAYWRIGHT_WORKERS=2

# CI/CD
export CUCUMBER_WORKERS=2
export PLAYWRIGHT_WORKERS=1
export HEADLESS=true

# Performance Testing
export CUCUMBER_WORKERS=6
export PLAYWRIGHT_WORKERS=3
```

## Monitoring and Reporting

### Execution Summary

The system automatically displays execution information:

```
🚀 PARALLEL EXECUTION SUMMARY
================================
📊 System Info:
   CPU Cores: 8
   Total Memory: 16GB
   Free Memory: 8GB
   Platform: darwin

⚙️ Execution Config:
   Workers: 4
   Scenarios: 20
   Scenarios per worker: ~5

⏱️ Time Estimates:
   Sequential: ~10m 0s
   Parallel: ~2m 30s
   Estimated reduction: 75%
================================
```

### Reports and Artifacts

Parallel execution generates:
- Individual worker reports
- Consolidated HTML reports
- JSON test results
- Screenshots and videos (on failure)

All reports are automatically uploaded as CI artifacts for analysis.
