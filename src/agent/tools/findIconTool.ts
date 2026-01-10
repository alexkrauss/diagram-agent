import { tool, protocol } from '@openai/agents';
import { z } from 'zod';
import type { IconLibrary } from '../../icon-library';
import type { RenderFunction } from '../DiagramAgent';

type ToolOutputImage = z.infer<typeof protocol.ToolOutputImage>;

export function createFindIconTool(
  iconLibrary: IconLibrary,
  renderFunction: RenderFunction
) {
  return tool({
    name: 'find_icon',
    description:
      'Search for icons to use in D2 diagrams. Returns a list of matching icons with URLs and a visual preview. Use this to find appropriate icons for AWS services, development tools, cloud platforms, etc.',
    parameters: z.object({
      query: z
        .string()
        .describe('Search term for icons (e.g., "database", "lambda", "kubernetes", "github")'),
    }),
    execute: async ({ query }) => {
      const icons = iconLibrary.search(query, 10);

      if (icons.length === 0) {
        return `No icons found matching '${query}'`;
      }

      // Build text result with icon names and URLs
      const textLines = icons.map((icon) => `- ${icon.name}: ${icon.url}`);
      const textResult = `Found ${icons.length} icons:\n${textLines.join('\n')}`;

      // Generate D2 diagram for visual preview
      const d2Lines = icons.map(
        (icon, i) => `icon_${i}: ${icon.name} {
  shape: image
  icon: ${icon.url}
}`
      );
      const d2Content = d2Lines.join('\n\n');

      // Render the preview
      const renderResult = await renderFunction(d2Content, `icon-preview-${Date.now()}`);

      if (renderResult.error || !renderResult.png) {
        // Return text-only if rendering fails
        return textResult;
      }

      // Return image with text as alt/description
      const base64Data = renderResult.png.replace(/^data:image\/png;base64,/, '');

      const result: ToolOutputImage = {
        type: 'image',
        image: {
          data: base64Data,
          mediaType: 'image/png',
        },
      };

      // The OpenAI agents SDK allows returning an array with text and image
      return [textResult, result];
    },
  });
}
