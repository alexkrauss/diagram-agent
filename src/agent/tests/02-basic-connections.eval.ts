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
    async (agent, expect) => {
      await agent.send(
        "Create a diagram with a shape labeled 'User' and a shape labeled 'Server'. Create a directed connection from 'User' to 'Server' labeled 'request'. Create a directed connection from 'Server' to 'User' labeled 'response'."
      );

      const canvas = agent.canvas;

      // Check shapes exist
      expect(canvas.content, "Canvas should contain User shape").toContain(
        "User"
      );
      expect(canvas.content, "Canvas should contain Server shape").toContain(
        "Server"
      );

      // Check connections exist with labels
      expect(
        canvas.content,
        "Canvas should contain connection labeled 'request'"
      ).toContain("request");
      expect(
        canvas.content,
        "Canvas should contain connection labeled 'response'"
      ).toContain("response");

      // Check for directed connections (using ->)
      // TODO: Add more specific assertions for connection directionality and ensure User -> Server and Server -> User exist
    }
  );

  /**
   * Scenario 2: Bi-Directional and Undirected Connections
   */
  conversation(
    "Bi-Directional and Undirected Connections",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a diagram with three shapes: 'Primary Database', 'Replica Database', and 'Cache Server'. Create a bidirectional connection between 'Primary Database' and 'Replica Database' labeled 'Replication'. Create an undirected connection between 'Replica Database' and 'Cache Server' labeled 'Sync status'."
      );

      const canvas = agent.canvas;

      // Check shapes exist
      expect(
        canvas.content,
        "Canvas should contain Primary Database shape"
      ).toContain("Primary Database");
      expect(
        canvas.content,
        "Canvas should contain Replica Database shape"
      ).toContain("Replica Database");
      expect(
        canvas.content,
        "Canvas should contain Cache Server shape"
      ).toContain("Cache Server");

      // Check connection labels exist
      expect(
        canvas.content,
        "Canvas should contain connection labeled 'Replication'"
      ).toContain("Replication");
      expect(
        canvas.content,
        "Canvas should contain connection labeled 'Sync status'"
      ).toContain("Sync status");

      // TODO: Add assertions for bidirectional connection (<->) between Primary Database and Replica Database
      // TODO: Add assertions for undirected connection (--) between Replica Database and Cache Server
    }
  );

  /**
   * Scenario 3: Connection Chaining
   */
  conversation(
    "Connection Chaining",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a diagram with three shapes: 'Data Source', 'ETL Processor', and 'Data Lake'. Create two directed connections: from 'Data Source' to 'ETL Processor', and from 'ETL Processor' to 'Data Lake'. Both connections should share the label 'Data flow'."
      );

      const canvas = agent.canvas;

      // Check shapes exist
      expect(canvas.content, "Canvas should contain Data Source shape").toContain(
        "Data Source"
      );
      expect(
        canvas.content,
        "Canvas should contain ETL Processor shape"
      ).toContain("ETL Processor");
      expect(canvas.content, "Canvas should contain Data Lake shape").toContain(
        "Data Lake"
      );

      // Check connection label exists
      expect(
        canvas.content,
        "Canvas should contain connection labeled 'Data flow'"
      ).toContain("Data flow");

      // TODO: Add assertions to verify two separate connections exist: Data Source -> ETL Processor and ETL Processor -> Data Lake
      // TODO: Verify both connections have the same "Data flow" label
    }
  );

  /**
   * Scenario 4: Multiple Connections to Same Shape
   */
  conversation(
    "Multiple Connections to Same Shape",
    createTestAgent,
    async (agent, expect) => {
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

      const canvas = agent.canvas;

      // Check all five shapes exist
      expect(canvas.content, "Canvas should contain Client shape").toContain(
        "Client"
      );
      expect(canvas.content, "Canvas should contain API Gateway shape").toContain(
        "API Gateway"
      );
      expect(
        canvas.content,
        "Canvas should contain Auth Service shape"
      ).toContain("Auth Service");
      expect(
        canvas.content,
        "Canvas should contain User Service shape"
      ).toContain("User Service");
      expect(canvas.content, "Canvas should contain Database shape").toContain(
        "Database"
      );

      // Check connection labels exist
      expect(
        canvas.content,
        "Canvas should contain connection labeled 'HTTP'"
      ).toContain("HTTP");
      expect(
        canvas.content,
        "Canvas should contain connection labeled 'Route'"
      ).toContain("Route");
      expect(
        canvas.content,
        "Canvas should contain connection labeled 'Query'"
      ).toContain("Query");
      expect(
        canvas.content,
        "Canvas should contain connection labeled 'Result'"
      ).toContain("Result");

      // TODO: Add assertions for each specific connection:
      // - Client -> API Gateway labeled "HTTP"
      // - API Gateway -> Auth Service labeled "Route"
      // - API Gateway -> User Service labeled "Route"
      // - Auth Service -> Database labeled "Query"
      // - User Service -> Database labeled "Query"
      // - Database -> Auth Service labeled "Result"
      // - Database -> User Service labeled "Result"
      // TODO: Verify all connections have correct directionality
    }
  );
});
