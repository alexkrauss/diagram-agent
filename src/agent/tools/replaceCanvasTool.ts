import { tool } from '@openai/agents';
import { z } from 'zod';

export function createReplaceCanvasTool(
  updateCanvas: (content: string) => void
) {
  return tool({
    name: 'replace_canvas',
    description: 'Replace the entire D2 diagram canvas with new content. This overwrites the current diagram completely.',
    parameters: z.object({
      content: z.string().describe('The complete D2 diagram DSL content to replace the canvas with'),
    }),
    execute: async (input) => {
      updateCanvas(input.content);
      return 'Canvas replaced successfully';
    },
  });
}
