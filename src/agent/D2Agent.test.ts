import { describe, it, expect, vi, beforeEach } from 'vitest';
import { D2Agent } from './D2Agent';
import type { AgentEvent } from './DiagramAgent';

// Mock the OpenAI Agents SDK
vi.mock('@openai/agents', () => ({
  Agent: vi.fn(),
  run: vi.fn(),
  setDefaultOpenAIClient: vi.fn(),
  user: (content: string) => ({ role: 'user', content }),
  tool: vi.fn((config) => config),
}));

// Mock OpenAI
vi.mock('openai', () => ({
  OpenAI: vi.fn(() => ({})),
}));

describe('D2Agent', () => {
  let agent: D2Agent;
  let eventCallback: (event: AgentEvent) => void;
  let capturedEvents: AgentEvent[];

  beforeEach(async () => {
    capturedEvents = [];
    eventCallback = (event: AgentEvent) => {
      capturedEvents.push(event);
    };

    // Mock the runAgent function to simulate successful completion
    const { run: runAgent } = await import('@openai/agents');
    vi.mocked(runAgent).mockImplementation(async () => {
      // Simulate a simple assistant response
      const mockResult = {
        output: [
          {
            role: 'assistant',
            content: 'I will create a simple diagram',
          },
        ],
        completed: Promise.resolve(),
        [Symbol.asyncIterator]: async function* () {
          // Simulate streaming assistant response
          yield {
            type: 'raw_model_stream_event',
            data: {
              choices: [
                {
                  delta: {
                    content: 'I will create a simple diagram',
                  },
                },
              ],
            },
          };
        },
      };
      return mockResult as any;
    });

    agent = new D2Agent(
      {
        apiKey: 'test-api-key',
        model: 'gpt-4o',
      },
      eventCallback
    );
  });

  describe('conversation history', () => {
    it('should start with empty conversation history', () => {
      const history = agent.getConversationHistory();
      expect(history).toHaveLength(0);
    });

    it('should add user message to conversation history after first message', async () => {
      await agent.sendMessage('Create a simple diagram with A and B');

      const history = agent.getConversationHistory();

      // Check that at least the user message was added
      const userMessages = history.filter(msg => msg.role === 'user');
      expect(userMessages).toHaveLength(1);
      expect(userMessages[0].content).toBe('Create a simple diagram with A and B');
    });

    it('should accumulate multiple user messages in conversation history', async () => {
      await agent.sendMessage('Create a simple diagram with A and B');
      await agent.sendMessage('Now add C connected to A');
      await agent.sendMessage('Make B point to C');

      const history = agent.getConversationHistory();

      // Filter only user messages
      const userMessages = history.filter(msg => msg.role === 'user');

      // Should have all 3 user messages
      expect(userMessages).toHaveLength(3);
      expect(userMessages[0].content).toBe('Create a simple diagram with A and B');
      expect(userMessages[1].content).toBe('Now add C connected to A');
      expect(userMessages[2].content).toBe('Make B point to C');
    });

    it('should maintain conversation history across multiple sendMessage calls', async () => {
      // First message
      await agent.sendMessage('First request');
      let history = agent.getConversationHistory();
      let userMessages = history.filter(msg => msg.role === 'user');
      expect(userMessages).toHaveLength(1);

      // Second message
      await agent.sendMessage('Second request');
      history = agent.getConversationHistory();
      userMessages = history.filter(msg => msg.role === 'user');
      expect(userMessages).toHaveLength(2);

      // Third message
      await agent.sendMessage('Third request');
      history = agent.getConversationHistory();
      userMessages = history.filter(msg => msg.role === 'user');
      expect(userMessages).toHaveLength(3);

      // Verify the order and content
      expect(userMessages[0].content).toBe('First request');
      expect(userMessages[1].content).toBe('Second request');
      expect(userMessages[2].content).toBe('Third request');
    });

    it('should include timestamps in conversation messages', async () => {
      const beforeTime = new Date();
      await agent.sendMessage('Test message');
      const afterTime = new Date();

      const history = agent.getConversationHistory();
      const userMessage = history.find(msg => msg.role === 'user');

      expect(userMessage).toBeDefined();
      expect(userMessage!.timestamp).toBeInstanceOf(Date);
      expect(userMessage!.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(userMessage!.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should preserve conversation history structure with role, content, and timestamp', async () => {
      await agent.sendMessage('Test message');

      const history = agent.getConversationHistory();
      const userMessage = history.find(msg => msg.role === 'user');

      expect(userMessage).toBeDefined();
      expect(userMessage).toHaveProperty('role', 'user');
      expect(userMessage).toHaveProperty('content', 'Test message');
      expect(userMessage).toHaveProperty('timestamp');
    });
  });

  describe('agent state', () => {
    it('should start in idle state', () => {
      const state = agent.getState();
      expect(state.status).toBe('idle');
    });

    it('should return to idle state after message completion', async () => {
      await agent.sendMessage('Test message');

      const state = agent.getState();
      expect(state.status).toBe('idle');
    });
  });

  describe('canvas content', () => {
    it('should start with empty canvas', () => {
      const canvas = agent.getCanvasContent();
      expect(canvas).toBe('');
    });
  });

  describe('event emission', () => {
    it('should emit start and complete events for a message', async () => {
      await agent.sendMessage('Test message');

      const startEvents = capturedEvents.filter(e => e.type === 'start');
      const completeEvents = capturedEvents.filter(e => e.type === 'complete');

      expect(startEvents).toHaveLength(1);
      expect(completeEvents).toHaveLength(1);
    });
  });
});
