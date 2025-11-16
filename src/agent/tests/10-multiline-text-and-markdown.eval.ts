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
    async (agent, expect) => {
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

      const canvas = agent.canvas;

      expect(
        canvas.content,
        "Canvas should contain header 'Getting Started'",
      ).toContain("Getting Started");
      expect(
        canvas.content,
        "Canvas should contain bold 'important'",
      ).toContain("important");
      expect(
        canvas.content,
        "Canvas should contain 'Install dependencies'",
      ).toContain("Install dependencies");
      expect(
        canvas.content,
        "Canvas should contain 'Run the build'",
      ).toContain("Run the build");
      expect(
        canvas.content,
        "Canvas should contain 'Start the server'",
      ).toContain("Start the server");
    },
  );

  /**
   * Scenario 2: Shape with Markdown Label
   */
  conversation(
    "Shape with Markdown Label",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        `Create a shape labeled 'warning' that has a markdown label with the following content:

\`\`\`
**Warning:** This is *critical* information
\`\`\`
`,
      );

      const canvas = agent.canvas;

      expect(
        canvas.content,
        "Canvas should contain 'warning' shape",
      ).toContain("warning");
      expect(
        canvas.content,
        "Canvas should contain 'Warning:'",
      ).toContain("Warning:");
      expect(
        canvas.content,
        "Canvas should contain 'critical'",
      ).toContain("critical");
    },
  );

  /**
   * Scenario 3: Code Block with JavaScript
   */
  conversation(
    "Code Block with JavaScript",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        `Create a code block showing JavaScript syntax highlighting with this exact function:

\`\`\`javascript
function calculateSum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}
\`\`\`
`,
      );

      const canvas = agent.canvas;

      expect(
        canvas.content,
        "Canvas should contain function name 'calculateSum'",
      ).toContain("calculateSum");
      expect(
        canvas.content,
        "Canvas should contain parameter 'arr'",
      ).toContain("arr");
      expect(
        canvas.content,
        "Canvas should contain arrow function syntax",
      ).toContain("=>");
      expect(
        canvas.content,
        "Canvas should contain 'reduce' method",
      ).toContain("reduce");
      // TODO: Add assertions for proper indentation preservation
      // TODO: Add assertions for JavaScript syntax highlighting indication
    },
  );

  /**
   * Scenario 4: Code Block with Python
   */
  conversation(
    "Code Block with Python",
    createTestAgent,
    async (agent, expect) => {
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

      const canvas = agent.canvas;

      expect(
        canvas.content,
        "Canvas should contain function name 'process_data'",
      ).toContain("process_data");
      expect(
        canvas.content,
        "Canvas should contain for loop",
      ).toContain("for item in items");
      expect(
        canvas.content,
        "Canvas should contain append operation",
      ).toContain("append");
      expect(
        canvas.content,
        "Canvas should contain 'item * 2'",
      ).toContain("item * 2");
      // TODO: Add assertions for Python indentation preservation
      // TODO: Add assertions for Python syntax highlighting indication
    },
  );

  /**
   * Scenario 5: Code Block with SQL
   */
  conversation(
    "Code Block with SQL",
    createTestAgent,
    async (agent, expect) => {
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

      const canvas = agent.canvas;

      expect(
        canvas.content,
        "Canvas should contain SELECT keyword",
      ).toContain("SELECT");
      expect(
        canvas.content,
        "Canvas should contain FROM keyword",
      ).toContain("FROM");
      expect(
        canvas.content,
        "Canvas should contain JOIN keyword",
      ).toContain("JOIN");
      expect(
        canvas.content,
        "Canvas should contain WHERE keyword",
      ).toContain("WHERE");
      expect(
        canvas.content,
        "Canvas should contain column reference 'users.name'",
      ).toContain("users.name");
      expect(
        canvas.content,
        "Canvas should contain column reference 'orders.total'",
      ).toContain("orders.total");
      expect(
        canvas.content,
        "Canvas should contain JOIN condition",
      ).toContain("users.id = orders.user_id");
      // TODO: Add assertions for SQL syntax highlighting indication
    },
  );

  /**
   * Scenario 6: Mixed Markdown with Multiple Formatting Types
   */
  conversation(
    "Mixed Markdown with Multiple Formatting Types",
    createTestAgent,
    async (agent, expect) => {
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

      const canvas = agent.canvas;

      expect(
        canvas.content,
        "Canvas should contain header 'Setup Guide'",
      ).toContain("Setup Guide");
      expect(
        canvas.content,
        "Canvas should contain bold text 'how to setup'",
      ).toContain("how to setup");
      expect(
        canvas.content,
        "Canvas should contain 'Node.js'",
      ).toContain("Node.js");
      expect(
        canvas.content,
        "Canvas should contain inline code '18+'",
      ).toContain("18+");
      expect(
        canvas.content,
        "Canvas should contain inline code 'npm install'",
      ).toContain("npm install");
      expect(
        canvas.content,
        "Canvas should contain inline code '.env'",
      ).toContain(".env");
      expect(
        canvas.content,
        "Canvas should contain inline code 'npm start'",
      ).toContain("npm start");
      expect(
        canvas.content,
        "Canvas should contain bold 'Note:'",
      ).toContain("Note:");
      // TODO: Add assertions for numbered list structure (4 items)
      // TODO: Add assertions for empty line preservation
    },
  );

  /**
   * Scenario 7: Code Block with Special Characters
   */
  conversation(
    "Code Block with Special Characters",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        `Create a TypeScript code block with this exact code:

\`\`\`typescript
type Result = Success | Error;
const check = (x > 5) || (y < 10);
\`\`\`
`,
      );

      const canvas = agent.canvas;

      expect(
        canvas.content,
        "Canvas should contain union type syntax with pipe",
      ).toContain("Success | Error");
      expect(
        canvas.content,
        "Canvas should contain OR operator",
      ).toContain("||");
      expect(
        canvas.content,
        "Canvas should contain greater than operator",
      ).toContain(">");
      expect(
        canvas.content,
        "Canvas should contain less than operator",
      ).toContain("<");
      expect(
        canvas.content,
        "Canvas should contain 'type Result'",
      ).toContain("type Result");
      expect(
        canvas.content,
        "Canvas should contain 'const check'",
      ).toContain("const check");
      // TODO: Add assertions for TypeScript syntax highlighting indication
    },
  );

  /**
   * Scenario 8: LaTeX Code Block
   */
  conversation(
    "LaTeX Code Block",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        `Create a code block with these LaTeX formulas:

\`\`\`latex
E = mc^2

\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
\`\`\`
`,
      );

      const canvas = agent.canvas;

      expect(
        canvas.content,
        "Canvas should contain Einstein formula",
      ).toContain("E = mc^2");
      expect(
        canvas.content,
        "Canvas should contain summation notation",
      ).toContain("\\sum");
      expect(
        canvas.content,
        "Canvas should contain fraction notation",
      ).toContain("\\frac");
      // TODO: Add assertions for LaTeX commands preservation
      // TODO: Add assertions for empty line between formulas
      // TODO: Add assertions for LaTeX syntax highlighting indication
    },
  );

  /**
   * Scenario 9: Nested Markdown in Multiple Shapes
   */
  conversation(
    "Nested Markdown in Multiple Shapes",
    createTestAgent,
    async (agent, expect) => {
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

      const canvas = agent.canvas;

      expect(
        canvas.content,
        "Canvas should contain 'API Documentation'",
      ).toContain("API Documentation");
      expect(
        canvas.content,
        "Canvas should contain function 'fetchData'",
      ).toContain("fetchData");
      expect(
        canvas.content,
        "Canvas should contain 'async' keyword",
      ).toContain("async");
      expect(
        canvas.content,
        "Canvas should contain 'await' keyword",
      ).toContain("await");
      expect(
        canvas.content,
        "Canvas should contain 'fetch'",
      ).toContain("fetch");
      expect(
        canvas.content,
        "Canvas should contain 'Important:'",
      ).toContain("Important:");
      expect(
        canvas.content,
        "Canvas should contain 'Check for null values'",
      ).toContain("Check for null values");
      expect(
        canvas.content,
        "Canvas should contain 'Sanitize strings'",
      ).toContain("Sanitize strings");
      expect(
        canvas.content,
        "Canvas should contain 'Validate data types'",
      ).toContain("Validate data types");
      // TODO: Add assertions for three separate text elements
      // TODO: Add assertions for blockquote syntax (starts with >)
      // TODO: Add assertions for JavaScript syntax highlighting indication
    },
  );
});
