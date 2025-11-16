# Benchmark: Multiline Text and Markdown

## Purpose

This benchmark tests the agent's ability to create multi-line text blocks and markdown content in D2 diagrams. It validates that the agent correctly handles:
- Multi-line text content with proper delimiters
- Markdown formatting in text blocks (bold, italic, lists, headers)
- Code blocks with proper language syntax highlighting
- Standalone markdown text shapes
- Shape labels containing markdown

---

## Test Scenarios

### Scenario 1: Standalone Markdown Text Block

**Request**: "Create a diagram with a standalone markdown text block with the following content:

```
# Getting Started
Follow these **important** steps:
- Install dependencies
- Run the build
- Start the server
```
"

**Properties to Assert**:
- [ ] A text shape exists with the specified content
- [ ] The text contains a level-1 header "Getting Started"
- [ ] The text contains the word "important" formatted in bold
- [ ] The text contains a bulleted list with three items: "Install dependencies", "Run the build", "Start the server"
- [ ] The markdown formatting is preserved and renderable
- [ ] No syntax errors in the D2 code

---

### Scenario 2: Shape with Markdown Label

**Request**: "Create a shape labeled 'warning' that has a markdown label with the following content:

```
**Warning:** This is *critical* information
```
"

**Properties to Assert**:
- [ ] A shape labeled 'warning' exists
- [ ] The shape has a label property
- [ ] The label contains "Warning:" formatted in bold
- [ ] The label contains "critical" formatted in italic
- [ ] The markdown formatting is preserved

---

### Scenario 3: Code Block with JavaScript

**Request**: "Create a code block showing JavaScript syntax highlighting with this exact function:

```javascript
function calculateSum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}
```
"

**Properties to Assert**:
- [ ] A text element exists containing the JavaScript function
- [ ] The function name `calculateSum` is present
- [ ] The array parameter `arr` is present
- [ ] The arrow function syntax `(a, b) => a + b` is preserved
- [ ] The default value `0` in reduce is present
- [ ] Multi-line formatting is preserved with proper indentation
- [ ] JavaScript syntax highlighting is indicated

---

### Scenario 4: Code Block with Python

**Request**: "Add a Python code snippet to the diagram with this exact function:

```python
def process_data(items):
  results = []
  for item in items:
    results.append(item * 2)
  return results
```
"

**Properties to Assert**:
- [ ] A text element exists containing the Python function
- [ ] The function name `process_data` is present
- [ ] Python indentation is preserved (4 spaces or consistent tabs)
- [ ] The for loop `for item in items:` is intact
- [ ] The append operation `results.append(item * 2)` is preserved
- [ ] Python syntax highlighting is indicated

---

### Scenario 5: Code Block with SQL

**Request**: "Create a code block with this SQL query:

```sql
SELECT users.name, orders.total
FROM users
JOIN orders ON users.id = orders.user_id
WHERE orders.total > 100
```
"

**Properties to Assert**:
- [ ] A text element exists containing the SQL query
- [ ] SQL keywords SELECT, FROM, JOIN, WHERE are preserved
- [ ] Column references `users.name` and `orders.total` are intact
- [ ] JOIN condition `users.id = orders.user_id` is preserved
- [ ] WHERE condition `orders.total > 100` is preserved
- [ ] Multi-line query formatting is maintained
- [ ] SQL syntax highlighting is indicated

---

### Scenario 6: Mixed Markdown with Multiple Formatting Types

**Request**: "Create a text block with markdown containing this exact content:

```
# Setup Guide

This guide explains **how to setup** the environment:

1. Install *Node.js* with version `18+`
2. Run `npm install` to get dependencies
3. Configure the `.env` file
4. Start the server with `npm start`

**Note:** This is required for production.
```
"

**Properties to Assert**:
- [ ] A level-1 header "Setup Guide" is present
- [ ] The text "how to setup" is formatted in bold
- [ ] A numbered list with 4 items is present
- [ ] The text "Node.js" is formatted in italic
- [ ] Inline code elements `18+`, `npm install`, `.env`, and `npm start` are preserved
- [ ] The word "Note:" at the end is formatted in bold
- [ ] Empty lines within the block are maintained
- [ ] All markdown formatting renders correctly

---

### Scenario 7: Code Block with Special Characters

**Request**: "Create a TypeScript code block with this exact code:

```typescript
type Result = Success | Error;
const check = (x > 5) || (y < 10);
```
"

