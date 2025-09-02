import { Worker } from 'worker_threads';
import * as os from 'os';

/**
 * Utility class for managing parallel execution
 */
export class ParallelHelpers {
  
  /**
   * Get optimal number of workers based on system resources
   */
  static getOptimalWorkerCount(): number {
    const cpuCount = os.cpus().length;
    const totalMemoryGB = os.totalmem() / (1024 * 1024 * 1024);
    
    // Conservative approach: use 50% of CPU cores, but consider memory
    let workers = Math.max(1, Math.floor(cpuCount * 0.5));
    
    // Adjust based on memory (each worker needs ~500MB)
    const maxWorkersByMemory = Math.floor(totalMemoryGB / 0.5);
    workers = Math.min(workers, maxWorkersByMemory);
    
    // Cap at 8 workers for stability
    return Math.min(workers, 8);
  }

  /**
   * Get worker count from environment or calculate optimal
   */
  static getWorkerCount(): number {
    const envWorkers = process.env.CUCUMBER_WORKERS || process.env.PLAYWRIGHT_WORKERS;
    
    if (envWorkers) {
      const count = parseInt(envWorkers, 10);
      return isNaN(count) ? this.getOptimalWorkerCount() : Math.max(1, count);
    }
    
    return this.getOptimalWorkerCount();
  }

  /**
   * Check if running in CI environment
   */
  static isCI(): boolean {
    return !!(
      process.env.CI ||
      process.env.GITHUB_ACTIONS ||
      process.env.JENKINS_URL ||
      process.env.BUILDKITE ||
      process.env.CIRCLECI
    );
  }

  /**
   * Get CI-optimized worker count
   */
  static getCIWorkerCount(): number {
    // CI environments typically have limited resources
    const ciWorkers = process.env.CI_WORKERS;
    if (ciWorkers) {
      return Math.max(1, parseInt(ciWorkers, 10));
    }
    
    // Conservative default for CI
    return 2;
  }

  /**
   * Get recommended worker count based on environment
   */
  static getRecommendedWorkerCount(): number {
    if (this.isCI()) {
      return this.getCIWorkerCount();
    }
    
    return this.getWorkerCount();
  }

  /**
   * Split scenarios across workers
   */
  static splitScenariosAcrossWorkers<T>(scenarios: T[], workerCount: number): T[][] {
    const chunks: T[][] = Array.from({ length: workerCount }, () => []);
    
    scenarios.forEach((scenario, index) => {
      const workerIndex = index % workerCount;
      const chunk = chunks[workerIndex];
      if (chunk) {
        chunk.push(scenario);
      }
    });
    
    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Calculate estimated execution time reduction
   */
  static calculateTimeReduction(totalScenarios: number, workerCount: number): {
    estimatedReduction: number;
    parallelTime: number;
    sequentialTime: number;
  } {
    const avgScenarioTime = 30; // seconds per scenario (estimate)
    const sequentialTime = totalScenarios * avgScenarioTime;
    const parallelTime = Math.ceil(totalScenarios / workerCount) * avgScenarioTime;
    const estimatedReduction = ((sequentialTime - parallelTime) / sequentialTime) * 100;
    
    return {
      estimatedReduction: Math.round(estimatedReduction),
      parallelTime,
      sequentialTime
    };
  }

  /**
   * Get system resource information
   */
  static getSystemInfo(): {
    cpuCount: number;
    totalMemoryGB: number;
    freeMemoryGB: number;
    platform: string;
    recommendedWorkers: number;
  } {
    return {
      cpuCount: os.cpus().length,
      totalMemoryGB: Math.round(os.totalmem() / (1024 * 1024 * 1024) * 100) / 100,
      freeMemoryGB: Math.round(os.freemem() / (1024 * 1024 * 1024) * 100) / 100,
      platform: os.platform(),
      recommendedWorkers: this.getRecommendedWorkerCount()
    };
  }

  /**
   * Validate worker configuration
   */
  static validateWorkerConfig(workerCount: number): {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const systemInfo = this.getSystemInfo();
    
    let isValid = true;
    
    // Check if worker count exceeds CPU cores
    if (workerCount > systemInfo.cpuCount) {
      warnings.push(`Worker count (${workerCount}) exceeds CPU cores (${systemInfo.cpuCount})`);
      recommendations.push(`Consider reducing workers to ${systemInfo.cpuCount} or less`);
    }
    
    // Check memory requirements
    const estimatedMemoryUsage = workerCount * 0.5; // 500MB per worker
    if (estimatedMemoryUsage > systemInfo.freeMemoryGB) {
      warnings.push(`Estimated memory usage (${estimatedMemoryUsage}GB) exceeds free memory (${systemInfo.freeMemoryGB}GB)`);
      recommendations.push(`Consider reducing workers to ${Math.floor(systemInfo.freeMemoryGB / 0.5)}`);
      isValid = false;
    }
    
    // Check for very high worker counts
    if (workerCount > 8) {
      warnings.push(`Very high worker count (${workerCount}) may cause instability`);
      recommendations.push('Consider capping workers at 8 for stability');
    }
    
    // Check for single worker (no parallelization)
    if (workerCount === 1) {
      warnings.push('Running with single worker - no parallelization benefit');
      recommendations.push(`Consider using ${systemInfo.recommendedWorkers} workers for better performance`);
    }
    
    return {
      isValid,
      warnings,
      recommendations
    };
  }

  /**
   * Print parallel execution summary
   */
  static printExecutionSummary(workerCount: number, scenarioCount: number): void {
    const systemInfo = this.getSystemInfo();
    const timeEstimate = this.calculateTimeReduction(scenarioCount, workerCount);
    const validation = this.validateWorkerConfig(workerCount);
    
    console.log('\n🚀 PARALLEL EXECUTION SUMMARY');
    console.log('================================');
    console.log(`📊 System Info:`);
    console.log(`   CPU Cores: ${systemInfo.cpuCount}`);
    console.log(`   Total Memory: ${systemInfo.totalMemoryGB}GB`);
    console.log(`   Free Memory: ${systemInfo.freeMemoryGB}GB`);
    console.log(`   Platform: ${systemInfo.platform}`);
    console.log(`\n⚙️  Execution Config:`);
    console.log(`   Workers: ${workerCount}`);
    console.log(`   Scenarios: ${scenarioCount}`);
    console.log(`   Scenarios per worker: ~${Math.ceil(scenarioCount / workerCount)}`);
    console.log(`\n⏱️  Time Estimates:`);
    console.log(`   Sequential: ~${Math.floor(timeEstimate.sequentialTime / 60)}m ${timeEstimate.sequentialTime % 60}s`);
    console.log(`   Parallel: ~${Math.floor(timeEstimate.parallelTime / 60)}m ${timeEstimate.parallelTime % 60}s`);
    console.log(`   Estimated reduction: ${timeEstimate.estimatedReduction}%`);
    
    if (validation.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      validation.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    if (validation.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      validation.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
    
    console.log('================================\n');
  }
}
