const config = {
  default: {
    paths: ['src/features/**/*.feature'],
    require: [
      'src/src/tests/support/**/*.ts',
      'src/src/tests/step-definitions/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    publishQuiet: true,
    dryRun: false,
    failFast: false,
    // Parallel execution configuration
    parallel: parseInt(process.env.CUCUMBER_WORKERS) || 2,
    retry: parseInt(process.env.CUCUMBER_RETRY) || 1
  },
  parallel: {
    paths: ['src/features/**/*.feature'],
    require: [
      'src/src/tests/support/**/*.ts',
      'src/src/tests/step-definitions/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'json:reports/cucumber-report-parallel.json',
      'html:reports/cucumber-report-parallel.html'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    publishQuiet: true,
    dryRun: false,
    failFast: false,
    parallel: parseInt(process.env.CUCUMBER_WORKERS) || 4,
    retry: parseInt(process.env.CUCUMBER_RETRY) || 2
  }
};

module.exports = config;
