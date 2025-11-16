/**
 * Sequence Diagrams Benchmark Tests
 *
 * Tests the agent's ability to create sequence diagrams using `shape: sequence_diagram`.
 * Based on spec/benchmark/06-sequence-diagrams.md
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

describe("Sequence Diagrams Benchmark", () => {
  /**
   * Scenario 1: Simple Actor-to-Actor Messages
   *
   * A basic sequence diagram with two actors exchanging messages
   */
  conversation(
    "Simple actor-to-actor messages",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a sequence diagram showing the following conversation:\n" +
          '- Two actors: "Alice" and "Bob"\n' +
          '- Message 1: Alice sends to Bob with label "What does it mean to be well-adjusted?"\n' +
          '- Message 2: Bob sends to Alice with label "The ability to play bridge or golf as if they were games."\n' +
          "\n" +
          "Messages must appear in this exact order."
      );

      const canvas = agent.canvas;

      // Check sequence diagram setup
      expect(
        canvas.content,
        "Canvas should contain shape: sequence_diagram"
      ).toMatch(/shape:\s*sequence_diagram/);

      // Check actors exist
      expect(canvas.content, "Canvas should contain actor Alice").toContain(
        "Alice"
      );
      expect(canvas.content, "Canvas should contain actor Bob").toContain(
        "Bob"
      );

      // Check messages exist with labels
      expect(
        canvas.content,
        'Canvas should contain message label "What does it mean to be well-adjusted?"'
      ).toContain("What does it mean to be well-adjusted?");
      expect(
        canvas.content,
        'Canvas should contain message label "The ability to play bridge or golf as if they were games."'
      ).toContain(
        "The ability to play bridge or golf as if they were games."
      );

      // TODO: Add assertions for message flow direction (Alice -> Bob, Bob -> Alice)
      // TODO: Add assertions for message ordering (temporal sequence)
    }
  );

  /**
   * Scenario 2: Sequence Diagram with Spans (Activation Boxes)
   *
   * A sequence diagram showing activation periods where actors are actively participating
   */
  conversation(
    "Sequence diagram with spans (activation boxes)",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a sequence diagram showing this exact interaction:\n" +
          '- Three actors: "Alice", "Bob", and "Charlie"\n' +
          '- Message 1: Alice sends to Bob with label "Send request"\n' +
          "- Activation period: Bob is now actively working\n" +
          '- Message 2: During Bob\'s activation, Bob sends to Charlie with label "Query data"\n' +
          '- Message 3: Charlie sends back to Bob (still activated) with label "Return results"\n' +
          "- Bob's activation period ends\n" +
          '- Message 4: Bob sends to Alice with label "Send response"\n' +
          "\n" +
          "Use spans to show Bob's activation period during messages 2 and 3."
      );

      const canvas = agent.canvas;

      // Check sequence diagram setup
      expect(
        canvas.content,
        "Canvas should contain shape: sequence_diagram"
      ).toMatch(/shape:\s*sequence_diagram/);

      // Check actors exist
      expect(canvas.content, "Canvas should contain actor Alice").toContain(
        "Alice"
      );
      expect(canvas.content, "Canvas should contain actor Bob").toContain(
        "Bob"
      );
      expect(canvas.content, "Canvas should contain actor Charlie").toContain(
        "Charlie"
      );

      // Check message labels
      expect(
        canvas.content,
        'Canvas should contain message label "Send request"'
      ).toContain("Send request");
      expect(
        canvas.content,
        'Canvas should contain message label "Query data"'
      ).toContain("Query data");
      expect(
        canvas.content,
        'Canvas should contain message label "Return results"'
      ).toContain("Return results");
      expect(
        canvas.content,
        'Canvas should contain message label "Send response"'
      ).toContain("Send response");

      // TODO: Add assertions for activation spans/periods showing Bob as active during messages 2 and 3
      // TODO: Add assertions for message flow directions
      // TODO: Add assertions for message ordering (1→2→3→4)
    }
  );

  /**
   * Scenario 3: Sequence Diagram with Groups
   *
   * A sequence diagram organized into logical sections or interaction phases using groups (fragments/frames)
   */
  conversation(
    "Sequence diagram with groups",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a sequence diagram with the following structure:\n" +
          '- Two actors: "Alice" and "Bob"\n' +
          '- Group 1: Label "Greeting phase"\n' +
          '  - Message: Alice to Bob with label "Hello"\n' +
          '  - Message: Bob to Alice with label "Hi there!"\n' +
          '- Group 2: Label "Business phase"\n' +
          '  - Message: Alice to Bob with label "How\'s the project?"\n' +
          '  - Message: Bob to Alice with label "Going well!"\n' +
          '- Group 3: Label "Goodbye phase"\n' +
          '  - Message: Bob to Alice with label "Goodbye"\n' +
          "\n" +
          "Groups must appear in this exact order. All messages within each group must maintain their specified order."
      );

      const canvas = agent.canvas;

      // Check sequence diagram setup
      expect(
        canvas.content,
        "Canvas should contain shape: sequence_diagram"
      ).toMatch(/shape:\s*sequence_diagram/);

      // Check actors exist
      expect(canvas.content, "Canvas should contain actor Alice").toContain(
        "Alice"
      );
      expect(canvas.content, "Canvas should contain actor Bob").toContain(
        "Bob"
      );

      // Check group labels
      expect(
        canvas.content,
        'Canvas should contain group label "Greeting phase"'
      ).toContain("Greeting phase");
      expect(
        canvas.content,
        'Canvas should contain group label "Business phase"'
      ).toContain("Business phase");
      expect(
        canvas.content,
        'Canvas should contain group label "Goodbye phase"'
      ).toContain("Goodbye phase");

      // Check message labels
      expect(
        canvas.content,
        'Canvas should contain message label "Hello"'
      ).toContain("Hello");
      expect(
        canvas.content,
        'Canvas should contain message label "Hi there!"'
      ).toContain("Hi there!");
      expect(
        canvas.content,
        'Canvas should contain message label "How\'s the project?"'
      ).toContain("How's the project?");
      expect(
        canvas.content,
        'Canvas should contain message label "Going well!"'
      ).toContain("Going well!");
      expect(
        canvas.content,
        'Canvas should contain message label "Goodbye"'
      ).toContain("Goodbye");

      // TODO: Add assertions for group structure (messages inside correct groups)
      // TODO: Add assertions for group ordering (Greeting → Business → Goodbye)
      // TODO: Add assertions for message flow directions within groups
    }
  );

  /**
   * Scenario 4: Complex Sequence with Self-Messages, Notes, and Mixed Features
   *
   * A realistic sequence diagram combining multiple sequence diagram features
   */
  conversation(
    "Complex sequence with self-messages, notes, and mixed features",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a sequence diagram for an e-commerce checkout flow with this exact sequence:\n" +
          '- Three actors: "Customer", "Website", and "PaymentService"\n' +
          '- Step 1: Customer sends to Website with label "Submit order"\n' +
          '- Step 2: Website sends to itself (self-message) with label "Validate order"\n' +
          '- Step 3: Website sends to PaymentService with label "Request payment"\n' +
          '- Step 4: Add a note on Customer with text "Waiting for confirmation"\n' +
          '- Step 5: PaymentService sends to Website with label "Payment approved"\n' +
          '- Step 6: Website sends to Customer with label "Order confirmed"\n' +
          '- Step 7: Add a note on Website with text "Order complete"\n' +
          "\n" +
          "All steps must appear in this exact order. The note in step 4 must appear between steps 3 and 5. The note in step 7 must appear after step 6."
      );

      const canvas = agent.canvas;

      // Check sequence diagram setup
      expect(
        canvas.content,
        "Canvas should contain shape: sequence_diagram"
      ).toMatch(/shape:\s*sequence_diagram/);

      // Check actors exist
      expect(canvas.content, "Canvas should contain actor Customer").toContain(
        "Customer"
      );
      expect(canvas.content, "Canvas should contain actor Website").toContain(
        "Website"
      );
      expect(
        canvas.content,
        "Canvas should contain actor PaymentService"
      ).toContain("PaymentService");

      // Check message labels
      expect(
        canvas.content,
        'Canvas should contain message label "Submit order"'
      ).toContain("Submit order");
      expect(
        canvas.content,
        'Canvas should contain message label "Validate order"'
      ).toContain("Validate order");
      expect(
        canvas.content,
        'Canvas should contain message label "Request payment"'
      ).toContain("Request payment");
      expect(
        canvas.content,
        'Canvas should contain message label "Payment approved"'
      ).toContain("Payment approved");
      expect(
        canvas.content,
        'Canvas should contain message label "Order confirmed"'
      ).toContain("Order confirmed");

      // Check notes
      expect(
        canvas.content,
        'Canvas should contain note "Waiting for confirmation"'
      ).toContain("Waiting for confirmation");
      expect(
        canvas.content,
        'Canvas should contain note "Order complete"'
      ).toContain("Order complete");

      // TODO: Add assertions for self-message (Website -> Website)
      // TODO: Add assertions for note placement (note on Customer appears between steps 3 and 5)
      // TODO: Add assertions for note placement (note on Website appears after step 6)
      // TODO: Add assertions for message ordering (all steps in correct temporal sequence)
      // TODO: Add assertions for message flow directions
    }
  );
});
