import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { environmentConfig } from '../config/EnvironmentConfig';

/**
 * Page Object for GitHub User Search Application
 */
export class GitHubUserSearchPage extends BasePage {
  // Locators
  private readonly searchInput: Locator;
  private readonly searchButton: Locator;
  private readonly userResults: Locator;
  private readonly profileLinks: Locator;
  private readonly userCards: Locator;

  constructor(page: Page) {
    // Load environment configuration and use search URL
    const config = environmentConfig.getConfig();
    super(page, config.application.searchUrl);
    
    // Initialize locators
    this.searchInput = this.page.locator('input[type="text"], input[placeholder*="search"], input[placeholder*="username"], input').first();
    this.searchButton = this.page.locator('button:has-text("Search"), button[type="submit"], .search-btn').first();
    this.userResults = this.page.locator('.user, .user-card, .search-result, .result-item');
    this.profileLinks = this.page.locator('a[href*="github.com"]');
    this.userCards = this.page.locator('.user-card, .user, .search-result');
  }

  /**
   * Navigate to GitHub User Search page
   */
  async navigateToSearchPage(): Promise<void> {
    await this.navigate();
    await this.waitForPageLoad();
  }

  /**
   * Search for a specific user
   */
  async searchForUser(username: string): Promise<void> {
    await this.fillInput(this.searchInput, username);
    
    // Try to click search button, fallback to Enter key
    if (await this.isElementVisible(this.searchButton)) {
      await this.clickElement(this.searchButton);
    } else {
      await this.searchInput.press('Enter');
    }
    
    // Wait for search results
    await this.wait(3000);
  }

  /**
   * Get search input element
   */
  getSearchInput(): Locator {
    return this.searchInput;
  }

  /**
   * Get search button element
   */
  getSearchButton(): Locator {
    return this.searchButton;
  }

  /**
   * Check if search results are displayed
   */
  async areSearchResultsDisplayed(): Promise<boolean> {
    return await this.isElementVisible(this.userResults.first());
  }

  /**
   * Get all user result cards
   */
  getUserResultCards(): Locator {
    return this.userCards;
  }

  /**
   * Click on GitHub profile link
   */
  async clickGitHubProfileLink(): Promise<void> {
    // Wait for search results to appear
    await this.wait(2000);
    
    // Try multiple strategies to find and click GitHub profile link
    const strategies = [
      () => this.profileLinks.first(),
      () => this.page.locator('button:has-text("Follow")').first(),
      () => this.page.locator('a:has-text("GitHub")').first(),
      () => this.page.locator('a:has-text("View Profile")').first(),
      () => this.page.locator('.user-card a').first(),
      () => this.page.locator('.profile-link').first(),
      () => this.page.locator('[data-testid="profile-link"]').first(),
      () => this.page.locator('a[target="_blank"]').first()
    ];

    let linkFound = false;
    for (const strategy of strategies) {
      const link = strategy();
      if (await this.isElementVisible(link)) {
        await this.clickElement(link);
        linkFound = true;
        console.log(`Successfully clicked GitHub profile link`);
        break;
      }
    }

    if (!linkFound) {
      // Fallback: click on any user result
      const userResult = this.userResults.first();
      if (await this.isElementVisible(userResult)) {
        const userLink = userResult.locator('a').first();
        await this.clickElement(userLink);
        linkFound = true;
      }
    }

    if (!linkFound) {
      throw new Error('Could not find any clickable element to access user profile');
    }

    // Wait for navigation
    await this.waitForPageLoad();
    console.log(`Navigated to: ${this.getCurrentUrl()}`);

    // Verify we're on GitHub
    await this.waitForUrlToContain('github.com');
  }

  /**
   * Get all visible profile links
   */
  getProfileLinks(): Locator {
    return this.profileLinks;
  }

  /**
   * Verify search page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await this.assertElementVisible(this.searchInput);
    await this.waitForPageLoad();
  }

  /**
   * Clear search input
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
  }

  /**
   * Get search input value
   */
  async getSearchInputValue(): Promise<string> {
    return await this.searchInput.inputValue();
  }

  /**
   * Wait for search results to load
   */
  async waitForSearchResults(timeout: number = 10000): Promise<void> {
    await this.userResults.first().waitFor({ state: 'visible', timeout });
  }

  /**
   * Get number of search results
   */
  async getSearchResultsCount(): Promise<number> {
    await this.wait(2000); // Wait for results to load
    return await this.userResults.count();
  }

  /**
   * Get search result at specific index
   */
  getSearchResultByIndex(index: number): Locator {
    return this.userResults.nth(index);
  }
}
