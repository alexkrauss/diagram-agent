/**
 * Example tests demonstrating the conversation testing DSL.
 *
 * These tests show the intended usage pattern. They will type-check but fail
 * at runtime until the conversation-testing harness is implemented.
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
  renderFunction: RenderFunction
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
  return new D2Agent({ apiKey, model: "gpt-4o", renderFunction }, callback);
}

describe("DiagramAgent - Example Conversations", () => {
  /**
   * Simple single-turn test.
   * Creates a diagram and validates the result.
   */
  conversation(
    "Create simple diagram",
    createTestAgent,
    async (agent) => {
      // ACTION: Send message to agent
      await agent.send("Create a diagram with two boxes: Frontend and Backend");

      agent.criteria(
        "The diagram includes two boxes labeled Frontend and Backend.",
        "No extra shapes or connections are introduced.",
        "The output is valid D2 and renders correctly.",
      );
    },
  );

  /**
   * Multi-turn conversation test.
   * Builds up a diagram incrementally across multiple turns.
   */
  conversation(
    "Build architecture incrementally",
    createTestAgent,
    async (agent) => {
      // Turn 1: Create initial element
      await agent.send("Create a box called Web Server");

      // Turn 2: Add connected element
      await agent.send("Add a Database box and connect it to the Web Server");

      // Turn 3: Add another element
      await agent.send("Add a Load Balancer in front of the Web Server");

      agent.criteria(
        "The final diagram includes Web Server, Database, and Load Balancer.",
        "Database is connected to the Web Server, and the Load Balancer sits in front of the Web Server.",
        "The diagram accumulates elements across turns without losing earlier shapes.",
        "The output renders as valid D2.",
      );
    },
  );

  /**
   * Test with structural validation.
   * Checks connections between elements.
   */
  conversation(
    "Validate connections",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create a diagram with Client, Server, and Database. " +
          "Connect Client to Server, and Server to Database.",
      );

      agent.criteria(
        "The diagram includes Client, Server, and Database shapes.",
        "Client connects to Server, and Server connects to Database in the requested order.",
        "No extra shapes or connections are added.",
        "The output is valid D2 and renders correctly.",
      );
    },
  );

  /**
   * Test conversation history inspection.
   * Validates that conversation state is properly tracked.
   */
  conversation(
    "Inspect conversation history",
    createTestAgent,
    async (agent) => {
      await agent.send("Create box A");
      await agent.send("Create box B");

      agent.criteria(
        "The conversation captures two user turns: Create box A followed by Create box B.",
        "The diagram reflects both box A and box B after the two turns.",
        "The transcript preserves the turn order without missing messages.",
      );
    },
  );

  /**
   * Test state snapshot and comparison.
   * Captures canvas state at different points.
   */
  conversation(
    "Compare canvas states",
    createTestAgent,
    async (agent) => {
      await agent.send("Create a Web Server");

      await agent.send("Add a Database");

      agent.criteria(
        "After the second turn, the diagram includes both Web Server and Database.",
        "The update is additive rather than replacing the initial Web Server.",
        "The output renders as valid D2.",
      );
    },
  );

  /**
   * Test error handling / edge cases.
   * Agent should handle unclear requests without crashing.
   */
  conversation(
    "Handle unclear request",
    createTestAgent,
    async (agent) => {
      // This tests that the agent handles unclear requests gracefully
      // The agent may choose to create something, ask for clarification, or do nothing
      await agent.send("Add a thing");

      agent.criteria(
        "The agent handles the unclear request without errors.",
        "The interaction records the user prompt and provides a coherent response or clarification.",
      );
    },
  );
});
