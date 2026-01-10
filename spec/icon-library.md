# Icon Library Feature Spec

## Overview

The icon library provides a way for the agent to discover and use icons in D2 diagrams. When the agent needs an icon (e.g., for AWS services, development tools, etc.), it can search the library by keyword and receive both a list of matching icons and a visual preview to help select the best match.

## Architecture

### IconLibrary Interface

```typescript
interface Icon {
  name: string;       // Display name (e.g., "Amazon S3", "GitHub")
  url: string;        // Full URL to SVG (e.g., "https://icons.terrastruct.com/aws/...")
}

interface IconLibrary {
  /**
   * Initialize the library. Called at agent startup.
   * For bundled libraries, this is a no-op. For future scraped libraries, this would fetch data.
   */
  initialize(): Promise<void>;

  /**
   * Search for icons matching a query string.
   * Returns up to maxResults icons (default 10).
   * Matching is case-insensitive substring on name.
   */
  search(query: string, maxResults?: number): Icon[];
}
```

### Tool: `find_icon`

The agent uses this tool to search for icons.

**Parameters:**
- `query` (string, required): Search term (e.g., "database", "lambda", "kubernetes")

**Returns:**
- Text listing matching icons with names and URLs (agent needs URLs to use icons in diagrams)
- Image: A rendered preview showing the icons in a grid layout
- If no icons match: Returns a text message indicating no results, no image

**Implementation approach:**
1. Call `iconLibrary.search(query, 10)` to get matching icons
2. If no results, return text "No icons found matching '{query}'"
3. Generate a D2 diagram displaying the icons in a grid:
   ```d2
   icon_0: Icon Name {
     shape: image
     icon: https://...
   }
   icon_1: Another Icon {
     shape: image
     icon: https://...
   }
   ```
4. Render the D2 diagram to PNG using the existing render function
5. Return both text (icon names + URLs) and the rendered image

### TerrastructIconLibrary Implementation

The first implementation uses pre-bundled data from https://icons.terrastruct.com/.

**Data source:**
- Scraped from the terrastruct icons HTML page at build time
- Stored as a JSON file bundled with the application
- Contains ~1,480 icons across 9 categories (aws, azure, gcp, dev, essentials, etc.)

**Build process (high-level):**
1. Fetch the HTML from https://icons.terrastruct.com/
2. Parse icon elements to extract name, path, and category
3. Generate JSON file with icon data
4. Bundle JSON with the application

**JSON format:**
```json
{
  "icons": [
    {
      "name": "Amazon S3",
      "path": "aws/Storage/Amazon-S3.svg"
    }
  ]
}
```

URLs are constructed at runtime: `https://icons.terrastruct.com/${encodedPath}`

## Integration with D2Agent

1. **Initialization**: When D2Agent is constructed, it creates and initializes the icon library
2. **Tool registration**: The `find_icon` tool is added to the agent's tool list alongside `replace_canvas` and `context`
3. **Tool execution**: When called, the tool uses the render function (same one used by `replace_canvas`) to create the preview image

## Testing Strategy

### Unit Tests

1. **IconLibrary.search()**: Test substring matching, case insensitivity, result limits
2. **TerrastructIconLibrary initialization**: Verify bundled data loads correctly
3. **No results case**: Verify search returns empty array for non-matching queries

### Integration Tests

1. **find_icon tool**: Verify it returns both text and image output
2. **Preview rendering**: Verify the generated D2 diagram renders without errors
3. **End-to-end**: Agent conversation requesting an icon and using it in a diagram

### Evaluation Considerations

The existing evaluation infrastructure may need updates to properly display `find_icon` tool calls and their results (including the preview images) in the evaluation reports. Verify that:
- Tool calls to `find_icon` are visible in the evaluation output
- The returned preview images are captured and displayable
- The text results (icon names/URLs) are shown

Add test cases to the existing evaluation suite:
- "Create a diagram showing an S3 bucket connected to a Lambda function with appropriate icons"
- "Draw a system with a GitHub repo, CI/CD pipeline, and cloud deployment using icons"

## Acceptance Criteria

1. **IconLibrary interface exists** with `initialize()` and `search()` methods
2. **TerrastructIconLibrary implementation** loads bundled icon data (~1,480 icons)
3. **find_icon tool** is registered with the D2Agent
4. **Search returns results**: Querying "S3" returns icons with "S3" in the name
5. **Search is case-insensitive**: "lambda" and "Lambda" return same results
6. **Result limit works**: No more than 10 icons returned per search
7. **No results handled**: Querying nonsense returns helpful "no icons found" message
8. **Preview image generated**: Tool returns a rendered PNG showing matched icons
9. **Agent can use results**: Agent successfully uses returned URLs in D2 diagrams
10. **Evaluation visibility**: Tool calls and image results appear in evaluation reports
