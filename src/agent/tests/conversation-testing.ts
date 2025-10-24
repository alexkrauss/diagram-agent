/**
 * Conversation Testing DSL for DiagramAgent
 *
 * This module provides a TypeScript-based DSL for evaluating the DiagramAgent
 * in a conversation-style manner. Tests collect detailed execution traces including
 * all events, assertions, and canvas updates for HTML report generation.
 *
 * Key design principles:
 * - Single entry point: all state accessed via agent parameter
 * - Multi-turn support: agent maintains state across turns
 * - Full event recording: capture everything for detailed HTML reports
 */

import { it } from "vitest";
import type {
  DiagramAgent,
  ConversationMessage,
  AgentState,
  AgentEvent,
} from "../DiagramAgent";
import { EventRecorder } from "./recording/EventRecorder";
import { RecordingAgentWrapper, createRecordingCallback } from "./recording/RecordingAgentWrapper";
import { createRecordingExpect, type ExpectFunction } from "./recording/RecordingExpect";
import type { RecordedEvent } from "./recording/types";

// =============================================================================
// Core API
// =============================================================================

/**
 * Define a conversation-based test.
 *
 * A conversation maintains state across multiple turns, allowing you to test
 * multi-turn interactions with the agent. All events, assertions, and canvas
 * updates are recorded for detailed HTML report generation.
 *
 * @param name - Descriptive name for the conversation test
 * @param agentFactory - Factory function that creates an agent with an event callback
 * @param fn - Test function receiving the wrapped agent and custom expect function
 *
 * @example
 * ```typescript
 * // Define agent factory that accepts callback
 * function createTestAgent(callback: (event: AgentEvent) => void): DiagramAgent {
 *   return new D2Agent({ apiKey: '...', model: 'gpt-4o' }, callback);
 * }
 *
 * // Use in test with custom expect for recording
 * conversation('Build architecture diagram', createTestAgent, async (agent, expect) => {
 *   await agent.send('Create a Web Server box');
 *   expect(agent.canvas.content, 'Canvas should contain Web Server').toContain('Web Server');
 * });
 * ```
 */
export function conversation(
  name: string,
  agentFactory: (callback: (event: AgentEvent) => void) => DiagramAgent,
  fn: (agent: AgentWrapper, expect: ExpectFunction) => Promise<void>
): void {
  it(name, async (testContext) => {
    const startTime = Date.now();

    // Create event recorder for this test
    const recorder = new EventRecorder();

    // Create recording callback for agent events
    const recordingCallback = createRecordingCallback(recorder);

    // Create agent with recording callback
    const agent = agentFactory(recordingCallback);

    // Wrap agent to record interactions
    const wrapper = new RecordingAgentWrapper(agent, recorder);

    // Create recording expect function
    const recordingExpect = createRecordingExpect(recorder);

    try {
      // Run test function with wrapper and custom expect
      await fn(wrapper, recordingExpect);

      const duration = Date.now() - startTime;
      const summary = recorder.getSummary();

      // Store events in test metadata for reporter to access
      // Cast to allow writing custom metadata (documented Vitest feature)
      const meta = testContext.task.meta as any;
      meta.events = recorder.getEvents();
      meta.passed = summary.failedAssertions === 0;
      meta.summary = {
        ...summary,
        duration, // Override with actual test execution time
      };

      // If any assertions failed, throw error to mark test as failed
      if (summary.failedAssertions > 0) {
        const failedAssertions = recorder.getEvents()
          .filter(e => e.type === 'assertion' && !(e as any).passed);

        throw new Error(
          `${summary.failedAssertions} assertion(s) failed:\n` +
          failedAssertions.map((a: any) =>
            `  - ${a.description || a.matcher}: ${a.error}`
          ).join('\n')
        );
      }

    } catch (error) {
      const duration = Date.now() - startTime;

      // Record error event
      recorder.record({
        type: 'error',
        time: Date.now(),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Store events even on failure
      // Cast to allow writing custom metadata (documented Vitest feature)
      const meta = testContext.task.meta as any;
      meta.events = recorder.getEvents();
      meta.passed = false;
      meta.summary = {
        ...recorder.getSummary(),
        duration, // Include actual test execution time
      };
      meta.error = error instanceof Error ? error.message : String(error);

      // Re-throw to mark test as failed
      throw error;
    }
  });
}

// =============================================================================
// Agent Wrapper
// =============================================================================

/**
 * Wrapper around DiagramAgent that provides a testing-friendly interface.
 *
 * Separates actions (send) from observations (canvas, conversation) to enable
 * clear test structure: action → observation → assertion.
 */
export interface AgentWrapper {
  /**
   * Send a message to the agent and wait for completion.
   *
   * This is the primary action in tests. After calling send(), you can
   * inspect the resulting state via `canvas` and `conversation`.
   *
   * @param message - User message to send to the agent
   *
   * @example
   * ```typescript
   * await agent.send('Create a diagram with boxes A and B');
   * expect(agent.canvas.content).toContain('A');
   * ```
   */
  send(message: string): Promise<void>;

  /**
   * Access the current canvas state.
   *
   * Returns a snapshot of the canvas after the last agent action.
   * Contains both raw D2 code and parsed structure.
   *
   * @example
   * ```typescript
   * const canvas = agent.canvas;
   * expect(canvas.content).toContain('Web Server');
   * expect(canvas.elements.length).toBe(3);
   * ```
   */
  readonly canvas: CanvasState;

  /**
   * Access the full conversation history.
   *
   * Returns all messages exchanged with the agent, including user messages,
   * assistant responses, and canvas updates.
   *
   * @example
   * ```typescript
   * const conversation = agent.conversation;
   * expect(conversation.userMessages.length).toBe(2);
   * expect(conversation.last.role).toBe('canvas_update');
   * ```
   */
  readonly conversation: ConversationState;

  /**
   * Get the current agent state (idle, thinking, running_tool).
   */
  readonly state: AgentState;

  /**
   * Reset the agent to initial state.
   * Clears conversation history and canvas.
   */
  reset(): void;
}

// AgentWrapper implementation is now provided by RecordingAgentWrapper

// =============================================================================
// Canvas State
// =============================================================================

/**
 * Represents the current state of the diagram canvas.
 *
 * Provides both raw D2 code and parsed structural information
 * for easy assertion.
 */
export interface CanvasState {
  /**
   * The complete D2 DSL code as a string.
   *
   * @example
   * ```typescript
   * expect(agent.canvas.content).toContain('Web Server:');
   * ```
   */
  readonly content: string;
}

// =============================================================================
// Conversation State
// =============================================================================

/**
 * Represents the full conversation history with the agent.
 *
 * Provides access to all messages and convenient filtering/querying methods.
 */
export interface ConversationState {
  /**
   * All messages in chronological order.
   *
   * @example
   * ```typescript
   * expect(agent.conversation.messages.length).toBe(4);
   * ```
   */
  readonly messages: ConversationMessage[];
}

// =============================================================================
// Test Metadata Types
// =============================================================================

/**
 * Metadata stored in test.meta for reporter access
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
