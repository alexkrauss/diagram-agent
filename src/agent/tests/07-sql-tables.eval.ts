/**
 * Benchmark tests for SQL Tables and Entity-Relationship Diagrams.
 *
 * Tests the agent's ability to create entity-relationship diagrams (ERDs) using
 * D2's `sql_table` shape. Validates proper implementation of:
 * - SQL table shape declaration and syntax
 * - Column definitions with proper types
 * - SQL constraints (primary_key, foreign_key, unique)
 * - Foreign key connections between tables
 * - Multiple tables with relationships in a single diagram
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

describe("SQL Tables and Entity-Relationship Diagrams", () => {
  /**
   * Scenario 1: Simple Single Table with Basic Columns and Types
   *
   * A single database table with multiple columns of different types and a primary key constraint.
   */
  conversation(
    "Simple single table with basic columns and types",
    createTestAgent,
    async (agent, expect) => {
      // ACTION: Send message to agent
      await agent.send(
        "Create a SQL table diagram for a users table with the following columns:\n" +
          "- id column of type int with primary_key constraint\n" +
          "- name column of type string with no constraints\n" +
          "- email column of type string with no constraints\n" +
          "- created_at column of type timestamp with no constraints"
      );

      // OBSERVATION: Access canvas state
      const canvas = agent.canvas;

      // ASSERTION: Use custom expect for recording
      expect(canvas.content, "Canvas should contain sql_table shape").toContain(
        "sql_table"
      );
      expect(canvas.content, "Canvas should contain users table").toContain(
        "users"
      );
      expect(canvas.content, "Canvas should contain id column with int type").toContain(
        "id"
      );
      expect(canvas.content, "Canvas should contain int type").toContain(
        "int"
      );
      expect(canvas.content, "Canvas should contain primary_key constraint").toContain(
        "primary_key"
      );
      expect(canvas.content, "Canvas should contain name column").toContain(
        "name"
      );
      expect(canvas.content, "Canvas should contain string type").toContain(
        "string"
      );
      expect(canvas.content, "Canvas should contain email column").toContain(
        "email"
      );
      expect(canvas.content, "Canvas should contain created_at column").toContain(
        "created_at"
      );
      expect(canvas.content, "Canvas should contain timestamp type").toContain(
        "timestamp"
      );
      expect(
        canvas.content.trim().length,
        "Canvas should not be empty",
      ).toBeGreaterThan(0);
    },
  );

  /**
   * Scenario 2: Table with Multiple Constraints
   *
   * A single table demonstrating different constraint types including primary key,
   * unique, and foreign key.
   */
  conversation(
    "Table with multiple constraints",
    createTestAgent,
    async (agent, expect) => {
      // ACTION: Send message to agent
      await agent.send(
        "Create a SQL table diagram for a products table with the following columns:\n" +
          "- product_id column of type int with primary_key constraint\n" +
          "- sku column of type string with unique constraint\n" +
          "- name column of type string with no constraints\n" +
          "- category_id column of type int with foreign_key constraint\n" +
          "- price column of type decimal with no constraints\n" +
          "- in_stock column of type boolean with no constraints"
      );

      // OBSERVATION: Access canvas state
      const canvas = agent.canvas;

      // ASSERTION: Use custom expect for recording
      expect(canvas.content, "Canvas should contain sql_table shape").toContain(
        "sql_table"
      );
      expect(canvas.content, "Canvas should contain products table").toContain(
        "products"
      );
      expect(canvas.content, "Canvas should contain product_id column").toContain(
        "product_id"
      );
      expect(canvas.content, "Canvas should contain primary_key constraint").toContain(
        "primary_key"
      );
      expect(canvas.content, "Canvas should contain sku column").toContain(
        "sku"
      );
      expect(canvas.content, "Canvas should contain unique constraint").toContain(
        "unique"
      );
      expect(canvas.content, "Canvas should contain name column").toContain(
        "name"
      );
      expect(canvas.content, "Canvas should contain category_id column").toContain(
        "category_id"
      );
      expect(canvas.content, "Canvas should contain foreign_key constraint").toContain(
        "foreign_key"
      );
      expect(canvas.content, "Canvas should contain price column").toContain(
        "price"
      );
      expect(canvas.content, "Canvas should contain decimal type").toContain(
        "decimal"
      );
      expect(canvas.content, "Canvas should contain in_stock column").toContain(
        "in_stock"
      );
      expect(canvas.content, "Canvas should contain boolean type").toContain(
        "boolean"
      );
      expect(
        canvas.content.trim().length,
        "Canvas should not be empty",
      ).toBeGreaterThan(0);
    },
  );

  /**
   * Scenario 3: Multiple Tables with Foreign Key Relationships
   *
   * Multiple related tables demonstrating a typical database schema with foreign
   * key connections between tables.
   */
  conversation(
    "Multiple tables with foreign key relationships",
    createTestAgent,
    async (agent, expect) => {
      // ACTION: Send message to agent
      await agent.send(
        "Create an entity-relationship diagram for a blog database with the following tables and columns:\n\n" +
          "Table: authors\n" +
          "- author_id column of type int with primary_key constraint\n" +
          "- name column of type string with no constraints\n" +
          "- email column of type string with unique constraint\n\n" +
          "Table: posts\n" +
          "- post_id column of type int with primary_key constraint\n" +
          "- title column of type string with no constraints\n" +
          "- content column of type text with no constraints\n" +
          "- author_id column of type int with foreign_key constraint\n" +
          "- created_at column of type timestamp with no constraints\n\n" +
          "Table: comments\n" +
          "- comment_id column of type int with primary_key constraint\n" +
          "- post_id column of type int with foreign_key constraint\n" +
          "- author_id column of type int with foreign_key constraint\n" +
          "- content column of type text with no constraints\n" +
          "- created_at column of type timestamp with no constraints\n\n" +
          "Show the following foreign key relationships with connections:\n" +
          "- posts.author_id connects to authors.author_id\n" +
          "- comments.post_id connects to posts.post_id\n" +
          "- comments.author_id connects to authors.author_id"
      );

      // OBSERVATION: Access canvas state
      const canvas = agent.canvas;

      // ASSERTION: Use custom expect for recording
      expect(canvas.content, "Canvas should contain sql_table shape").toContain(
        "sql_table"
      );

      // Check authors table
      expect(canvas.content, "Canvas should contain authors table").toContain(
        "authors"
      );
      expect(canvas.content, "Canvas should contain author_id column").toContain(
        "author_id"
      );
      expect(canvas.content, "Canvas should contain primary_key constraint").toContain(
        "primary_key"
      );
      expect(canvas.content, "Canvas should contain unique constraint").toContain(
        "unique"
      );

      // Check posts table
      expect(canvas.content, "Canvas should contain posts table").toContain(
        "posts"
      );
      expect(canvas.content, "Canvas should contain post_id column").toContain(
        "post_id"
      );
      expect(canvas.content, "Canvas should contain title column").toContain(
        "title"
      );
      expect(canvas.content, "Canvas should contain content column").toContain(
        "content"
      );
      expect(canvas.content, "Canvas should contain text type").toContain(
        "text"
      );
      expect(canvas.content, "Canvas should contain created_at column").toContain(
        "created_at"
      );
      expect(canvas.content, "Canvas should contain timestamp type").toContain(
        "timestamp"
      );

      // Check comments table
      expect(canvas.content, "Canvas should contain comments table").toContain(
        "comments"
      );
      expect(canvas.content, "Canvas should contain comment_id column").toContain(
        "comment_id"
      );
      expect(canvas.content, "Canvas should contain foreign_key constraint").toContain(
        "foreign_key"
      );

      // Check foreign key connections
      // TODO: Add assertions for foreign key connections (posts.author_id -> authors.author_id)
      // TODO: Add assertions for foreign key connections (comments.post_id -> posts.post_id)
      // TODO: Add assertions for foreign key connections (comments.author_id -> authors.author_id)

      expect(
        canvas.content.trim().length,
        "Canvas should not be empty",
      ).toBeGreaterThan(0);
    },
  );
});
