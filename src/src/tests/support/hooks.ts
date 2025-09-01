import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { CustomWorld } from './world';

BeforeAll(async function () {
  console.log('Starting Cucumber tests with Playwright');
});

Before(async function (this: CustomWorld) {
  await this.init();
});

After(async function (this: CustomWorld) {
  await this.destroy();
});

AfterAll(async function () {
  console.log('Cucumber tests completed');
});
