/**
 * Benchmark: Icons and Images (09-icons-and-images)
 *
 * Test the agent's ability to add icons and images to shapes in D2 diagrams.
 * This benchmark validates that the agent correctly understands and implements
 * D2's icon and image capabilities.
 *
 * Based on: spec/benchmark/09-icons-and-images.md
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

describe("DiagramAgent - Icons and Images", () => {
  /**
   * Test Scenario 1: Basic Icons on Different Shape Types
   *
   * Test the agent's ability to apply icons to various shape types.
   */
  conversation(
    "Basic Icons on Different Shape Types",
    createTestAgent,
    async (agent) => {
      // ACTION: Send message to agent
      await agent.send(
        "Create a diagram with three shapes representing different services:\n" +
          "1. A container labeled \"AWS Account\" that has an icon from https://icons.terrastruct.com/aws%2FArchitecture%20Service%20Icons%2FCompute%2FAWSLambda_light-bg.svg\n" +
          "2. A rectangle labeled \"Database\" with an icon from https://icons.terrastruct.com/tech/022-database.svg\n" +
          "3. A circle labeled \"User\" with an icon from https://icons.terrastruct.com/tech/032-user.svg"
      );

      agent.criteria(
        "The diagram includes an AWS Account container with the specified AWS Lambda icon URL.",
        "A Database rectangle includes the specified database icon URL.",
        "A User circle includes the specified user icon URL.",
        "Each icon is applied to its corresponding labeled shape type.",
        "No extra shapes are added and the output renders as valid D2.",
      );
    }
  );

  /**
   * Test Scenario 2: Container with Icon and Nested Shapes
   *
   * Test the agent's ability to add icons to containers while maintaining
   * the container's structure with nested child shapes.
   */
  conversation(
    "Container with Icon and Nested Shapes",
    createTestAgent,
    async (agent) => {
      // ACTION: Send message to agent
      await agent.send(
        "Create a system architecture diagram with a container representing \"Kubernetes Cluster\" that has an icon " +
          "from https://icons.terrastruct.com/tech/167-kubernetes.svg. Inside this container, add two rectangles: " +
          "one labeled \"Pod A\" and another labeled \"Pod B\"."
      );

      agent.criteria(
        "A Kubernetes Cluster container is present with the specified Kubernetes icon URL.",
        "Pod A and Pod B are rectangles nested inside the Kubernetes Cluster container.",
        "The container and children are labeled correctly with no extra shapes.",
        "The diagram renders as valid D2.",
      );
    }
  );

  /**
   * Test Scenario 3: Standalone Image Using shape: image
   *
   * Test the agent's ability to create standalone image shapes using `shape: image`.
   */
  conversation(
    "Standalone Image Using shape: image",
    createTestAgent,
    async (agent) => {
      // ACTION: Send message to agent
      await agent.send(
        "Create a simple diagram with a standalone image shape labeled \"Team Logo\" that displays the image " +
          "from https://icons.terrastruct.com/tech/010-user-group.svg."
      );

      agent.criteria(
        "The diagram contains a standalone image shape labeled Team Logo.",
        "The Team Logo uses shape: image and displays the specified user group icon URL.",
        "No other shapes are included and the output renders as valid D2.",
      );
    }
  );

  /**
   * Test Scenario 4: Icons with Other Shape Properties
   *
   * Test the agent's ability to add icons to shapes while preserving other
   * shape properties like labels, styling, and connections.
   */
  conversation(
    "Icons with Other Shape Properties",
    createTestAgent,
    async (agent) => {
      // ACTION: Send message to agent
      await agent.send(
        "Create a diagram with a rectangle labeled \"Processed Data\" that has:\n" +
          "1. An icon from https://icons.terrastruct.com/tech/021-copy.svg\n" +
          "2. A fill color of #E8F4F8\n" +
          "3. A font-color of #2C3E50\n" +
          "4. Another rectangle labeled \"Output\" connected with an arrow"
      );

      agent.criteria(
        "Processed Data is a rectangle with the specified copy icon URL, fill color #E8F4F8, and font color #2C3E50.",
        "An Output rectangle is present and connected from Processed Data with a directed arrow.",
        "Icons and styling coexist correctly on the Processed Data shape.",
        "No extra shapes are added and the diagram renders as valid D2.",
      );
    }
  );
});
