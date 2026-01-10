/**
 * Reproducer for icon rendering issue.
 *
 * This script tests whether icons referenced via URLs are properly
 * rendered in the PNG output.
 *
 * Run: npx tsx scripts/icon-render-reproducer.ts
 *
 * THE ISSUE:
 * Sharp (and the underlying librsvg) does NOT fetch external URLs when
 * converting SVG to PNG. This is a security feature - SVGs rendered as
 * images shouldn't load external resources.
 *
 * THE FIX:
 * Pre-process the SVG to inline external images as base64 data URIs
 * before passing to Sharp.
 */

import { D2RendererImpl } from "../src/render/D2Renderer";
import { createImageConverter } from "../src/render/ImageConverter";
import * as fs from "fs/promises";
import * as path from "path";

const D2_WITH_ICONS = `
repo: GitHub Repo {
  icon: https://icons.terrastruct.com/dev/github.svg
}

ci: CI/CD {
  icon: https://icons.terrastruct.com/essentials%2F092-copy.svg
}

repo -> ci
`;

/**
 * Fetches an external URL and converts it to a base64 data URI.
 */
async function urlToBase64DataUri(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/svg+xml";
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  return `data:${contentType};base64,${base64}`;
}

/**
 * Pre-processes SVG to inline external image references as base64 data URIs.
 * This fixes the issue where Sharp/librsvg doesn't fetch external URLs.
 */
async function inlineExternalImages(svg: string): Promise<string> {
  // Find all image elements with href attributes pointing to http(s) URLs
  const imageHrefRegex = /<image\s+([^>]*?)href="(https?:\/\/[^"]+)"([^>]*?)\/>/g;

  let result = svg;
  const matches = [...svg.matchAll(imageHrefRegex)];

  for (const match of matches) {
    const [fullMatch, beforeHref, url, afterHref] = match;
    try {
      console.log(`  Fetching: ${url}`);
      const dataUri = await urlToBase64DataUri(url);
      const replacement = `<image ${beforeHref}href="${dataUri}"${afterHref}/>`;
      result = result.replace(fullMatch, replacement);
    } catch (error) {
      console.warn(`  Warning: Failed to inline ${url}:`, error);
    }
  }

  return result;
}

async function main() {
  const outputDir = path.join(process.cwd(), "test-output");
  await fs.mkdir(outputDir, { recursive: true });

  console.log("Rendering D2 diagram with icons...\n");
  console.log("D2 code:");
  console.log(D2_WITH_ICONS);

  // Step 1: Render D2 to SVG
  const renderer = new D2RendererImpl();
  const renderResult = await renderer.render(D2_WITH_ICONS);

  if (renderResult.error) {
    console.error("D2 render error:", renderResult.error);
    return;
  }

  const svgPath = path.join(outputDir, "icon-test.svg");
  await fs.writeFile(svgPath, renderResult.svg);
  console.log(`\nSVG saved to: ${svgPath}`);

  // Check if SVG contains icon references
  const hasImageHref = renderResult.svg.includes("href=");
  console.log(`\nSVG contains href attributes: ${hasImageHref}`);

  // Extract image URLs from SVG
  const hrefMatches = renderResult.svg.match(/<image[^>]*href="([^"]+)"/g) || [];
  console.log("\nImage references found in SVG:");
  hrefMatches.forEach((match) => {
    console.log(`  ${match}`);
  });

  // Step 2: Convert SVG to PNG WITHOUT inlining (demonstrates the bug)
  console.log("\n--- WITHOUT inlining external images ---");
  console.log("Converting SVG to PNG using sharp (icons will be MISSING)...");
  const imageConverter = createImageConverter();
  const pngDataUrlBroken = await imageConverter.svgToPngBase64(renderResult.svg);

  const pngPathBroken = path.join(outputDir, "icon-test-BROKEN.png");
  const base64DataBroken = pngDataUrlBroken.replace(/^data:image\/png;base64,/, "");
  const pngBufferBroken = Buffer.from(base64DataBroken, "base64");
  await fs.writeFile(pngPathBroken, pngBufferBroken);
  console.log(`PNG (broken) saved to: ${pngPathBroken}`);

  // Step 3: Convert SVG to PNG WITH inlining (demonstrates the fix)
  console.log("\n--- WITH inlining external images ---");
  console.log("Inlining external images...");
  const inlinedSvg = await inlineExternalImages(renderResult.svg);

  const svgPathInlined = path.join(outputDir, "icon-test-inlined.svg");
  await fs.writeFile(svgPathInlined, inlinedSvg);
  console.log(`Inlined SVG saved to: ${svgPathInlined}`);

  console.log("Converting inlined SVG to PNG using sharp (icons WILL appear)...");
  const pngDataUrlFixed = await imageConverter.svgToPngBase64(inlinedSvg);

  const pngPathFixed = path.join(outputDir, "icon-test-FIXED.png");
  const base64DataFixed = pngDataUrlFixed.replace(/^data:image\/png;base64,/, "");
  const pngBufferFixed = Buffer.from(base64DataFixed, "base64");
  await fs.writeFile(pngPathFixed, pngBufferFixed);
  console.log(`PNG (fixed) saved to: ${pngPathFixed}`);

  console.log("\n=== SUMMARY ===");
  console.log("The issue: Sharp/librsvg doesn't fetch external URLs in SVG images.");
  console.log("The fix: Pre-process SVG to inline external images as base64 data URIs.");
  console.log("\nCompare these files:");
  console.log(`  Original SVG:    ${svgPath}`);
  console.log(`  BROKEN PNG:      ${pngPathBroken} (no icons)`);
  console.log(`  Inlined SVG:     ${svgPathInlined}`);
  console.log(`  FIXED PNG:       ${pngPathFixed} (has icons)`);
}

main().catch(console.error);
