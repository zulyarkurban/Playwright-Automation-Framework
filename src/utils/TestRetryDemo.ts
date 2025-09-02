import { RetryHelpers, FailedTest } from './RetryHelpers';
import { environmentConfig } from '../config/EnvironmentConfig';

/**
 * Demo utility to simulate failed tests and demonstrate retry functionality
 */
class TestRetryDemo {
  
  /**
   * Create a mock failed test for demonstration
   */
  static createMockFailedTest(): FailedTest {
    return {
      scenarioName: "Search for user with network timeout",
      featureFile: "src/features/github-user-search.feature",
      line: 15,
      error: "TimeoutError: Timeout 30000ms exceeded while waiting for element to be visible",
      timestamp: new Date().toISOString(),
      attempt: 1
    };
  }

  /**
   * Demonstrate retry functionality
   */
  static async demonstrateRetrySystem(): Promise<void> {
    console.log('\n🎭 RETRY SYSTEM DEMONSTRATION');
    console.log('================================');

    // 1. Show current environment retry configuration
    const config = environmentConfig.getConfig();
    console.log(`Environment: ${config.environment.name}`);
    console.log(`Max Retries: ${config.test.retries}`);
    console.log(`Retry Delay: ${config.test.retryDelay || 'default'}ms`);
    console.log(`Fail Fast: ${config.test.failFast || false}`);

    // 2. Simulate a failed test
    console.log('\n📝 Simulating failed test...');
    const mockFailedTest = this.createMockFailedTest();
    RetryHelpers.saveFailedTest(mockFailedTest);

    // 3. Show failed tests
    const failedTests = RetryHelpers.getFailedTests();
    console.log(`\n❌ Failed tests detected: ${failedTests.length}`);
    failedTests.forEach(test => {
      console.log(`   - ${test.scenarioName} (${test.error.substring(0, 50)}...)`);
    });

    // 4. Generate retry command
    const retryCommand = RetryHelpers.generateRetryCommand();
    console.log(`\n🔄 Generated retry command:`);
    console.log(`   ${retryCommand}`);

    // 5. Demonstrate retry with backoff
    console.log('\n⏳ Demonstrating exponential backoff retry...');
    let attempt = 0;
    try {
      await RetryHelpers.retryWithBackoff(async () => {
        attempt++;
        console.log(`   Attempt ${attempt}: Simulating operation...`);
        
        // Simulate success on 3rd attempt
        if (attempt < 3) {
          throw new Error('Simulated network timeout');
        }
        
        console.log('   ✅ Operation succeeded!');
        return 'success';
      }, 3, 1000);
    } catch (error) {
      console.log(`   ❌ All retry attempts failed: ${error}`);
    }

    // 6. Show retry statistics
    console.log('\n📊 Current retry statistics:');
    const stats = RetryHelpers.getRetryStatistics();
    console.log(`   Total Retries: ${stats.totalRetries}`);
    console.log(`   Successful Retries: ${stats.successfulRetries}`);
    console.log(`   Permanent Failures: ${stats.permanentFailures}`);
    console.log(`   Success Rate: ${stats.retrySuccessRate}%`);

    // 7. Clean up demo data
    console.log('\n🧹 Cleaning up demo data...');
    RetryHelpers.clearFailedTests();
    
    console.log('\n✅ Retry system demonstration completed!');
    console.log('================================\n');
  }

  /**
   * Test different error types for retry eligibility
   */
  static testRetryEligibility(): void {
    console.log('\n🔍 RETRY ELIGIBILITY TEST');
    console.log('================================');

    const testErrors = [
      'TimeoutError: Timeout 30000ms exceeded',
      'NetworkError: Failed to fetch',
      'Error: Connection refused',
      'Error: Element not found',
      'Error: Page crashed',
      'Error: Browser disconnected',
      'AssertionError: Expected "Hello" but got "Hi"',
      'SyntaxError: Unexpected token'
    ];

    testErrors.forEach(error => {
      const shouldRetry = RetryHelpers.shouldRetryTest(error);
      const status = shouldRetry ? '✅ RETRY' : '❌ NO RETRY';
      console.log(`${status}: ${error}`);
    });

    console.log('================================\n');
  }
}

// Main execution for demo
if (require.main === module) {
  TestRetryDemo.demonstrateRetrySystem().catch(console.error);
}

// Export for use in other modules
export { TestRetryDemo };
