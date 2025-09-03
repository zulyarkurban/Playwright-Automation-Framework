const config = {
  default: {
    paths: ['src/features/**/*.feature'],
    require: [
      'src/src/tests/support/world-azure.ts',
      'src/src/tests/support/hooks-azure.ts',
      'src/src/tests/step-definitions/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'json:reports/cucumber-azure-report.json',
      'html:reports/cucumber-azure-report.html'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    publishQuiet: true,
    dryRun: false,
    failFast: false,
    // Use higher parallelism with Azure cloud browsers
    parallel: parseInt(process.env.CUCUMBER_WORKERS) || 10,
    retry: parseInt(process.env.CUCUMBER_RETRY) || 2
  },
  azure: {
    paths: ['src/features/**/*.feature'],
    require: [
      'src/src/tests/support/world-azure.ts',
      'src/src/tests/support/hooks-azure.ts',
      'src/src/tests/step-definitions/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'json:reports/cucumber-azure-parallel.json',
      'html:reports/cucumber-azure-parallel.html'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    publishQuiet: true,
    dryRun: false,
    failFast: false,
    // Maximum parallelism with Azure cloud infrastructure
    parallel: parseInt(process.env.CUCUMBER_WORKERS) || 20,
    retry: parseInt(process.env.CUCUMBER_RETRY) || 3
  }
};

module.exports = config;
