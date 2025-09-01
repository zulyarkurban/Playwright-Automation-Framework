import { Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { DataHelpers, UserData } from '../../../utils/DataHelpers';

// Set default timeout to 30 seconds for all steps
setDefaultTimeout(30000);

Given('I navigate to the GitHub user search application', async function (this: CustomWorld) {
  await this.gitHubUserSearchPage.navigateToSearchPage();
  await this.gitHubUserSearchPage.verifyPageLoaded();
});

When('I search for user {string}', async function (this: CustomWorld, username: string) {
  await this.gitHubUserSearchPage.searchForUser(username);
  // Wait for search results with a longer timeout
  try {
    await this.gitHubUserSearchPage.waitForSearchResults(15000);
  } catch (error) {
    // If waiting for specific results fails, just wait for the page to stabilize
    await this.gitHubUserSearchPage.wait(3000);
  }
});

When('I click on the GitHub profile link', async function (this: CustomWorld) {
  await this.gitHubUserSearchPage.clickGitHubProfileLink();
  await this.gitHubProfilePage.verifyOnGitHubProfile();
});

When('I click on the repositories section', async function (this: CustomWorld) {
  await this.gitHubProfilePage.clickRepositoriesTab();
  await this.gitHubProfilePage.verifyRepositoriesPageLoaded();
});

Then('I should see all public repositories', async function (this: CustomWorld) {
  await this.gitHubProfilePage.verifyRepositoriesPageLoaded();
  
  // Verify repository list is visible
  const repositoryList = this.gitHubProfilePage.getRepositoryList();
  await expect(repositoryList).toBeVisible();
});

Then('I print out all public repository names', async function (this: CustomWorld) {
  const repositories = await this.gitHubProfilePage.printAllRepositoryNames();
  
  // Store repositories in world for potential further use
  (this as any).repositories = repositories;
});

// Dynamic data step definitions
When('I search for a user from the test data file', async function (this: CustomWorld) {
  const userData = DataHelpers.getRandomUser();
  console.log(`Searching for user from test data: ${userData.username} - ${userData.description}`);
  
  await this.gitHubUserSearchPage.searchForUser(userData.username);
  try {
    await this.gitHubUserSearchPage.waitForSearchResults(15000);
  } catch (error) {
    await this.gitHubUserSearchPage.wait(3000);
  }
  
  // Store user data for later use
  (this as any).currentUserData = userData;
});

When('I search for the default user for current environment', async function (this: CustomWorld) {
  const env = process.env.TEST_ENV || 'dev';
  const userData = DataHelpers.getDefaultUserForEnvironment(env);
  console.log(`Searching for default user for ${env} environment: ${userData.username}`);
  
  await this.gitHubUserSearchPage.searchForUser(userData.username);
  try {
    await this.gitHubUserSearchPage.waitForSearchResults(15000);
  } catch (error) {
    await this.gitHubUserSearchPage.wait(3000);
  }
  
  // Store user data for later use
  (this as any).currentUserData = userData;
});

When('I search for a random user from test data', async function (this: CustomWorld) {
  const userData = DataHelpers.getRandomUser();
  console.log(`Searching for random user: ${userData.username} - ${userData.description}`);
  
  await this.gitHubUserSearchPage.searchForUser(userData.username);
  try {
    await this.gitHubUserSearchPage.waitForSearchResults(15000);
  } catch (error) {
    await this.gitHubUserSearchPage.wait(3000);
  }
  
  // Store user data for later use
  (this as any).currentUserData = userData;
});
