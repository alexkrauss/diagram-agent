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
    async (agent, expect) => {
      // ACTION: Send message to agent
      await agent.send(
        "Create a diagram with three shapes representing different services:\n" +
          "1. A container labeled \"AWS Account\" that has an icon from https://icons.terrastruct.com/aws%2FArchitecture%20Service%20Icons%2FCompute%2FAWSLambda_light-bg.svg\n" +
          "2. A rectangle labeled \"Database\" with an icon from https://icons.terrastruct.com/tech/022-database.svg\n" +
          "3. A circle labeled \"User\" with an icon from https://icons.terrastruct.com/tech/032-user.svg"
      );

      // OBSERVATION: Access canvas state
      const canvas = agent.canvas;

      // ASSERTION: Check for AWS Account container with icon
      expect(
        canvas.content,
        "Canvas should contain AWS Account label"
      ).toContain("AWS Account");
      expect(
        canvas.content,
        "Canvas should contain AWS Lambda icon URL"
      ).toContain("https://icons.terrastruct.com/aws%2FArchitecture%20Service%20Icons%2FCompute%2FAWSLambda_light-bg.svg");
      // TODO: Add assertion for AWS Account having shape: container

      // ASSERTION: Check for Database rectangle with icon
      expect(
        canvas.content,
        "Canvas should contain Database label"
      ).toContain("Database");
      expect(
        canvas.content,
        "Canvas should contain database icon URL"
      ).toContain("https://icons.terrastruct.com/tech/022-database.svg");

      // ASSERTION: Check for User circle with icon
      expect(
        canvas.content,
        "Canvas should contain User label"
      ).toContain("User");
      expect(
        canvas.content,
        "Canvas should contain user icon URL"
      ).toContain("https://icons.terrastruct.com/tech/032-user.svg");
      expect(
        canvas.content,
        "Canvas should contain circle shape for User"
      ).toMatch(/user.*shape.*:.*circle|circle.*:.*user/i);
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
    async (agent, expect) => {
      // ACTION: Send message to agent
      await agent.send(
        "Create a system architecture diagram with a container representing \"Kubernetes Cluster\" that has an icon " +
          "from https://icons.terrastruct.com/tech/167-kubernetes.svg. Inside this container, add two rectangles: " +
          "one labeled \"Pod A\" and another labeled \"Pod B\"."
      );

      // OBSERVATION: Access canvas state
      const canvas = agent.canvas;

      // ASSERTION: Check for Kubernetes Cluster container with icon
      expect(
        canvas.content,
        "Canvas should contain Kubernetes Cluster label"
      ).toContain("Kubernetes Cluster");
      expect(
        canvas.content,
        "Canvas should contain Kubernetes icon URL"
      ).toContain("https://icons.terrastruct.com/tech/167-kubernetes.svg");
      // TODO: Add assertion for Kubernetes Cluster having shape: container

      // ASSERTION: Check for nested Pod A
      expect(
        canvas.content,
        "Canvas should contain Pod A label"
      ).toContain("Pod A");

      // ASSERTION: Check for nested Pod B
      expect(
        canvas.content,
        "Canvas should contain Pod B label"
      ).toContain("Pod B");

      // TODO: Add assertion for Pod A and Pod B being children of Kubernetes Cluster
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
    async (agent, expect) => {
      // ACTION: Send message to agent
      await agent.send(
        "Create a simple diagram with a standalone image shape labeled \"Team Logo\" that displays the image " +
          "from https://icons.terrastruct.com/tech/010-user-group.svg."
      );

      // OBSERVATION: Access canvas state
      const canvas = agent.canvas;

      // ASSERTION: Check for Team Logo with shape: image
      expect(
        canvas.content,
        "Canvas should contain Team Logo label"
      ).toContain("Team Logo");
      expect(
        canvas.content,
        "Canvas should contain user group icon URL"
      ).toContain("https://icons.terrastruct.com/tech/010-user-group.svg");
      expect(
        canvas.content,
        "Canvas should contain shape: image for Team Logo"
      ).toMatch(/team.*logo.*shape.*:.*image/i);
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
    async (agent, expect) => {
      // ACTION: Send message to agent
      await agent.send(
        "Create a diagram with a rectangle labeled \"Processed Data\" that has:\n" +
          "1. An icon from https://icons.terrastruct.com/tech/021-copy.svg\n" +
          "2. A fill color of #E8F4F8\n" +
          "3. A font-color of #2C3E50\n" +
          "4. Another rectangle labeled \"Output\" connected with an arrow"
      );

      // OBSERVATION: Access canvas state
      const canvas = agent.canvas;

      // ASSERTION: Check for Processed Data with icon
      expect(
        canvas.content,
        "Canvas should contain Processed Data label"
      ).toContain("Processed Data");
      expect(
        canvas.content,
        "Canvas should contain copy/document icon URL"
      ).toContain("https://icons.terrastruct.com/tech/021-copy.svg");

      // ASSERTION: Check for fill color
      expect(
        canvas.content,
        "Canvas should contain fill color #E8F4F8"
      ).toContain("#E8F4F8");

      // ASSERTION: Check for font color
      expect(
        canvas.content,
        "Canvas should contain font color #2C3E50"
      ).toContain("#2C3E50");

      // ASSERTION: Check for Output shape
      expect(
        canvas.content,
        "Canvas should contain Output label"
      ).toContain("Output");

      // ASSERTION: Check for connection between Processed Data and Output
      expect(
        canvas.content,
        "Canvas should contain connection from Processed Data to Output"
      ).toMatch(/processed.*data.*->.*output|processed.*data.*--.*output/i);
    }
  );
});
