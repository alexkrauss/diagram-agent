/**
 * Component Diagrams Benchmark Tests
 *
 * Tests the agent's ability to create component and architecture diagrams
 * using nested containers (boxes) and connections (arrows).
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

describe("Component Diagrams Benchmark", () => {
  /**
   * Scenario 1: Simple 3-Tier Architecture
   * Tests basic multi-level architecture with linear connections
   */
  conversation(
    "Simple 3-Tier Architecture",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a 3-tier architecture diagram with exactly three shapes:\n" +
        "- A shape labeled \"Frontend\"\n" +
        "- A shape labeled \"Backend\"\n" +
        "- A shape labeled \"Database\"\n\n" +
        "Add two connections:\n" +
        "- From Frontend to Backend with label \"HTTP requests\"\n" +
        "- From Backend to Database with label \"SQL queries\"\n\n" +
        "All shapes should be rectangles."
      );

      const canvas = agent.canvas;

      // Check that all three shapes exist with correct labels
      expect(canvas.content, "Canvas should contain Frontend").toContain("Frontend");
      expect(canvas.content, "Canvas should contain Backend").toContain("Backend");
      expect(canvas.content, "Canvas should contain Database").toContain("Database");

      // Check connections exist (using D2 arrow syntax)
      expect(canvas.content, "Connection from Frontend to Backend should exist").toMatch(
        /Frontend.*->.*Backend/s
      );
      expect(canvas.content, "Connection from Backend to Database should exist").toMatch(
        /Backend.*->.*Database/s
      );

      // Check connection labels
      expect(canvas.content, "Frontend to Backend connection should have label").toContain(
        "HTTP requests"
      );
      expect(canvas.content, "Backend to Database connection should have label").toContain(
        "SQL queries"
      );

      // TODO: Add assertions for:
      // - All shapes are rectangles (shape: rectangle)
      // - Connections are unidirectional (not bidirectional <->)
    },
  );

  /**
   * Scenario 2: Microservices Architecture
   * Tests nested containers with multiple levels and cross-container connections
   */
  conversation(
    "Microservices Architecture",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a microservices architecture diagram with the following structure:\n\n" +
        "Top-level shapes:\n" +
        "- Shape labeled \"API Gateway\" (rectangle)\n" +
        "- Shape labeled \"Payment Gateway\" (rectangle)\n\n" +
        "Container labeled \"Services\" containing:\n" +
        "- Shape labeled \"User Service\"\n" +
        "- Shape labeled \"Product Service\"\n" +
        "- Shape labeled \"Order Service\"\n\n" +
        "Container labeled \"Data Layer\" containing:\n" +
        "- Shape labeled \"User Database\"\n" +
        "- Shape labeled \"Product Database\"\n" +
        "- Shape labeled \"Shared Cache\"\n\n" +
        "Add these connections:\n" +
        "- From API Gateway to User Service with label \"route\"\n" +
        "- From API Gateway to Product Service with label \"route\"\n" +
        "- From API Gateway to Order Service with label \"route\"\n" +
        "- From User Service to User Database with label \"query\"\n" +
        "- From Product Service to Product Database with label \"query\"\n" +
        "- From Order Service to Payment Gateway with label \"process payment\"\n" +
        "- From User Service to Shared Cache with label \"read/write\"\n" +
        "- From Product Service to Shared Cache with label \"read/write\"\n" +
        "- From Order Service to Shared Cache with label \"read/write\""
      );

      const canvas = agent.canvas;

      // Check containers exist
      expect(canvas.content, "Canvas should contain Services container").toContain("Services");
      expect(canvas.content, "Canvas should contain Data Layer container").toContain("Data Layer");

      // Check top-level shapes
      expect(canvas.content, "Canvas should contain API Gateway").toContain("API Gateway");
      expect(canvas.content, "Canvas should contain Payment Gateway").toContain("Payment Gateway");

      // Check Services container children
      expect(canvas.content, "Canvas should contain User Service").toContain("User Service");
      expect(canvas.content, "Canvas should contain Product Service").toContain("Product Service");
      expect(canvas.content, "Canvas should contain Order Service").toContain("Order Service");

      // Check Data Layer container children
      expect(canvas.content, "Canvas should contain User Database").toContain("User Database");
      expect(canvas.content, "Canvas should contain Product Database").toContain("Product Database");
      expect(canvas.content, "Canvas should contain Shared Cache").toContain("Shared Cache");

      // Check key connections exist
      expect(canvas.content, "Connection from API Gateway to User Service should exist").toMatch(
        /API Gateway.*->.*User Service/s
      );
      expect(canvas.content, "Connection from User Service to User Database should exist").toMatch(
        /User Service.*->.*User Database/s
      );
      expect(canvas.content, "Connection from Order Service to Payment Gateway should exist").toMatch(
        /Order Service.*->.*Payment Gateway/s
      );

      // Check connection labels
      expect(canvas.content, "Should contain route label").toContain("route");
      expect(canvas.content, "Should contain query label").toContain("query");
      expect(canvas.content, "Should contain process payment label").toContain("process payment");
      expect(canvas.content, "Should contain read/write label").toContain("read/write");

      // TODO: Add assertions for:
      // - Containers have exactly the right number of children (3 each)
      // - All specified connections are present (9 total)
      // - Shapes are at correct nesting levels (top-level vs inside containers)
      // - All connections are unidirectional
      // - All connection labels are correctly placed
    },
  );

  /**
   * Scenario 3: Cloud Architecture with Multi-Region Deployment
   * Tests symmetric nested structures with parallel hierarchies and shared connections
   */
  conversation(
    "Cloud Architecture with Multi-Region Deployment",
    createTestAgent,
    async (agent, expect) => {
      await agent.send(
        "Create a cloud architecture diagram with the following structure:\n\n" +
        "Top-level shapes:\n" +
        "- Shape labeled \"CDN\" (rectangle)\n" +
        "- Shape labeled \"Monitoring Service\" (rectangle)\n\n" +
        "Container labeled \"US-East Region\" containing:\n" +
        "- Shape labeled \"Load Balancer\"\n" +
        "- Shape labeled \"Web Cluster\"\n" +
        "- Shape labeled \"App Cluster\"\n\n" +
        "Container labeled \"EU-West Region\" containing:\n" +
        "- Shape labeled \"Load Balancer\"\n" +
        "- Shape labeled \"Web Cluster\"\n" +
        "- Shape labeled \"App Cluster\"\n\n" +
        "Container labeled \"Data Center\" containing:\n" +
        "- Shape labeled \"Database\"\n\n" +
        "Add these connections:\n" +
        "- From CDN to the Load Balancer in US-East Region with label \"route traffic\"\n" +
        "- From CDN to the Load Balancer in EU-West Region with label \"route traffic\"\n" +
        "- From Load Balancer to Web Cluster (within US-East Region) with label \"forward\"\n" +
        "- From Web Cluster to App Cluster (within US-East Region) with label \"API call\"\n" +
        "- From Load Balancer to Web Cluster (within EU-West Region) with label \"forward\"\n" +
        "- From Web Cluster to App Cluster (within EU-West Region) with label \"API call\"\n" +
        "- From App Cluster in US-East Region to Database with label \"SQL query\"\n" +
        "- From App Cluster in EU-West Region to Database with label \"SQL query\"\n" +
        "- From Load Balancer in US-East Region to Monitoring Service with label \"metrics\"\n" +
        "- From Load Balancer in EU-West Region to Monitoring Service with label \"metrics\""
      );

      const canvas = agent.canvas;

      // Check containers exist
      expect(canvas.content, "Canvas should contain US-East Region container").toContain("US-East Region");
      expect(canvas.content, "Canvas should contain EU-West Region container").toContain("EU-West Region");
      expect(canvas.content, "Canvas should contain Data Center container").toContain("Data Center");

      // Check top-level shapes
      expect(canvas.content, "Canvas should contain CDN").toContain("CDN");
      expect(canvas.content, "Canvas should contain Monitoring Service").toContain("Monitoring Service");

      // Check US-East Region children
      expect(canvas.content, "Canvas should contain Load Balancer").toContain("Load Balancer");
      expect(canvas.content, "Canvas should contain Web Cluster").toContain("Web Cluster");
      expect(canvas.content, "Canvas should contain App Cluster").toContain("App Cluster");

      // Check Data Center child
      expect(canvas.content, "Canvas should contain Database").toContain("Database");

      // Check key connections exist
      expect(canvas.content, "Connection from CDN to Load Balancer should exist").toMatch(
        /CDN.*->.*Load Balancer/s
      );
      expect(canvas.content, "Connection from Load Balancer to Web Cluster should exist").toMatch(
        /Load Balancer.*->.*Web Cluster/s
      );
      expect(canvas.content, "Connection from Web Cluster to App Cluster should exist").toMatch(
        /Web Cluster.*->.*App Cluster/s
      );
      expect(canvas.content, "Connection from App Cluster to Database should exist").toMatch(
        /App Cluster.*->.*Database/s
      );
      expect(canvas.content, "Connection from Load Balancer to Monitoring Service should exist").toMatch(
        /Load Balancer.*->.*Monitoring Service/s
      );

      // Check connection labels
      expect(canvas.content, "Should contain route traffic label").toContain("route traffic");
      expect(canvas.content, "Should contain forward label").toContain("forward");
      expect(canvas.content, "Should contain API call label").toContain("API call");
      expect(canvas.content, "Should contain SQL query label").toContain("SQL query");
      expect(canvas.content, "Should contain metrics label").toContain("metrics");

      // TODO: Add assertions for:
      // - Both regional containers have exactly 3 children each
      // - Data Center has exactly 1 child
      // - All 10 specified connections are present
      // - Both regional containers have identical internal structure
      // - Both app clusters connect to the same database
      // - Both load balancers connect to the same monitoring service
      // - All connections are unidirectional
      // - All connection labels are correctly placed
    },
  );
});
