/**
 * Benchmark: Basic Connections
 *
 * Test the agent's ability to create connections between shapes in D2 diagrams.
 * This benchmark validates that the agent correctly understands and implements:
 * - Connection directionality (directed, undirected, bidirectional)
 * - Connection labels
 * - Multiple connections in a diagram
 * - Shape references in connections
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

describe("Benchmark: Basic Connections", () => {
  /**
   * Scenario 1: Simple Directional Connections
   */
  conversation(
    "Simple Directional Connections",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create a diagram with a shape labeled 'User' and a shape labeled 'Server'. Create a directed connection from 'User' to 'Server' labeled 'request'. Create a directed connection from 'Server' to 'User' labeled 'response'."
      );

      agent.criteria(
        "The diagram contains a User shape and a Server shape.",
        "There is a directed connection from User to Server labeled request.",
        "There is a directed connection from Server back to User labeled response.",
        "No extra shapes or unrelated connections are introduced.",
        "The diagram renders as valid D2.",
      );
    }
  );

  /**
   * Scenario 2: Bi-Directional and Undirected Connections
   */
  conversation(
    "Bi-Directional and Undirected Connections",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create a diagram with three shapes: 'Primary Database', 'Replica Database', and 'Cache Server'. Create a bidirectional connection between 'Primary Database' and 'Replica Database' labeled 'Replication'. Create an undirected connection between 'Replica Database' and 'Cache Server' labeled 'Sync status'."
      );

      agent.criteria(
        "The diagram includes shapes for Primary Database, Replica Database, and Cache Server.",
        "Primary Database and Replica Database are connected bidirectionally with the label Replication.",
        "Replica Database and Cache Server share an undirected connection labeled Sync status.",
        "The diagram does not add extra shapes or connections beyond the request.",
        "The output is valid D2 that renders correctly.",
      );
    }
  );

  /**
   * Scenario 3: Connection Chaining
   */
  conversation(
    "Connection Chaining",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create a diagram with three shapes: 'Data Source', 'ETL Processor', and 'Data Lake'. Create two directed connections: from 'Data Source' to 'ETL Processor', and from 'ETL Processor' to 'Data Lake'. Both connections should share the label 'Data flow'."
      );

      agent.criteria(
        "The diagram shows Data Source, ETL Processor, and Data Lake as distinct shapes.",
        "There is a directed Data Source to ETL Processor connection labeled Data flow.",
        "There is a directed ETL Processor to Data Lake connection labeled Data flow.",
        "Only the two requested connections appear, with no extra links.",
        "The D2 output is syntactically valid and renders.",
      );
    }
  );

  /**
   * Scenario 4: Multiple Connections to Same Shape
   */
  conversation(
    "Multiple Connections to Same Shape",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create a diagram with five shapes: 'Client', 'API Gateway', 'Auth Service', 'User Service', and 'Database'. Create these connections:\n" +
        "- From 'Client' to 'API Gateway' labeled 'HTTP'\n" +
        "- From 'API Gateway' to 'Auth Service' labeled 'Route'\n" +
        "- From 'API Gateway' to 'User Service' labeled 'Route'\n" +
        "- From 'Auth Service' to 'Database' labeled 'Query'\n" +
        "- From 'User Service' to 'Database' labeled 'Query'\n" +
        "- From 'Database' to 'Auth Service' labeled 'Result'\n" +
        "- From 'Database' to 'User Service' labeled 'Result'"
      );

      agent.criteria(
        "The diagram includes five shapes labeled Client, API Gateway, Auth Service, User Service, and Database.",
        "Client connects to API Gateway with a directed HTTP connection.",
        "API Gateway connects to Auth Service and User Service with directed Route connections.",
        "Auth Service and User Service each connect to Database with directed Query connections.",
        "Database connects back to Auth Service and User Service with directed Result connections.",
        "No additional shapes or connections appear beyond the requested flow.",
        "The diagram is valid D2 and renders successfully.",
      );
    }
  );
});
