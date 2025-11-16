import { describe, expect, it } from 'vitest';
import { RecordingAgentWrapper } from './RecordingAgentWrapper';
import { EventRecorder } from './EventRecorder';
import type { DiagramAgent, ConversationMessage, AgentState } from '../../DiagramAgent';

describe('RecordingAgentWrapper', () => {
  it('records turn completion with the last canvas update', async () => {
    const recorder = new EventRecorder();
    let canvas = '';
    const messages: ConversationMessage[] = [];

    const agent: DiagramAgent = {
      async sendMessage(message: string): Promise<void> {
        messages.push({ role: 'user', content: message, timestamp: new Date() });

        recorder.record({
          type: 'canvas_update',
          time: Date.now(),
          d2Content: 'first',
          canvasUpdateId: 'canvas-0',
        });

        recorder.record({
          type: 'canvas_update',
          time: Date.now() + 1,
          d2Content: 'second',
          canvasUpdateId: 'canvas-1',
        });

        canvas = 'second';
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

    const wrapper = new RecordingAgentWrapper(agent, recorder);
    await wrapper.send('Create A');

    const turnComplete = recorder
      .getEvents()
      .find((event) => event.type === 'turn_complete');

    expect(turnComplete?.type).toBe('turn_complete');
    if (turnComplete?.type === 'turn_complete') {
      expect(turnComplete.canvasUpdateId).toBe('canvas-1');
      expect(turnComplete.d2Content).toBe('second');
    }
  });

  it('records criteria for the most recent turn', async () => {
    const recorder = new EventRecorder();
    const agent: DiagramAgent = {
      async sendMessage(): Promise<void> {},
      getCanvasContent(): string {
        return '';
      },
      getConversationHistory(): ConversationMessage[] {
        return [];
      },
      getState(): AgentState {
        return { status: 'idle' };
      },
    };

    const wrapper = new RecordingAgentWrapper(agent, recorder);
    await wrapper.send('Create A');
    wrapper.criteria('There is a box labeled A.');

    const criteriaEvent = recorder
      .getEvents()
      .find((event) => event.type === 'criteria');

    expect(criteriaEvent?.type).toBe('criteria');
    if (criteriaEvent?.type === 'criteria') {
      expect(criteriaEvent.turnIndex).toBe(0);
      expect(criteriaEvent.criteria).toEqual(['There is a box labeled A.']);
    }
  });
});
