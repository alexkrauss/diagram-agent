import { describe, expect, it } from 'vitest';
import type { RecordedEvent } from '../recording/types';
import { buildTurnRecords } from './visualInput';

describe('buildTurnRecords', () => {
  it('attaches criteria and builds turn events', () => {
    const events: RecordedEvent[] = [
      {
        type: 'user_message',
        time: 0,
        content: 'Draw A',
      },
      {
        type: 'assistant_message',
        time: 1,
        content: 'I will draw A for you.',
      },
      {
        type: 'criteria',
        time: 2,
        turnIndex: 0,
        criteria: ['There is a box labeled A.'],
      },
      {
        type: 'turn_complete',
        time: 3,
        turnIndex: 0,
        canvasUpdateId: 'canvas-1',
        d2Content: 'A',
        conversation: [{ role: 'user', content: 'Draw A' }],
      },
    ];

    const turns = buildTurnRecords(events, 'file-1', 0);
    expect(turns.length).toBe(1);
    expect(turns[0].criteria).toEqual(['There is a box labeled A.']);
    expect(turns[0].pngPath).toBe('./file-1/test-0/canvas-1.png');
    expect(turns[0].d2Content).toBe('A');
    expect(turns[0].turnEvents).toEqual([
      { type: 'user_message', content: 'Draw A' },
      { type: 'assistant_message', content: 'I will draw A for you.' },
    ]);
  });

  it('includes tool calls in turn events in order', () => {
    const events: RecordedEvent[] = [
      { type: 'user_message', time: 1, content: 'Draw shapes' },
      { type: 'tool_call', time: 2, toolName: 'get_d2_context', arguments: { keyword: 'shapes' } },
      { type: 'assistant_message', time: 3, content: 'Here are shapes.' },
      {
        type: 'turn_complete',
        time: 4,
        turnIndex: 0,
        canvasUpdateId: 'canvas-1',
        d2Content: 'A',
        conversation: [{ role: 'user', content: 'Draw shapes' }],
      },
    ];

    const turns = buildTurnRecords(events, 'file-1', 0);
    expect(turns[0].turnEvents).toEqual([
      { type: 'user_message', content: 'Draw shapes' },
      { type: 'tool_call', toolName: 'get_d2_context', arguments: { keyword: 'shapes' } },
      { type: 'assistant_message', content: 'Here are shapes.' },
    ]);
  });

  it('preserves interleaved tool calls and messages in order', () => {
    const events: RecordedEvent[] = [
      { type: 'user_message', time: 1, content: 'Create a diagram' },
      { type: 'tool_call', time: 2, toolName: 'get_d2_context', arguments: { keyword: 'basics' } },
      { type: 'assistant_message', time: 3, content: 'Let me check connections too.' },
      { type: 'tool_call', time: 4, toolName: 'get_d2_context', arguments: { keyword: 'connections' } },
      { type: 'assistant_message', time: 5, content: 'Here is your diagram.' },
      {
        type: 'turn_complete',
        time: 6,
        turnIndex: 0,
        canvasUpdateId: 'canvas-0',
        d2Content: 'A -> B',
        conversation: [],
      },
    ];

    const turns = buildTurnRecords(events, 'file-1', 0);
    expect(turns[0].turnEvents).toEqual([
      { type: 'user_message', content: 'Create a diagram' },
      { type: 'tool_call', toolName: 'get_d2_context', arguments: { keyword: 'basics' } },
      { type: 'assistant_message', content: 'Let me check connections too.' },
      { type: 'tool_call', toolName: 'get_d2_context', arguments: { keyword: 'connections' } },
      { type: 'assistant_message', content: 'Here is your diagram.' },
    ]);
  });

  it('associates events with correct turns in multi-turn conversations', () => {
    const events: RecordedEvent[] = [
      { type: 'user_message', time: 1, content: 'First request' },
      { type: 'tool_call', time: 2, toolName: 'get_d2_context', arguments: { keyword: 'basics' } },
      { type: 'assistant_message', time: 3, content: 'Done with first.' },
      {
        type: 'turn_complete',
        time: 4,
        turnIndex: 0,
        canvasUpdateId: 'canvas-0',
        d2Content: 'A',
        conversation: [],
      },
      { type: 'user_message', time: 5, content: 'Second request' },
      { type: 'tool_call', time: 6, toolName: 'get_d2_context', arguments: { keyword: 'connections' } },
      { type: 'tool_call', time: 7, toolName: 'get_d2_context', arguments: { keyword: 'styles' } },
      { type: 'assistant_message', time: 8, content: 'Done with second.' },
      {
        type: 'turn_complete',
        time: 9,
        turnIndex: 1,
        canvasUpdateId: 'canvas-1',
        d2Content: 'A -> B',
        conversation: [],
      },
    ];

    const turns = buildTurnRecords(events, 'file-1', 0);
    expect(turns).toHaveLength(2);

    expect(turns[0].turnEvents).toEqual([
      { type: 'user_message', content: 'First request' },
      { type: 'tool_call', toolName: 'get_d2_context', arguments: { keyword: 'basics' } },
      { type: 'assistant_message', content: 'Done with first.' },
    ]);

    expect(turns[1].turnEvents).toEqual([
      { type: 'user_message', content: 'Second request' },
      { type: 'tool_call', toolName: 'get_d2_context', arguments: { keyword: 'connections' } },
      { type: 'tool_call', toolName: 'get_d2_context', arguments: { keyword: 'styles' } },
      { type: 'assistant_message', content: 'Done with second.' },
    ]);
  });

  it('handles turns without tool calls', () => {
    const events: RecordedEvent[] = [
      { type: 'user_message', time: 1, content: 'Simple request' },
      { type: 'assistant_message', time: 2, content: 'Simple response.' },
      {
        type: 'turn_complete',
        time: 3,
        turnIndex: 0,
        canvasUpdateId: 'canvas-0',
        d2Content: 'A',
        conversation: [],
      },
    ];

    const turns = buildTurnRecords(events, 'file-1', 0);
    expect(turns[0].turnEvents).toEqual([
      { type: 'user_message', content: 'Simple request' },
      { type: 'assistant_message', content: 'Simple response.' },
    ]);
  });
});
