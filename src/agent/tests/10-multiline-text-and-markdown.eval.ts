/**
 * Benchmark: Multiline Text and Markdown
 *
 * Tests the agent's ability to create multi-line text blocks and markdown content
 * in D2 diagrams. Validates proper handling of markdown formatting, code blocks,
 * and special characters.
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

describe("Benchmark: Multiline Text and Markdown", () => {
  /**
   * Scenario 1: Standalone Markdown Text Block
   */
  conversation(
    "Standalone Markdown Text Block",
    createTestAgent,
    async (agent) => {
      await agent.send(
        `Create a diagram with a standalone markdown text block with the following content:

\`\`\`
# Getting Started
Follow these **important** steps:
- Install dependencies
- Run the build
- Start the server
\`\`\`
`,
      );

      agent.criteria(
        "A standalone markdown text block is present with the Getting Started header.",
        "The block includes the bold emphasis on important and the three bullet steps for install, build, and start.",
        "Formatting is preserved as markdown rather than converted to plain prose.",
        "The diagram renders as valid D2.",
      );
    },
  );

  /**
   * Scenario 2: Shape with Markdown Label
   */
  conversation(
    "Shape with Markdown Label",
    createTestAgent,
    async (agent) => {
      await agent.send(
        `Create a shape labeled 'warning' that has a markdown label with the following content:

\`\`\`
**Warning:** This is *critical* information
\`\`\`
`,
      );

      agent.criteria(
        "A shape labeled warning exists with a markdown label.",
        "The label includes bold Warning: and italic emphasis on critical.",
        "The markdown is preserved as inline formatting.",
        "The diagram renders as valid D2.",
      );
    },
  );

  /**
   * Scenario 3: Code Block with JavaScript
   */
  conversation(
    "Code Block with JavaScript",
    createTestAgent,
    async (agent) => {
      await agent.send(
        `Create a code block showing JavaScript syntax highlighting with this exact function:

\`\`\`javascript
function calculateSum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}
\`\`\`
`,
      );

      agent.criteria(
        "A JavaScript code block is shown with the calculateSum function exactly as specified.",
        "The code block preserves the reduce call, arrow function syntax, and parameter names.",
        "The formatting remains a code block with JavaScript context.",
        "The diagram renders as valid D2.",
      );
    },
  );

  /**
   * Scenario 4: Code Block with Python
   */
  conversation(
    "Code Block with Python",
    createTestAgent,
    async (agent) => {
      await agent.send(
        `Add a Python code snippet to the diagram with this exact function:

\`\`\`python
def process_data(items):
  results = []
  for item in items:
    results.append(item * 2)
  return results
\`\`\`
`,
      );

      agent.criteria(
        "A Python code block shows the process_data function exactly as specified.",
        "The code includes the for loop, append call, and item * 2 operation.",
        "Indentation and code block formatting are preserved.",
        "The diagram renders as valid D2.",
      );
    },
  );

  /**
   * Scenario 5: Code Block with SQL
   */
  conversation(
    "Code Block with SQL",
    createTestAgent,
    async (agent) => {
      await agent.send(
        `Create a code block with this SQL query:

\`\`\`sql
SELECT users.name, orders.total
FROM users
JOIN orders ON users.id = orders.user_id
WHERE orders.total > 100
\`\`\`
`,
      );

      agent.criteria(
        "An SQL code block contains the SELECT, FROM, JOIN, and WHERE query exactly as specified.",
        "The query references users.name, orders.total, and the join condition users.id = orders.user_id.",
        "The formatting remains a code block with SQL context.",
        "The diagram renders as valid D2.",
      );
    },
  );

  /**
   * Scenario 6: Mixed Markdown with Multiple Formatting Types
   */
  conversation(
    "Mixed Markdown with Multiple Formatting Types",
    createTestAgent,
    async (agent) => {
      await agent.send(
        `Create a text block with markdown containing this exact content:

\`\`\`
# Setup Guide

This guide explains **how to setup** the environment:

1. Install *Node.js* with version \`18+\`
2. Run \`npm install\` to get dependencies
3. Configure the \`.env\` file
4. Start the server with \`npm start\`

**Note:** This is required for production.
\`\`\`
`,
      );

      agent.criteria(
        "The markdown block includes the Setup Guide header and preserves bold, italic, and inline code formatting.",
        "The numbered list contains the four setup steps with the specified inline code snippets.",
        "The Note line appears in bold and the content matches the request.",
        "Formatting remains markdown with line breaks preserved.",
        "The diagram renders as valid D2.",
      );
    },
  );

  /**
   * Scenario 7: Code Block with Special Characters
   */
  conversation(
    "Code Block with Special Characters",
    createTestAgent,
    async (agent) => {
      await agent.send(
        `Create a TypeScript code block with this exact code:

\`\`\`typescript
type Result = Success | Error;
const check = (x > 5) || (y < 10);
\`\`\`
`,
      );

      agent.criteria(
        "A TypeScript code block contains the Result union type and the check expression exactly as specified.",
        "Special characters (|, ||, >, <) are preserved in the code block.",
        "The block is formatted as TypeScript with code block styling.",
        "The diagram renders as valid D2.",
      );
    },
  );

  /**
   * Scenario 8: LaTeX Code Block
   */
  conversation(
    "LaTeX Code Block",
    createTestAgent,
    async (agent) => {
      await agent.send(
        `Create a code block with these LaTeX formulas:

\`\`\`latex
E = mc^2

\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
\`\`\`
`,
      );

      agent.criteria(
        "A LaTeX code block contains the E = mc^2 formula and the summation equation.",
        "LaTeX commands like \\sum and \\frac are preserved.",
        "The empty line between formulas is maintained.",
        "The diagram renders as valid D2.",
      );
    },
  );

  /**
   * Scenario 9: Nested Markdown in Multiple Shapes
   */
  conversation(
    "Nested Markdown in Multiple Shapes",
    createTestAgent,
    async (agent) => {
      await agent.send(
        `Create a diagram with three text shapes:

First shape with this markdown:
\`\`\`
# API Documentation
\`\`\`

Second shape with this JavaScript code:
\`\`\`javascript
async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}
\`\`\`

Third shape with this markdown:
\`\`\`
> **Important:** Always validate input before processing

- Check for null values
- Sanitize strings
- Validate data types
\`\`\`
`,
      );

      agent.criteria(
        "Three separate text shapes are present: a markdown header for API Documentation, a JavaScript code block for fetchData, and a markdown blockquote with a checklist.",
        "The JavaScript block preserves async/await usage and the fetch call.",
        "The markdown blockquote includes the Important note and the three bullet items.",
        "Markdown and code formatting are preserved across all shapes.",
        "The diagram renders as valid D2.",
      );
    },
  );
});
