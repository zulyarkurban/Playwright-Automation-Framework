import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface for user test data
 */
export interface UserData {
  username: string;
  description: string;
  expectedRepoCount: number;
  tags: string[];
}

/**
 * Interface for environment configuration
 */
export interface EnvironmentConfig {
  defaultUser: string;
  timeout: number;
}

/**
 * Interface for test data structure
 */
export interface TestData {
  testUsers: UserData[];
  environments: Record<string, EnvironmentConfig>;
}

/**
 * Utility class for managing test data
 */
export class DataHelpers {
  private static dataPath = path.join(__dirname, '../data');

  /**
   * Load user data from JSON file
   */
  static loadUsersFromJson(): TestData {
    const filePath = path.join(this.dataPath, 'users.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawData);
  }

  /**
   * Load user data from CSV file
   */
  static loadUsersFromCsv(): UserData[] {
    const filePath = path.join(this.dataPath, 'users.csv');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const lines = rawData.trim().split('\n');
    
    if (lines.length === 0) {
      return [];
    }
    
    const headers = lines[0]?.split(',') || [];
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        username: values[0] || '',
        description: values[1] || '',
        expectedRepoCount: parseInt(values[2] || '0') || 0,
        tags: values[3] ? values[3].split(';') : []
      };
    }).filter(user => user.username.length > 0);
  }

  /**
   * Get user data by username
   */
  static getUserByUsername(username: string): UserData | null {
    const testData = this.loadUsersFromJson();
    return testData.testUsers.find(user => user.username === username) || null;
  }

  /**
   * Get users by tag
   */
  static getUsersByTag(tag: string): UserData[] {
    const testData = this.loadUsersFromJson();
    return testData.testUsers.filter(user => user.tags.includes(tag));
  }

  /**
   * Get random user
   */
  static getRandomUser(): UserData {
    const testData = this.loadUsersFromJson();
    if (testData.testUsers.length === 0) {
      throw new Error('No test users available in data file');
    }
    const randomIndex = Math.floor(Math.random() * testData.testUsers.length);
    const user = testData.testUsers[randomIndex];
    if (!user) {
      throw new Error('Failed to get random user from test data');
    }
    return user;
  }

  /**
   * Get environment configuration
   */
  static getEnvironmentConfig(env: string = 'dev'): EnvironmentConfig {
    const testData = this.loadUsersFromJson();
    const config = testData.environments[env] || testData.environments['dev'];
    if (!config) {
      throw new Error(`Environment configuration not found for: ${env}`);
    }
    return config;
  }

  /**
   * Get default user for environment
   */
  static getDefaultUserForEnvironment(env: string = 'dev'): UserData {
    const config = this.getEnvironmentConfig(env);
    const userData = this.getUserByUsername(config.defaultUser);
    if (!userData) {
      throw new Error(`Default user ${config.defaultUser} not found for environment ${env}`);
    }
    return userData;
  }

  /**
   * Generate test data combinations
   */
  static generateTestCombinations(tags?: string[]): UserData[] {
    const testData = this.loadUsersFromJson();
    
    if (!tags || tags.length === 0) {
      return testData.testUsers;
    }
    
    return testData.testUsers.filter(user => 
      tags.some(tag => user.tags.includes(tag))
    );
  }

  /**
   * Get users for data-driven testing
   */
  static getUsersForDataDrivenTest(count?: number): UserData[] {
    const testData = this.loadUsersFromJson();
    
    if (count && count > 0) {
      return testData.testUsers.slice(0, count);
    }
    
    return testData.testUsers;
  }

  /**
   * Validate user data
   */
  static validateUserData(userData: UserData): boolean {
    return !!(
      userData.username &&
      userData.description &&
      typeof userData.expectedRepoCount === 'number' &&
      Array.isArray(userData.tags)
    );
  }

  /**
   * Get test data from environment variables
   */
  static getTestDataFromEnv(): UserData | null {
    const username = process.env.TEST_USERNAME;
    const description = process.env.TEST_DESCRIPTION || 'User from environment';
    const expectedRepoCount = process.env.TEST_EXPECTED_REPO_COUNT 
      ? parseInt(process.env.TEST_EXPECTED_REPO_COUNT) 
      : 10;
    const tags = process.env.TEST_TAGS 
      ? process.env.TEST_TAGS.split(',') 
      : ['environment'];

    if (!username) {
      return null;
    }

    return {
      username,
      description,
      expectedRepoCount,
      tags
    };
  }

  /**
   * Create dynamic test data
   */
  static createDynamicTestData(
    username: string,
    options?: {
      description?: string;
      expectedRepoCount?: number;
      tags?: string[];
    }
  ): UserData {
    return {
      username,
      description: options?.description || `Dynamic test user: ${username}`,
      expectedRepoCount: options?.expectedRepoCount || 10,
      tags: options?.tags || ['dynamic']
    };
  }
}
