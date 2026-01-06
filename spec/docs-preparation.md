# D2 docs preparation steps

Goal: create agent-focused context markdown files under `src/agent/context` by extracting core syntax from the D2 docs repo in `tmp/d2-docs/`.

## General cleanup rules

- Remove frontmatter, React imports, JSX, and embed SVG blocks.
- Inline D2 examples by copying the content of referenced `tmp/d2-docs/static/d2/*.d2` files into fenced ```d2 blocks.
- Remove long narrative and presentational sections (e.g., screenshots, CLI usage, and catalog images).
- Keep each file focused on syntax and short usage notes.

## Source mappings

### `src/agent/context/basics.md`

- Source: `tmp/d2-docs/docs/tour/hello-world.md` and `tmp/d2-docs/docs/tour/comments.md`.
- Inline `tmp/d2-docs/static/d2/hello-world.d2` into the "Hello world" section.
- Copy the comment examples from `comments.md` verbatim.
- Add a short note on keys/labels (from `docs/tour/shapes.md`) and diagram `direction` (from `docs/tour/style.md` examples).

### `src/agent/context/shapes.md`

- Source: `tmp/d2-docs/docs/tour/shapes.md`.
- Inline:
  - `tmp/d2-docs/static/d2/shapes-1.d2` for basic shape keys.
  - `tmp/d2-docs/static/d2/shapes-2.d2` for labels and `shape` type example.
- Keep the 1:1 ratio note for `circle` and `square`.
- Drop catalog and SVG render blocks.

### `src/agent/context/connections.md`

- Source: `tmp/d2-docs/docs/tour/connections.md`.
- Inline the basic connection snippet and key-vs-label snippet from the doc body.
- Inline chaining example from `tmp/d2-docs/static/d2/connections-3.d2`.
- Omit repeated connections, arrowhead catalog, and connection-referencing sections.

### `src/agent/context/containers.md`

- Source: `tmp/d2-docs/docs/tour/containers.md`.
- Inline:
  - `tmp/d2-docs/static/d2/containers-1.d2` for dot notation.
  - `tmp/d2-docs/static/d2/containers-2.d2` for nested maps.
  - `tmp/d2-docs/static/d2/containers-underscore.d2` for parent `_` references.
- Include both label styles (`label:` and shorthand), but remove SVG embeds.

### `src/agent/context/styles.md`

- Source: `tmp/d2-docs/docs/tour/style.md`.
- Inline the D2 snippets from:
  - `tmp/d2-docs/static/d2/styles-fill.d2`
  - `tmp/d2-docs/static/d2/styles-stroke.d2`
  - `tmp/d2-docs/static/d2/styles-stroke-width.d2`
  - `tmp/d2-docs/static/d2/styles-font-color.d2`
- Keep the note that hex colors require quotes.
- Remove the full style catalog and SVG embeds.

### `src/agent/context/sequence-diagrams.md`

- Source: `tmp/d2-docs/docs/tour/sequence-diagrams.md`.
- Inline examples from:
  - `tmp/d2-docs/static/d2/sequence-diagrams-1.d2`
  - `tmp/d2-docs/static/d2/sequence-diagrams-3.d2`
  - `tmp/d2-docs/static/d2/sequence-diagrams-group.d2`
  - `tmp/d2-docs/static/d2/sequence-diagrams-note.d2`
  - `tmp/d2-docs/static/d2/sequence-diagrams-self.d2`
- Keep short notes about ordering, groups, spans, notes, and self-messages.
- Remove WebP images and SVG embeds.

### `src/agent/context/sql-tables.md`

- Source: `tmp/d2-docs/docs/tour/sql-tables.md`.
- Inline:
  - `tmp/d2-docs/static/d2/tables-1.d2`
  - `tmp/d2-docs/static/d2/tables-2.d2`
- Keep notes about constraints and quoting reserved keywords.
- Drop the long container example and SVG embeds.

### `src/agent/context/uml-classes.md`

- Source: `tmp/d2-docs/docs/tour/uml-classes.md`.
- Inline:
  - `tmp/d2-docs/static/d2/classes-1.d2`
  - `tmp/d2-docs/static/d2/classes-2.d2`
- Keep visibility rules and reserved keyword escaping.
- Remove the full example and SVG embeds.
