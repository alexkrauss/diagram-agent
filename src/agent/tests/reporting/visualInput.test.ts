import { describe, expect, it } from 'vitest';
import type { RecordedEvent } from '../recording/types';
import { buildTurnRecords } from './visualInput';

describe('buildTurnRecords', () => {
  it('attaches criteria and builds prompt/payload fields', () => {
    const events: RecordedEvent[] = [
      {
        type: 'criteria',
        time: 1,
        turnIndex: 0,
        criteria: ['There is a box labeled A.'],
      },
      {
        type: 'turn_complete',
        time: 2,
        turnIndex: 0,
        canvasUpdateId: 'canvas-1',
        d2Content: 'A',
        conversation: [{ role: 'user', content: 'Draw A' }],
      },
    ];

    const turns = buildTurnRecords(events, 'file-1', 0);
    expect(turns.length).toBe(1);
    expect(turns[0].criteria).toEqual(['There is a box labeled A.']);
    expect(turns[0].prompt).toContain('USER: Draw A');
    expect(turns[0].pngPath).toBe('./file-1/test-0/canvas-1.png');
    expect(turns[0].d2Content).toBe('A');
  });
});
