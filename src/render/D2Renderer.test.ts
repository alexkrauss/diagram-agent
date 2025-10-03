import { describe, it, expect, beforeAll } from 'vitest';
import { D2RendererImpl } from './D2Renderer';
import type { RenderOptions } from './types';

describe('D2Renderer', () => {
  let renderer: D2RendererImpl;

  beforeAll(async () => {
    renderer = new D2RendererImpl();
  });

  describe('successful rendering', () => {
    it('should render a simple diagram', async () => {
      const d2Code = 'x -> y';
      const result = await renderer.render(d2Code);

      expect(result.error).toBeUndefined();
      expect(result.svg).toContain('<svg');
      expect(result.svg).toContain('</svg>');
      expect(result.svg.length).toBeGreaterThan(100);
    });

    it('should render a more complex diagram', async () => {
      const d2Code = `
        users: Users {
          shape: cylinder
        }
        api: API Server {
          shape: hexagon
        }
        users -> api: HTTP Request
      `;
      const result = await renderer.render(d2Code);

      expect(result.error).toBeUndefined();
      expect(result.svg).toContain('<svg');
      expect(result.svg).toContain('</svg>');
    });

    it('should respect scale option', async () => {
      const d2Code = 'x -> y';
      const options: Partial<RenderOptions> = { scale: 2.0 };
      const result = await renderer.render(d2Code, options);

      expect(result.error).toBeUndefined();
      expect(result.svg).toContain('<svg');
    });

    it('should respect layout option', async () => {
      const d2Code = 'x -> y -> z';
      const options: Partial<RenderOptions> = { layout: 'elk' };
      const result = await renderer.render(d2Code, options);

      expect(result.error).toBeUndefined();
      expect(result.svg).toContain('<svg');
    });

    it('should respect sketch mode option', async () => {
      const d2Code = 'x -> y';
      const options: Partial<RenderOptions> = { sketch: true };
      const result = await renderer.render(d2Code, options);

      expect(result.error).toBeUndefined();
      expect(result.svg).toContain('<svg');
    });
  });

  describe('error handling', () => {
    it('should handle syntax errors gracefully', async () => {
      const d2Code = 'x -> -> y'; // Invalid syntax: double arrow
      const result = await renderer.render(d2Code);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('connection missing destination');
      expect(result.error).toContain('connection missing source');
      expect(result.svg).toBe('');
    });

    it('should handle empty input', async () => {
      const d2Code = '';
      const result = await renderer.render(d2Code);

      // Empty diagram should still render (just blank)
      expect(result.error).toBeUndefined();
      expect(result.svg).toContain('<svg');
    });

    it('should handle malformed D2 code', async () => {
      const d2Code = 'x -> { invalid }'; // Invalid: connection with map
      const result = await renderer.render(d2Code);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('connection missing destination');
      expect(result.svg).toBe('');
    });

    it('should handle unterminated map', async () => {
      const d2Code = 'x -> y {'; // Invalid: unterminated map
      const result = await renderer.render(d2Code);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('maps must be terminated with }');
      expect(result.svg).toBe('');
    });
  });
});
