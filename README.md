# Playwright_Automation Project

This project integrates Cucumber BDD testing with Playwright for end-to-end web automation.

## Project Structure

```
src/
├── features/                 # Gherkin feature files
│   └── login.feature        # Example login scenarios
└── src/tests/
    ├── cucumber.spec.ts     # Step definitions
    └── support/
        ├── world.ts         # Custom world with Playwright setup
        └── hooks.ts         # Before/After hooks
```

## Available Scripts

- `npm run test:cucumber` - Run Cucumber tests with browser visible + generate JSON report
- `npm run test:cucumber:html` - Run Cucumber tests + generate HTML report
- `npm run test:cucumber:headless` - Run Cucumber tests in headless mode

## Features

- **BDD Testing**: Write tests in natural language using Gherkin syntax
- **Playwright Integration**: Full Playwright browser automation capabilities
- **TypeScript Support**: Type-safe step definitions and world context
- **Multiple Browsers**: Supports Chromium, Firefox, and WebKit
- **Reporting**: JSON and HTML test reports in `reports/` directory
- **Headless/Headed**: Configurable browser visibility

## Writing Tests

### 1. Create Feature Files
Add `.feature` files in `src/features/`:

```gherkin
Feature: User Authentication
  Scenario: Successful login
    Given I am on the login page
    When I enter valid credentials
    Then I should see the dashboard
```

### 2. Implement Step Definitions
Add corresponding steps in `src/src/tests/cucumber.spec.ts`:

```typescript
Given('I am on the login page', async function (this: CustomWorld) {
  await this.page.goto('https://your-app.com/login');
});
```

### 3. Run Tests
```bash
npm run test:cucumber:headless
```

## Configuration

- **Browser Settings**: Modify `src/src/tests/support/world.ts`
- **Cucumber Options**: Update scripts in `package.json`
- **TypeScript**: Configure via `tsconfig.json`

## Example Output

The tests are now running successfully! Update the URLs in your step definitions to point to your actual application for real testing.
