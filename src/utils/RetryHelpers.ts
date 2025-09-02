import * as fs from 'fs';
import * as path from 'path';
import { environmentConfig } from '../config/EnvironmentConfig';

export interface FailedTest {
  scenarioName: string;
  featureFile: string;
  line: number;
  error: string;
  timestamp: string;
  attempt: number;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryOnlyFailures: boolean;
  retryTimeoutMultiplier: number;
  failFast: boolean;
}

/**
 * Utility class for managing test retries and failed test re-execution
 */
export class RetryHelpers {
  private static readonly FAILED_TESTS_FILE = 'test-results/failed-tests.json';
  private static readonly RETRY_REPORT_FILE = 'reports/retry-report.json';

  /**
   * Get retry configuration from environment
   */
  static getRetryConfig(): RetryConfig {
    const config = environmentConfig.getConfig();
    return {
      maxRetries: config.test.retries || 2,
      retryDelay: config.test.retryDelay || 1000,
      retryOnlyFailures: config.test.retryOnlyFailures || true,
      retryTimeoutMultiplier: config.test.retryTimeoutMultiplier || 1.5,
      failFast: config.test.failFast || false
    };
  }

  /**
   * Save failed test information
   */
  static saveFailedTest(failedTest: FailedTest): void {
    try {
      const existingFailed = this.getFailedTests();
      existingFailed.push(failedTest);
      
      // Ensure directory exists
      const dir = path.dirname(this.FAILED_TESTS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.FAILED_TESTS_FILE, JSON.stringify(existingFailed, null, 2));
      console.log(`💾 Saved failed test: ${failedTest.scenarioName}`);
    } catch (error) {
      console.error('Failed to save failed test information:', error);
    }
  }

  /**
   * Get list of failed tests
   */
  static getFailedTests(): FailedTest[] {
    try {
      if (fs.existsSync(this.FAILED_TESTS_FILE)) {
        const content = fs.readFileSync(this.FAILED_TESTS_FILE, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn('Could not read failed tests file:', error);
    }
    return [];
  }

  /**
   * Clear failed tests list
   */
  static clearFailedTests(): void {
    try {
      if (fs.existsSync(this.FAILED_TESTS_FILE)) {
        fs.unlinkSync(this.FAILED_TESTS_FILE);
        console.log('🧹 Cleared failed tests list');
      }
    } catch (error) {
      console.error('Failed to clear failed tests:', error);
    }
  }

  /**
   * Generate Cucumber command to re-run failed tests
   */
  static generateRetryCommand(): string | null {
    const failedTests = this.getFailedTests();
    
    if (failedTests.length === 0) {
      console.log('✅ No failed tests to retry');
      return null;
    }

    // Group by feature file
    const featureFiles = [...new Set(failedTests.map(test => test.featureFile))];
    
    // Generate cucumber command with specific scenarios
    const scenarios = failedTests.map(test => `"${test.scenarioName}"`).join(' ');
    const features = featureFiles.join(' ');
    
    return `cucumber-js ${features} --name "${scenarios.replace(/"/g, '')}"`;
  }

  /**
   * Execute retry for failed tests
   */
  static async executeRetry(): Promise<boolean> {
    const retryCommand = this.generateRetryCommand();
    
    if (!retryCommand) {
      return true; // No failed tests to retry
    }

    const retryConfig = this.getRetryConfig();
    console.log(`🔄 Retrying ${this.getFailedTests().length} failed tests...`);
    
    try {
      // Execute retry command
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const result = await execAsync(retryCommand, {
        cwd: process.cwd(),
        timeout: 300000 // 5 minutes timeout
      });
      
      console.log('✅ Retry execution completed');
      return result.stderr === '';
    } catch (error) {
      console.error('❌ Retry execution failed:', error);
      return false;
    }
  }

  /**
   * Parse Cucumber JSON report to identify failed tests
   */
  static parseFailedTestsFromReport(reportPath: string): FailedTest[] {
    try {
      if (!fs.existsSync(reportPath)) {
        console.warn(`Report file not found: ${reportPath}`);
        return [];
      }

      const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      const failedTests: FailedTest[] = [];

      reportData.forEach((feature: any) => {
        feature.elements?.forEach((scenario: any) => {
          const hasFailedSteps = scenario.steps?.some((step: any) => 
            step.result?.status === 'failed'
          );

          if (hasFailedSteps) {
            const failedStep = scenario.steps.find((step: any) => 
              step.result?.status === 'failed'
            );

            failedTests.push({
              scenarioName: scenario.name,
              featureFile: feature.uri || feature.name,
              line: scenario.line || 0,
              error: failedStep?.result?.error_message || 'Unknown error',
              timestamp: new Date().toISOString(),
              attempt: 1
            });
          }
        });
      });

      return failedTests;
    } catch (error) {
      console.error('Failed to parse report for failed tests:', error);
      return [];
    }
  }

  /**
   * Generate retry report
   */
  static generateRetryReport(originalFailed: FailedTest[], retryResults: FailedTest[]): void {
    const retryReport = {
      timestamp: new Date().toISOString(),
      originalFailures: originalFailed.length,
      retriedTests: originalFailed.length,
      stillFailing: retryResults.length,
      recovered: originalFailed.length - retryResults.length,
      successRate: ((originalFailed.length - retryResults.length) / originalFailed.length * 100).toFixed(2),
      details: {
        originalFailed,
        retryResults,
        recovered: originalFailed.filter(original => 
          !retryResults.some(retry => retry.scenarioName === original.scenarioName)
        )
      }
    };

    // Ensure directory exists
    const dir = path.dirname(this.RETRY_REPORT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.RETRY_REPORT_FILE, JSON.stringify(retryReport, null, 2));
    
    console.log('\n📊 RETRY EXECUTION SUMMARY');
    console.log('================================');
    console.log(`Original Failures: ${retryReport.originalFailures}`);
    console.log(`Tests Recovered: ${retryReport.recovered}`);
    console.log(`Still Failing: ${retryReport.stillFailing}`);
    console.log(`Success Rate: ${retryReport.successRate}%`);
    console.log('================================\n');
  }

  /**
   * Smart retry with exponential backoff
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Retry attempt ${attempt}/${maxRetries} in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Sleep utility for retry delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if test should be retried based on error type
   */
  static shouldRetryTest(error: string): boolean {
    const retryableErrors = [
      'timeout',
      'network',
      'connection',
      'element not found',
      'page crash',
      'browser disconnect'
    ];

    return retryableErrors.some(retryableError => 
      error.toLowerCase().includes(retryableError)
    );
  }

  /**
   * Get retry statistics from previous runs
   */
  static getRetryStatistics(): {
    totalRetries: number;
    successfulRetries: number;
    permanentFailures: number;
    retrySuccessRate: number;
  } {
    try {
      if (fs.existsSync(this.RETRY_REPORT_FILE)) {
        const retryData = JSON.parse(fs.readFileSync(this.RETRY_REPORT_FILE, 'utf8'));
        return {
          totalRetries: retryData.retriedTests || 0,
          successfulRetries: retryData.recovered || 0,
          permanentFailures: retryData.stillFailing || 0,
          retrySuccessRate: parseFloat(retryData.successRate) || 0
        };
      }
    } catch (error) {
      console.warn('Could not read retry statistics:', error);
    }

    return {
      totalRetries: 0,
      successfulRetries: 0,
      permanentFailures: 0,
      retrySuccessRate: 0
    };
  }
}
