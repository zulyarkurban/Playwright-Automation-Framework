import * as fs from 'fs';
import * as path from 'path';

export interface EnvironmentConfig {
  environment: {
    name: string;
    description: string;
  };
  application: {
    baseUrl: string;
    searchUrl: string;
    apiUrl: string;
  };
  browser: {
    headless: boolean;
    slowMo: number;
    timeout: number;
    viewport: {
      width: number;
      height: number;
    };
  };
  test: {
    timeout: number;
    retries: number;
    workers: number;
    reporter: string;
  };
  logging: {
    level: string;
    enableScreenshots: boolean;
    enableVideo: boolean;
    enableTrace?: boolean;
  };
  users: {
    defaultUser: string;
    testUsers: string[];
  };
}

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig | null = null;
  private currentEnvironment: string = 'dev';

  private constructor() {}

  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  /**
   * Load configuration for specified environment
   */
  loadEnvironment(environment?: string): EnvironmentConfig {
    const env = environment || process.env.TEST_ENV || process.env.NODE_ENV || 'dev';
    this.currentEnvironment = env;

    try {
      // Load base configuration
      const basePath = path.join(__dirname, 'environments', 'base.json');
      const baseConfig = this.loadConfigFile(basePath);

      // Load environment-specific configuration
      const envPath = path.join(__dirname, 'environments', `${env}.json`);
      const envConfig = this.loadConfigFile(envPath);

      // Merge configurations (environment overrides base)
      this.config = this.mergeConfigs(baseConfig, envConfig);

      console.log(`🌍 Loaded environment: ${this.config.environment.name} (${env})`);
      return this.config;
    } catch (error) {
      console.error(`❌ Failed to load environment config for '${env}':`, error);
      throw new Error(`Environment configuration not found for: ${env}`);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): EnvironmentConfig {
    if (!this.config) {
      return this.loadEnvironment();
    }
    return this.config;
  }

  /**
   * Get application base URL
   */
  getBaseUrl(): string {
    return this.getConfig().application.baseUrl;
  }

  /**
   * Get search URL
   */
  getSearchUrl(): string {
    return this.getConfig().application.searchUrl;
  }

  /**
   * Get API URL
   */
  getApiUrl(): string {
    return this.getConfig().application.apiUrl;
  }

  /**
   * Get default test user
   */
  getDefaultUser(): string {
    return this.getConfig().users.defaultUser;
  }

  /**
   * Get test users list
   */
  getTestUsers(): string[] {
    return this.getConfig().users.testUsers;
  }

  /**
   * Get browser configuration
   */
  getBrowserConfig() {
    return this.getConfig().browser;
  }

  /**
   * Get test configuration
   */
  getTestConfig() {
    return this.getConfig().test;
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig() {
    return this.getConfig().logging;
  }

  /**
   * Get current environment name
   */
  getCurrentEnvironment(): string {
    return this.currentEnvironment;
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return this.getCurrentEnvironment() === 'dev';
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return this.getCurrentEnvironment() === 'prod';
  }

  /**
   * Get available environments
   */
  getAvailableEnvironments(): string[] {
    const envDir = path.join(__dirname, 'environments');
    try {
      return fs.readdirSync(envDir)
        .filter(file => file.endsWith('.json') && file !== 'base.json')
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.warn('Could not read environments directory:', error);
      return ['dev', 'staging', 'prod'];
    }
  }

  /**
   * Print current configuration summary
   */
  printConfigSummary(): void {
    const config = this.getConfig();
    console.log('\n🔧 ENVIRONMENT CONFIGURATION');
    console.log('================================');
    console.log(`Environment: ${config.environment.name}`);
    console.log(`Description: ${config.environment.description}`);
    console.log(`Base URL: ${config.application.baseUrl}`);
    console.log(`Search URL: ${config.application.searchUrl}`);
    console.log(`Browser Headless: ${config.browser.headless}`);
    console.log(`Test Workers: ${config.test.workers}`);
    console.log(`Default User: ${config.users.defaultUser}`);
    console.log(`Logging Level: ${config.logging.level}`);
    console.log('================================\n');
  }

  private loadConfigFile(filePath: string): any {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Configuration file not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }

  private mergeConfigs(base: any, override: any): EnvironmentConfig {
    const merged = { ...base };
    
    for (const key in override) {
      if (override.hasOwnProperty(key)) {
        if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
          merged[key] = { ...merged[key], ...override[key] };
        } else {
          merged[key] = override[key];
        }
      }
    }
    
    return merged as EnvironmentConfig;
  }
}

// Export singleton instance
export const environmentConfig = EnvironmentManager.getInstance();
