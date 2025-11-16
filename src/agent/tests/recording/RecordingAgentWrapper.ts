/**
 * RecordingAgentWrapper - Wraps a DiagramAgent and records all events and interactions
 */

import type { DiagramAgent, AgentEvent, AgentState } from '../../DiagramAgent';
import type { EventRecorder } from './EventRecorder';
import type { AgentWrapper, CanvasState, ConversationState } from '../conversation-testing';

export class RecordingAgentWrapper implements AgentWrapper {
  private agent: DiagramAgent;
  private recorder: EventRecorder;
  private turnIndex: number = -1;

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

    const eventStartIndex = this.recorder.getEvents().length;

    // Send to agent (agent events are recorded via callback during agent creation)
    await this.agent.sendMessage(message);

    const events = this.recorder.getEvents().slice(eventStartIndex);
    const lastCanvasUpdate = [...events]
      .reverse()
      .find((event) => event.type === 'canvas_update');

    this.turnIndex += 1;

    this.recorder.record({
      type: 'turn_complete',
      time: Date.now(),
      turnIndex: this.turnIndex,
      canvasUpdateId:
        lastCanvasUpdate?.type === 'canvas_update'
          ? lastCanvasUpdate.canvasUpdateId
          : undefined,
      d2Content:
        lastCanvasUpdate?.type === 'canvas_update'
          ? lastCanvasUpdate.d2Content
          : this.agent.getCanvasContent(),
      conversation: this.agent
        .getConversationHistory()
        .map((message) => ({ role: message.role, content: message.content })),
    });
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
   * Attach prose criteria to the most recent completed turn.
   */
  criteria(...criteria: string[]): void {
    if (this.turnIndex < 0) {
      throw new Error('criteria() must be called after at least one send().');
    }
    this.recorder.record({
      type: 'criteria',
      time: Date.now(),
      turnIndex: this.turnIndex,
      criteria,
    });
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

      case 'render_complete':
        recorder.record({
          type: 'render_complete',
          time,
          canvasUpdateId: event.canvasUpdateId,
          success: event.success,
          error: event.error,
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
