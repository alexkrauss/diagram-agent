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
import type { D2Renderer, ImageConverter } from '../render';

interface UseDiagramAgentHandlerProps {
  apiKey: string;
  renderer: D2Renderer;
  imageConverter: ImageConverter;
}

interface UseDiagramAgentHandlerReturn extends ChatHandler {
  canvasContent: string;
  clearChat: () => void;
  svg: string;
  renderError: string;
}

/**
 * Custom hook that manages the DiagramAgent and handles the complete feedback loop.
 * Responsibilities:
 * - Creates and manages the agent
 * - Watches canvas changes
 * - Renders D2 code to SVG
 * - Converts SVG to PNG and sends as feedback to agent
 * - Handles render errors by sending error feedback to agent
 */
export function useDiagramAgentHandler(
  props: UseDiagramAgentHandlerProps
): UseDiagramAgentHandlerReturn {
  const { apiKey, renderer, imageConverter } = props;

  // Single state object managed by pure functions
  const [state, setState] = useState<DiagramAgentState>(createInitialState);

  // Local state for render results
  const [svg, setSvg] = useState('');
  const [renderError, setRenderError] = useState('');

  // Agent event callback that applies pure state transformations
  const agentEventCallback = useCallback((event: AgentEvent) => {
    setState(currentState => handleAgentEvent(currentState, event));
  }, []);

  // Create render function that the agent will call during tool execution
  const renderFunction = useCallback(async (d2Content: string) => {
    const result = await renderer.render(d2Content);

    if (result.error) {
      return { error: result.error };
    }

    // Update local UI state with SVG
    setSvg(result.svg);
    setRenderError('');

    // Convert SVG to PNG for the agent
    try {
      const pngBase64 = await imageConverter.svgToPngBase64(result.svg);
      return { svg: result.svg, png: pngBase64 };
    } catch (error) {
      console.error('Failed to convert SVG to PNG:', error);
      return { svg: result.svg, error: 'Failed to convert to PNG' };
    }
  }, [renderer, imageConverter]);

  // Create agent instance with memoization
  const agent = useMemo(() => {
    if (!apiKey.trim()) return null;
    return d2AgentFactory.createAgent(
      { apiKey, renderFunction },
      agentEventCallback
    );
  }, [apiKey, renderFunction, agentEventCallback]);

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
    setSvg('');
    setRenderError('');
  }, []);

  return {
    messages: state.messages,
    status: state.status,
    sendMessage,
    canvasContent: state.canvasContent,
    clearChat,
    svg,
    renderError,
  };
}
