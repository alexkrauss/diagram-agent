/**
 * Represents the result of rendering a D2 diagram
 */
export interface RenderResult {
  /** The rendered diagram as SVG string */
  svg: string;
  /** Optional error message if rendering failed */
  error?: string;
}

/**
 * Configuration options for the D2 renderer
 */
export interface RenderOptions {
  /** Scale factor for output size (default: 1.0) */
  scale: number;
  /** Layout engine to use (default: 'dagre') */
  layout: "dagre" | "elk";
  /** Theme ID to use (default: 0) */
  themeID: number;
  /** Padding in pixels (default: 100) */
  pad: number;
  /** Enable sketch mode (default: false) */
  sketch: boolean;
}

/**
 * Default rendering options used when none are specified
 */
export const defaultRenderOptions: RenderOptions = {
  scale: 1.0,
  layout: "dagre",
  themeID: 0,
  pad: 100,
  sketch: false,
};

/**
 * Interface for D2 diagram rendering
 */
export interface D2Renderer {
  /**
   * Renders D2 DSL code to an image
   * @param d2Code - The D2 diagram code to render
   * @param options - Optional rendering configuration
   * @returns Promise resolving to the render result
   */
  render(
    d2Code: string,
    options?: Partial<RenderOptions>
  ): Promise<RenderResult>;
}
