import { useState, useMemo, useCallback } from 'react';
import { d2AgentFactory, AgentEvent } from '../agent';
import { ChatHandler, Message } from './types';
import {
  createInitialState,
  handleAgentEvent,
  extractTextFromMessage,
  addUserMessage,
  clearChatState,
  setErrorStatus,
  type DiagramAgentState,
} from './diagramAgentAdapter';

interface UseDiagramAgentHandlerProps {
  apiKey: string;
}

interface UseDiagramAgentHandlerReturn extends ChatHandler {
  canvasContent: string;
  clearChat: () => void;
}

/**
 * Custom hook that bridges DiagramAgent with the chat-ui ChatHandler interface.
 * This is a thin wrapper around pure state management functions.
 */
export function useDiagramAgentHandler(
  props: UseDiagramAgentHandlerProps
): UseDiagramAgentHandlerReturn {
  const { apiKey } = props;

  // Single state object managed by pure functions
  const [state, setState] = useState<DiagramAgentState>(createInitialState);

  // Agent event callback that applies pure state transformations
  const agentEventCallback = useCallback((event: AgentEvent) => {
    setState(currentState => handleAgentEvent(currentState, event));
  }, []);

  // Create agent instance with memoization
  const agent = useMemo(() => {
    if (!apiKey.trim()) return null;
    return d2AgentFactory.createAgent(
      { apiKey },
      agentEventCallback
    );
  }, [apiKey, agentEventCallback]);

  const sendMessage = useCallback(
    async (msg: Message) => {
      if (!agent) {
        throw new Error('Agent not initialized. Please provide an API key.');
      }

      const userText = extractTextFromMessage(msg);
      if (!userText.trim()) return;

      // Add user message to UI immediately
      setState(currentState => addUserMessage(currentState, msg));

      try {
        await agent.sendMessage(userText);
      } catch (error) {
        console.error('Agent error:', error);
        setState(currentState => setErrorStatus(currentState));
      }
    },
    [agent]
  );

  const clearChat = useCallback(() => {
    setState(currentState => clearChatState(currentState));
  }, []);

  return {
    messages: state.messages,
    status: state.status,
    sendMessage,
    canvasContent: state.canvasContent,
    clearChat,
  };
}
