/**
 * EvalReporter - Vitest custom reporter that collects test results and generates HTML report
 */

import type { Reporter, Vitest } from 'vitest';
import type { TestCase, TestSuite } from 'vitest/node';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { RecordedEvent } from '../recording/types';
import type { TestMetadata } from '../conversation-testing';

/**
 * Collected result for a single test
 */
interface TestResult {
  name: string;
  fullName: string;
  hierarchy: string[];
  passed: boolean;
  duration: number;
  events: RecordedEvent[];
  summary?: {
    totalEvents: number;
    totalAssertions: number;
    passedAssertions: number;
    failedAssertions: number;
    duration: number;
  };
  error?: string;
}

/**
 * Results for an entire test file
 */
interface TestFileResults {
  filepath: string;
  tests: TestResult[];
}

/**
 * Complete test suite results
 */
interface TestSuiteResults {
  files: TestFileResults[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    totalAssertions: number;
    passedAssertions: number;
    failedAssertions: number;
  };
}

export default class EvalReporter implements Reporter {
  private allResults: Map<string, TestFileResults> = new Map();

  onInit(_ctx: Vitest) {
    // Store context for future use if needed
  }

  onTestCaseResult(test: TestCase) {
    // Extract metadata from test.task.meta (not test.meta which is a function)
    const metadata = (test as any).task?.meta as TestMetadata | undefined;

    if (!metadata || !metadata.events) {
      // Not a conversation test or no events recorded
      return;
    }

    // Get diagnostic info (includes duration)
    const diagnostic = test.diagnostic();
    const duration = diagnostic?.duration || 0;

    // Build test hierarchy
    const hierarchy = this.getTestHierarchy(test);

    // Get or create file results
    const filepath = test.module?.moduleId || 'unknown';
    const fileResults: TestFileResults = this.allResults.get(filepath) || {
      filepath,
      tests: []
    };

    // Add test result
    fileResults.tests.push({
      name: test.name,
      fullName: hierarchy.join(' > '),
      hierarchy,
      passed: metadata.passed,
      duration,
      events: metadata.events,
      summary: metadata.summary,
      error: metadata.error,
    });

    this.allResults.set(filepath, fileResults);
  }

  async onFinished() {
    // Generate HTML report
    try {
      // Collect all results
      const files = Array.from(this.allResults.values());

      // Calculate summary
      const summary = this.calculateSummary(files);

      const suiteResults: TestSuiteResults = {
        files,
        summary,
      };

      // Generate HTML
      const html = await this.generateHtml(suiteResults);

      // Write to file
      const outputPath = path.join(process.cwd(), 'eval-report.html');
      await fs.writeFile(outputPath, html);

      console.log(`\n✓ HTML report generated: ${outputPath}\n`);
    } catch (error) {
      console.error('\n✗ Failed to generate HTML report:', error);
    }
  }

  /**
   * Extract test hierarchy from test case
   */
  private getTestHierarchy(test: TestCase): string[] {
    const names: string[] = [];
    let current: TestSuite | undefined = test.parent.type === 'suite' ? test.parent : undefined;

    while (current) {
      if (current.name) {
        names.unshift(current.name);
      }
      current = current.parent.type === 'suite' ? current.parent : undefined;
    }

    names.push(test.name);
    return names;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(files: TestFileResults[]) {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let totalAssertions = 0;
    let passedAssertions = 0;
    let failedAssertions = 0;

    for (const file of files) {
      for (const test of file.tests) {
        totalTests++;
        if (test.passed) {
          passedTests++;
        } else {
          failedTests++;
        }

        if (test.summary) {
          totalAssertions += test.summary.totalAssertions;
          passedAssertions += test.summary.passedAssertions;
          failedAssertions += test.summary.failedAssertions;
        }
      }
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      totalAssertions,
      passedAssertions,
      failedAssertions,
    };
  }

  /**
   * Generate HTML report (placeholder for now)
   */
  private async generateHtml(results: TestSuiteResults): Promise<string> {
    // For now, generate a simple HTML report
    // This will be replaced with HtmlReportGenerator later
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Agent Evaluation Report</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .test { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
    .test.pass { border-left: 4px solid #4caf50; }
    .test.fail { border-left: 4px solid #f44336; }
    .status { font-weight: bold; }
    .status.pass { color: #4caf50; }
    .status.fail { color: #f44336; }
    .events { background: #fafafa; padding: 10px; margin-top: 10px; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Agent Evaluation Report</h1>

  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Tests:</strong> ${results.summary.totalTests} total, ${results.summary.passedTests} passed, ${results.summary.failedTests} failed</p>
    <p><strong>Assertions:</strong> ${results.summary.totalAssertions} total, ${results.summary.passedAssertions} passed, ${results.summary.failedAssertions} failed</p>
  </div>

  ${results.files.map(file => `
    <h2>${path.basename(file.filepath)}</h2>
    ${file.tests.map(test => `
      <div class="test ${test.passed ? 'pass' : 'fail'}">
        <h3>${test.fullName} <span class="status ${test.passed ? 'pass' : 'fail'}">${test.passed ? '✓' : '✗'}</span></h3>
        <p><strong>Duration:</strong> ${test.duration}ms</p>
        ${test.summary ? `
          <p><strong>Assertions:</strong> ${test.summary.passedAssertions}/${test.summary.totalAssertions} passed</p>
        ` : ''}
        ${test.error ? `<p><strong>Error:</strong> ${test.error}</p>` : ''}
        <div class="events">
          <strong>Events:</strong> ${test.events.length} recorded
          <ul>
            ${test.events.slice(0, 5).map(e => `<li>${e.type} at ${e.relativeTime}ms</li>`).join('')}
            ${test.events.length > 5 ? `<li>... and ${test.events.length - 5} more</li>` : ''}
          </ul>
        </div>
      </div>
    `).join('')}
  `).join('')}

</body>
</html>
    `.trim();
  }
}
