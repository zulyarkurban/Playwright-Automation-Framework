import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page class containing common functionality for all page objects
 */
export abstract class BasePage {
  protected page: Page;
  protected url?: string | undefined;

  constructor(page: Page, url?: string | undefined) {
    this.page = page;
    this.url = url;
  }

  /**
   * Navigate to the page URL
   */
  async navigate(): Promise<void> {
    if (!this.url) {
      throw new Error('URL not defined for this page');
    }
    await this.page.goto(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(locator: Locator, timeout: number = 10000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForElementToHide(locator: Locator, timeout: number = 10000): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Click element with retry logic
   */
  async clickElement(locator: Locator, options?: { timeout?: number; force?: boolean }): Promise<void> {
    await this.waitForElement(locator, options?.timeout);
    const clickOptions: any = {};
    if (options?.force !== undefined) {
      clickOptions.force = options.force;
    }
    await locator.click(clickOptions);
  }

  /**
   * Fill input field with text
   */
  async fillInput(locator: Locator, text: string, options?: { clear?: boolean }): Promise<void> {
    await this.waitForElement(locator);
    if (options?.clear) {
      await locator.clear();
    }
    await locator.fill(text);
  }

  /**
   * Get text content from element
   */
  async getElementText(locator: Locator): Promise<string> {
    await this.waitForElement(locator);
    const text = await locator.textContent();
    return text?.trim() || '';
  }

  /**
   * Get all text contents from multiple elements
   */
  async getAllElementTexts(locator: Locator): Promise<string[]> {
    await this.page.waitForTimeout(1000); // Brief wait for elements to load
    const elements = await locator.all();
    const texts = await Promise.all(
      elements.map(async (element) => {
        const text = await element.textContent();
        return text?.trim() || '';
      })
    );
    return texts.filter(text => text.length > 0);
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if element exists in DOM
   */
  async isElementPresent(locator: Locator): Promise<boolean> {
    return (await locator.count()) > 0;
  }

  /**
   * Scroll element into view
   */
  async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Take screenshot of the page
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Get current page URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Wait for URL to contain specific text
   */
  async waitForUrlToContain(text: string, timeout: number = 10000): Promise<void> {
    await this.page.waitForFunction(
      (expectedText) => window.location.href.includes(expectedText),
      text,
      { timeout }
    );
  }

  /**
   * Press keyboard key
   */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Wait for specific amount of time
   */
  async wait(milliseconds: number): Promise<void> {
    await this.page.waitForTimeout(milliseconds);
  }

  /**
   * Refresh the page
   */
  async refresh(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
    await this.waitForPageLoad();
  }

  /**
   * Assert element is visible
   */
  async assertElementVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  /**
   * Assert element contains text
   */
  async assertElementContainsText(locator: Locator, expectedText: string): Promise<void> {
    await expect(locator).toContainText(expectedText);
  }

  /**
   * Assert page URL
   */
  async assertUrl(expectedUrl: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(expectedUrl);
  }

  /**
   * Assert page title
   */
  async assertTitle(expectedTitle: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
  }
}
