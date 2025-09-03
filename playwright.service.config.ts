import { defineConfig, devices } from '@playwright/test';
import { environmentConfig } from './src/config/EnvironmentConfig';

/**
 * Microsoft Playwright Testing service configuration
 * This config enables running tests on Azure cloud browsers with 20+ parallel workers
 */
export default defineConfig({
  // Test directory - you may need to create Playwright-native tests
  testDir: './src/tests/playwright',
  
  // Global test timeout
  timeout: 30000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 5000,
  },
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : 20,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'reports/playwright-report' }],
    ['json', { outputFile: 'reports/playwright-results.json' }],
    ['junit', { outputFile: 'reports/playwright-junit.xml' }]
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL from environment config
    baseURL: environmentConfig.getConfig().application.baseUrl,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Microsoft Playwright Testing service URL with authentication
    connectOptions: process.env.PLAYWRIGHT_SERVICE_URL ? {
      wsEndpoint: process.env.PLAYWRIGHT_SERVICE_URL,
      ...(process.env.PLAYWRIGHT_SERVICE_ACCESS_TOKEN && {
        headers: {
          'Authorization': `Bearer ${process.env.PLAYWRIGHT_SERVICE_ACCESS_TOKEN}`
        }
      })
    } : undefined,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use cloud browsers
        connectOptions: process.env.PLAYWRIGHT_SERVICE_URL ? {
          wsEndpoint: process.env.PLAYWRIGHT_SERVICE_URL,
        } : undefined,
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        connectOptions: process.env.PLAYWRIGHT_SERVICE_URL ? {
          wsEndpoint: process.env.PLAYWRIGHT_SERVICE_URL,
        } : undefined,
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        connectOptions: process.env.PLAYWRIGHT_SERVICE_URL ? {
          wsEndpoint: process.env.PLAYWRIGHT_SERVICE_URL,
        } : undefined,
      },
    },
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        connectOptions: process.env.PLAYWRIGHT_SERVICE_URL ? {
          wsEndpoint: process.env.PLAYWRIGHT_SERVICE_URL,
        } : undefined,
      },
    },
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        connectOptions: process.env.PLAYWRIGHT_SERVICE_URL ? {
          wsEndpoint: process.env.PLAYWRIGHT_SERVICE_URL,
        } : undefined,
      },
    },
  ],

  // No web server needed for GitHub testing
  // webServer: {
  //   command: 'npm run start',
  //   port: 3000,
  //   reuseExistingServer: !process.env.CI,
  // },
});
