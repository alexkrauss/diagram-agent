import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialState,
  handleAgentEvent,
  extractTextFromMessage,
  addUserMessage,
  clearChatState,
  setErrorStatus,
  generateMessageId,
  resetMessageIdCounter,
  type DiagramAgentState,
} from './diagramAgentAdapter';
import type { AgentEvent } from '../agent';
import type { Message } from './types';

describe('diagramAgentAdapter - Pure Functions', () => {
  let state: DiagramAgentState;

  beforeEach(() => {
    // Reset state before each test
    state = createInitialState();
    // Reset ID counter for predictable IDs
    resetMessageIdCounter();
  });

  // ===== 1. INITIALIZATION =====

  it('should create initial state with empty values', () => {
    // Test: Initial state has no messages, ready status, empty canvas
    const initialState = createInitialState();

    expect(initialState.messages).toEqual([]);
    expect(initialState.status).toBe('ready');
    expect(initialState.canvasContent).toBe('');
    expect(initialState.currentAssistantMessageId).toBeNull();
  });

  // ===== 2. MESSAGE ID GENERATION =====

  it('should generate unique message IDs', () => {
    // Test: Each call produces a different ID
    const id1 = generateMessageId();
    const id2 = generateMessageId();
    const id3 = generateMessageId();

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  it('should generate IDs in the correct format', () => {
    // Test: ID format is "msg-{timestamp}-{counter}"
    const id = generateMessageId();

    expect(id).toMatch(/^msg-\d+-\d+$/);
  });

  it('should reset counter when resetMessageIdCounter is called', () => {
    // Test: Counter resets to 0
    generateMessageId();
    generateMessageId();
    resetMessageIdCounter();

    const id = generateMessageId();
    expect(id).toMatch(/^msg-\d+-0$/);
  });

  // ===== 3. EVENT HANDLING: start =====

  it('should handle start event by changing status to streaming', () => {
    // Test: Status becomes "streaming" when agent starts
    const event: AgentEvent = { type: 'start' };
    const newState = handleAgentEvent(state, event);

    expect(newState.status).toBe('streaming');
  });

  it('should add empty assistant message on start event', () => {
    // Test: A new assistant message with empty text is created
    const event: AgentEvent = { type: 'start' };
    const newState = handleAgentEvent(state, event);

    expect(newState.messages).toHaveLength(1);
    expect(newState.messages[0].role).toBe('assistant');
    expect(newState.messages[0].parts).toEqual([{ type: 'text', text: '' }]);
  });

  it('should set currentAssistantMessageId on start event', () => {
    // Test: The ID of the new message is tracked
    const event: AgentEvent = { type: 'start' };
    const newState = handleAgentEvent(state, event);

    expect(newState.currentAssistantMessageId).toBe(newState.messages[0].id);
  });

  it('should not mutate original state', () => {
    // Test: Pure function doesn't modify input
    const originalState = { ...state };
    const event: AgentEvent = { type: 'start' };

    handleAgentEvent(state, event);

    expect(state).toEqual(originalState);
  });

  // ===== 4. EVENT HANDLING: model_response =====

  it('should append chunk to current assistant message', () => {
    // Test: Text chunks accumulate in the last assistant message
    let currentState = state;

    currentState = handleAgentEvent(currentState, { type: 'start' });
    currentState = handleAgentEvent(currentState, { type: 'model_response', chunk: 'Hello' });
    currentState = handleAgentEvent(currentState, { type: 'model_response', chunk: ' world' });

    expect(currentState.messages).toHaveLength(1);
    const textPart = currentState.messages[0].parts[0];
    expect(textPart.type).toBe('text');
    expect((textPart as any).text).toBe('Hello world');
  });

  it('should only update the last message when streaming', () => {
    // Test: Previous messages are not modified during streaming
    let currentState = state;

    // First message
    currentState = handleAgentEvent(currentState, { type: 'start' });
    currentState = handleAgentEvent(currentState, { type: 'model_response', chunk: 'First' });
    currentState = handleAgentEvent(currentState, { type: 'complete' });

    // Second message
    currentState = handleAgentEvent(currentState, { type: 'start' });
    currentState = handleAgentEvent(currentState, { type: 'model_response', chunk: 'Second' });

    expect(currentState.messages).toHaveLength(2);
    expect((currentState.messages[0].parts[0] as any).text).toBe('First');
    expect((currentState.messages[1].parts[0] as any).text).toBe('Second');
  });

  it('should handle model_response when no current assistant message exists', () => {
    // Test: Gracefully handles chunks without crashing when no message is streaming
    const event: AgentEvent = { type: 'model_response', chunk: 'orphan' };
    const newState = handleAgentEvent(state, event);

    // Should not add any messages or crash
    expect(newState.messages).toHaveLength(0);
  });

  // ===== 5. EVENT HANDLING: canvas_update =====

  it('should update canvasContent on canvas_update event', () => {
    // Test: Canvas content is updated with the new diagram content
    const event: AgentEvent = {
      type: 'canvas_update',
      content: 'A -> B: Hello',
      canvasUpdateId: 'test-1'
    };
    const newState = handleAgentEvent(state, event);

    expect(newState.canvasContent).toBe('A -> B: Hello');
  });

  it('should replace canvas content on subsequent updates', () => {
    // Test: New canvas content replaces the old content (not appends)
    let currentState = state;

    currentState = handleAgentEvent(currentState, { type: 'canvas_update', content: 'First', canvasUpdateId: 'test-1' });
    currentState = handleAgentEvent(currentState, { type: 'canvas_update', content: 'Second', canvasUpdateId: 'test-2' });

    expect(currentState.canvasContent).toBe('Second');
  });

  it('should add system message when canvas updates', () => {
    // Test: Canvas updates add a system message to show the update in chat
    let currentState = state;

    currentState = handleAgentEvent(currentState, { type: 'start' });
    currentState = handleAgentEvent(currentState, { type: 'canvas_update', content: 'A -> B', canvasUpdateId: 'test-1' });

    expect(currentState.messages).toHaveLength(2);
    expect(currentState.messages[0].role).toBe('assistant');
    expect(currentState.messages[1].role).toBe('system');
    expect((currentState.messages[1].parts[0] as any).text).toContain('Canvas updated');
  });

  it('should add separate system message for each canvas update', () => {
    // Test: Multiple canvas updates create multiple system messages
    let currentState = state;

    currentState = handleAgentEvent(currentState, { type: 'canvas_update', content: 'First', canvasUpdateId: 'test-1' });
    currentState = handleAgentEvent(currentState, { type: 'canvas_update', content: 'Second', canvasUpdateId: 'test-2' });

    expect(currentState.messages).toHaveLength(2);
    expect(currentState.messages[0].role).toBe('system');
    expect(currentState.messages[1].role).toBe('system');
  });

  // ===== 6. EVENT HANDLING: complete =====

  it('should change status to ready on complete event', () => {
    // Test: Status returns to "ready" when agent finishes
    let currentState = state;

    currentState = handleAgentEvent(currentState, { type: 'start' });
    currentState = handleAgentEvent(currentState, { type: 'complete' });

    expect(currentState.status).toBe('ready');
  });

  it('should clear currentAssistantMessageId on complete', () => {
    // Test: Message tracking is cleared
    let currentState = state;

    currentState = handleAgentEvent(currentState, { type: 'start' });
    expect(currentState.currentAssistantMessageId).not.toBeNull();

    currentState = handleAgentEvent(currentState, { type: 'complete' });
    expect(currentState.currentAssistantMessageId).toBeNull();
  });

  it('should not modify messages on complete event', () => {
    // Test: Complete event doesn't change the message list
    let currentState = state;

    currentState = handleAgentEvent(currentState, { type: 'start' });
    currentState = handleAgentEvent(currentState, { type: 'model_response', chunk: 'Done' });
    currentState = handleAgentEvent(currentState, { type: 'complete' });

    expect(currentState.messages).toHaveLength(1);
    expect((currentState.messages[0].parts[0] as any).text).toBe('Done');
  });

  // ===== 7. EVENT HANDLING: error =====

  it('should change status to error on error event', () => {
    // Test: Status becomes "error" when an error occurs
    const event: AgentEvent = {
      type: 'error',
      error: new Error('Test error')
    };
    const newState = handleAgentEvent(state, event);

    expect(newState.status).toBe('error');
  });

  it('should add error message to messages array', () => {
    // Test: Error is displayed as an assistant message
    const event: AgentEvent = {
      type: 'error',
      error: new Error('Something went wrong')
    };
    const newState = handleAgentEvent(state, event);

    expect(newState.messages).toHaveLength(1);
    expect(newState.messages[0].role).toBe('assistant');
    expect((newState.messages[0].parts[0] as any).text).toBe('Error: Something went wrong');
  });

  it('should clear currentAssistantMessageId on error', () => {
    // Test: Message tracking is cleared on error
    let currentState = state;

    currentState = handleAgentEvent(currentState, { type: 'start' });
    expect(currentState.currentAssistantMessageId).not.toBeNull();

    currentState = handleAgentEvent(currentState, {
      type: 'error',
      error: new Error('Failed')
    });
    expect(currentState.currentAssistantMessageId).toBeNull();
  });

  // ===== 8. EVENT HANDLING: Ignored events =====

  it('should ignore log events', () => {
    // Test: Log events don't change any state
    const event: AgentEvent = { type: 'log', message: 'Debug info' };
    const newState = handleAgentEvent(state, event);

    expect(newState).toEqual(state);
  });

  it('should ignore tool_start events', () => {
    // Test: Tool start events don't change any state
    const event: AgentEvent = {
      type: 'tool_start',
      name: 'replace_canvas',
      args: {}
    };
    const newState = handleAgentEvent(state, event);

    expect(newState).toEqual(state);
  });

  it('should ignore tool_end events', () => {
    // Test: Tool end events don't change any state
    const event: AgentEvent = {
      type: 'tool_end',
      name: 'replace_canvas',
      result: {}
    };
    const newState = handleAgentEvent(state, event);

    expect(newState).toEqual(state);
  });

  // ===== 9. extractTextFromMessage FUNCTION =====

  it('should extract text from message with text part', () => {
    // Test: Text is correctly extracted from message parts
    const message: Message = {
      id: 'test-1',
      role: 'user',
      parts: [{ type: 'text', text: 'Hello world' }]
    };

    const text = extractTextFromMessage(message);
    expect(text).toBe('Hello world');
  });

  it('should return empty string when no text part exists', () => {
    // Test: Returns empty string for messages without text
    const message: Message = {
      id: 'test-1',
      role: 'user',
      parts: [{ type: 'file', file: new File([], 'test.txt') }]
    };

    const text = extractTextFromMessage(message);
    expect(text).toBe('');
  });

  it('should extract first text part from message with multiple parts', () => {
    // Test: When message has multiple parts, first text part is used
    const message: Message = {
      id: 'test-1',
      role: 'user',
      parts: [
        { type: 'file', file: new File([], 'test.txt') },
        { type: 'text', text: 'First text' },
        { type: 'text', text: 'Second text' }
      ]
    };

    const text = extractTextFromMessage(message);
    expect(text).toBe('First text');
  });

  // ===== 10. addUserMessage FUNCTION =====

  it('should add user message to messages array', () => {
    // Test: User message is added to the state
    const userMessage: Message = {
      id: 'user-1',
      role: 'user',
      parts: [{ type: 'text', text: 'Hello' }]
    };

    const newState = addUserMessage(state, userMessage);

    expect(newState.messages).toHaveLength(1);
    expect(newState.messages[0]).toEqual(userMessage);
  });

  it('should change status to submitted when adding user message', () => {
    // Test: Status becomes "submitted" when user sends a message
    const userMessage: Message = {
      id: 'user-1',
      role: 'user',
      parts: [{ type: 'text', text: 'Hello' }]
    };

    const newState = addUserMessage(state, userMessage);

    expect(newState.status).toBe('submitted');
  });

  it('should preserve existing messages when adding user message', () => {
    // Test: New message is appended, not replacing
    let currentState = state;

    currentState = handleAgentEvent(currentState, { type: 'start' });
    currentState = handleAgentEvent(currentState, { type: 'model_response', chunk: 'Hi' });

    const userMessage: Message = {
      id: 'user-1',
      role: 'user',
      parts: [{ type: 'text', text: 'Hello again' }]
    };
    currentState = addUserMessage(currentState, userMessage);

    expect(currentState.messages).toHaveLength(2);
  });

  // ===== 11. clearChatState FUNCTION =====

  it('should clear all messages', () => {
    // Test: clearChatState removes all messages from the list
    let currentState = state;

    currentState = handleAgentEvent(currentState, { type: 'start' });
    currentState = handleAgentEvent(currentState, { type: 'model_response', chunk: 'Hello' });

    currentState = clearChatState(currentState);

    expect(currentState.messages).toHaveLength(0);
  });

  it('should clear canvas content', () => {
    // Test: clearChatState resets the diagram canvas
    let currentState = state;

    currentState = handleAgentEvent(currentState, { type: 'canvas_update', content: 'A -> B', canvasUpdateId: 'test-1' });
    currentState = clearChatState(currentState);

    expect(currentState.canvasContent).toBe('');
  });

  it('should reset status to ready', () => {
    // Test: clearChatState returns status to ready state
    let currentState = state;

    currentState = handleAgentEvent(currentState, { type: 'start' });
    expect(currentState.status).toBe('streaming');

    currentState = clearChatState(currentState);

    expect(currentState.status).toBe('ready');
  });

  it('should clear currentAssistantMessageId', () => {
    // Test: Message tracking is cleared
    let currentState = state;

    currentState = handleAgentEvent(currentState, { type: 'start' });
    expect(currentState.currentAssistantMessageId).not.toBeNull();

    currentState = clearChatState(currentState);

    expect(currentState.currentAssistantMessageId).toBeNull();
  });

  // ===== 12. setErrorStatus FUNCTION =====

  it('should set status to error', () => {
    // Test: Status is changed to error
    const newState = setErrorStatus(state);

    expect(newState.status).toBe('error');
  });

  it('should preserve other state when setting error', () => {
    // Test: Only status changes, everything else remains
    let currentState = state;

    currentState = handleAgentEvent(currentState, { type: 'canvas_update', content: 'A -> B', canvasUpdateId: 'test-1' });
    currentState = addUserMessage(currentState, {
      id: 'user-1',
      role: 'user',
      parts: [{ type: 'text', text: 'Hello' }]
    });

    const errorState = setErrorStatus(currentState);

    expect(errorState.messages).toEqual(currentState.messages);
    expect(errorState.canvasContent).toBe('A -> B');
  });

  // ===== 13. INTEGRATION FLOW =====

  it('should handle full conversation flow correctly', () => {
    // Test: Complete flow from user message to agent response works
    let currentState = state;

    // User sends message
    currentState = addUserMessage(currentState, {
      id: 'user-1',
      role: 'user',
      parts: [{ type: 'text', text: 'Create diagram' }]
    });

    // Agent responds
    currentState = handleAgentEvent(currentState, { type: 'start' });
    currentState = handleAgentEvent(currentState, { type: 'model_response', chunk: 'Creating' });
    currentState = handleAgentEvent(currentState, { type: 'model_response', chunk: ' diagram' });
    currentState = handleAgentEvent(currentState, { type: 'canvas_update', content: 'A -> B', canvasUpdateId: 'test-1' });
    currentState = handleAgentEvent(currentState, { type: 'complete' });

    expect(currentState.messages).toHaveLength(3);
    expect((currentState.messages[0].parts[0] as any).text).toBe('Create diagram');
    expect((currentState.messages[1].parts[0] as any).text).toBe('Creating diagram');
    expect(currentState.messages[2].role).toBe('system');
    expect((currentState.messages[2].parts[0] as any).text).toContain('Canvas updated');
    expect(currentState.canvasContent).toBe('A -> B');
    expect(currentState.status).toBe('ready');
  });

  it('should handle multiple user messages in sequence', () => {
    // Test: Multiple back-and-forth messages work correctly
    let currentState = state;

    // First exchange
    currentState = addUserMessage(currentState, {
      id: 'user-1',
      role: 'user',
      parts: [{ type: 'text', text: 'First' }]
    });
    currentState = handleAgentEvent(currentState, { type: 'start' });
    currentState = handleAgentEvent(currentState, { type: 'model_response', chunk: 'Response 1' });
    currentState = handleAgentEvent(currentState, { type: 'complete' });

    // Second exchange
    currentState = addUserMessage(currentState, {
      id: 'user-2',
      role: 'user',
      parts: [{ type: 'text', text: 'Second' }]
    });
    currentState = handleAgentEvent(currentState, { type: 'start' });
    currentState = handleAgentEvent(currentState, { type: 'model_response', chunk: 'Response 2' });
    currentState = handleAgentEvent(currentState, { type: 'complete' });

    expect(currentState.messages).toHaveLength(4);
    expect((currentState.messages[0].parts[0] as any).text).toBe('First');
    expect((currentState.messages[1].parts[0] as any).text).toBe('Response 1');
    expect((currentState.messages[2].parts[0] as any).text).toBe('Second');
    expect((currentState.messages[3].parts[0] as any).text).toBe('Response 2');
  });

  it('should handle rapid successive events', () => {
    // Test: Multiple events in quick succession are handled correctly
    let currentState = state;

    currentState = handleAgentEvent(currentState, { type: 'start' });
    currentState = handleAgentEvent(currentState, { type: 'model_response', chunk: 'a' });
    currentState = handleAgentEvent(currentState, { type: 'model_response', chunk: 'b' });
    currentState = handleAgentEvent(currentState, { type: 'model_response', chunk: 'c' });
    currentState = handleAgentEvent(currentState, { type: 'canvas_update', content: 'diagram1', canvasUpdateId: 'test-1' });
    currentState = handleAgentEvent(currentState, { type: 'canvas_update', content: 'diagram2', canvasUpdateId: 'test-2' });
    currentState = handleAgentEvent(currentState, { type: 'complete' });

    expect((currentState.messages[0].parts[0] as any).text).toBe('abc');
    expect(currentState.canvasContent).toBe('diagram2');
    expect(currentState.status).toBe('ready');
  });

  it('should handle error recovery flow', () => {
    // Test: After an error, the chat can be cleared and continue
    let currentState = state;

    currentState = handleAgentEvent(currentState, {
      type: 'error',
      error: new Error('Failed')
    });

    expect(currentState.status).toBe('error');

    currentState = clearChatState(currentState);
    expect(currentState.status).toBe('ready');
    expect(currentState.messages).toHaveLength(0);

    currentState = addUserMessage(currentState, {
      id: 'user-1',
      role: 'user',
      parts: [{ type: 'text', text: 'Try again' }]
    });

    expect(currentState.messages).toHaveLength(1);
  });
});
