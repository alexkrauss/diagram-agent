import { tool, protocol } from '@openai/agents';
import { z } from 'zod';
import type { RenderFunction, AgentEvent } from '../DiagramAgent';

type ToolOutputImage = z.infer<typeof protocol.ToolOutputImage>;

let canvasUpdateCounter = 0;

export function createReplaceCanvasTool(
  updateCanvas: (content: string, canvasUpdateId: string) => void,
  renderFunction: RenderFunction,
  emit: (event: AgentEvent) => void
) {
  return tool({
    name: 'replace_canvas',
    description: 'Replace the entire D2 diagram canvas with new content. This overwrites the current diagram completely.',
    parameters: z.object({
      content: z.string().describe('The complete D2 diagram DSL content to replace the canvas with'),
    }),
    execute: async (input) => {
      // Generate unique ID for this canvas update
      const canvasUpdateId = `canvas-${canvasUpdateCounter++}`;

      // Update the canvas state
      updateCanvas(input.content, canvasUpdateId);

      // Render the D2 content to get visual feedback
      const renderResult = await renderFunction(input.content, canvasUpdateId);

      let result: string | ToolOutputImage;

      // If rendering failed, return error as text
      if (renderResult.error) {
        // Emit render_complete event with error
        emit({
          type: 'render_complete',
          canvasUpdateId: canvasUpdateId,
          success: false,
          error: renderResult.error,
        });

        result = `Canvas updated, but rendering failed: ${renderResult.error}`;
        return result;
      }

      // If rendering succeeded, return the PNG image as tool output
      if (renderResult.png) {
        // Emit render_complete event with success
        emit({
          type: 'render_complete',
          canvasUpdateId: canvasUpdateId,
          success: true,
        });

        // Extract base64 data from data URL (data:image/png;base64,...)
        const base64Data = renderResult.png.replace(/^data:image\/png;base64,/, '');

        result = {
          type: 'image',
          image: {
            data: base64Data,
            mediaType: 'image/png'
          }
        };
        return result;
      }

      // Fallback if no PNG or error
      emit({
        type: 'render_complete',
        canvasUpdateId: canvasUpdateId,
        success: true,
      });

      result = 'Canvas replaced successfully';
      return result;
    },
  });
}
