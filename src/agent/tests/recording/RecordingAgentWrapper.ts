/**
 * RecordingAgentWrapper - Wraps a DiagramAgent and records all events and interactions
 */

import type { DiagramAgent, AgentEvent, AgentState } from '../../DiagramAgent';
import type { EventRecorder } from './EventRecorder';
import type { AgentWrapper, CanvasState, ConversationState } from '../conversation-testing';

export class RecordingAgentWrapper implements AgentWrapper {
  private agent: DiagramAgent;
  private recorder: EventRecorder;

  constructor(agent: DiagramAgent, recorder: EventRecorder) {
    this.agent = agent;
    this.recorder = recorder;
  }

  /**
   * Send a message to the agent
   * Records the user message event
   */
  async send(message: string): Promise<void> {
    // Record user message
    this.recorder.record({
      type: 'user_message',
      time: Date.now(),
      content: message,
    });

    // Send to agent (agent events are recorded via callback during agent creation)
    await this.agent.sendMessage(message);
  }

  /**
   * Get current canvas state
   */
  get canvas(): CanvasState {
    return {
      content: this.agent.getCanvasContent(),
    };
  }

  /**
   * Get conversation history
   */
  get conversation(): ConversationState {
    return {
      messages: this.agent.getConversationHistory(),
    };
  }

  /**
   * Get agent state
   */
  get state(): AgentState {
    return this.agent.getState();
  }

  /**
   * Reset agent (not supported)
   */
  reset(): void {
    throw new Error(
      'Reset not supported. DiagramAgent interface does not provide a reset method. ' +
      'Create a new agent instance instead.'
    );
  }
}

/**
 * Creates an event callback that records agent events to an EventRecorder
 */
export function createRecordingCallback(recorder: EventRecorder): (event: AgentEvent) => void {
  return (event: AgentEvent) => {
    const time = Date.now();

    switch (event.type) {
      case 'start':
        // Don't record start events (noise)
        break;

      case 'log':
        // Don't record log events (noise)
        break;

      case 'model_response':
        // Don't record individual streaming chunks
        // Wait for model_response_complete instead
        break;

      case 'model_response_complete':
        // Record the complete aggregated response as a single assistant message
        recorder.record({
          type: 'assistant_message',
          time,
          content: event.content,
        });
        break;

      case 'tool_start':
        recorder.record({
          type: 'tool_call',
          time,
          toolName: event.name,
          arguments: event.args,
        });
        break;

      case 'tool_end':
        recorder.record({
          type: 'tool_result',
          time,
          toolName: event.name,
          result: event.result,
        });
        break;

      case 'canvas_update':
        recorder.record({
          type: 'canvas_update',
          time,
          d2Content: event.content,
          canvasUpdateId: event.canvasUpdateId,
        });
        break;

      case 'error':
        recorder.record({
          type: 'error',
          time,
          error: event.error.message,
          stack: event.error.stack,
        });
        break;

      case 'complete':
        // Don't record complete events (noise)
        break;
    }
  };
}
