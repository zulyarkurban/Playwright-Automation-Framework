# Dynamic Test Data Management

This directory contains test data files and utilities for data-driven testing.

## Files

### `users.json`
Main test data file containing:
- **testUsers**: Array of user objects with username, description, expected repo count, and tags
- **environments**: Configuration for different test environments (dev, staging, prod)

### `users.csv`
CSV format of user data for external data loading and integration with other tools.

## Usage Examples

### 1. Basic Scenario Outline (Feature File)
```gherkin
Scenario Outline: Search for multiple users
  When I search for user "<username>"
  Examples:
    | username     |
    | zulyarkurban |
    | octocat      |
    | torvalds     |
```

### 2. Dynamic Data Loading (Step Definitions)
```typescript
// Search for random user from data file
When('I search for a user from the test data file', async function() {
  const userData = DataHelpers.getRandomUser();
  await this.gitHubUserSearchPage.searchForUser(userData.username);
});

// Search for environment-specific user
When('I search for the default user for current environment', async function() {
  const env = process.env.TEST_ENV || 'dev';
  const userData = DataHelpers.getDefaultUserForEnvironment(env);
  await this.gitHubUserSearchPage.searchForUser(userData.username);
});
```

### 3. Environment Variables
Set environment variables to override test data:
```bash
export TEST_USERNAME=myuser
export TEST_ENV=staging
npm run test:cucumber
```

### 4. Programmatic Data Creation
```typescript
// Create dynamic test data
const userData = DataHelpers.createDynamicTestData('newuser', {
  description: 'Custom test user',
  expectedRepoCount: 15,
  tags: ['custom', 'test']
});
```

## Data Structure

```typescript
interface UserData {
  username: string;
  description: string;
  expectedRepoCount: number;
  tags: string[];
}
```

## Available Methods

- `DataHelpers.getRandomUser()` - Get random user from data file
- `DataHelpers.getUserByUsername(username)` - Get specific user
- `DataHelpers.getUsersByTag(tag)` - Filter users by tag
- `DataHelpers.getDefaultUserForEnvironment(env)` - Get environment default
- `DataHelpers.generateTestCombinations(tags)` - Generate test combinations