**Properties to Assert**:
- [ ] A text element exists containing the TypeScript code
- [ ] The union type syntax `Success | Error` is preserved (with the pipe character)
- [ ] The OR operator `||` is preserved
- [ ] Comparison operators `>` and `<` are intact
- [ ] TypeScript syntax highlighting is indicated
- [ ] All special characters render correctly

---

### Scenario 8: LaTeX Code Block

**Request**: "Create a code block with these LaTeX formulas:

```latex
E = mc^2

\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
```
"

**Properties to Assert**:
- [ ] A text element exists containing the LaTeX formulas
- [ ] The formula `E = mc^2` is preserved with the superscript `^2`
- [ ] The summation notation `\sum_{i=1}^{n}` is intact
- [ ] The fraction notation `\frac{n(n+1)}{2}` is preserved
- [ ] LaTeX commands like `\sum` and `\frac` are not corrupted
- [ ] Empty line between formulas is maintained
- [ ] LaTeX syntax highlighting is indicated

---

### Scenario 9: Nested Markdown in Multiple Shapes

**Request**: "Create a diagram with three text shapes:

First shape with this markdown:
```
# API Documentation
```

Second shape with this JavaScript code:
```javascript
async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}
```

Third shape with this markdown:
```
> **Important:** Always validate input before processing

- Check for null values
- Sanitize strings
- Validate data types
```
"

**Properties to Assert**:
- [ ] Three separate text elements exist in the diagram
- [ ] First element contains the header "API Documentation"
- [ ] Second element contains the JavaScript function with `async`, `await`, and `fetch`
- [ ] Second element has JavaScript syntax highlighting indicated
- [ ] Third element contains a blockquote (starts with `>`)
- [ ] Third element contains "Important:" formatted in bold
- [ ] Third element contains a bulleted list with three items
- [ ] All three elements coexist without interfering with each other

---

## Properties to Assert (All Scenarios)

### Content Preservation
- [ ] All text content from the request is preserved exactly
- [ ] Line breaks and empty lines are maintained
- [ ] Indentation is preserved in code blocks
- [ ] Special characters are not corrupted

### Markdown Formatting
- [ ] Headers (`#`, `##`, etc.) render as headers
- [ ] Bold text (`**text**`) renders as bold
- [ ] Italic text (`*text*` or `_text_`) renders as italic
- [ ] Inline code (backticks) renders as code
- [ ] Ordered lists (1., 2., 3.) render as numbered lists
- [ ] Unordered lists (`-`, `*`) render as bullet lists
- [ ] Block quotes (`>`) render as blockquotes

### Code Block Formatting
- [ ] Code syntax is preserved exactly as written
- [ ] Indentation levels are maintained
- [ ] Operators and special characters are intact
- [ ] String quotes and escape sequences are preserved
- [ ] Parentheses, brackets, and braces are balanced

### Language Specification
- [ ] Appropriate syntax highlighting is indicated for code blocks
- [ ] JavaScript, Python, TypeScript, SQL, LaTeX, and other languages are supported
- [ ] Language specification doesn't appear as part of the visible content

### Shape Integration
- [ ] Standalone text blocks are created as text shapes
- [ ] Shape labels with markdown can be defined
- [ ] Multiple text/code shapes can coexist in the same diagram

### No Syntax Errors
- [ ] The generated D2 code is syntactically valid
- [ ] The code can be parsed without errors
- [ ] All text blocks are properly delimited

---

## Error Conditions to Avoid

The agent's output should NOT contain:

- [ ] ❌ Missing or incomplete text content from the request
- [ ] ❌ Corrupted markdown formatting
- [ ] ❌ Lost indentation in code blocks
- [ ] ❌ Special characters that are escaped or removed incorrectly
- [ ] ❌ Incomplete markdown formatting (e.g., opening `**` without closing `**`)
- [ ] ❌ Syntax errors that prevent D2 parsing
- [ ] ❌ Text content bleeding into D2 structure or keywords

---

## Success Criteria

A benchmark test passes when:

1. **Content Accuracy** - All text content from the request is present and exactly preserved
2. **Markdown Rendering** - All markdown formatting renders correctly when the D2 diagram is displayed
3. **Code Integrity** - Code blocks preserve syntax, indentation, and special characters
4. **Syntax Highlighting** - Appropriate language highlighting is applied to code blocks
5. **Valid D2 Syntax** - The generated D2 code is syntactically correct and parseable
6. **Multiple Blocks** - Multiple text/code shapes with different content work together without interference

---

## Reference

D2 Text and Code Documentation: https://d2lang.com/tour/text
