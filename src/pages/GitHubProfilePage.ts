import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for GitHub Profile Page
 */
export class GitHubProfilePage extends BasePage {
  // Locators
  private readonly repositoriesTab: Locator;
  private readonly repositoryList: Locator;
  private readonly repositoryNames: Locator;
  private readonly profileName: Locator;
  private readonly followButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators
    this.repositoriesTab = this.page.locator('a[data-tab-item="repositories"], nav a:has-text("Repositories"), a:has-text("Repositories")').first();
    this.repositoryList = this.page.locator('[data-testid="repos-list"], .js-repo-list, #user-repositories-list').first();
    this.repositoryNames = this.page.locator('h3 a[href*="/"][itemprop="name codeRepository"], .js-repo-list h3 a, [data-testid="repos-list"] h3 a');
    this.profileName = this.page.locator('.p-name, .vcard-fullname, [data-testid="profile-name"]').first();
    this.followButton = this.page.locator('button:has-text("Follow"), [data-testid="follow-button"]').first();
  }

  /**
   * Verify we're on a GitHub profile page
   */
  async verifyOnGitHubProfile(): Promise<void> {
    await this.waitForUrlToContain('github.com');
    // Wait for profile elements to load
    await this.wait(2000);
  }

  /**
   * Click on repositories tab
   */
  async clickRepositoriesTab(): Promise<void> {
    // Try multiple selectors for repositories tab
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

    let tabFound = false;
    for (const selector of repoSelectors) {
      const tab = this.page.locator(selector).first();
      if (await this.isElementVisible(tab)) {
        await this.clickElement(tab);
        tabFound = true;
        console.log(`Found repositories tab using selector: ${selector}`);
        break;
      }
    }

    if (!tabFound) {
      // Fallback: navigate directly via URL
      const currentUrl = this.getCurrentUrl();
      if (currentUrl.includes('github.com')) {
        const reposUrl = currentUrl.includes('?') 
          ? currentUrl.split('?')[0] + '?tab=repositories'
          : currentUrl + '?tab=repositories';
        console.log(`Navigating directly to repositories: ${reposUrl}`);
        await this.page.goto(reposUrl);
      } else {
        throw new Error('Could not find repositories tab and not on GitHub profile page');
      }
    }

    // Wait for repositories to load
    await this.waitForPageLoad();
    console.log(`Current page after repositories click: ${this.getCurrentUrl()}`);
  }

  /**
   * Verify repositories page is loaded
   */
  async verifyRepositoriesPageLoaded(): Promise<void> {
    await this.assertUrl(/.*\/repositories.*|.*\?tab=repositories.*/);
    await this.assertElementVisible(this.repositoryList);
  }

  /**
   * Get all repository names
   */
  async getAllRepositoryNames(): Promise<string[]> {
    await this.wait(2000); // Wait for repositories to load

    // Try multiple selectors for repository names
    const repoSelectors = [
      'h3 a[href*="/"][itemprop="name codeRepository"]',
      '.js-repo-list h3 a',
      '[data-testid="repos-list"] h3 a',
      'a[data-hovercard-type="repository"]',
      'h3 a[href*="github.com"]'
    ];

    let repositories: string[] = [];
    
    for (const selector of repoSelectors) {
      const repoElements = this.page.locator(selector);
      if (await repoElements.count() > 0) {
        repositories = await this.getAllElementTexts(repoElements);
        break;
      }
    }

    // Filter out empty names and duplicates
    repositories = [...new Set(repositories.filter(name => name.length > 0))];
    
    return repositories;
  }

  /**
   * Print all repository names to console
   */
  async printAllRepositoryNames(): Promise<string[]> {
    const repositories = await this.getAllRepositoryNames();
    
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
    
    return repositories;
  }

  /**
   * Get repository list element
   */
  getRepositoryList(): Locator {
    return this.repositoryList;
  }

  /**
   * Get repositories tab element
   */
  getRepositoriesTab(): Locator {
    return this.repositoriesTab;
  }

  /**
   * Get repository names locator
   */
  getRepositoryNames(): Locator {
    return this.repositoryNames;
  }

  /**
   * Get profile name
   */
  async getProfileName(): Promise<string> {
    if (await this.isElementVisible(this.profileName)) {
      return await this.getElementText(this.profileName);
    }
    return '';
  }

  /**
   * Check if follow button is present
   */
  async isFollowButtonPresent(): Promise<boolean> {
    return await this.isElementVisible(this.followButton);
  }

  /**
   * Click repository by name
   */
  async clickRepositoryByName(repositoryName: string): Promise<void> {
    const repoLink = this.page.locator(`a:has-text("${repositoryName}")`).first();
    await this.clickElement(repoLink);
    await this.waitForPageLoad();
  }

  /**
   * Get repository count
   */
  async getRepositoryCount(): Promise<number> {
    const repositories = await this.getAllRepositoryNames();
    return repositories.length;
  }

  /**
   * Search repositories (if search functionality exists)
   */
  async searchRepositories(searchTerm: string): Promise<void> {
    const searchInput = this.page.locator('input[placeholder*="Find a repository"], input[aria-label*="repository"]').first();
    if (await this.isElementVisible(searchInput)) {
      await this.fillInput(searchInput, searchTerm);
      await this.wait(1000); // Wait for search results
    }
  }
}
