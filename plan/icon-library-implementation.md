# Icon Library Implementation Plan

Implementation plan for the icon library feature as specified in `spec/icon-library.md`.

## Task 1: Create IconLibrary Interface

**Goal**: Define the TypeScript interface for icon libraries.

**Files**:
- Create `src/icon-library/types.ts`

**Implementation**:
```typescript
export interface Icon {
  name: string;
  url: string;
}

export interface IconLibrary {
  initialize(): Promise<void>;
  search(query: string, maxResults?: number): Icon[];
}
```

**Verification**:
- `npm run check` passes

---

## Task 2: Scrape Terrastruct Icons and Generate JSON

**Goal**: Create a build script that scrapes icons.terrastruct.com and generates a bundled JSON file.

**Files**:
- Create `scripts/scrape-icons.ts` (or `.mjs`)
- Create `src/icon-library/terrastruct-icons.json` (generated output)

**Implementation**:
1. Fetch HTML from https://icons.terrastruct.com/
2. Parse icon elements using the documented structure (see `spec/icon-db-format.md`)
3. Extract name and path for each icon
4. Write JSON file with format: `{ "icons": [{ "name": "...", "path": "..." }, ...] }`

**Verification**:
- Run script manually, verify JSON is generated
- JSON contains ~1,480 icons
- Spot check: search for "S3" in JSON, verify reasonable results

---

## Task 3: Implement TerrastructIconLibrary

**Goal**: Implement the IconLibrary interface using bundled JSON data.

**Files**:
- Create `src/icon-library/TerrastructIconLibrary.ts`
- Create `src/icon-library/index.ts` (exports)

**Implementation**:
1. Import the bundled JSON
2. `initialize()`: No-op (data already bundled)
3. `search(query, maxResults=10)`:
   - Case-insensitive substring match on name
   - Return up to maxResults icons
   - Construct full URL from path: `https://icons.terrastruct.com/${encodeURIComponent(path)}`

**Verification**:
- Unit tests in `src/icon-library/TerrastructIconLibrary.test.ts`:
  - `search("S3")` returns icons containing "S3" in name
  - `search("s3")` returns same results (case insensitive)
  - `search("xyznonexistent")` returns empty array
  - `search("aws", 5)` returns at most 5 results
  - Returned URLs are properly encoded
- `npm run check` passes

---

## Task 4: Create find_icon Tool

**Goal**: Implement the agent tool that searches icons and returns visual preview.

**Files**:
- Create `src/agent/tools/findIconTool.ts`

**Implementation**:
1. Accept `query` parameter
2. Call `iconLibrary.search(query, 10)`
3. If no results: return text "No icons found matching '{query}'"
4. Generate D2 diagram with icons in grid layout:
   ```d2
   icon_0: Icon Name {
     shape: image
     icon: https://...
   }
   ```
5. Render D2 to PNG using the render function
6. Return both:
   - Text: list of icon names and URLs
   - Image: rendered preview PNG

**Verification**:
- Unit test in `src/agent/tools/findIconTool.test.ts`:
  - Tool returns text with icon names/URLs
  - Tool returns image when icons found
  - Tool returns only text (no image) when no icons found
- `npm run check` passes

---

## Task 5: Integrate find_icon Tool with D2Agent

**Goal**: Register the find_icon tool with the agent.

**Files**:
- Modify `src/agent/D2Agent.ts`

**Implementation**:
1. Import TerrastructIconLibrary and createFindIconTool
2. Create icon library instance in constructor
3. Call `iconLibrary.initialize()` (for future-proofing)
4. Create find_icon tool with icon library and render function
5. Add to agent's tools array alongside replace_canvas and context

**Verification**:
- Manual test: start dev server, ask agent "find icons for database"
- Agent should call find_icon tool and receive results
- `npm run check` passes

---

## Task 6: Verify Evaluation Infrastructure

**Goal**: Ensure find_icon tool calls and results appear correctly in evaluation reports.

**Files**:
- May need to modify `src/agent/tests/recording/` or `src/agent/tests/reporting/`

**Implementation**:
1. Run existing evaluation suite
2. Check that tool calls are captured in recordings
3. Check that image results are displayed in HTML reports
4. Fix any gaps in recording/reporting of tool outputs

**Verification**:
- Run `npm run eval` with a test that uses find_icon
- Evaluation report shows tool call with query
- Evaluation report shows returned icon preview image

---

## Task 7: Add Icon Evaluation Test Cases

**Goal**: Add evaluation tests that exercise the icon library feature.

**Files**:
- Modify `src/agent/tests/09-icons-and-images.eval.ts` or create new eval file

**Implementation**:
Add test scenarios:
1. "Create a diagram showing an S3 bucket connected to a Lambda function with appropriate icons"
2. "Draw a system with a GitHub repo, CI/CD pipeline, and cloud deployment using icons"

**Verification**:
- `npm run eval:exec` runs the new tests
- `npm run eval:judge` evaluates them
- Agent successfully uses find_icon tool and incorporates icons in final diagram

---

## Task 8: Final Acceptance Testing

**Goal**: Verify all acceptance criteria from spec are met.

**Checklist**:
1. [ ] IconLibrary interface exists with `initialize()` and `search()` methods
2. [ ] TerrastructIconLibrary loads bundled icon data (~1,480 icons)
3. [ ] find_icon tool is registered with D2Agent
4. [ ] Querying "S3" returns icons with "S3" in name
5. [ ] Search is case-insensitive
6. [ ] No more than 10 icons returned per search
7. [ ] Querying nonsense returns "no icons found" message
8. [ ] Preview image generated with matched icons
9. [ ] Agent can use returned URLs in D2 diagrams
10. [ ] Tool calls and image results appear in evaluation reports

**Verification**:
- All unit tests pass
- All integration tests pass
- Manual end-to-end test successful
- `npm run check` passes
