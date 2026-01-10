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
    async (agent) => {
      await agent.send(
        "Create a sequence diagram showing the following conversation:\n" +
          '- Two actors: "Alice" and "Bob"\n' +
          '- Message 1: Alice sends to Bob with label "What does it mean to be well-adjusted?"\n' +
          '- Message 2: Bob sends to Alice with label "The ability to play bridge or golf as if they were games."\n' +
          "\n" +
          "Messages must appear in this exact order.",
      );

      agent.criteria(
        "The output is a UML sequence diagram.",
        "There are two actors, Alice and Bob.",
        "Two messages are shown in the specified order: Alice to Bob with the well-adjusted question, then Bob to Alice with the bridge or golf response.",
        "Message directionality matches the conversation flow.",
        "No extra actors or messages are added.",
      );
    },
  );

  /**
   * Scenario 2: Sequence Diagram with Spans (Activation Boxes)
   *
   * A sequence diagram showing activation periods where actors are actively participating
   */
  conversation(
    "Sequence diagram with spans (activation boxes)",
    createTestAgent,
    async (agent) => {
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
          "Use spans to show Bob's activation period during messages 2 and 3.",
      );

      agent.criteria(
        "The diagram is a UML sequence diagram.",
        "The diagram has actors Alice, Bob, and Charlie.",
        "Four messages appear in order: Alice to Bob (Send request), Bob to Charlie (Query data), Charlie to Bob (Return results), and Bob to Alice (Send response).",
        "Bob shows an activation span covering exactly the middle two messages (Query data and Return results).",
        "Message directions and ordering match the prompt.",
      );
    },
  );

  /**
   * Scenario 3: Sequence Diagram with Groups
   *
   * A sequence diagram organized into logical sections or interaction phases using groups (fragments/frames)
   */
  conversation(
    "Sequence diagram with groups",
    createTestAgent,
    async (agent) => {
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
          "Groups must appear in this exact order. All messages within each group must maintain their specified order.",
      );

      agent.criteria(
        "The output is a UML sequence diagram with Alice and Bob as actors.",
        "Three groups appear in order: Greeting phase, Business phase, Goodbye phase.",
        "Greeting phase contains Alice to Bob 'Hello' followed by Bob to Alice 'Hi there!'.",
        "Business phase contains Alice to Bob 'How's the project?' followed by Bob to Alice 'Going well!'.",
        "Goodbye phase contains Bob to Alice 'Goodbye'.",
        "Group boundaries are visible and message ordering is preserved.",
      );
    },
  );

  /**
   * Scenario 4: Complex Sequence with Self-Messages, Notes, and Mixed Features
   *
   * A realistic sequence diagram combining multiple sequence diagram features
   */
  conversation(
    "Complex sequence with self-messages, notes, and mixed features",
    createTestAgent,
    async (agent) => {
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
          "All steps must appear in this exact order. The note in step 4 must appear between steps 3 and 5. The note in step 7 must appear after step 6.",
      );

      agent.criteria(
        "The diagram is a UML sequence diagram with Customer, Website, and PaymentService actors.",
        "Messages appear in order: Customer to Website (Submit order), Website to itself (Validate order), Website to PaymentService (Request payment), PaymentService to Website (Payment approved), Website to Customer (Order confirmed).",
        "A note on Customer says 'Waiting for confirmation' and appears between Request payment and Payment approved.",
        "A note on Website says 'Order complete' and appears after Order confirmed.",
        "The Website self-message is visually distinct as a self-call.",
      );
    },
  );
});
