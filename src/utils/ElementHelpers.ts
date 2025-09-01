import { Page, Locator } from '@playwright/test';

/**
 * Utility class for common element operations
 */
export class ElementHelpers {
  
  /**
   * Try multiple selectors until one is found
   */
  static async findElementByMultipleSelectors(
    page: Page, 
    selectors: string[], 
    timeout: number = 5000
  ): Promise<Locator | null> {
    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        await element.waitFor({ state: 'visible', timeout });
        return element;
      } catch {
        continue;
      }
    }
    return null;
  }

  /**
   * Wait for any of multiple elements to be visible
   */
  static async waitForAnyElement(
    page: Page, 
    selectors: string[], 
    timeout: number = 10000
  ): Promise<Locator> {
    const promises = selectors.map(selector => 
      page.locator(selector).first().waitFor({ state: 'visible', timeout })
        .then(() => page.locator(selector).first())
    );

    try {
      return await Promise.race(promises);
    } catch {
      throw new Error(`None of the elements were found: ${selectors.join(', ')}`);
    }
  }

  /**
   * Get element text with fallback options
   */
  static async getTextWithFallback(
    locator: Locator, 
    fallbackSelectors: string[] = []
  ): Promise<string> {
    try {
      const text = await locator.textContent();
      if (text && text.trim()) {
        return text.trim();
      }
    } catch {
      // Try fallback selectors
      for (const selector of fallbackSelectors) {
        try {
          const fallbackElement = locator.page().locator(selector).first();
          const text = await fallbackElement.textContent();
          if (text && text.trim()) {
            return text.trim();
          }
        } catch {
          continue;
        }
      }
    }
    return '';
  }

  /**
   * Smart click with multiple strategies
   */
  static async smartClick(
    locator: Locator, 
    options?: { 
      timeout?: number; 
      force?: boolean; 
      useJavaScript?: boolean;
      retries?: number;
    }
  ): Promise<void> {
    const { timeout = 10000, force = false, useJavaScript = false, retries = 3 } = options || {};
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await locator.waitFor({ state: 'visible', timeout });
        
        if (useJavaScript) {
          await locator.evaluate(el => (el as HTMLElement).click());
        } else {
          await locator.click({ force, timeout });
        }
        return;
      } catch (error) {
        if (attempt === retries) {
          throw new Error(`Failed to click element after ${retries} attempts: ${error}`);
        }
        await locator.page().waitForTimeout(1000);
      }
    }
  }

  /**
   * Smart fill input with clear and validation
   */
  static async smartFill(
    locator: Locator, 
    text: string, 
    options?: { 
      clear?: boolean; 
      validate?: boolean; 
      timeout?: number;
    }
  ): Promise<void> {
    const { clear = true, validate = true, timeout = 10000 } = options || {};
    
    await locator.waitFor({ state: 'visible', timeout });
    
    if (clear) {
      await locator.clear();
    }
    
    await locator.fill(text);
    
    if (validate) {
      const inputValue = await locator.inputValue();
      if (inputValue !== text) {
        throw new Error(`Input validation failed. Expected: "${text}", Actual: "${inputValue}"`);
      }
    }
  }

  /**
   * Scroll element into view with options
   */
  static async scrollIntoView(
    locator: Locator, 
    options?: { 
      behavior?: 'auto' | 'smooth'; 
      block?: 'start' | 'center' | 'end' | 'nearest';
    }
  ): Promise<void> {
    const { behavior = 'auto', block = 'center' } = options || {};
    
    await locator.evaluate((el, scrollOptions) => {
      el.scrollIntoView({
        behavior: scrollOptions.behavior,
        block: scrollOptions.block
      });
    }, { behavior, block });
  }

  /**
   * Wait for element to contain specific text
   */
  static async waitForTextContent(
    locator: Locator, 
    expectedText: string, 
    timeout: number = 10000
  ): Promise<void> {
    await locator.page().waitForFunction(
      ({ selector, text }) => {
        const element = document.querySelector(selector);
        return element && element.textContent && element.textContent.includes(text);
      },
      { selector: await locator.getAttribute('data-testid') || '', text: expectedText },
      { timeout }
    );
  }

  /**
   * Get element attribute with fallback
   */
  static async getAttributeWithFallback(
    locator: Locator, 
    attribute: string, 
    fallbackValue: string = ''
  ): Promise<string> {
    try {
      const value = await locator.getAttribute(attribute);
      return value || fallbackValue;
    } catch {
      return fallbackValue;
    }
  }

  /**
   * Check if element has specific class
   */
  static async hasClass(locator: Locator, className: string): Promise<boolean> {
    try {
      const classAttribute = await locator.getAttribute('class');
      return classAttribute ? classAttribute.split(' ').includes(className) : false;
    } catch {
      return false;
    }
  }

  /**
   * Wait for element to be clickable
   */
  static async waitForClickable(
    locator: Locator, 
    timeout: number = 10000
  ): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
    await locator.waitFor({ state: 'attached', timeout });
    
    // Check if element is not disabled
    await locator.page().waitForFunction(
      (selector) => {
        const element = document.querySelector(selector) as HTMLElement;
        return element && !element.hasAttribute('disabled') && 
               getComputedStyle(element).pointerEvents !== 'none';
      },
      await this.getElementSelector(locator),
      { timeout }
    );
  }

  /**
   * Get element selector (helper method)
   */
  private static async getElementSelector(locator: Locator): Promise<string> {
    // This is a simplified approach - in practice, you might need more sophisticated selector extraction
    try {
      const testId = await locator.getAttribute('data-testid');
      if (testId) return `[data-testid="${testId}"]`;
      
      const id = await locator.getAttribute('id');
      if (id) return `#${id}`;
      
      const className = await locator.getAttribute('class');
      if (className) return `.${className.split(' ')[0]}`;
      
      return locator.toString();
    } catch {
      return locator.toString();
    }
  }
}
