/**
 * EvalReporter - Vitest custom reporter that collects test results and writes JSON for Ragas
 *
 * This reporter reads test metadata (which includes recorded events with canvasUpdateIds)
 * and writes a JSON file that the Python Ragas runner can enrich and render to HTML.
 *
 * File structure:
 * eval-results/
 * ├── ragas-input.json
 * ├── test-0/
 * │   ├── canvas-0.svg
 * │   ├── canvas-0.png
 * │   └── ...
 * └── test-1/
 *     ├── canvas-0.svg
 *     └── canvas-0.png
 */

import type { Reporter, Vitest } from "vitest";
import type { TestCase, TestSuite } from "vitest/node";
import * as fs from "fs/promises";
import * as path from "path";
import type { RecordedEvent } from "../recording/types";
import type { TestMetadata } from "../conversation-testing";
import { buildTurnRecords, type RagasInput, type TestRecord } from "./ragasInput";

/**
 * Collected result for a single test
 */
interface TestResult {
  fileId: string;
  testIndex: number;
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
    const filepath = test.module?.moduleId || "unknown";
    const fileResults: TestFileResults = this.allResults.get(filepath) || {
      filepath,
      tests: [],
    };

    // Add test result
    fileResults.tests.push({
      fileId: metadata.fileId,
      testIndex: metadata.testIndex,
      name: test.name,
      fullName: hierarchy.join(" > "),
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
    // Generate JSON report input
    try {
      // Collect all results
      const files = Array.from(this.allResults.values());

      // Use Vitest's root config
      const projectRoot = this.ctx?.config.root || process.cwd();
      const evalResultsDir = path.join(projectRoot, "eval-results");
      await fs.mkdir(evalResultsDir, { recursive: true });

      const summary = this.calculateSummary(files);

      const tests: TestRecord[] = [];

      for (const file of files) {
        for (const test of file.tests) {
          tests.push({
            fileId: test.fileId,
            testIndex: test.testIndex,
            name: test.name,
            fullName: test.fullName,
            hierarchy: test.hierarchy,
            passed: test.passed,
            duration: test.duration,
            events: test.events,
            summary: test.summary,
            error: test.error,
            turns: buildTurnRecords(test.events, test.fileId, test.testIndex),
          });
        }
      }

      const ragasInput: RagasInput = {
        generatedAt: new Date().toISOString(),
        summary,
        tests,
      };

      const outputPath = path.join(evalResultsDir, "ragas-input.json");
      await fs.writeFile(outputPath, JSON.stringify(ragasInput, null, 2));

      console.log(`\n✓ Ragas input generated: ${outputPath}\n`);
    } catch (error) {
      console.error("\n✗ Failed to generate Ragas input:", error);
    }
  }

  /**
   * Extract test hierarchy from test case
   */
  private getTestHierarchy(test: TestCase): string[] {
    const names: string[] = [];
    let current: TestSuite | undefined =
      test.parent.type === "suite" ? test.parent : undefined;

    while (current) {
      if (current.name) {
        names.unshift(current.name);
      }
      current = current.parent.type === "suite" ? current.parent : undefined;
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
}
