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
    async (agent) => {
      await agent.send(
        "Create a diagram with three rectangles. The first rectangle should display the text 'Red Fill' and have a red fill using the CSS name 'red'. The second rectangle should display the text 'Blue Fill' and have a blue fill using hex code '#0000FF'. The third rectangle should display the text 'Green Fill' and have a green fill using hex code '#008000'."
      );

      agent.criteria(
        "The diagram shows three rectangles labeled Red Fill, Blue Fill, and Green Fill.",
        "Red Fill uses a red fill color by name, Blue Fill uses #0000FF, and Green Fill uses #008000.",
        "No connections appear between the shapes.",
      );
    }
  );

  /**
   * Test Scenario 2: Stroke Colors and Stroke Width
   */
  conversation(
    "Stroke Colors and Stroke Width",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create a diagram with three circles. The first circle should display the text 'Thin Black Stroke' and have a black stroke color and stroke width 1. The second circle should display the text 'Medium Purple Stroke' and have a purple stroke color and stroke width 5. The third circle should display the text 'Thick Navy Stroke' and have a navy stroke color and stroke width 10."
      );

      agent.criteria(
        "The diagram contains three circle shapes labeled Thin Black Stroke, Medium Purple Stroke, and Thick Navy Stroke.",
        "Each circle uses the requested stroke color and stroke width (black/1, purple/5, navy/10).",
        "No connections are present between the circles.",
      );
    }
  );

  /**
   * Test Scenario 3: Dashed Connections and Font Styling
   */
  conversation(
    "Dashed Connections and Font Styling",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create a diagram with two rectangles: one displaying the text 'Start', and one displaying the text 'End'. Connect them with a directed arrow from 'Start' to 'End' that has a dashed line style (stroke-dash value 3). Set the font size of 'Start' to 18 with font color red. Set the font size of 'End' to 14 with font color #0000FF."
      );

      agent.criteria(
        "Two rectangles labeled Start and End are present.",
        "A directed connection from Start to End is shown with a dashed line style (stroke-dash 3).",
        "Start uses font size 18 with red text; End uses font size 14 with #0000FF text.",
        "The diagram contains no extra shapes or connections beyond what was requested.",
      );
    }
  );
});
