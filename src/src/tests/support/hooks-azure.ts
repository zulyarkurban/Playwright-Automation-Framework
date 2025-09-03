import { Before, After, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { CustomWorld } from './world-azure';

// Increase timeout for Azure cloud browser connections
setDefaultTimeout(60000); // 60 seconds

BeforeAll(async function () {
  console.log('Starting Cucumber tests with Microsoft Playwright Testing service');
});

Before({ timeout: 60000 }, async function (this: CustomWorld) {
  console.log('Initializing Azure cloud browser...');
  await this.init();
  console.log('Azure cloud browser initialized successfully');
});

After(async function (this: CustomWorld) {
  await this.cleanup();
});

AfterAll(async function () {
  console.log('Cucumber tests completed');
});
