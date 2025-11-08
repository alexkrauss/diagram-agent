/**
 * RecordingExpect - Wraps Vitest's expect() to record all assertions (pass and fail)
 * without throwing errors, allowing tests to continue execution.
 */

import { expect as vitestExpect } from 'vitest';
import type { EventRecorder } from './EventRecorder';

export type ExpectFunction = (actual: any, description?: string) => any;

/**
 * Creates a recording expect function that captures all assertions
 * @param recorder - The EventRecorder instance to record assertions to
 * @returns A function with the same API as Vitest's expect()
 */
export function createRecordingExpect(recorder: EventRecorder): ExpectFunction {
  return function expect(actual: any, description?: string) {
    const vitestMatcher = vitestExpect(actual);

    // Create a proxy that intercepts all matcher calls
    return new Proxy(vitestMatcher, {
      get(target: any, prop: string | symbol) {
        // Return the original property if it's not a function
        if (typeof target[prop] !== 'function') {
          return target[prop];
        }

        // Wrap matcher functions to record results
        return (...args: any[]) => {
          const matcherName = String(prop);

          try {
            // Execute the matcher - this will throw if assertion fails
            const result = target[prop](...args);

            // If we get here, assertion passed
            recorder.recordAssertion({
              type: 'assertion',
              time: Date.now(),
              passed: true,
              matcher: matcherName,
              actual: actual,
              expected: args[0],
              description: description,
            });

            return result;
          } catch (error: any) {
            // Assertion failed - record it but DON'T re-throw
            recorder.recordAssertion({
              type: 'assertion',
              time: Date.now(),
              passed: false,
              matcher: matcherName,
              actual: actual,
              expected: args[0],
              error: error.message,
              stack: error.stack,
              description: description,
            });

            // Return undefined instead of throwing
            // This allows the test to continue
            return undefined;
          }
        };
      },
    });
  };
}
