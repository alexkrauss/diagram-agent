/**
 * EvalReporter - Vitest custom reporter that collects test results and generates HTML report
 */

import type { Reporter, Vitest } from 'vitest';
import type { TestCase, TestSuite } from 'vitest/node';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { RecordedEvent, UserMessageEvent, AssistantMessageEvent, ToolCallEvent, ToolResultEvent, CanvasUpdateEvent, AssertionEvent, ErrorEvent } from '../recording/types';
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
  private ctx?: Vitest;

  onInit(ctx: Vitest) {
    this.ctx = ctx;
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

      // Write to file - use Vitest's root config
      const projectRoot = this.ctx?.config.root || process.cwd();
      const distDir = path.join(projectRoot, 'dist');
      await fs.mkdir(distDir, { recursive: true });
      const outputPath = path.join(distDir, 'eval-report.html');
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
   * Generate comprehensive HTML report with all events and details
   */
  private async generateHtml(results: TestSuiteResults): Promise<string> {
    // Render all events synchronously
    const testDetails = results.files.flatMap(file =>
      file.tests.map(test => ({
        ...test,
        eventHtml: this.renderTestEventsSync(test),
      }))
    );

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Agent Evaluation Report</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #f9f9f9; }
    h1 { color: #333; margin-top: 0; }
    h2 { color: #555; margin-top: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
    h3 { color: #666; margin-top: 20px; }

    .main-summary { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
    .summary-card { background: #f5f5f5; padding: 15px; border-radius: 5px; border-left: 4px solid #2196f3; }
    .summary-card.pass { border-left-color: #4caf50; }
    .summary-card.fail { border-left-color: #f44336; }
    .summary-number { font-size: 24px; font-weight: bold; }
    .summary-label { font-size: 12px; color: #666; margin-top: 5px; }

    .test-container { background: #fff; margin: 20px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .test-header { padding: 15px 20px; border-left: 4px solid #ccc; background: #fafafa; }
    .test-header.pass { border-left-color: #4caf50; background: #f1f8f4; }
    .test-header.fail { border-left-color: #f44336; background: #fef5f5; }
    .test-title { margin: 0; font-size: 18px; display: flex; justify-content: space-between; align-items: center; }
    .test-title .status { font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 3px; }
    .test-title .status.pass { color: #4caf50; background: #e8f5e9; }
    .test-title .status.fail { color: #f44336; background: #ffebee; }
    .test-meta { font-size: 12px; color: #666; margin-top: 8px; }

    .test-content { padding: 20px; }
    .test-error { background: #ffebee; border: 1px solid #f44336; padding: 10px; border-radius: 4px; margin-bottom: 15px; color: #c62828; }

    .events-section { margin-top: 20px; }
    .events-section h4 { margin: 0 0 15px 0; color: #333; }

    .event { background: #f9f9f9; border: 1px solid #e0e0e0; padding: 12px; margin: 8px 0; border-radius: 4px; border-left: 3px solid #999; }
    .event.user_message { border-left-color: #2196f3; }
    .event.assistant_message { border-left-color: #4caf50; }
    .event.tool_call { border-left-color: #ff9800; }
    .event.tool_result { border-left-color: #ff9800; }
    .event.canvas_update { border-left-color: #9c27b0; }
    .event.assertion { border-left-color: #00bcd4; }
    .event.error { border-left-color: #f44336; background: #ffebee; }

    .event-header { font-weight: bold; font-size: 13px; margin-bottom: 8px; display: flex; justify-content: space-between; }
    .event-type { text-transform: uppercase; font-size: 11px; padding: 2px 6px; border-radius: 3px; background: #e0e0e0; }
    .event-type.user_message { background: #e3f2fd; color: #1976d2; }
    .event-type.assistant_message { background: #e8f5e9; color: #388e3c; }
    .event-type.tool_call { background: #fff3e0; color: #f57c00; }
    .event-type.tool_result { background: #fff3e0; color: #f57c00; }
    .event-type.canvas_update { background: #f3e5f5; color: #7b1fa2; }
    .event-type.assertion { background: #e0f2f1; color: #00796b; }
    .event-type.error { background: #ffebee; color: #d32f2f; }

    .event-time { font-size: 11px; color: #999; }
    .event-content { white-space: pre-wrap; word-break: break-word; font-family: 'Courier New', monospace; font-size: 13px; }
    .event-assertion { background: #e0f2f1; padding: 8px; border-radius: 3px; margin-top: 8px; }
    .event-assertion.fail { background: #ffebee; }

    .report-summary { background: #fff; padding: 20px; border-radius: 8px; margin-top: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <h1>Agent Evaluation Report</h1>

  <div class="main-summary">
    <h2 style="margin-top: 0; border: none; padding: 0;">Summary</h2>
    <div class="summary-grid">
      <div class="summary-card pass">
        <div class="summary-number">${results.summary.totalTests}</div>
        <div class="summary-label">Total Tests</div>
      </div>
      <div class="summary-card pass">
        <div class="summary-number">${results.summary.passedTests}</div>
        <div class="summary-label">Passed Tests</div>
      </div>
      <div class="summary-card ${results.summary.failedTests > 0 ? 'fail' : 'pass'}">
        <div class="summary-number">${results.summary.failedTests}</div>
        <div class="summary-label">Failed Tests</div>
      </div>
      <div class="summary-card">
        <div class="summary-number">${results.summary.totalAssertions}</div>
        <div class="summary-label">Total Assertions</div>
      </div>
      <div class="summary-card pass">
        <div class="summary-number">${results.summary.passedAssertions}</div>
        <div class="summary-label">Passed Assertions</div>
      </div>
      <div class="summary-card ${results.summary.failedAssertions > 0 ? 'fail' : 'pass'}">
        <div class="summary-number">${results.summary.failedAssertions}</div>
        <div class="summary-label">Failed Assertions</div>
      </div>
    </div>
  </div>

  <h2>Test Details</h2>
  ${results.files.map(file => `
    <h3>${path.basename(file.filepath)}</h3>
    ${file.tests.map(test => {
      const detail = testDetails.find(d => d.name === test.name && d.fullName === test.fullName);
      return `
      <div class="test-container">
        <div class="test-header ${test.passed ? 'pass' : 'fail'}">
          <h3 class="test-title">
            ${test.fullName}
            <span class="status ${test.passed ? 'pass' : 'fail'}">${test.passed ? '✓ PASSED' : '✗ FAILED'}</span>
          </h3>
          <div class="test-meta">
            Duration: ${test.duration}ms |
            ${test.summary ? `Assertions: ${test.summary.passedAssertions}/${test.summary.totalAssertions} passed` : 'No assertions'}
          </div>
        </div>
        <div class="test-content">
          ${test.error ? `<div class="test-error"><strong>Error:</strong> ${test.error}</div>` : ''}
          <div class="events-section">
            <h4>Conversation & Events (${test.events.length} total)</h4>
            ${detail?.eventHtml || '<p>No events recorded</p>'}
          </div>
        </div>
      </div>
    `;
    }).join('')}
  `).join('')}

  <div class="report-summary">
    <h2 style="margin-top: 0;">Report Summary</h2>
    <p><strong>Report Generated:</strong> ${new Date().toISOString()}</p>
    <p><strong>Total Tests:</strong> ${results.summary.totalTests}</p>
    <p><strong>Total Assertions:</strong> ${results.summary.totalAssertions}</p>
  </div>

</body>
</html>
    `.trim();
  }

  /**
   * Render all events for a test into HTML (synchronously, D2 rendering is lazy)
   */
  private renderTestEventsSync(test: TestResult): string {
    return test.events.map(event => this.renderEventSync(event)).join('');
  }

  /**
   * Render a single event based on its type (synchronously)
   */
  private renderEventSync(event: RecordedEvent): string {
    const typeHtml = `<span class="event-type ${event.type}">${event.type.replace(/_/g, ' ')}</span>`;
    const timeHtml = `<span class="event-time">${event.relativeTime}ms</span>`;

    if (event.type === 'user_message') {
      const e = event as UserMessageEvent;
      return `
        <div class="event ${event.type}">
          <div class="event-header">${typeHtml}${timeHtml}</div>
          <div class="event-content">${this.escapeHtml(e?.content || '')}</div>
        </div>
      `;
    }

    if (event.type === 'assistant_message') {
      const e = event as AssistantMessageEvent;
      return `
        <div class="event ${event.type}">
          <div class="event-header">${typeHtml}${timeHtml}</div>
          <div class="event-content">${this.escapeHtml(e?.content || '')}</div>
        </div>
      `;
    }

    if (event.type === 'tool_call') {
      const e = event as ToolCallEvent;
      return `
        <div class="event ${event.type}">
          <div class="event-header">${typeHtml} - ${this.escapeHtml(e?.toolName || 'unknown')}${timeHtml}</div>
          <div class="event-content">${this.escapeHtml(JSON.stringify(e?.arguments || {}, null, 2))}</div>
        </div>
      `;
    }

    if (event.type === 'tool_result') {
      const e = event as ToolResultEvent;
      return `
        <div class="event ${event.type}">
          <div class="event-header">${typeHtml} - ${this.escapeHtml(e?.toolName || 'unknown')}${timeHtml}</div>
          <div class="event-content">${this.escapeHtml(JSON.stringify(e?.result || {}, null, 2))}</div>
        </div>
      `;
    }

    if (event.type === 'canvas_update') {
      const e = event as CanvasUpdateEvent;
      const d2Content = e?.d2Content || '';
      return `
        <div class="event ${event.type}">
          <div class="event-header">${typeHtml}${timeHtml}</div>
          <div class="event-content">${this.escapeHtml(d2Content)}</div>
        </div>
      `;
    }

    if (event.type === 'assertion') {
      const e = event as AssertionEvent;
      const assertionClass = (e?.passed) ? 'pass' : 'fail';
      return `
        <div class="event ${event.type}">
          <div class="event-header">${typeHtml} - ${e?.passed ? 'PASS' : 'FAIL'}${timeHtml}</div>
          <div class="event-assertion ${assertionClass}">
            ${e?.description ? `<strong>Description:</strong> ${this.escapeHtml(e.description)}<br>` : ''}
            <strong>Matcher:</strong> ${this.escapeHtml(e?.matcher || 'unknown')}<br>
            <strong>Expected:</strong> <code>${this.escapeHtml(JSON.stringify(e?.expected))}</code><br>
            <strong>Actual:</strong> <code>${this.escapeHtml(JSON.stringify(e?.actual))}</code>
            ${e?.error ? `<br><strong>Error:</strong> ${this.escapeHtml(e.error)}` : ''}
          </div>
        </div>
      `;
    }

    if (event.type === 'error') {
      const e = event as ErrorEvent;
      return `
        <div class="event ${event.type}">
          <div class="event-header">${typeHtml}${timeHtml}</div>
          <div class="event-content">${this.escapeHtml(e?.error || 'Unknown error')}</div>
          ${e?.stack ? `<pre style="background: #fff; border: 1px solid #ddd; padding: 8px; margin-top: 8px; overflow-x: auto;">${this.escapeHtml(e.stack)}</pre>` : ''}
        </div>
      `;
    }

    // Fallback for unknown event types
    return `
      <div class="event" style="border-left-color: #999;">
        <div class="event-header">${typeHtml}${timeHtml}</div>
        <div class="event-content">${this.escapeHtml(JSON.stringify(event, null, 2))}</div>
      </div>
    `;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: unknown): string {
    if (text === null || text === undefined) {
      return '';
    }
    const str = String(text);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
