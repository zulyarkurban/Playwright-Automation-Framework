# Playwright Cucumber Automation Framework

A comprehensive test automation framework integrating Cucumber BDD with Playwright for parallel end-to-end testing with dynamic data capabilities.

## 🚀 Key Features

- **Parallel Execution**: Run tests across multiple workers for 75-83% faster execution
- **Dynamic Data Testing**: CSV/JSON data-driven test scenarios
- **Page Object Model**: Maintainable and scalable test architecture
- **CI/CD Integration**: GitHub Actions with matrix builds
- **Multiple Browsers**: Chromium, Firefox, and WebKit support
- **Comprehensive Reporting**: HTML/JSON reports with screenshots
- **TypeScript Support**: Full type safety and IntelliSense

## 📁 Project Structure

```
src/
├── features/                           # Gherkin feature files
│   ├── github-user-search.feature     # Basic search scenarios
│   └── github-user-search-dynamic.feature # Data-driven scenarios
├── pages/                              # Page Object Model
│   ├── BasePage.ts                     # Base page functionality
│   ├── GitHubUserSearchPage.ts         # Search page actions
│   └── GitHubProfilePage.ts            # Profile page actions
├── data/                               # Test data files
│   ├── users.json                      # JSON test data
│   └── users.csv                       # CSV test data
├── utils/                              # Utility classes
│   ├── DataHelpers.ts                  # Data management utilities
│   └── ParallelHelpers.ts              # Parallel execution utilities
└── src/tests/                          # Test implementation
    ├── step-definitions/               # Cucumber step definitions
    ├── support/                        # Test configuration
    └── components/                     # Reusable components
```

## ⚡ Quick Start

### Parallel Execution (Recommended)

```bash
# Install dependencies
npm ci

# Run tests in parallel (4 workers)
npm run test:parallel

# High-performance execution (6 workers)
npm run test:parallel:fast

# CI-optimized execution (2 workers)
npm run test:parallel:ci
```

### Sequential Execution

```bash
# Standard execution
npm run test:cucumber

# With HTML reports
npm run test:cucumber:html

# Headless mode
npm run test:cucumber:headless
```

## 🔧 Available Scripts

### Parallel Execution
- `npm run test:parallel` - Run with 4 workers (recommended)
- `npm run test:parallel:fast` - Run with 6 workers (high-performance)
- `npm run test:parallel:ci` - Run with 2 workers (CI-optimized)
- `npm run test:sequential` - Run with single worker (debugging)

### Standard Execution
- `npm run test:cucumber` - Run tests with visible browser
- `npm run test:cucumber:html` - Generate HTML reports
- `npm run test:cucumber:headless` - Run in headless mode

### Interactive Script
```bash
# Run with custom options
./scripts/parallel-test.sh -w 6 -m fast -e staging
```

## 📊 Performance Benefits

| Test Count | Sequential | 4 Workers | 6 Workers | Time Saved |
|------------|------------|-----------|-----------|------------|
| 10 scenarios | 5 min | 1.25 min | 1 min | 80% |
| 20 scenarios | 10 min | 2.5 min | 1.7 min | 83% |
| 50 scenarios | 25 min | 6.25 min | 4.2 min | 83% |

## 🛠️ Configuration

### Environment Variables

```bash
# Parallel execution
export CUCUMBER_WORKERS=4          # Number of Cucumber workers
export PLAYWRIGHT_WORKERS=2        # Playwright workers per Cucumber process
export HEADLESS=true              # Run in headless mode

# Test environment
export TEST_ENV=dev               # Environment: dev, staging, prod
export CI=true                    # CI environment detection
```

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 18.x | 20.x+ |
| Memory | 4GB | 8GB+ |
| CPU Cores | 2 | 4+ |

## 📝 Writing Tests

### 1. Feature Files with Dynamic Data

```gherkin
Feature: GitHub User Search
  Scenario Outline: Search for users dynamically
    Given I navigate to the GitHub user search application
    When I search for user "<username>"
    And I click on the GitHub profile link
    And I click on the repositories section
    Then I should see all public repositories
    And I print out all public repository names

    Examples:
      | username |
      | octocat  |
      | microsoft|
      | facebook |
```

### 2. Page Object Implementation

