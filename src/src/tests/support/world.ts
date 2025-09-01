import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';
import { PageFactory } from '../../../components/PageFactory';
import { GitHubUserSearchPage } from '../../../pages/GitHubUserSearchPage';
import { GitHubProfilePage } from '../../../pages/GitHubProfilePage';

export interface CustomWorldOptions extends IWorldOptions {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
}

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  pageFactory!: PageFactory;
  
  // Page Objects
  gitHubUserSearchPage!: GitHubUserSearchPage;
  gitHubProfilePage!: GitHubProfilePage;

  constructor(options: CustomWorldOptions) {
    super(options);
  }

  async init() {
    this.browser = await chromium.launch({ 
      headless: process.env.HEADLESS === 'true' || process.env.CI === 'true',
      slowMo: process.env.HEADLESS === 'true' ? 0 : 100
    });
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true
    });
    this.page = await this.context.newPage();
    
    // Initialize page factory and page objects
    this.pageFactory = new PageFactory(this.page);
    this.gitHubUserSearchPage = this.pageFactory.getGitHubUserSearchPage();
    this.gitHubProfilePage = this.pageFactory.getGitHubProfilePage();
  }

  async cleanup() {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }
}

setWorldConstructor(CustomWorld);
