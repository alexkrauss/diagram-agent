import { useState, useMemo, useCallback, useEffect } from 'react';
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
    setSvg('');
    setRenderError('');
  }, []);

  // Feedback loop: Render D2 code and send visual feedback to agent
  useEffect(() => {
    const renderAndSendFeedback = async () => {
      if (!state.canvasContent || !agent) {
        setSvg('');
        setRenderError('');
        return;
      }

      const result = await renderer.render(state.canvasContent);

      if (result.error) {
        console.error('Render error:', result.error);
        setRenderError(result.error);
        setSvg('');

        // Send error feedback to agent immediately
        const feedbackMessage: Message = {
          id: crypto.randomUUID(),
          role: 'user',
          parts: [{
            type: 'text',
            text: `Rendering failed with error: ${result.error}`
          }]
        };

        await sendMessage(feedbackMessage);
      } else {
        setRenderError('');
        setSvg(result.svg);

        // Convert SVG to PNG and send image feedback to agent immediately
        try {
          const pngBase64 = await imageConverter.svgToPngBase64(result.svg);
          agent.setRenderedImage(pngBase64);

          const feedbackMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            parts: [{
              type: 'text',
              text: 'Here is the rendered diagram:'
            }]
          };

          await sendMessage(feedbackMessage);
        } catch (error) {
          console.error('Failed to convert SVG to PNG:', error);
        }
      }
    };

    renderAndSendFeedback();
  }, [state.canvasContent, agent, renderer, imageConverter, sendMessage]);

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
