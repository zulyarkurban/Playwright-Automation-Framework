# Page Object Model (POM) Architecture

## Overview
This document outlines the Page Object Model architecture implemented for the Playwright automation project. The POM pattern helps organize web elements, reusable methods, and improves test maintainability.

## Architecture Structure

```
src/
├── pages/                    # Page Object classes
│   ├── BasePage.ts          # Base class with common functionality
│   ├── GitHubUserSearchPage.ts
│   └── GitHubProfilePage.ts
├── components/              # Shared components and factories
│   └── PageFactory.ts       # Factory for creating page objects
├── utils/                   # Utility classes
│   ├── ElementHelpers.ts    # Element interaction utilities
│   └── WaitHelpers.ts       # Advanced waiting strategies
└── src/tests/
    ├── support/
    │   └── world.ts         # Updated with POM integration
    └── step-definitions/
        ├── github-user-search-steps.ts     # Original steps
        └── github-user-search-steps-pom.ts # POM-based steps
```

## Key Components

### 1. BasePage.ts
**Purpose**: Abstract base class providing common functionality for all page objects.

**Key Features**:
- Navigation and page loading utilities
- Element interaction methods (click, fill, getText)
- Waiting strategies
- Assertion helpers
- Screenshot capabilities

**Example Usage**:
```typescript
export class MyPage extends BasePage {
  constructor(page: Page) {
    super(page, 'https://example.com');
  }
  
  async clickButton() {
    await this.clickElement(this.buttonLocator);
  }
}
```

### 2. Page Objects
**GitHubUserSearchPage.ts**: Handles GitHub user search functionality
- Search input interactions
- Result navigation
- Profile link clicking

**GitHubProfilePage.ts**: Manages GitHub profile page operations
- Repository tab navigation
- Repository listing
- Profile information extraction

### 3. Utility Classes

**ElementHelpers.ts**: Advanced element interaction utilities
- Multi-selector element finding
- Smart click with retry logic
- Element validation helpers

**WaitHelpers.ts**: Sophisticated waiting strategies
- Network idle waiting
- DOM stability checks
- Custom condition waiting

### 4. PageFactory.ts
**Purpose**: Centralized creation of page objects
- Manages page object instantiation
- Provides consistent page object access

## Usage Examples

### Basic Page Object Usage
```typescript
// In step definitions
Given('I navigate to search page', async function (this: CustomWorld) {
  await this.gitHubUserSearchPage.navigateToSearchPage();
  await this.gitHubUserSearchPage.verifyPageLoaded();
});

When('I search for user {string}', async function (this: CustomWorld, username: string) {
  await this.gitHubUserSearchPage.searchForUser(username);
});
```

### Advanced Element Interactions
```typescript
// Using ElementHelpers for complex scenarios
const element = await ElementHelpers.findElementByMultipleSelectors(
  page, 
  ['.primary-btn', '#submit', 'button[type="submit"]']
);

await ElementHelpers.smartClick(element, { 
  retries: 3, 
  useJavaScript: true 
});
```

### Custom Waiting Strategies
```typescript
// Using WaitHelpers for complex loading scenarios
await WaitHelpers.smartWait(page, {
  networkIdle: true,
  domStable: true,
  customCondition: async () => {
    return await page.locator('.results').count() > 0;
  }
});
```

## Benefits of This Architecture

### 1. **Maintainability**
- Centralized element definitions
- Reusable methods across tests
- Easy updates when UI changes

### 2. **Readability**
- Clear separation of concerns
- Business-readable step definitions
- Self-documenting code structure

### 3. **Reusability**
- Common functionality in BasePage
- Shared utilities across page objects
- Factory pattern for consistent object creation

### 4. **Scalability**
- Easy to add new page objects
- Extensible utility classes
- Modular architecture

### 5. **Robustness**
- Advanced waiting strategies
- Retry mechanisms
- Multiple selector fallbacks

## Migration Guide

### From Original Steps to POM
1. **Replace direct page interactions** with page object methods
2. **Use page object properties** instead of inline locators
3. **Leverage utility classes** for complex operations

### Example Migration
```typescript
// Before (original approach)
await this.page.locator('input[type="text"]').fill(username);
await this.page.locator('button:has-text("Search")').click();

// After (POM approach)
await this.gitHubUserSearchPage.searchForUser(username);
```

## Best Practices

### 1. **Page Object Design**
- Keep page objects focused on single pages/components
- Use descriptive method names
- Return page objects for method chaining when appropriate

### 2. **Element Locators**
- Prefer stable selectors (data-testid, id)
- Use multiple fallback selectors
- Avoid xpath when possible

### 3. **Waiting Strategies**
- Use appropriate waiting methods
- Combine multiple wait conditions for complex scenarios
- Set reasonable timeouts

### 4. **Error Handling**
- Provide meaningful error messages
- Use try-catch for optional operations
- Log important actions for debugging

## Testing the Architecture

### Run POM-based Tests
```bash
# Update cucumber.config.js to use POM step definitions
npm run test:cucumber:html
```

### Verify Implementation
1. Check that page objects are properly instantiated
2. Verify element interactions work correctly
3. Test error handling and fallback mechanisms

## Future Enhancements

1. **Add more page objects** for additional functionality
2. **Implement data objects** for test data management
3. **Add API helpers** for hybrid testing scenarios
4. **Create custom reporters** for enhanced test reporting
5. **Add visual testing** capabilities with screenshot comparison
