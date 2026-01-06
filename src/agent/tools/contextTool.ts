import { tool } from '@openai/agents';
import { z } from 'zod';
import { getContextDoc, getContextKeywords } from '../context';

export function createContextTool() {
  return tool({
    name: 'get_d2_context',
    description:
      'Load D2 language reference notes by keyword (e.g., basics, shapes, connections, containers, styles).',
    parameters: z.object({
      keyword: z
        .string()
        .describe('Topic keyword matching a context doc filename (without extension).'),
    }),
    execute: async ({ keyword }) => {
      const doc = getContextDoc(keyword);
      if (!doc) {
        const keywords = getContextKeywords();
        return `No context found for "${keyword}". Available keywords: ${keywords.join(', ')}.`;
      }
      return doc;
    },
  });
}
