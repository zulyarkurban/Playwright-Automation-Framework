# Test Reporting Guide

This guide covers the comprehensive reporting features available in the Playwright Cucumber automation framework, including HTML reports, JSON data, screenshots, videos, and CI/CD integration.

## 📊 Report Types

### 1. HTML Reports
Interactive HTML reports with detailed test execution information, screenshots, and failure analysis.

**Location**: `reports/cucumber-report.html`

**Features**:
- Interactive test scenario breakdown
- Step-by-step execution details
- Embedded screenshots and videos
- Execution time metrics
- Pass/fail statistics
- Environment information

### 2. JSON Reports
Machine-readable JSON data for integration with other tools and custom analysis.

**Location**: `reports/cucumber-report.json`

**Features**:
- Complete test execution data
- Step definitions and results
- Timing information
- Error details and stack traces
- Environment metadata

### 3. Parallel Execution Reports
Consolidated reports from multiple parallel workers.

**Location**: `reports/cucumber-report-parallel.html` and `reports/cucumber-report-parallel.json`

**Features**:
- Aggregated results from all workers
- Performance metrics across workers
- Resource utilization data
- Parallel execution summary

## 🎯 Generating Reports

### Environment-Based Reporting

```bash
# Development environment - HTML report with debug info
npm run test:dev

# Staging environment - Standard HTML report
npm run test:staging

# Production environment - Minimal reporting for CI
npm run test:prod
```

### Manual Report Generation

```bash
# Generate HTML report only
npm run test:cucumber:html

# Generate both HTML and JSON reports
cucumber-js --config cucumber.config.js --format html:reports/cucumber-report.html --format json:reports/cucumber-report.json

# Parallel execution with reports
npm run test:dev:parallel
```

## 📸 Screenshots and Videos

### Automatic Capture

Screenshots and videos are automatically captured based on environment configuration:

#### Development Environment
```json
{
  "logging": {
    "level": "debug",
    "enableScreenshots": true,
    "enableVideo": true,
    "enableTrace": true
  }
}
```

#### Staging Environment
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

#### Production Environment
```json
{
  "logging": {
    "level": "warn",
    "enableScreenshots": false,
    "enableVideo": false,
    "enableTrace": false
  }
}
```

### Manual Screenshot Capture

```typescript
// In step definitions
await this.page.screenshot({ 
  path: `test-results/screenshot-${Date.now()}.png`,
  fullPage: true 
});

// In page objects
await this.captureScreenshot('user-search-results');
```

### Video Recording

Videos are automatically recorded for failed tests when enabled:

**Location**: `test-results/`
**Format**: WebM
**Trigger**: Test failures (when video recording is enabled)

## 📁 Report Structure

```
reports/
├── cucumber-report.html              # Main HTML report
├── cucumber-report.json              # Main JSON report
├── cucumber-report-parallel.html     # Parallel execution HTML report
└── cucumber-report-parallel.json     # Parallel execution JSON report

test-results/
├── screenshots/                      # Test screenshots
├── videos/                          # Test videos
├── traces/                          # Playwright traces (dev only)
└── .last-run.json                   # Last execution metadata
```

## 🔧 Report Configuration

### Cucumber Configuration

```javascript
// cucumber.config.js
module.exports = {
  default: {
    formatOptions: {
      snippetInterface: 'async-await'
    },
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json'
    ],
    parallel: 1
  },
  parallel: {
    format: [
      'progress-bar',
      'html:reports/cucumber-report-parallel.html',
      'json:reports/cucumber-report-parallel.json'
    ],
    parallel: parseInt(process.env.CUCUMBER_WORKERS) || 4
  }
};
```

### Environment-Specific Reporting

Each environment has specific reporting configurations:

```typescript
// src/config/EnvironmentConfig.ts
export interface EnvironmentConfig {
  logging: {
    level: string;
    enableScreenshots: boolean;
    enableVideo: boolean;
    enableTrace?: boolean;
  };
}
```

## 📈 Report Analysis

### HTML Report Features

1. **Executive Summary**
   - Total scenarios and steps
   - Pass/fail rates
   - Execution time
   - Environment details

2. **Scenario Details**
   - Step-by-step breakdown
   - Execution times per step
   - Screenshots at failure points
   - Error messages and stack traces

3. **Interactive Elements**
   - Expandable scenario sections
   - Filterable results (passed/failed)
   - Search functionality
   - Timeline view

### JSON Report Structure

```json
{
  "elements": [
    {
      "id": "scenario-id",
      "name": "Scenario name",
      "description": "",
      "type": "scenario",
      "keyword": "Scenario",
      "steps": [
        {
          "keyword": "Given ",
          "name": "I navigate to the GitHub user search application",
          "result": {
            "status": "passed",
            "duration": 1197207499
          },
          "match": {
            "location": "step-definitions/github-user-search-steps-pom.ts:14"
          }
        }
      ]
    }
  ]
}
```