```typescript
// src/pages/GitHubUserSearchPage.ts
export class GitHubUserSearchPage extends BasePage {
  async searchForUser(username: string): Promise<void> {
    await this.fillInput(this.searchInput, username);
    await this.clickElement(this.searchButton);
  }
  
  async clickGitHubProfileLink(): Promise<void> {
    await this.clickElement(this.profileLinks.first());
  }
}
```

### 3. Step Definitions with POM

```typescript
// src/src/tests/step-definitions/github-user-search-steps-pom.ts
Given('I navigate to the GitHub user search application', async function (this: CustomWorld) {
  await this.gitHubUserSearchPage.navigateToSearchPage();
});

When('I search for user {string}', async function (this: CustomWorld, username: string) {
  await this.gitHubUserSearchPage.searchForUser(username);
});
```

### 4. Dynamic Test Data

```json
// src/data/users.json
{
  "users": [
    {
      "username": "octocat",
      "description": "GitHub mascot",
      "environment": "dev"
    },
    {
      "username": "microsoft",
      "description": "Microsoft organization",
      "environment": "staging"
    }
  ]
}
```

## 🚀 CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
strategy:
  matrix:
    worker-id: [1, 2, 3, 4]
  fail-fast: false

steps:
  - name: Run Cucumber tests in parallel
    run: npm run test:cucumber:parallel:ci
    env:
      CUCUMBER_WORKERS: 2
      WORKER_ID: ${{ matrix.worker-id }}
      TOTAL_WORKERS: 4
```

## 📊 Monitoring & Reporting

### Execution Summary

The framework automatically displays performance metrics:

```
🚀 PARALLEL EXECUTION SUMMARY
================================
📊 System Info:
   CPU Cores: 8
   Total Memory: 16GB
   Workers: 4
   
⏱️ Time Estimates:
   Sequential: ~10m 0s
   Parallel: ~2m 30s
   Estimated reduction: 75%
================================
```

### Generated Reports

- **HTML Report**: `reports/cucumber-report.html`
- **JSON Report**: `reports/cucumber-report.json`
- **Screenshots**: `test-results/` (on failure)
- **Videos**: `test-results/` (on failure)

## 🔧 Advanced Usage

### Custom Worker Configuration

```bash
# Interactive script with options
./scripts/parallel-test.sh --help

# Examples
./scripts/parallel-test.sh -w 6 -m fast -e staging -h
./scripts/parallel-test.sh --workers 2 --mode sequential --env prod
```

### Resource Optimization

```typescript
import { ParallelHelpers } from './src/utils/ParallelHelpers';

// Get optimal worker count for your system
const workers = ParallelHelpers.getRecommendedWorkerCount();

// Validate configuration
const validation = ParallelHelpers.validateWorkerConfig(workers);
console.log(validation.warnings);
```

## 🐛 Troubleshooting

### Common Issues

**Parallel execution fails:**
```bash
# Reduce workers and run sequentially for debugging
npm run test:sequential
```

**Memory issues:**
```bash
# Check system resources
node -e "console.log(require('./src/utils/ParallelHelpers').ParallelHelpers.getSystemInfo())"
```

**Step definition errors:**
- Ensure all step definitions are properly implemented
- Check method names match between page objects and step definitions
- Verify imports and dependencies

### Debug Mode

```bash
# Enable debug logging
DEBUG=pw:api npm run test:parallel

# Run with verbose output
npm run test:cucumber -- --verbose
```

## 📚 Documentation

- [Parallel Execution Guide](docs/PARALLEL_EXECUTION.md) - Comprehensive parallel testing guide
- [Page Object Model](README-POM-Architecture.md) - POM architecture details
- [Cucumber Configuration](cucumber.config.js) - Test runner configuration

## 🎯 Best Practices

1. **Test Independence**: Keep scenarios isolated and stateless
2. **Dynamic Data**: Use external data files for test parameters
3. **Resource Management**: Monitor system resources during parallel execution
4. **Error Handling**: Implement proper retry mechanisms and timeouts
5. **Reporting**: Generate comprehensive reports for analysis

## 📈 Performance Results

Recent test execution with parallel implementation:
- **9 scenarios** completed in **2m 39s** (vs ~8m sequential)
- **75% time reduction** achieved with 4 workers
- **50 steps** executed across multiple browser instances
- **2 failed scenarios** properly isolated and reported
