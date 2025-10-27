import { tool, protocol } from '@openai/agents';
import { z } from 'zod';
import type { RenderFunction } from '../DiagramAgent';

export function createReplaceCanvasTool(
  updateCanvas: (content: string) => void,
  renderFunction: RenderFunction
) {
  return tool({
    name: 'replace_canvas',
    description: 'Replace the entire D2 diagram canvas with new content. This overwrites the current diagram completely.',
    parameters: z.object({
      content: z.string().describe('The complete D2 diagram DSL content to replace the canvas with'),
    }),
    execute: async (input) => {
      // Update the canvas state
      updateCanvas(input.content);

      // Render the D2 content to get visual feedback
      const renderResult = await renderFunction(input.content);

      // If rendering failed, return error as text
      if (renderResult.error) {
        return `Canvas updated, but rendering failed: ${renderResult.error}`;
      }

      // If rendering succeeded, return the PNG image as tool output
      if (renderResult.png) {
        // Extract base64 data from data URL (data:image/png;base64,...)
        const base64Data = renderResult.png.replace(/^data:image\/png;base64,/, '');

        return {
          type: 'image',
          data: base64Data,
          mediaType: 'image/png'
        } as protocol.ToolOutputImage;
      }

      // Fallback if no PNG or error
      return 'Canvas replaced successfully';
    },
  });
}