## 🚀 CI/CD Integration

### GitHub Actions Artifacts

The framework automatically uploads reports as artifacts in CI/CD:

```yaml
# .github/workflows/ci-cd.yml
- name: Upload test reports
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: test-reports-worker-${{ matrix.worker-id }}-${{ github.run_number }}
    path: |
      reports/
      test-results/
    retention-days: 30

- name: Upload consolidated test reports
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: consolidated-test-reports-${{ github.run_number }}
    path: collected-artifacts/
    retention-days: 30
```

### Artifact Structure

```
Artifacts/
├── test-reports-worker-1-{run-number}/
│   ├── reports/
│   └── test-results/
├── test-reports-worker-2-{run-number}/
│   ├── reports/
│   └── test-results/
└── consolidated-test-reports-{run-number}/
    ├── reports/
    └── test-results/
```

## 📊 Performance Metrics

### Parallel Execution Summary

The framework provides detailed performance metrics:

```
🚀 PARALLEL EXECUTION SUMMARY
================================
📊 System Info:
   CPU Cores: 8
   Total Memory: 16GB
   Free Memory: 12GB
   Platform: darwin
   
⚙️ Execution Config:
   Workers: 4
   Scenarios: 9
   Scenarios per worker: ~3
   
⏱️ Time Estimates:
   Sequential: ~4m 30s
   Parallel: ~1m 8s
   Estimated reduction: 75%
================================
```

### Report Metrics

- **Execution Time**: Total and per-scenario timing
- **Resource Usage**: Memory and CPU utilization
- **Worker Distribution**: Scenario distribution across workers
- **Failure Analysis**: Error patterns and frequency

## 🔍 Troubleshooting Reports

### Common Issues

**Missing Screenshots**
```bash
# Check environment configuration
npm run env:dev
# Ensure enableScreenshots: true
```

**Large Report Files**
```bash
# Use production environment for minimal reporting
npm run test:prod

# Or disable video recording
ENABLE_VIDEO=false npm run test:dev
```

**Report Generation Failures**
```bash
# Check reports directory exists
mkdir -p reports

# Verify permissions
chmod 755 reports/

# Run with debug logging
DEBUG=cucumber* npm run test:cucumber:html
```

### Report Validation

```bash
# Validate JSON report structure
node -e "console.log(JSON.parse(require('fs').readFileSync('reports/cucumber-report.json', 'utf8')))"

# Check HTML report accessibility
open reports/cucumber-report.html
```

## 📋 Best Practices

### 1. Environment-Appropriate Reporting
- **Development**: Full reporting with screenshots, videos, and traces
- **Staging**: Moderate reporting with screenshots only
- **Production**: Minimal reporting for performance

### 2. Report Management
- Regular cleanup of old reports and artifacts
- Archive important test runs
- Use meaningful names for custom reports

### 3. CI/CD Integration
- Always upload reports as artifacts
- Set appropriate retention periods
- Use consolidated reports for analysis

### 4. Performance Optimization
- Disable video recording in production
- Use selective screenshot capture
- Compress large report files

## 🎨 Custom Reporting

### Adding Custom Formatters

```javascript
// cucumber.config.js
module.exports = {
  default: {
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
      './src/utils/custom-formatter.js:reports/custom-report.txt'
    ]
  }
};
```

### Custom Report Generation

```typescript
// src/utils/ReportGenerator.ts
export class ReportGenerator {
  static async generateCustomReport(jsonReport: string): Promise<void> {
    const data = JSON.parse(fs.readFileSync(jsonReport, 'utf8'));
    
    const summary = {
      totalScenarios: data.length,
      passedScenarios: data.filter(f => f.elements.every(e => 
        e.steps.every(s => s.result.status === 'passed'))).length,
      executionTime: data.reduce((acc, f) => 
        acc + f.elements.reduce((acc2, e) => 
          acc2 + e.steps.reduce((acc3, s) => 
            acc3 + (s.result.duration || 0), 0), 0), 0)
    };
    
    fs.writeFileSync('reports/custom-summary.json', JSON.stringify(summary, null, 2));
  }
}
```

## 📖 Report Examples

### Successful Test Run
```
Feature: GitHub User Search
  ✓ Search for user "torvalds" (2.1s)
  ✓ Navigate to repositories (1.8s)
  ✓ Verify repository list (0.9s)

3 scenarios (3 passed)
15 steps (15 passed)
Total time: 4.8s
```

### Failed Test Run with Details
```
Feature: GitHub User Search
  ✓ Search for user "torvalds" (2.1s)
  ✗ Navigate to repositories (timeout after 30s)
    └── Screenshot: test-results/failed-navigation-123456.png
    └── Error: Timeout waiting for element to be visible
  
1 scenario (1 failed)
8 steps (6 passed, 1 failed, 1 skipped)
```
