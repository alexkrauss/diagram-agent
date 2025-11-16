/**
 * Benchmark: UML Class Diagrams
 *
 * Tests the agent's ability to create UML class diagrams using the `class` shape in D2.
 * Validates class shape declaration, field definitions, method definitions, visibility modifiers,
 * and relationships between classes.
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

describe("DiagramAgent - UML Class Diagrams", () => {
  /**
   * Scenario 1: Simple Class with Typed Fields
   */
  conversation(
    "Simple Class with Typed Fields",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a UML class diagram for a Person class with fields: name (string), age (integer), and email (string)"
      );

      const canvas = agent.canvas;

      expect(canvas.content, "Canvas should contain Person class").toContain("Person");
      expect(canvas.content, "Canvas should declare shape: class").toContain("shape: class");
      expect(canvas.content, "Canvas should contain name field").toContain("name");
      expect(canvas.content, "Canvas should contain age field").toContain("age");
      expect(canvas.content, "Canvas should contain email field").toContain("email");
      expect(canvas.content, "Canvas should contain string type").toContain("string");
      // TODO: Add assertions for correct field-type associations (name: string, age: int, email: string)
    },
  );

  /**
   * Scenario 2: Class with Methods and Return Types
   */
  conversation(
    "Class with Methods and Return Types",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a User class with methods: getId (returns integer), getName (returns string), and login (takes username parameter which is a string, returns boolean)"
      );

      const canvas = agent.canvas;

      expect(canvas.content, "Canvas should contain User class").toContain("User");
      expect(canvas.content, "Canvas should declare shape: class").toContain("shape: class");
      expect(canvas.content, "Canvas should contain getId method").toContain("getId");
      expect(canvas.content, "Canvas should contain getName method").toContain("getName");
      expect(canvas.content, "Canvas should contain login method").toContain("login");
      expect(canvas.content, "Canvas should contain username parameter").toContain("username");
      // TODO: Add assertions for method signatures with return types (getId(): int, getName(): string, login(username: string): bool)
    },
  );

  /**
   * Scenario 3: Class with Visibility Modifiers
   */
  conversation(
    "Class with Visibility Modifiers",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create an Employee class where: name is public (string type), salary is private (float type), department is protected (string type), and employeeId has default visibility (int type)"
      );

      const canvas = agent.canvas;

      expect(canvas.content, "Canvas should contain Employee class").toContain("Employee");
      expect(canvas.content, "Canvas should declare shape: class").toContain("shape: class");
      expect(canvas.content, "Canvas should contain name field").toContain("name");
      expect(canvas.content, "Canvas should contain salary field").toContain("salary");
      expect(canvas.content, "Canvas should contain department field").toContain("department");
      expect(canvas.content, "Canvas should contain employeeId field").toContain("employeeId");
      expect(canvas.content, "Canvas should contain public modifier +").toContain("+");
      expect(canvas.content, "Canvas should contain private modifier -").toContain("-");
      expect(canvas.content, "Canvas should contain protected modifier #").toContain("#");
      // TODO: Add assertions for correct visibility prefixes (+name, -salary, #department, employeeId without prefix)
    },
  );

  /**
   * Scenario 4: Complex Class with Fields, Methods, and Mixed Visibility
   */
  conversation(
    "Complex Class with Fields, Methods, and Mixed Visibility",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a BankAccount class with: private field accountNumber (string type), private field balance (float type), public method deposit that takes parameter amount (float type) and returns void, public method getBalance that takes no parameters and returns float, and a protected method calculateInterest that takes parameter rate (float type) and returns float"
      );

      const canvas = agent.canvas;

      expect(canvas.content, "Canvas should contain BankAccount class").toContain("BankAccount");
      expect(canvas.content, "Canvas should declare shape: class").toContain("shape: class");
      expect(canvas.content, "Canvas should contain accountNumber field").toContain("accountNumber");
      expect(canvas.content, "Canvas should contain balance field").toContain("balance");
      expect(canvas.content, "Canvas should contain deposit method").toContain("deposit");
      expect(canvas.content, "Canvas should contain getBalance method").toContain("getBalance");
      expect(canvas.content, "Canvas should contain calculateInterest method").toContain("calculateInterest");
      expect(canvas.content, "Canvas should contain amount parameter").toContain("amount");
      expect(canvas.content, "Canvas should contain rate parameter").toContain("rate");
      // TODO: Add assertions for correct visibility modifiers on fields and methods
      // TODO: Add assertions for method signatures with parameters and return types
    },
  );

  /**
   * Scenario 5: Multiple Classes with Inheritance and Relationships
   */
  conversation(
    "Multiple Classes with Inheritance and Relationships",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a class diagram with: a base class Animal with field name (string type) and field age (int type), and methods eat() that returns void and sleep() that returns void; a Dog class that inherits from Animal with an additional method bark() that returns void; a Cat class that inherits from Animal with an additional method meow() that returns void"
      );

      const canvas = agent.canvas;

      expect(canvas.content, "Canvas should contain Animal class").toContain("Animal");
      expect(canvas.content, "Canvas should contain Dog class").toContain("Dog");
      expect(canvas.content, "Canvas should contain Cat class").toContain("Cat");
      expect(canvas.content, "Canvas should declare shape: class").toContain("shape: class");
      expect(canvas.content, "Canvas should contain name field").toContain("name");
      expect(canvas.content, "Canvas should contain age field").toContain("age");
      expect(canvas.content, "Canvas should contain eat method").toContain("eat");
      expect(canvas.content, "Canvas should contain sleep method").toContain("sleep");
      expect(canvas.content, "Canvas should contain bark method").toContain("bark");
      expect(canvas.content, "Canvas should contain meow method").toContain("meow");
      // TODO: Add assertions for inheritance relationships (Dog -> Animal, Cat -> Animal)
      // TODO: Add assertions for correct method signatures with parentheses and return types
    },
  );

  /**
   * Scenario 6: Mixed Scenario with Complex Types and Relationships
   */
  conversation(
    "Mixed Scenario with Complex Types and Relationships",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a class diagram showing: a Product class with field sku (string type), field name (string type), field price (float type), and method calculateTax that takes parameter rate (float type) and returns float; an Order class with field orderId (int type), field items (array type), field totalAmount (float type), method addItem() that returns void, and method getTotal() that returns float; show that Order contains Products with a relationship"
      );

      const canvas = agent.canvas;

      expect(canvas.content, "Canvas should contain Product class").toContain("Product");
      expect(canvas.content, "Canvas should contain Order class").toContain("Order");
      expect(canvas.content, "Canvas should declare shape: class").toContain("shape: class");
      expect(canvas.content, "Canvas should contain sku field").toContain("sku");
      expect(canvas.content, "Canvas should contain price field").toContain("price");
      expect(canvas.content, "Canvas should contain calculateTax method").toContain("calculateTax");
      expect(canvas.content, "Canvas should contain orderId field").toContain("orderId");
      expect(canvas.content, "Canvas should contain items field").toContain("items");
      expect(canvas.content, "Canvas should contain totalAmount field").toContain("totalAmount");
      expect(canvas.content, "Canvas should contain addItem method").toContain("addItem");
      expect(canvas.content, "Canvas should contain getTotal method").toContain("getTotal");
      // TODO: Add assertions for relationship between Order and Product
      // TODO: Add assertions for array type on items field
      // TODO: Add assertions for method signatures with parameters and return types
    },
  );
});
