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
    // Try to connect to Microsoft Playwright Testing service if URL is provided
    if (process.env.PLAYWRIGHT_SERVICE_URL) {
      try {
        console.log('Attempting to connect to Azure Playwright Testing service...');
        
        // Configure connection URL with OS parameter
        let wsEndpoint = process.env.PLAYWRIGHT_SERVICE_URL;
        if (wsEndpoint && !wsEndpoint.includes('?os=')) {
          wsEndpoint += '?os=linux';
        }
        
        const connectOptions: any = {
          wsEndpoint: wsEndpoint
        };
        
        // Add authentication if token is available
        if (process.env.PLAYWRIGHT_SERVICE_ACCESS_TOKEN) {
          connectOptions.headers = {
            'Authorization': `Bearer ${process.env.PLAYWRIGHT_SERVICE_ACCESS_TOKEN}`
          };
        }
        
        this.browser = await chromium.connect(connectOptions);
        console.log('✅ Successfully connected to Azure cloud browsers');
      } catch (error: any) {
        console.warn('❌ Failed to connect to Azure Playwright Testing service:', error.message);
        console.log('🔄 Falling back to local browser...');
        // Fallback to local browser
        this.browser = await chromium.launch({ 
          headless: process.env.HEADLESS === 'true' || process.env.CI === 'true',
          slowMo: process.env.HEADLESS === 'true' ? 0 : 100
        });
      }
    } else {
      // Use local browser
      this.browser = await chromium.launch({ 
        headless: process.env.HEADLESS === 'true' || process.env.CI === 'true',
        slowMo: process.env.HEADLESS === 'true' ? 0 : 100
      });
    }
    
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
    if (this.browser && !process.env.PLAYWRIGHT_SERVICE_URL) {
      // Only close browser if it's local (not cloud service)
      await this.browser.close();
    }
  }
}

setWorldConstructor(CustomWorld);
