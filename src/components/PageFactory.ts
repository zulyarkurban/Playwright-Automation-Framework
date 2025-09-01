import { Page } from '@playwright/test';
import { GitHubUserSearchPage } from '../pages/GitHubUserSearchPage';
import { GitHubProfilePage } from '../pages/GitHubProfilePage';

/**
 * Factory class for creating page objects
 */
export class PageFactory {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get GitHub User Search page instance
   */
  getGitHubUserSearchPage(): GitHubUserSearchPage {
    return new GitHubUserSearchPage(this.page);
  }

  /**
   * Get GitHub Profile page instance
   */
  getGitHubProfilePage(): GitHubProfilePage {
    return new GitHubProfilePage(this.page);
  }

  /**
   * Get current page instance
   */
  getCurrentPage(): Page {
    return this.page;
  }
}
