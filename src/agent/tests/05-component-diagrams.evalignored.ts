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
    async (agent) => {
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

      agent.criteria(
        "The diagram contains exactly three rectangle shapes labeled Frontend, Backend, and Database.",
        "A directed connection runs from Frontend to Backend labeled HTTP requests.",
        "A directed connection runs from Backend to Database labeled SQL queries.",
        "No extra shapes or connections appear beyond the 3-tier flow.",
      );
    },
  );

  /**
   * Scenario 2: Microservices Architecture
   * Tests nested containers with multiple levels and cross-container connections
   */
  conversation(
    "Microservices Architecture",
    createTestAgent,
    async (agent) => {
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

      agent.criteria(
        "The diagram includes top-level API Gateway and Payment Gateway shapes.",
        "A Services container holds User Service, Product Service, and Order Service.",
        "A Data Layer container holds User Database, Product Database, and Shared Cache.",
        "API Gateway routes to each service with labeled route connections.",
        "User Service connects to User Database with query, Product Service connects to Product Database with query, and Order Service connects to Payment Gateway with process payment.",
        "All three services connect to the Shared Cache with labeled read/write connections.",
        "The container nesting and connection directionality match the requested architecture, with no extra elements.",
      );
    },
  );

  /**
   * Scenario 3: Cloud Architecture with Multi-Region Deployment
   * Tests symmetric nested structures with parallel hierarchies and shared connections
   */
  conversation(
    "Cloud Architecture with Multi-Region Deployment",
    createTestAgent,
    async (agent) => {
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

      agent.criteria(
        "The diagram includes top-level CDN and Monitoring Service shapes.",
        "US-East Region and EU-West Region containers each contain Load Balancer, Web Cluster, and App Cluster shapes.",
        "A Data Center container contains the Database shape.",
        "Connections exist from CDN to each region's Load Balancer labeled route traffic.",
        "Within each region, Load Balancer connects to Web Cluster (forward) and Web Cluster to App Cluster (API call).",
        "Each App Cluster connects to the shared Database with SQL query labels.",
        "Each region's Load Balancer connects to Monitoring Service with metrics labels.",
      );
    },
  );
});
