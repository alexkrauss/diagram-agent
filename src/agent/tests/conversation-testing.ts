/**
 * Conversation Testing DSL for DiagramAgent
 *
 * This module provides a TypeScript-based DSL for evaluating the DiagramAgent
 * in a conversation-style manner. Tests collect metrics rather than failing,
 * allowing comprehensive evaluation of agent behavior.
 *
 * Key design principles:
 * - Separation of concerns: action (send) → observation (canvas, conversation) → assertion
 * - Single entry point: all state accessed via agent parameter
 * - Multi-turn support: agent maintains state across turns
 * - Evaluation focus: collect metrics, don't fail tests
 */

import { it } from "vitest";
import type {
  DiagramAgent,
  ConversationMessage,
  AgentState,
} from "../DiagramAgent";

// =============================================================================
// Core API
// =============================================================================

/**
 * Define a conversation-based test.
 *
 * A conversation maintains state across multiple turns, allowing you to test
 * multi-turn interactions with the agent.
 *
 * @param name - Descriptive name for the conversation test
 * @param agentOrFactory - DiagramAgent instance or factory function that creates an agent
 * @param fn - Test function receiving the wrapped agent
 *
 * @example
 * ```typescript
 * // Using a factory function (recommended for lazy initialization)
 * conversation('Build architecture diagram', () => createDiagramAgent(), async (agent) => {
 *   await agent.send('Create a Web Server box');
 *   expect(agent.canvas.content).toContain('Web Server');
 * });
 *
 * // Using an agent instance
 * const myAgent = createDiagramAgent({ apiKey: '...', model: 'gpt-4o' });
 * conversation('Build architecture diagram', myAgent, async (agent) => {
 *   await agent.send('Create a Web Server box');
 *   expect(agent.canvas.content).toContain('Web Server');
 * });
 * ```
 */
export function conversation(
  name: string,
  agentOrFactory: DiagramAgent | (() => DiagramAgent),
  fn: (agent: AgentWrapper) => Promise<void>
): void {
  it(name, async () => {
    // Create agent lazily if a factory function is provided
    const agent = typeof agentOrFactory === 'function'
      ? agentOrFactory()
      : agentOrFactory;

    const wrapper = new AgentWrapperImpl(agent);
    const startTime = Date.now();

    // Evaluation mode: collect metrics instead of failing
    const result: EvaluationResult = {
      name,
      passed: true,
      score: 1.0,
      assertions: [],
      duration: 0,
    };

    try {
      await fn(wrapper);
      result.duration = Date.now() - startTime;
      EvalResults.record(name, result);
    } catch (error) {
      result.passed = false;
      result.score = 0.0;
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;
      EvalResults.record(name, result);
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

/**
 * Implementation of AgentWrapper that wraps a DiagramAgent.
 */
class AgentWrapperImpl implements AgentWrapper {
  private agent: DiagramAgent;

  constructor(agent: DiagramAgent) {
    this.agent = agent;
  }

  async send(message: string): Promise<void> {
    await this.agent.sendMessage(message);
  }

  get canvas(): CanvasState {
    return {
      content: this.agent.getCanvasContent(),
    };
  }

  get conversation(): ConversationState {
    return {
      messages: this.agent.getConversationHistory(),
    };
  }

  get state(): AgentState {
    return this.agent.getState();
  }

  reset(): void {
    // Note: Current DiagramAgent interface doesn't have a reset method.
    // This would need to be added to the interface if reset functionality is needed.
    // For now, we throw an error to indicate it's not supported.
    throw new Error(
      'Reset not supported. DiagramAgent interface does not provide a reset method. ' +
      'Create a new agent instance instead.'
    );
  }
}

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
// Evaluation Results
// =============================================================================

/**
 * Results collected during evaluation tests.
 *
 * Conversation tests collect metrics instead of failing on assertion errors.
 */
export interface EvaluationResult {
  /** Name of the conversation test */
  name: string;

  /** Overall pass/fail status */
  passed: boolean;

  /** Aggregate score (0-1) */
  score: number;

  /** Results for each assertion */
  assertions: AssertionResult[];

  /** Execution time in milliseconds */
  duration: number;

  /** Any error that occurred */
  error?: string;
}

export interface AssertionResult {
  /** Description of what was asserted */
  description: string;

  /** Whether the assertion passed */
  passed: boolean;

  /** Score for this assertion (0-1) */
  score: number;

  /** Reason for pass/fail */
  reason?: string;
}

/**
 * Summary report of all evaluation results.
 */
export interface EvaluationReport {
  /** Total number of conversations tested */
  totalConversations: number;

  /** Number of conversations that passed */
  passedConversations: number;

  /** Overall pass rate */
  passRate: number;

  /** Average score across all tests */
  averageScore: number;

  /** Detailed results per conversation */
  conversations: EvaluationResult[];
}

/**
 * Global results collector for evaluation mode.
 */
export namespace EvalResults {
  const results: EvaluationResult[] = [];

  /**
   * Record results for a conversation test.
   */
  export function record(_name: string, result: EvaluationResult): void {
    results.push(result);
  }

  /**
   * Get all recorded results.
   */
  export function getAll(): EvaluationResult[] {
    return [...results];
  }

  /**
   * Generate a summary report.
   */
  export function generateReport(): EvaluationReport {
    const totalConversations = results.length;
    const passedConversations = results.filter((r) => r.passed).length;
    const passRate = totalConversations > 0 ? passedConversations / totalConversations : 0;
    const averageScore = totalConversations > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / totalConversations
      : 0;

    return {
      totalConversations,
      passedConversations,
      passRate,
      averageScore,
      conversations: [...results],
    };
  }

  /**
   * Clear all recorded results.
   */
  export function clear(): void {
    results.length = 0;
  }
}
