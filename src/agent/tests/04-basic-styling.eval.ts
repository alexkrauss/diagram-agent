/**
 * Benchmark: Basic Styling
 *
 * Test the agent's ability to apply basic styling to shapes and connections,
 * including fill colors, stroke properties, and font styling.
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

describe("Benchmark 04 - Basic Styling", () => {
  /**
   * Test Scenario 1: Shape Fill Colors (CSS Names and Hex Codes)
   */
  conversation(
    "Shape Fill Colors (CSS Names and Hex Codes)",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a diagram with three rectangles. The first rectangle should display the text 'Red Fill' and have a red fill using the CSS name 'red'. The second rectangle should display the text 'Blue Fill' and have a blue fill using hex code '#0000FF'. The third rectangle should display the text 'Green Fill' and have a green fill using hex code '#008000'."
      );

      const canvas = agent.canvas;

      // Check that all three rectangles with labels exist
      expect(
        canvas.content,
        "Canvas should contain Red Fill label"
      ).toContain("Red Fill");
      expect(
        canvas.content,
        "Canvas should contain Blue Fill label"
      ).toContain("Blue Fill");
      expect(
        canvas.content,
        "Canvas should contain Green Fill label"
      ).toContain("Green Fill");

      // TODO: Add assertions for fill colors (red, #0000FF, #008000)
      // TODO: Add assertion that exactly three shapes exist
      // TODO: Add assertion that no connections exist
    }
  );

  /**
   * Test Scenario 2: Stroke Colors and Stroke Width
   */
  conversation(
    "Stroke Colors and Stroke Width",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a diagram with three circles. The first circle should display the text 'Thin Black Stroke' and have a black stroke color and stroke width 1. The second circle should display the text 'Medium Purple Stroke' and have a purple stroke color and stroke width 5. The third circle should display the text 'Thick Navy Stroke' and have a navy stroke color and stroke width 10."
      );

      const canvas = agent.canvas;

      // Check that all three circles with labels exist
      expect(
        canvas.content,
        "Canvas should contain Thin Black Stroke label"
      ).toContain("Thin Black Stroke");
      expect(
        canvas.content,
        "Canvas should contain Medium Purple Stroke label"
      ).toContain("Medium Purple Stroke");
      expect(
        canvas.content,
        "Canvas should contain Thick Navy Stroke label"
      ).toContain("Thick Navy Stroke");

      // Check that shapes are circles
      // TODO: Add assertions for circle shape property
      // TODO: Add assertions for stroke colors (black, purple, navy)
      // TODO: Add assertions for stroke widths (1, 5, 10)
      // TODO: Add assertion that no connections exist
    }
  );

  /**
   * Test Scenario 3: Dashed Connections and Font Styling
   */
  conversation(
    "Dashed Connections and Font Styling",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a diagram with two rectangles: one displaying the text 'Start', and one displaying the text 'End'. Connect them with a directed arrow from 'Start' to 'End' that has a dashed line style (stroke-dash value 3). Set the font size of 'Start' to 18 with font color red. Set the font size of 'End' to 14 with font color #0000FF."
      );

      const canvas = agent.canvas;

      // Check that both rectangles exist
      expect(
        canvas.content,
        "Canvas should contain Start label"
      ).toContain("Start");
      expect(
        canvas.content,
        "Canvas should contain End label"
      ).toContain("End");

      // Check that a connection exists from Start to End
      expect(
        canvas.content,
        "Canvas should contain a connection from Start to End"
      ).toMatch(/start.*->.*end/i);

      // TODO: Add assertion for dashed line style (stroke-dash: 3)
      // TODO: Add assertion for Start font size 18 and font color red
      // TODO: Add assertion for End font size 14 and font color #0000FF
    }
  );
});
