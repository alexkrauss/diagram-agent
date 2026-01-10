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
    async (agent) => {
      await agent.send(
        "Create a diagram with a container labeled 'server' that contains two child shapes: 'web' and 'database'."
      );

      agent.criteria(
        "The diagram includes a container labeled server.",
        "The server container contains two child shapes labeled web and database.",
        "The web and database shapes are visually nested within server rather than at the top level.",
        "No connections appear between the shapes.",
      );
    },
  );

  /**
   * Scenario 2: Multi-Level Nesting with Connections
   */
  conversation(
    "Multi-Level Nesting with Connections",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create a diagram with a container labeled 'clouds'. Inside 'clouds', create two containers: 'aws' and 'gcloud'. Inside 'aws', create shapes 'load_balancer' and 'api', and inside 'gcloud', create shape 'auth'. Also inside 'clouds' at the same level as 'aws' and 'gcloud', create a shape 'db'. Create these connections: from 'load_balancer' to 'api', from 'api' to 'db', from 'auth' to 'db', and from 'gcloud' to 'aws'."
      );

      agent.criteria(
        "There is a top-level container labeled clouds with child containers aws and gcloud.",
        "The aws container contains load_balancer and api shapes, while gcloud contains auth.",
        "A db shape exists inside clouds at the same level as aws and gcloud.",
        "Connections exist from load_balancer to api, api to db, auth to db, and from gcloud to aws.",
        "The nesting hierarchy is correct across all three levels.",
      );
    },
  );

  /**
   * Scenario 3: Container Labels
   */
  conversation(
    "Container Labels",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create a diagram with a container labeled 'clouds'. Inside 'clouds', create two containers: one labeled 'Amazon Web Services' and one labeled 'Google Cloud Platform'. Inside 'Amazon Web Services', create shapes 'load_balancer' and 'db'. Inside 'Google Cloud Platform', create shape 'auth'. Create a connection from 'load_balancer' to 'db', from 'auth' to 'db', and from 'Google Cloud Platform' to 'Amazon Web Services'. Also create a shape 'users' (at the top level, outside 'clouds') with connections to 'load_balancer' in 'Amazon Web Services' and to 'auth' in 'Google Cloud Platform'."
      );

      agent.criteria(
        "The diagram includes a top-level container labeled clouds with child containers Amazon Web Services and Google Cloud Platform.",
        "Amazon Web Services contains load_balancer and db shapes; Google Cloud Platform contains auth.",
        "A users shape exists at the top level outside the clouds container.",
        "Inside the clouds container, connections exist from load_balancer to db, from auth to db, and from Google Cloud Platform to Amazon Web Services.",
        "Users connects to load_balancer (inside Amazon Web Services) and to auth (inside Google Cloud Platform).",
      );
    },
  );

  /**
   * Scenario 4: Cross-Container Connections
   */
  conversation(
    "Cross-Container Connections",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create a diagram with two containers: 'apartment' and 'office'. Inside 'apartment', create shapes 'bedroom' and 'bathroom'. Inside 'office', create shapes 'spare_room' and 'bathroom'. Create a connection from the bathroom in 'apartment' to the bathroom in 'office' labeled 'Portal'."
      );

      agent.criteria(
        "There are two top-level containers labeled apartment and office.",
        "Apartment contains bedroom and bathroom; office contains spare_room and bathroom.",
        "A connection labeled Portal links the apartment bathroom to the office bathroom.",
        "The diagram uses correct container scoping for the two bathroom nodes.",
      );
    },
  );

  /**
   * Scenario 5: Sibling Container References with Styling
   */
  conversation(
    "Sibling Container References with Styling",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create a diagram with two containers at the same level: 'christmas' and 'birthdays'. Inside each container, create a shape called 'presents'. Create a connection from the 'presents' in 'christmas' to the 'presents' in 'birthdays' labeled 'regift'. Set the fill color of the 'christmas' container to light green (#ACE1AF)."
      );

      agent.criteria(
        "Two sibling containers exist: christmas and birthdays.",
        "Each container contains a presents shape, and the christmas presents connects to the birthdays presents with the label regift.",
        "The christmas container has a light green fill color (#ACE1AF).",
        "The diagram does not introduce extra containers or connections.",
      );
    },
  );
});
