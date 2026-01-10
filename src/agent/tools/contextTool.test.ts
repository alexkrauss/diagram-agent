import { describe, expect, it, vi } from 'vitest';

vi.mock('@openai/agents', () => ({
  tool: vi.fn((config) => config),
}));

import { createContextTool } from './contextTool';
import { getContextKeywords } from '../context';

describe('createContextTool', () => {
  it('returns context content for a known keyword', async () => {
    const toolConfig = createContextTool() as unknown as {
      execute: (args: { keyword: string }) => Promise<string>;
    };
    const result = await toolConfig.execute({ keyword: 'basics' });

    expect(result).toContain('# D2 basics');
  });

  it('lists available keywords for unknown requests', async () => {
    const toolConfig = createContextTool() as unknown as {
      execute: (args: { keyword: string }) => Promise<string>;
    };
    const result = await toolConfig.execute({ keyword: 'unknown-topic' });

    expect(result).toContain('Available keywords');
    for (const keyword of getContextKeywords()) {
      expect(result).toContain(keyword);
    }
  });
});
