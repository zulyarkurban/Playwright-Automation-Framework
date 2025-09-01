import { Page, Locator } from '@playwright/test';

/**
 * Utility class for advanced waiting strategies
 */
export class WaitHelpers {
  
  /**
   * Wait for network to be idle
   */
  static async waitForNetworkIdle(
    page: Page, 
    timeout: number = 30000,
    idleTime: number = 500
  ): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout });
    await page.waitForTimeout(idleTime);
  }

  /**
   * Wait for DOM to be stable (no new elements added)
   */
  static async waitForDOMStable(
    page: Page, 
    timeout: number = 10000,
    checkInterval: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    let lastElementCount = 0;
    let stableCount = 0;
    const requiredStableChecks = 5;

    while (Date.now() - startTime < timeout) {
      const currentElementCount = await page.evaluate(() => document.querySelectorAll('*').length);
      
      if (currentElementCount === lastElementCount) {
        stableCount++;
        if (stableCount >= requiredStableChecks) {
          return;
        }
      } else {
        stableCount = 0;
        lastElementCount = currentElementCount;
      }
      
      await page.waitForTimeout(checkInterval);
    }
    
    throw new Error(`DOM did not stabilize within ${timeout}ms`);
  }

  /**
   * Wait for element count to be stable
   */
  static async waitForElementCountStable(
    locator: Locator, 
    timeout: number = 10000,
    checkInterval: number = 200
  ): Promise<number> {
    const startTime = Date.now();
    let lastCount = 0;
    let stableCount = 0;
    const requiredStableChecks = 3;

    while (Date.now() - startTime < timeout) {
      const currentCount = await locator.count();
      
      if (currentCount === lastCount && currentCount > 0) {
        stableCount++;
        if (stableCount >= requiredStableChecks) {
          return currentCount;
        }
      } else {
        stableCount = 0;
        lastCount = currentCount;
      }
      
      await locator.page().waitForTimeout(checkInterval);
    }
    
    return lastCount;
  }

  /**
   * Wait for text to appear in element
   */
  static async waitForTextToAppear(
    locator: Locator, 
    expectedText: string, 
    timeout: number = 10000
  ): Promise<void> {
    await locator.page().waitForFunction(
      ({ element, text }) => {
        const el = document.querySelector(element);
        return el && el.textContent && el.textContent.includes(text);
      },
      { element: locator.toString(), text: expectedText },
      { timeout }
    );
  }

  /**
   * Wait for element to have specific attribute value
   */
  static async waitForAttributeValue(
    locator: Locator, 
    attribute: string, 
    expectedValue: string, 
    timeout: number = 10000
  ): Promise<void> {
    await locator.page().waitForFunction(
      ({ selector, attr, value }) => {
        const element = document.querySelector(selector);
        return element && element.getAttribute(attr) === value;
      },
      { 
        selector: locator.toString(), 
        attr: attribute, 
        value: expectedValue 
      },
      { timeout }
    );
  }

  /**
   * Wait for element to be removed from DOM
   */
  static async waitForElementRemoval(
    locator: Locator, 
    timeout: number = 10000
  ): Promise<void> {
    await locator.waitFor({ state: 'detached', timeout });
  }

  /**
   * Wait with exponential backoff
   */
  static async waitWithBackoff(
    condition: () => Promise<boolean>,
    maxAttempts: number = 5,
    initialDelay: number = 1000,
    backoffFactor: number = 2
  ): Promise<void> {
    let delay = initialDelay;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (await condition()) {
        return;
      }
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoffFactor;
      }
    }
    
    throw new Error(`Condition not met after ${maxAttempts} attempts`);
  }

  /**
   * Wait for page to have specific title
   */
  static async waitForTitle(
    page: Page, 
    expectedTitle: string | RegExp, 
    timeout: number = 10000
  ): Promise<void> {
    await page.waitForFunction(
      (title) => {
        if (typeof title === 'string') {
          return document.title === title;
        } else {
          return new RegExp(title.source, title.flags).test(document.title);
        }
      },
      expectedTitle,
      { timeout }
    );
  }

  /**
   * Wait for URL to match pattern
   */
  static async waitForUrlPattern(
    page: Page, 
    pattern: string | RegExp, 
    timeout: number = 10000
  ): Promise<void> {
    await page.waitForFunction(
      (urlPattern) => {
        if (typeof urlPattern === 'string') {
          return window.location.href.includes(urlPattern);
        } else {
          return new RegExp(urlPattern.source, urlPattern.flags).test(window.location.href);
        }
      },
      pattern,
      { timeout }
    );
  }

  /**
   * Wait for element to be in viewport
   */
  static async waitForElementInViewport(
    locator: Locator, 
    timeout: number = 10000
  ): Promise<void> {
    await locator.page().waitForFunction(
      (selector) => {
        const element = document.querySelector(selector);
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth
        );
      },
      locator.toString(),
      { timeout }
    );
  }

  /**
   * Smart wait that combines multiple conditions
   */
  static async smartWait(
    page: Page,
    options: {
      networkIdle?: boolean;
      domStable?: boolean;
      customCondition?: () => Promise<boolean>;
      timeout?: number;
    }
  ): Promise<void> {
    const { networkIdle = true, domStable = false, customCondition, timeout = 15000 } = options;
    
    const promises: Promise<any>[] = [];
    
    if (networkIdle) {
      promises.push(this.waitForNetworkIdle(page, timeout));
    }
    
    if (domStable) {
      promises.push(this.waitForDOMStable(page, timeout));
    }
    
    if (customCondition) {
      promises.push(this.waitWithBackoff(customCondition, 5, 500));
    }
    
    await Promise.all(promises);
  }
}
