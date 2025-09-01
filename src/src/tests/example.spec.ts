import { test, expect,webkit, type Page} from '@playwright/test';
import { _electron } from 'playwright';

test.beforeAll('Setup', async () => {
  console.log('Before tests');
});
test('has title',{
  tag: '@smoke',
}, async ({ page }) => {
  
  await webkit.launch({ headless: false }); //can be true or false
  await page.goto('https://playwright.dev/');
  
  // await page.screenshot({ path: 'screenshot.png' });
  // await page.emulateMedia({ media: 'screen' });
  // await page.pdf({ path: 'page.pdf' });

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});

test.afterEach(async ({ page }) => {
  console.log(`Finished ${test.info().title} with status ${test.info().status}`);

  if (test.info().status !== test.info().expectedStatus)
    console.log(`Did not run as expected, ended up at ${page.url()}`);
});

test('basic test', async ({ page }, testInfo) => {
  await page.goto('https://playwright.dev');
  const screenshot = await page.screenshot();
  // await page.screenshot({ path: 'screenshot.png' });
  await testInfo.attach('screenshot', { body: screenshot, contentType: '/test-results/image/png' });
});

test.afterAll(async () => {
  console.log('After tests');
});