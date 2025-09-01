import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('I navigate to the GitHub user search application', async function (this: CustomWorld) {
  // Navigate to the GitHub user search app
  await this.page.goto('https://gh-users-search.netlify.app/');
  
  // Wait for the page to load
  await this.page.waitForLoadState('networkidle');
});

When('I search for user {string}', async function (this: CustomWorld, username: string) {
  // Find the search input field and enter the username
  const searchInput = this.page.locator('input[type="text"], input[placeholder*="search"], input[placeholder*="username"], input').first();
  await searchInput.fill(username);
  
  // Try to click search button first, if not found, press Enter
  const searchButton = this.page.locator('button:has-text("Search"), button[type="submit"], .search-btn').first();
  
  try {
    await searchButton.waitFor({ state: 'visible', timeout: 2000 });
    await searchButton.click();
  } catch {
    // If no search button found, press Enter
    await searchInput.press('Enter');
  }
  
  // Wait for search results to load
  await this.page.waitForTimeout(3000);
});

When('I click on the GitHub profile link', async function (this: CustomWorld) {
  // Wait for search results to appear first
  await this.page.waitForTimeout(2000);
  
  // Look for any clickable element that might lead to GitHub profile
  // Try multiple selectors that might be present on the search results
  const possibleSelectors = [
    'a[href*="github.com"]',
    'button:has-text("Follow")',
    'a:has-text("GitHub")',
    'a:has-text("View Profile")',
    '.user-card a',
    '.profile-link',
    '[data-testid="profile-link"]',
    'a[target="_blank"]'
  ];
  
  let githubLink = null;
  for (const selector of possibleSelectors) {
    const elements = await this.page.locator(selector).all();
    if (elements.length > 0) {
      githubLink = elements[0];
      console.log(`Found link using selector: ${selector}`);
      break;
    }
  }
  
  if (!githubLink) {
    // If no direct GitHub link found, look for any clickable user result
    const userResults = this.page.locator('.user, .user-card, .search-result, .result-item').first();
    if (await userResults.count() > 0) {
      githubLink = userResults.locator('a').first();
    }
  }
  
  if (!githubLink) {
    throw new Error('Could not find any clickable element to access user profile');
  }
  
  // Click the GitHub link
  await githubLink.click();
  
  // Wait for navigation to complete
  await this.page.waitForLoadState('networkidle', { timeout: 15000 });
  console.log(`Navigated to: ${this.page.url()}`);
  
  // Verify we're on GitHub
  if (!this.page.url().includes('github.com')) {
    throw new Error(`Expected to be on GitHub, but current URL is: ${this.page.url()}`);
  }
});

When('I click on the repositories section', async function (this: CustomWorld) {
  // Wait for the GitHub profile page to fully load
  await this.page.waitForTimeout(2000);
  
  // Try multiple selectors for the repositories tab on GitHub
  const repoSelectors = [
    'a[data-tab-item="repositories"]',
    'nav a:has-text("Repositories")',
    'a:has-text("Repositories")',
    '[data-testid="repositories-tab"]',
    'a[href*="?tab=repositories"]',
    'a[href$="/repositories"]',
    '.js-repo-nav a',
    '.UnderlineNav-item:has-text("Repositories")'
  ];
  
  let reposTab = null;
  for (const selector of repoSelectors) {
    const elements = await this.page.locator(selector).all();
    if (elements.length > 0) {
      reposTab = elements[0];
      console.log(`Found repositories tab using selector: ${selector}`);
      break;
    }
  }
  
  if (!reposTab) {
    // If no repositories tab found, try to navigate directly via URL
    const currentUrl = this.page.url();
    if (currentUrl.includes('github.com')) {
      const reposUrl = currentUrl.includes('?') 
        ? currentUrl.split('?')[0] + '?tab=repositories'
        : currentUrl + '?tab=repositories';
      console.log(`Navigating directly to repositories: ${reposUrl}`);
      await this.page.goto(reposUrl);
    } else {
      throw new Error('Could not find repositories tab and not on GitHub profile page');
    }
  } else {
    // Click on repositories tab
    await reposTab.click();
  }
  
  // Wait for repositories to load
  await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  console.log(`Current page after repositories click: ${this.page.url()}`);
});

Then('I should see all public repositories', async function (this: CustomWorld) {
  // Verify we're on the repositories page
  await expect(this.page).toHaveURL(/.*\/repositories.*|.*\?tab=repositories.*/);
  
  // Wait for repository list to be visible
  const repoList = this.page.locator('[data-testid="repos-list"], .js-repo-list, #user-repositories-list').first();
  await expect(repoList).toBeVisible();
});

Then('I print out all public repository names', async function (this: CustomWorld) {
  // Wait a moment for all repositories to load
  await this.page.waitForTimeout(2000);
  
  // Get all repository names - try multiple selectors for GitHub's repository list
  const repoSelectors = [
    'h3 a[href*="/"][itemprop="name codeRepository"]',
    '.js-repo-list h3 a',
    '[data-testid="repos-list"] h3 a',
    'a[data-hovercard-type="repository"]',
    'h3 a[href*="github.com"]'
  ];
  
  let repositories: string[] = [];
  
  for (const selector of repoSelectors) {
    const repoElements = await this.page.locator(selector).all();
    if (repoElements.length > 0) {
      repositories = await Promise.all(
        repoElements.map(async (element) => {
          const text = await element.textContent();
          return text?.trim() || '';
        })
      );
      break;
    }
  }
  
  // Filter out empty names and duplicates
  repositories = [...new Set(repositories.filter(name => name.length > 0))];
  
  // Print repository names to console
  console.log('\n=== PUBLIC REPOSITORIES ===');
  if (repositories.length > 0) {
    repositories.forEach((repo, index) => {
      console.log(`${index + 1}. ${repo}`);
    });
    console.log(`\nTotal repositories found: ${repositories.length}`);
  } else {
    console.log('No repositories found or user has no public repositories');
  }
  console.log('===========================\n');
  
  // Store repositories in world for potential further use
  (this as any).repositories = repositories;
});
