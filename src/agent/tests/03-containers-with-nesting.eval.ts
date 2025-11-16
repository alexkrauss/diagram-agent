/**
 * Benchmark: Containers with Nesting
 *
 * Test the agent's ability to create and manage nested container structures in D2 diagrams.
 * This benchmark verifies that the agent correctly understands container hierarchies and how
 * to reference elements across different nesting levels.
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

describe("Benchmark: Containers with Nesting", () => {
  /**
   * Scenario 1: Simple Container with Child Shapes
   */
  conversation(
    "Simple Container with Child Shapes",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a diagram with a container labeled 'server' that contains two child shapes: 'web' and 'database'."
      );

      const canvas = agent.canvas;

      // Check container and child shapes exist
      expect(canvas.content, "Canvas should contain server container").toContain("server");
      expect(canvas.content, "Canvas should contain web shape").toContain("web");
      expect(canvas.content, "Canvas should contain database shape").toContain("database");

      // TODO: Add assertions for checking that web and database are children of server (proper nesting)
      // TODO: Add assertions for verifying no connections exist
    },
  );

  /**
   * Scenario 2: Multi-Level Nesting with Connections
   */
  conversation(
    "Multi-Level Nesting with Connections",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a diagram with a container labeled 'clouds'. Inside 'clouds', create two containers: 'aws' and 'gcloud'. Inside 'aws', create shapes 'load_balancer' and 'api', and inside 'gcloud', create shape 'auth'. Also inside 'clouds' at the same level as 'aws' and 'gcloud', create a shape 'db'. Create these connections: from 'load_balancer' to 'api', from 'api' to 'db', from 'auth' to 'db', and from 'gcloud' to 'aws'."
      );

      const canvas = agent.canvas;

      // Check containers exist
      expect(canvas.content, "Canvas should contain clouds container").toContain("clouds");
      expect(canvas.content, "Canvas should contain aws container").toContain("aws");
      expect(canvas.content, "Canvas should contain gcloud container").toContain("gcloud");

      // Check shapes exist
      expect(canvas.content, "Canvas should contain load_balancer shape").toContain("load_balancer");
      expect(canvas.content, "Canvas should contain api shape").toContain("api");
      expect(canvas.content, "Canvas should contain auth shape").toContain("auth");
      expect(canvas.content, "Canvas should contain db shape").toContain("db");

      // Check connections exist (basic string matching)
      expect(canvas.content, "Should have connection from load_balancer to api").toMatch(/load_balancer.*->.*api|load_balancer.*--.*api/i);
      expect(canvas.content, "Should have connection from api to db").toMatch(/api.*->.*db|api.*--.*db/i);
      expect(canvas.content, "Should have connection from auth to db").toMatch(/auth.*->.*db|auth.*--.*db/i);
      expect(canvas.content, "Should have connection from gcloud to aws").toMatch(/gcloud.*->.*aws|gcloud.*--.*aws/i);

      // TODO: Add assertions for verifying correct nesting hierarchy (3 levels deep)
      // TODO: Add assertions for verifying db is a sibling of aws and gcloud (not nested inside them)
    },
  );

  /**
   * Scenario 3: Container Labels
   */
  conversation(
    "Container Labels",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a diagram with a container labeled 'clouds'. Inside 'clouds', create two containers: one labeled 'Amazon Web Services' and one labeled 'Google Cloud Platform'. Inside 'Amazon Web Services', create shapes 'load_balancer' and 'db'. Inside 'Google Cloud Platform', create shape 'auth'. Create a connection from 'load_balancer' to 'db', from 'auth' to 'db', and from 'Google Cloud Platform' to 'Amazon Web Services'. Also create a shape 'users' (at the top level, outside 'clouds') with connections to 'load_balancer' in 'Amazon Web Services' and to 'auth' in 'Google Cloud Platform'."
      );

      const canvas = agent.canvas;

      // Check containers exist
      expect(canvas.content, "Canvas should contain clouds container").toContain("clouds");
      expect(canvas.content, "Canvas should contain Amazon Web Services container").toContain("Amazon Web Services");
      expect(canvas.content, "Canvas should contain Google Cloud Platform container").toContain("Google Cloud Platform");

      // Check shapes exist
      expect(canvas.content, "Canvas should contain load_balancer shape").toContain("load_balancer");
      expect(canvas.content, "Canvas should contain db shape").toContain("db");
      expect(canvas.content, "Canvas should contain auth shape").toContain("auth");
      expect(canvas.content, "Canvas should contain users shape").toContain("users");

      // Check connections exist
      expect(canvas.content, "Should have connection from load_balancer to db").toMatch(/load_balancer.*->.*db|load_balancer.*--.*db/i);
      expect(canvas.content, "Should have connection from auth to db").toMatch(/auth.*->.*db|auth.*--.*db/i);

      // TODO: Add assertions for connection from Google Cloud Platform to Amazon Web Services
      // TODO: Add assertions for connection from users to load_balancer (cross-container)
      // TODO: Add assertions for connection from users to auth (cross-container)
      // TODO: Add assertions for verifying users is at top level (not inside clouds)
    },
  );

  /**
   * Scenario 4: Cross-Container Connections
   */
  conversation(
    "Cross-Container Connections",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a diagram with two containers: 'apartment' and 'office'. Inside 'apartment', create shapes 'bedroom' and 'bathroom'. Inside 'office', create shapes 'spare_room' and 'bathroom'. Create a connection from the bathroom in 'apartment' to the bathroom in 'office' labeled 'Portal'."
      );

      const canvas = agent.canvas;

      // Check containers exist
      expect(canvas.content, "Canvas should contain apartment container").toContain("apartment");
      expect(canvas.content, "Canvas should contain office container").toContain("office");

      // Check shapes exist
      expect(canvas.content, "Canvas should contain bedroom shape").toContain("bedroom");
      expect(canvas.content, "Canvas should contain bathroom shape").toContain("bathroom");
      expect(canvas.content, "Canvas should contain spare_room shape").toContain("spare_room");

      // Check connection label exists
      expect(canvas.content, "Canvas should contain Portal label").toContain("Portal");

      // TODO: Add assertions for verifying the connection from apartment.bathroom to office.bathroom
      // TODO: Add assertions for verifying bathroom exists in both containers (not just one)
      // TODO: Add assertions for verifying the connection has the label "Portal"
    },
  );

  /**
   * Scenario 5: Sibling Container References with Styling
   */
  conversation(
    "Sibling Container References with Styling",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a diagram with two containers at the same level: 'christmas' and 'birthdays'. Inside each container, create a shape called 'presents'. Create a connection from the 'presents' in 'christmas' to the 'presents' in 'birthdays' labeled 'regift'. Set the fill color of the 'christmas' container to light green (#ACE1AF)."
      );

      const canvas = agent.canvas;

      // Check containers exist
      expect(canvas.content, "Canvas should contain christmas container").toContain("christmas");
      expect(canvas.content, "Canvas should contain birthdays container").toContain("birthdays");

      // Check shapes exist
      expect(canvas.content, "Canvas should contain presents shape").toContain("presents");

      // Check connection label exists
      expect(canvas.content, "Canvas should contain regift label").toContain("regift");

      // Check styling exists
      expect(canvas.content, "Canvas should contain color #ACE1AF").toContain("#ACE1AF");

      // TODO: Add assertions for verifying presents exists in both containers (not just one)
      // TODO: Add assertions for verifying the connection from christmas.presents to birthdays.presents
      // TODO: Add assertions for verifying the fill color is applied to the christmas container specifically
    },
  );
});
