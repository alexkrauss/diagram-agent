import { describe, it, expect, vi, beforeEach } from 'vitest';
import { D2Agent } from './D2Agent';
import type { AgentEvent } from './DiagramAgent';

// Mock the OpenAI Agents SDK
vi.mock('@openai/agents', () => {
  const userMock = vi.fn((content: string | any[]) => ({ role: 'user', content }));
  return {
    Agent: vi.fn(),
    run: vi.fn(),
    setDefaultOpenAIClient: vi.fn(),
    user: userMock,
    tool: vi.fn((config) => config),
  };
});

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

    // Clear all mocks before each test
    vi.clearAllMocks();

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

    // Mock render function for testing
    const mockRenderFunction = vi.fn(async (_d2Content: string) => {
      return {
        svg: '<svg>mock</svg>',
        png: 'data:image/png;base64,mockdata',
      };
    });

    agent = new D2Agent(
      {
        apiKey: 'test-api-key',
        model: 'gpt-4o',
        renderFunction: mockRenderFunction,
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

  describe('rendering and tool execution', () => {
    let mockRenderFunction: ReturnType<typeof vi.fn>;
    let toolConfig: any;

    beforeEach(async () => {
      // Capture the tool configuration when tool() is called
      const { tool } = await import('@openai/agents');
      vi.mocked(tool).mockImplementation((config) => {
        toolConfig = config;
        return {
          type: 'function',
          name: config.name || 'mock_tool',
          description: config.description,
          parameters: config.parameters,
          strict: config.strict ?? true,
          invoke: vi.fn(),
          needsApproval: vi.fn(async () => false),
          isEnabled: vi.fn(async () => true),
        } as any;
      });

      // Reset mocks
      capturedEvents = [];
      mockRenderFunction = vi.fn(async (_d2Content: string) => {
        return {
          svg: '<svg>mock</svg>',
          png: 'data:image/png;base64,mockdata',
        };
      });

      agent = new D2Agent(
        {
          apiKey: 'test-api-key',
          model: 'gpt-4o',
          renderFunction: mockRenderFunction,
        },
        eventCallback
      );
    });

    it('should set state to rendering when tool executes', async () => {
      // Mock runAgent to simulate tool execution
      const { run: runAgent } = await import('@openai/agents');
      vi.mocked(runAgent).mockImplementation(async () => {
        // Before tool execution
        expect(agent.getState().status).toBe('thinking');

        // Simulate tool execution by calling the execute function
        const d2Content = 'A -> B';
        await toolConfig.execute({ content: d2Content });

        // During/after tool execution
        const state = agent.getState();
        expect(state.status).toBe('rendering');

        return {
          output: [],
          completed: Promise.resolve(),
          [Symbol.asyncIterator]: async function* () {},
        } as any;
      });

      await agent.sendMessage('Create diagram');
    });

    it('should update canvas content when tool executes', async () => {
      const { run: runAgent } = await import('@openai/agents');
      const d2Content = 'A -> B -> C';

      vi.mocked(runAgent).mockImplementation(async () => {
        // Execute the tool
        await toolConfig.execute({ content: d2Content });

        return {
          output: [],
          completed: Promise.resolve(),
          [Symbol.asyncIterator]: async function* () {},
        } as any;
      });

      await agent.sendMessage('Create diagram');

      // Canvas should be updated
      expect(agent.getCanvasContent()).toBe(d2Content);
    });

    it('should add canvas_update message to conversation history', async () => {
      const { run: runAgent } = await import('@openai/agents');
      const d2Content = 'X -> Y';

      vi.mocked(runAgent).mockImplementation(async () => {
        await toolConfig.execute({ content: d2Content });

        return {
          output: [],
          completed: Promise.resolve(),
          [Symbol.asyncIterator]: async function* () {},
        } as any;
      });

      await agent.sendMessage('Create diagram');

      const history = agent.getConversationHistory();
      const canvasUpdates = history.filter(msg => msg.role === 'canvas_update');

      expect(canvasUpdates).toHaveLength(1);
      expect(canvasUpdates[0].content).toBe(d2Content);
      expect(canvasUpdates[0].timestamp).toBeInstanceOf(Date);
    });

    it('should call render function with correct D2 content', async () => {
      const { run: runAgent } = await import('@openai/agents');
      const d2Content = 'server -> database';

      vi.mocked(runAgent).mockImplementation(async () => {
        await toolConfig.execute({ content: d2Content });

        return {
          output: [],
          completed: Promise.resolve(),
          [Symbol.asyncIterator]: async function* () {},
        } as any;
      });

      await agent.sendMessage('Create diagram');

      // Render function is now called with (d2Content, canvasUpdateId)
      expect(mockRenderFunction).toHaveBeenCalledWith(d2Content, expect.stringMatching(/^canvas-\d+$/));
      expect(mockRenderFunction).toHaveBeenCalledTimes(1);
    });

    it('should return image when rendering succeeds', async () => {
      const { run: runAgent } = await import('@openai/agents');
      const d2Content = 'A -> B';

      let toolResult: any;
      vi.mocked(runAgent).mockImplementation(async () => {
        toolResult = await toolConfig.execute({ content: d2Content });

        return {
          output: [],
          completed: Promise.resolve(),
          [Symbol.asyncIterator]: async function* () {},
        } as any;
      });

      await agent.sendMessage('Create diagram');

      // Tool should return ToolOutputImage with nested format
      expect(toolResult).toBeDefined();
      expect(toolResult.type).toBe('image');
      expect(toolResult.image).toBeDefined();
      expect(toolResult.image.mediaType).toBe('image/png');
      expect(toolResult.image.data).toBe('mockdata'); // Without data URL prefix
    });

    it('should return error text when rendering fails', async () => {
      // Configure render function to return error
      mockRenderFunction.mockResolvedValueOnce({
        error: 'Invalid D2 syntax: unexpected token',
      });

      const { run: runAgent } = await import('@openai/agents');
      const d2Content = 'invalid syntax {{}}';

      let toolResult: any;
      vi.mocked(runAgent).mockImplementation(async () => {
        toolResult = await toolConfig.execute({ content: d2Content });

        return {
          output: [],
          completed: Promise.resolve(),
          [Symbol.asyncIterator]: async function* () {},
        } as any;
      });

      await agent.sendMessage('Create diagram');

      // Tool should return error as text string
      expect(typeof toolResult).toBe('string');
      expect(toolResult).toContain('rendering failed');
      expect(toolResult).toContain('Invalid D2 syntax');
    });

    it('should emit canvas_update event when tool executes', async () => {
      const { run: runAgent } = await import('@openai/agents');
      const d2Content = 'user -> system';

      vi.mocked(runAgent).mockImplementation(async () => {
        await toolConfig.execute({ content: d2Content });

        return {
          output: [],
          completed: Promise.resolve(),
          [Symbol.asyncIterator]: async function* () {},
        } as any;
      });

      await agent.sendMessage('Create diagram');

      const canvasUpdateEvents = capturedEvents.filter(e => e.type === 'canvas_update');
      expect(canvasUpdateEvents).toHaveLength(1);
      expect(canvasUpdateEvents[0]).toEqual({
        type: 'canvas_update',
        content: d2Content,
        canvasUpdateId: expect.stringMatching(/^canvas-\d+$/),
      });
    });

    it('should emit render_complete event after rendering finishes', async () => {
      const { run: runAgent } = await import('@openai/agents');
      const d2Content = 'A -> B';

      vi.mocked(runAgent).mockImplementation(async () => {
        await toolConfig.execute({ content: d2Content });

        return {
          output: [],
          completed: Promise.resolve(),
          [Symbol.asyncIterator]: async function* () {},
        } as any;
      });

      await agent.sendMessage('Create diagram');

      // Find render_complete event
      const renderCompleteEvents = capturedEvents.filter(e => e.type === 'render_complete');
      expect(renderCompleteEvents).toHaveLength(1);

      const event = renderCompleteEvents[0];
      expect(event.type).toBe('render_complete');
      expect(event).toHaveProperty('canvasUpdateId');
      expect(event.canvasUpdateId).toMatch(/^canvas-\d+$/);
      expect(event).toHaveProperty('success', true);
      expect(event).not.toHaveProperty('error');
    });

    it('should emit render_complete event with error when rendering fails', async () => {
      // Configure render function to return error
      mockRenderFunction.mockResolvedValueOnce({
        error: 'Invalid D2 syntax: unexpected token',
      });

      const { run: runAgent } = await import('@openai/agents');
      const d2Content = 'invalid syntax {{}}';

      vi.mocked(runAgent).mockImplementation(async () => {
        await toolConfig.execute({ content: d2Content });

        return {
          output: [],
          completed: Promise.resolve(),
          [Symbol.asyncIterator]: async function* () {},
        } as any;
      });

      await agent.sendMessage('Create diagram');

      const renderCompleteEvents = capturedEvents.filter(e => e.type === 'render_complete');
      expect(renderCompleteEvents).toHaveLength(1);

      const event = renderCompleteEvents[0];
      expect(event.type).toBe('render_complete');
      expect(event).toHaveProperty('canvasUpdateId');
      expect(event.canvasUpdateId).toMatch(/^canvas-\d+$/);
      expect(event).toHaveProperty('success', false);
      expect(event).toHaveProperty('error');
      expect(event.error).toContain('Invalid D2 syntax');
    });

    it('should emit canvas_update before render_complete', async () => {
      const { run: runAgent } = await import('@openai/agents');
      const d2Content = 'A -> B';

      vi.mocked(runAgent).mockImplementation(async () => {
        await toolConfig.execute({ content: d2Content });

        return {
          output: [],
          completed: Promise.resolve(),
          [Symbol.asyncIterator]: async function* () {},
        } as any;
      });

      await agent.sendMessage('Create diagram');

      // Find indices of canvas_update and render_complete events
      const canvasUpdateIndex = capturedEvents.findIndex(e => e.type === 'canvas_update');
      const renderCompleteIndex = capturedEvents.findIndex(e => e.type === 'render_complete');

      expect(canvasUpdateIndex).toBeGreaterThanOrEqual(0);
      expect(renderCompleteIndex).toBeGreaterThan(canvasUpdateIndex);

      // Verify they have matching canvasUpdateIds
      const canvasUpdateEvent = capturedEvents[canvasUpdateIndex] as any;
      const renderCompleteEvent = capturedEvents[renderCompleteIndex] as any;
      expect(canvasUpdateEvent.canvasUpdateId).toBe(renderCompleteEvent.canvasUpdateId);
    });

    it('should return to idle state after tool completion', async () => {
      const { run: runAgent } = await import('@openai/agents');
      const d2Content = 'A -> B';

      vi.mocked(runAgent).mockImplementation(async () => {
        await toolConfig.execute({ content: d2Content });

        // State should be rendering during tool execution
        expect(agent.getState().status).toBe('rendering');

        return {
          output: [],
          completed: Promise.resolve(),
          [Symbol.asyncIterator]: async function* () {},
        } as any;
      });

      await agent.sendMessage('Create diagram');

      // After message completion, state should be idle
      expect(agent.getState().status).toBe('idle');
    });
  });
});
