/**
 * Unit tests for the conversation testing harness itself.
 * These tests verify the harness works correctly without needing an OpenAI API key.
 */

import { describe, expect } from 'vitest';
import { conversation } from './conversation-testing';
import type { DiagramAgent, ConversationMessage, AgentState } from '../DiagramAgent';

/**
 * Create a mock agent for testing the test harness.
 */
function createMockAgent(): DiagramAgent {
  let canvas = '';
  const messages: ConversationMessage[] = [];

  return {
    async sendMessage(userMessage: string): Promise<void> {
      // Add user message
      messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      });

      // Simulate canvas update
      canvas += `\n${userMessage}`;
      messages.push({
        role: 'canvas_update',
        content: canvas,
        timestamp: new Date(),
      });
    },

    getCanvasContent(): string {
      return canvas;
    },

    getConversationHistory(): ConversationMessage[] {
      return messages;
    },

    getState(): AgentState {
      return { status: 'idle' };
    },
  };
}

describe('Conversation Testing Harness', () => {
  conversation('Basic send and canvas access', createMockAgent, async (agent) => {
    await agent.send('Create box A');

    expect(agent.canvas.content).toContain('Create box A');
  });

  conversation('Multi-turn conversation', createMockAgent, async (agent) => {
    await agent.send('First message');
    expect(agent.canvas.content).toContain('First message');

    await agent.send('Second message');
    expect(agent.canvas.content).toContain('First message');
    expect(agent.canvas.content).toContain('Second message');
  });

  conversation('Conversation history', createMockAgent, async (agent) => {
    await agent.send('Message 1');
    await agent.send('Message 2');

    const messages = agent.conversation.messages;
    expect(messages.length).toBeGreaterThanOrEqual(4); // 2 user + 2 canvas_update

    const userMessages = messages.filter((m) => m.role === 'user');
    expect(userMessages.length).toBe(2);
    expect(userMessages[0].content).toBe('Message 1');
    expect(userMessages[1].content).toBe('Message 2');
  });

  conversation('Agent state access', createMockAgent, async (agent) => {
    const state = agent.state;
    expect(state.status).toBe('idle');
  });
});
