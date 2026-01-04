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
    async (agent) => {
      // ACTION: Send message to agent
      await agent.send(
        "Create a SQL table diagram for a users table with the following columns:\n" +
          "- id column of type int with primary_key constraint\n" +
          "- name column of type string with no constraints\n" +
          "- email column of type string with no constraints\n" +
          "- created_at column of type timestamp with no constraints"
      );

      agent.criteria(
        "The diagram shows a users table rendered as an SQL table shape.",
        "The users table includes columns id (int, primary key), name (string), email (string), and created_at (timestamp).",
        "Only the id column carries the primary key constraint; the other columns are unconstrained.",
        "No extra tables or relationships are added.",
        "The output is valid D2 and renders correctly.",
      );
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
    async (agent) => {
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

      agent.criteria(
        "The diagram includes a products table rendered as an SQL table shape.",
        "Columns appear with the requested types: product_id (int, primary key), sku (string, unique), name (string), category_id (int, foreign key), price (decimal), in_stock (boolean).",
        "Constraints match the request and are only applied to product_id, sku, and category_id.",
        "No additional tables or relationships are introduced.",
        "The output is valid D2 and renders correctly.",
      );
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
    async (agent) => {
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

      agent.criteria(
        "The diagram contains three SQL tables named authors, posts, and comments.",
        "Authors includes author_id (int, primary key), name (string), and email (string, unique).",
        "Posts includes post_id (int, primary key), title (string), content (text), author_id (int, foreign key), and created_at (timestamp).",
        "Comments includes comment_id (int, primary key), post_id (int, foreign key), author_id (int, foreign key), content (text), and created_at (timestamp).",
        "Foreign key connections link posts.author_id to authors.author_id, comments.post_id to posts.post_id, and comments.author_id to authors.author_id.",
        "No extra tables or relationships are added and the output renders as valid D2.",
      );
    },
  );
});
