/**
 * Example tests demonstrating the conversation testing DSL.
 *
 * These tests show the intended usage pattern. They will type-check but fail
 * at runtime until the conversation-testing harness is implemented.
 *
 * Run in strict mode (default):
 *   npm test
 *
 * Run in evaluation mode:
 *   EVAL_MODE=true npm test
 */

import { describe, expect } from 'vitest';
import { conversation } from './conversation-testing';
import type { DiagramAgent } from '../DiagramAgent';
import { D2Agent } from '../D2Agent';

/**
 * Create a test agent instance using the OpenAI API key from environment.
 * Requires OPENAI_API_KEY to be set in .env file or environment variables.
 */
function createTestAgent(): DiagramAgent {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable is not set. ' +
      'Create a .env file with OPENAI_API_KEY=your-key-here'
    );
  }

  return new D2Agent(
    { apiKey, model: 'gpt-4o' },
    () => {} // Empty event callback for tests
  );
}

describe('DiagramAgent - Example Conversations', () => {
  /**
   * Simple single-turn test.
   * Creates a diagram and validates the result.
   */
  conversation('Create simple diagram', createTestAgent, async (agent) => {
    // ACTION: Send message to agent
    await agent.send('Create a diagram with two boxes: Frontend and Backend');

    // OBSERVATION: Access canvas state
    const canvas = agent.canvas;

    // ASSERTION: Use standard Vitest assertions on raw content
    expect(canvas.content).toContain('Frontend');
    expect(canvas.content).toContain('Backend');
    expect(canvas.content.trim().length).toBeGreaterThan(0);
  });

  /**
   * Multi-turn conversation test.
   * Builds up a diagram incrementally across multiple turns.
   */
  conversation('Build architecture incrementally', createTestAgent, async (agent) => {
    // Turn 1: Create initial element
    await agent.send('Create a box called Web Server');

    expect(agent.canvas.content).toContain('Web Server');

    const userMessages1 = agent.conversation.messages.filter((m) => m.role === 'user');
    expect(userMessages1.length).toBe(1);

    // Turn 2: Add connected element
    await agent.send('Add a Database box and connect it to the Web Server');

    expect(agent.canvas.content).toContain('Web Server');
    expect(agent.canvas.content).toContain('Database');

    const userMessages2 = agent.conversation.messages.filter((m) => m.role === 'user');
    expect(userMessages2.length).toBe(2);

    // Turn 3: Add another element
    await agent.send('Add a Load Balancer in front of the Web Server');

    expect(agent.canvas.content).toContain('Load Balancer');

    // Validate conversation state
    const userMessages3 = agent.conversation.messages.filter((m) => m.role === 'user');
    expect(userMessages3.length).toBe(3);

    const lastMessage = agent.conversation.messages[agent.conversation.messages.length - 1];
    expect(lastMessage.role).toBe('canvas_update');
  });

  /**
   * Test with structural validation.
   * Checks connections between elements.
   */
  conversation('Validate connections', createTestAgent, async (agent) => {
    await agent.send(
      'Create a diagram with Client, Server, and Database. ' +
        'Connect Client to Server, and Server to Database.'
    );

    const canvas = agent.canvas;

    // Check elements exist
    expect(canvas.content).toContain('Client');
    expect(canvas.content).toContain('Server');
    expect(canvas.content).toContain('Database');

    // Check connections exist (basic string matching, case-insensitive)
    expect(canvas.content).toMatch(/client.*->.*server|client.*--.*server/i);
    expect(canvas.content).toMatch(/server.*->.*database|server.*--.*database/i);
  });

  /**
   * Test conversation history inspection.
   * Validates that conversation state is properly tracked.
   */
  conversation('Inspect conversation history', createTestAgent, async (agent) => {
    await agent.send('Create box A');
    await agent.send('Create box B');

    const conversation = agent.conversation;

    // Check message counts
    expect(conversation.messages.length).toBeGreaterThanOrEqual(4);

    const userMessages = conversation.messages.filter((m) => m.role === 'user');
    expect(userMessages.length).toBe(2);

    const canvasUpdates = conversation.messages.filter((m) => m.role === 'canvas_update');
    expect(canvasUpdates.length).toBeGreaterThanOrEqual(1);

    // Check specific messages
    expect(userMessages[0].content).toContain('box A');
    expect(userMessages[1].content).toContain('box B');

    // Check last message
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    expect(lastMessage).toBeDefined();

    const lastUserMessage = [...conversation.messages].reverse().find((m) => m.role === 'user');
    expect(lastUserMessage?.content).toContain('box B');
  });

  /**
   * Test state snapshot and comparison.
   * Captures canvas state at different points.
   */
  conversation('Compare canvas states', createTestAgent, async (agent) => {
    await agent.send('Create a Web Server');

    // Capture first state
    const state1 = agent.canvas;
    const content1 = state1.content;

    await agent.send('Add a Database');

    // Capture second state
    const state2 = agent.canvas;

    // Compare states
    expect(state2.content).not.toBe(content1);
    expect(state2.content).toContain('Database');
    expect(state2.content).toContain('Web Server'); // Original should still be there
    expect(state2.content.length).toBeGreaterThan(content1.length);
  });

  /**
   * Test error handling / edge cases.
   * Agent should handle unclear requests without crashing.
   */
  conversation('Handle unclear request', createTestAgent, async (agent) => {
    // This tests that the agent handles unclear requests gracefully
    // The agent may choose to create something, ask for clarification, or do nothing
    await agent.send('Add a thing');

    const conversation = agent.conversation;

    // Validate that the request was processed (at minimum, user message exists)
    expect(conversation.messages.length).toBeGreaterThanOrEqual(1);

    const userMessages = conversation.messages.filter((m) => m.role === 'user');
    expect(userMessages.length).toBe(1);
    expect(userMessages[0].content).toContain('Add a thing');

    // Test passed if we got here without throwing an error
  });
});
