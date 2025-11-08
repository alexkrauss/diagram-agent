/**
 * EventRecorder - Collects all events during a test execution in chronological order.
 */

import type { RecordedEvent, AssertionEvent } from './types';

export class EventRecorder {
  private events: RecordedEvent[] = [];
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Record a generic event
   */
  record(event: RecordedEvent): void {
    this.events.push({
      ...event,
      relativeTime: event.time - this.startTime,
    });
  }

  /**
   * Record an assertion event
   */
  recordAssertion(assertion: Omit<AssertionEvent, 'relativeTime'>): void {
    this.record(assertion as AssertionEvent);
  }

  /**
   * Get all recorded events in chronological order
   */
  getEvents(): RecordedEvent[] {
    return [...this.events].sort((a, b) => a.time - b.time);
  }

  /**
   * Clear all recorded events
   */
  clear(): void {
    this.events = [];
    this.startTime = Date.now();
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const assertions = this.events.filter(e => e.type === 'assertion') as AssertionEvent[];
    const passedAssertions = assertions.filter(a => a.passed);
    const failedAssertions = assertions.filter(a => !a.passed);

    return {
      totalEvents: this.events.length,
      totalAssertions: assertions.length,
      passedAssertions: passedAssertions.length,
      failedAssertions: failedAssertions.length,
      duration: this.events.length > 0
        ? Math.max(...this.events.map(e => e.relativeTime || 0))
        : 0,
    };
  }
}
