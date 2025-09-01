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
    failFast: false
  }
};

module.exports = config;
