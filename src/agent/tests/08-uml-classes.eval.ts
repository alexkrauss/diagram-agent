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
    async (agent) => {
      await agent.send(
        "Create a UML class diagram for a Person class with fields: name (string), age (integer), and email (string)"
      );

      agent.criteria(
        "The diagram includes a Person class rendered as a UML class shape.",
        "Person has fields name (string), age (int or integer), and email (string) with default visibility.",
        "No extra fields, methods, or classes are introduced.",
        "The output is valid D2 and renders correctly.",
      );
    },
  );

  /**
   * Scenario 2: Class with Methods and Return Types
   */
  conversation(
    "Class with Methods and Return Types",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create a User class with methods: getId (returns integer), getName (returns string), and login (takes username parameter which is a string, returns boolean)"
      );

      agent.criteria(
        "The diagram includes a User class rendered as a UML class shape.",
        "User defines methods getId(): int or integer, getName(): string, and login(username: string): boolean or bool.",
        "Method names, parameters, and return types match the request.",
        "No extra classes or methods are added, and the output renders as valid D2.",
      );
    },
  );

  /**
   * Scenario 3: Class with Visibility Modifiers
   */
  conversation(
    "Class with Visibility Modifiers",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create an Employee class where: name is public (string type), salary is private (float type), department is protected (string type), and employeeId has default visibility (int type)"
      );

      agent.criteria(
        "The diagram includes an Employee class rendered as a UML class shape.",
        "Employee fields use the requested visibility: +name (string), -salary (float), #department (string), and employeeId (int or integer) with default visibility.",
        "Visibility modifiers and types align with the prompt.",
        "The output is valid D2 and renders correctly.",
      );
    },
  );

  /**
   * Scenario 4: Complex Class with Fields, Methods, and Mixed Visibility
   */
  conversation(
    "Complex Class with Fields, Methods, and Mixed Visibility",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create a BankAccount class with: private field accountNumber (string type), private field balance (float type), public method deposit that takes parameter amount (float type) and returns void, public method getBalance that takes no parameters and returns float, and a protected method calculateInterest that takes parameter rate (float type) and returns float"
      );

      agent.criteria(
        "The diagram includes a BankAccount class rendered as a UML class shape.",
        "Private fields accountNumber (string) and balance (float) are present.",
        "Public methods deposit(amount: float): void and getBalance(): float are present.",
        "A protected method calculateInterest(rate: float): float is present.",
        "Visibility modifiers, parameters, and return types align with the request, and the output renders as valid D2.",
      );
    },
  );

  /**
   * Scenario 5: Multiple Classes with Inheritance and Relationships
   */
  conversation(
    "Multiple Classes with Inheritance and Relationships",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create a class diagram with: a base class Animal with field name (string type) and field age (int type), and methods eat() that returns void and sleep() that returns void; a Dog class that inherits from Animal with an additional method bark() that returns void; a Cat class that inherits from Animal with an additional method meow() that returns void"
      );

      agent.criteria(
        "The diagram includes UML classes Animal, Dog, and Cat.",
        "Animal has fields name (string) and age (int or integer) plus methods eat(): void and sleep(): void.",
        "Dog adds bark(): void and inherits from Animal.",
        "Cat adds meow(): void and inherits from Animal.",
        "Inheritance relationships are shown from Dog to Animal and Cat to Animal, and the diagram renders as valid D2.",
      );
    },
  );

  /**
   * Scenario 6: Mixed Scenario with Complex Types and Relationships
   */
  conversation(
    "Mixed Scenario with Complex Types and Relationships",
    createTestAgent,
    async (agent) => {
      await agent.send(
        "Create a class diagram showing: a Product class with field sku (string type), field name (string type), field price (float type), and method calculateTax that takes parameter rate (float type) and returns float; an Order class with field orderId (int type), field items (array type), field totalAmount (float type), method addItem() that returns void, and method getTotal() that returns float; show that Order contains Products with a relationship"
      );

      agent.criteria(
        "The diagram includes UML classes Product and Order.",
        "Product has fields sku (string), name (string), price (float), and a method calculateTax(rate: float): float.",
        "Order has fields orderId (int or integer), items (array), totalAmount (float), and methods addItem(): void and getTotal(): float.",
        "A relationship shows Order contains or references Product.",
        "No extra classes are introduced and the output renders as valid D2.",
      );
    },
  );
});
