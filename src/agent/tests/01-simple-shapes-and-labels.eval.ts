/**
 * Benchmark: Simple Shapes and Labels
 *
 * This benchmark tests the agent's ability to create basic shapes with different
 * labels in D2 diagrams. It focuses on fundamental shape declaration patterns
 * and label assignment.
 *
 * Run in strict mode (default):
 *   npm test
 *
 * Run in evaluation mode:
 *   EVAL_MODE=true npm test
 */

import { describe } from "vitest";
import { conversation } from "./conversation-testing";
import type { DiagramAgent, AgentEvent, RenderFunction } from "../DiagramAgent";
import { D2Agent } from "../D2Agent";

/**
 * Create a test agent instance using the OpenAI API key from environment.
 * Requires OPENAI_API_KEY to be set in .env file or environment variables.
 *
 * The test harness provides the renderFunction, which includes file capturing
 * for evaluation reports (SVG and PNG files are saved to eval-results/).
 *
 * @param callback - Event callback for recording agent events
 * @param renderFunction - Render function provided by the test harness (includes file capturing)
 */
function createTestAgent(
  callback: (event: AgentEvent) => void,
  renderFunction: RenderFunction,
): DiagramAgent {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. " +
        "Create a .env file with OPENAI_API_KEY=your-key-here",
    );
  }

  // Use the render function provided by the test harness
  // (which captures SVG/PNG files for evaluation reports)
  return new D2Agent({ apiKey, renderFunction }, callback);
}

describe("Benchmark: Simple Shapes and Labels", () => {
  /**
   * Test Case 1: Simple Diagram with Two Shapes
   *
   * Creates a diagram with two shapes labeled 'Frontend App' and 'Backend Server'.
   * Validates that both shapes are present with correct labels.
   */
  conversation(
    "Simple Diagram with Two Shapes",
    createTestAgent,
    async (agent) => {
      // ACTION: Send message to agent
      await agent.send(
        "Create a diagram with two shapes: one labeled 'Frontend App' and one labeled 'Backend Server'",
      );

      agent.criteria(
        "The diagram shows exactly two shapes labeled 'Frontend App' and 'Backend Server'.",
        "There are no connections or arrows between the two shapes.",
        "Both shapes appear as default rectangles (no special shape styling).",
      );
    },
  );

  /**
   * Test Case 2: Three Shapes with Different Labels
   *
   * Creates a diagram with three shapes labeled 'database', 'API Server', and 'UI Client'.
   * Validates that all three shapes are present with correct labels.
   */
  conversation(
    "Three Shapes with Different Labels",
    createTestAgent,
    async (agent) => {
      // ACTION: Send message to agent
      await agent.send(
        "Create a diagram with three shapes labeled: 'database', 'API Server', and 'UI Client'",
      );

      agent.criteria(
        "The diagram presents three distinct shapes labeled database, API Server, and UI Client.",
        "All three items are standalone shapes without any connecting edges or relationships.",
        "Each shape uses the default rectangle style rather than a specialized shape type.",
      );
    },
  );

  /**
   * Test Case 3: Multiple Services with Descriptive Labels
   *
   * Creates a diagram with three services: 'Redis Cache', 'Cloud Storage', and 'queue'.
   * Validates that all services are present with correct labels.
   */
  conversation(
    "Multiple Services with Descriptive Labels",
    createTestAgent,
    async (agent) => {
      // ACTION: Send message to agent
      await agent.send(
        "Create a diagram with these services: 'Redis Cache', 'Cloud Storage', and 'queue'",
      );

      agent.criteria(
        "The diagram shows three service shapes labeled Redis Cache, Cloud Storage, and queue.",
        "There are no connections, arrows, or relationship lines between the services.",
      );
    },
  );
});
