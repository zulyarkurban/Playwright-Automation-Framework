#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Environment configuration loader for npm scripts
 * Usage: node src/config/environment-loader.js [environment]
 */

function loadEnvironmentConfig(env = 'dev') {
  const configPath = path.join(__dirname, 'environments', `${env}.json`);
  
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Environment configuration not found: ${env}`);
    console.log('Available environments:', getAvailableEnvironments());
    process.exit(1);
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Set environment variables based on config
  process.env.TEST_ENV = env;
  process.env.BASE_URL = config.application.baseUrl;
  process.env.SEARCH_URL = config.application.searchUrl;
  process.env.API_URL = config.application.apiUrl;
  process.env.HEADLESS = config.browser.headless.toString();
  process.env.CUCUMBER_WORKERS = config.test.workers.toString();
  process.env.TEST_TIMEOUT = config.test.timeout.toString();
  process.env.RETRIES = config.test.retries.toString();
  process.env.LOG_LEVEL = config.logging.level;
  
  console.log(`🌍 Loaded environment: ${config.environment.name} (${env})`);
  console.log(`📍 Base URL: ${config.application.baseUrl}`);
  console.log(`⚙️  Workers: ${config.test.workers}`);
  console.log(`🎯 Default User: ${config.users.defaultUser}`);
  
  return config;
}

function getAvailableEnvironments() {
  const envDir = path.join(__dirname, 'environments');
  try {
    return fs.readdirSync(envDir)
      .filter(file => file.endsWith('.json') && file !== 'base.json')
      .map(file => file.replace('.json', ''));
  } catch (error) {
    return ['dev', 'staging', 'prod'];
  }
}

function printUsage() {
  console.log('\n🔧 Environment Configuration Loader');
  console.log('Usage: node src/config/environment-loader.js [environment]');
  console.log('\nAvailable environments:');
  getAvailableEnvironments().forEach(env => console.log(`  - ${env}`));
  console.log('\nExample: node src/config/environment-loader.js staging\n');
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }
  
  const environment = args[0] || process.env.TEST_ENV || 'dev';
  loadEnvironmentConfig(environment);
}

module.exports = { loadEnvironmentConfig, getAvailableEnvironments };
