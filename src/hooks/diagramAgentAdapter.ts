import { AgentEvent } from '../agent';
import { Message } from '@llamaindex/chat-ui';

/**
 * State managed by the diagram agent handler.
 *
 * This represents the complete UI state for the chat interface:
 * - messages: The conversation history displayed in the chat UI
 * - status: Current state of the agent (controls loading indicators, button states)
 * - canvasContent: The D2 diagram source code (displayed separately from chat)
 * - currentAssistantMessageId: Tracks which message is currently being streamed to
 *                               (null when not streaming)
 */
export interface DiagramAgentState {
  messages: Message[];
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  canvasContent: string;
  currentAssistantMessageId: string | null;
}

/**
 * Simple message ID generator
 */
let messageIdCounter = 0;
export const generateMessageId = (): string => `msg-${Date.now()}-${messageIdCounter++}`;

/**
 * Reset the message ID counter (useful for testing)
 */
export const resetMessageIdCounter = (): void => {
  messageIdCounter = 0;
};

/**
 * Creates the initial state for the diagram agent handler
 */
export function createInitialState(): DiagramAgentState {
  return {
    messages: [],
    status: 'ready',
    canvasContent: '',
    currentAssistantMessageId: null,
  };
}

/**
 * Pure function that handles agent events and returns new state.
 *
 * This is the core state transformation logic that translates DiagramAgent events
 * into chat-ui state updates. Each event type represents a different phase of the
 * agent's execution cycle.
 */
export function handleAgentEvent(
  state: DiagramAgentState,
  event: AgentEvent
): DiagramAgentState {
  switch (event.type) {
    case 'start': {
      // Agent begins processing: Create an empty assistant message as a placeholder
      // that will be filled in as text streams arrive. Set status to 'streaming'
      // to show loading indicators in the UI.
      const newAssistantMsg: Message = {
        id: generateMessageId(),
        role: 'assistant',
        parts: [{ type: 'text', text: '' }],
      };

      return {
        ...state,
        status: 'streaming',
        messages: [...state.messages, newAssistantMsg],
        currentAssistantMessageId: newAssistantMsg.id,
      };
    }

    case 'model_response': {
      // Agent streams a text chunk: Find the currently streaming message
      // (identified by currentAssistantMessageId) and append the new chunk
      // to its existing text. This creates the typewriter effect in the UI.
      const messages = [...state.messages];
      const lastMsg = messages[messages.length - 1];

      if (lastMsg?.id === state.currentAssistantMessageId && lastMsg.role === 'assistant') {
        const textPart = lastMsg.parts.find(p => p.type === 'text');
        if (textPart && 'text' in textPart) {
          // Create new message with updated text (immutable update)
          const updatedMsg: Message = {
            ...lastMsg,
            parts: [{ type: 'text', text: textPart.text + event.chunk }],
          };
          messages[messages.length - 1] = updatedMsg;
        }
      }

      return {
        ...state,
        messages,
      };
    }

    case 'canvas_update':
      // Agent updates the diagram: Replace the canvas content entirely with new D2 code.
      // This happens when the agent calls the replace_canvas tool. The canvas content
      // is displayed separately from the chat messages.
      return {
        ...state,
        canvasContent: event.content,
      };

    case 'complete':
      // Agent finished successfully: Reset status to 'ready' (hides loading indicators)
      // and clear the streaming message ID since no message is being streamed anymore.
      return {
        ...state,
        status: 'ready',
        currentAssistantMessageId: null,
      };

    case 'error': {
      // Agent encountered an error: Add the error as a visible message in the chat
      // so the user understands what went wrong. Set status to 'error' to update UI.
      const errorMsg: Message = {
        id: generateMessageId(),
        role: 'assistant',
        parts: [{ type: 'text', text: `Error: ${event.error.message}` }],
      };

      return {
        ...state,
        status: 'error',
        messages: [...state.messages, errorMsg],
        currentAssistantMessageId: null,
      };
    }

    // Ignore diagnostic events (log, tool_start, tool_end) - they don't affect UI state
    default:
      return state;
  }
}

/**
 * Extracts text content from a message's parts.
 *
 * Messages can have multiple parts (text, files, artifacts). This finds the first
 * text part and returns its content, or empty string if no text is found. Used when
 * sending a user's message to the agent - we only care about the text content.
 */
export function extractTextFromMessage(message: Message): string {
  const textPart = message.parts.find(p => p.type === 'text');
  return textPart && 'text' in textPart ? textPart.text : '';
}

/**
 * Adds a user message to the state.
 *
 * When the user sends a message, it's immediately added to the chat UI so they
 * see their own message right away. Status changes to 'submitted' to indicate
 * that we're waiting for the agent to start processing.
 */
export function addUserMessage(
  state: DiagramAgentState,
  message: Message
): DiagramAgentState {
  return {
    ...state,
    messages: [...state.messages, message],
    status: 'submitted',
  };
}

/**
 * Clears all chat state.
 *
 * Resets everything to initial state: clears the conversation history, wipes the
 * diagram canvas, resets status to ready, and clears any in-progress streaming.
 * Used when the user clicks "Clear Chat" to start a fresh conversation.
 */
export function clearChatState(state: DiagramAgentState): DiagramAgentState {
  return {
    ...state,
    messages: [],
    canvasContent: '',
    status: 'ready',
    currentAssistantMessageId: null,
  };
}

/**
 * Sets error status without adding a message.
 *
 * Used when an error occurs in the hook itself (e.g., network error when calling
 * agent.sendMessage). The agent's own errors are handled by the 'error' event,
 * but hook-level errors need to update the status so the UI can show error styling.
 */
export function setErrorStatus(state: DiagramAgentState): DiagramAgentState {
  return {
    ...state,
    status: 'error',
  };
}
