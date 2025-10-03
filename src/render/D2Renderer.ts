import { D2 } from "@terrastruct/d2";
import type { D2Renderer, RenderResult, RenderOptions } from "./types";
import { defaultRenderOptions } from "./types";

/**
 * Implementation of D2Renderer using @terrastruct/d2
 */
export class D2RendererImpl implements D2Renderer {
  private d2: D2;

  constructor() {
    this.d2 = new D2();
  }

  async render(
    d2Code: string,
    options?: Partial<RenderOptions>
  ): Promise<RenderResult> {
    try {
      // Merge with default options
      const opts: RenderOptions = {
        ...defaultRenderOptions,
        ...options,
      };

      // Compile the D2 code
      const compileResult = await this.d2.compile(d2Code, {
        options: {
          layout: opts.layout,
        },
      });

      // Render to SVG
      const svg = await this.d2.render(compileResult.diagram, {
        ...compileResult.renderOptions,
        themeID: opts.themeID,
        pad: opts.pad,
        scale: opts.scale,
        sketch: opts.sketch,
      });

      return {
        svg,
      };
    } catch (error) {
      return {
        svg: "",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
