/**
 * Test Results Storage
 *
 * This module provides a simple, vitest-independent storage mechanism for test results.
 * It's used by conversation-testing.ts to store results and by EvalReporter to retrieve them.
 *
 * Separating this from conversation-testing.ts prevents the reporter from transitively
 * importing vitest (which causes startup errors).
 */

import type { RecordedEvent } from './types';

/**
 * Metadata for a test execution
 */
export interface TestMetadata {
  /** All recorded events from the test execution */
  events: RecordedEvent[];

  /** Whether all assertions passed */
  passed: boolean;

  /** Summary statistics */
  summary: {
    totalEvents: number;
    totalAssertions: number;
    passedAssertions: number;
    failedAssertions: number;
    duration: number;
  };

  /** Error message if test failed */
  error?: string;
}

/**
 * Global map to store test results for the reporter to access.
 * Uses test name as key since that's reliably available.
 */
const testResultsMap = new Map<string, TestMetadata>();

/**
 * Store test results for reporter access
 * @internal
 */
export function storeTestResults(testName: string, metadata: TestMetadata): void {
  testResultsMap.set(testName, metadata);
}

/**
 * Retrieve test results
 * @internal
 */
export function getTestResults(testName: string): TestMetadata | undefined {
  return testResultsMap.get(testName);
}

/**
 * Get all stored test results
 * @internal
 */
export function getAllTestResults(): Map<string, TestMetadata> {
  return new Map(testResultsMap);
}
