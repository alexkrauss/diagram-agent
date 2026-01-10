# D2 docs preparation principles

Goal: create agent-focused context markdown files under `src/agent/context` by extracting core syntax from the D2 docs repo in `tmp/d2-docs/`.

## Content removal

- Remove frontmatter, React imports, JSX components, and embedded SVG/WebP blocks.
- Remove long narrative sections, CLI usage guides, and catalog images.
- Remove screenshots and rendered diagram images.

## Content transformation

- Inline referenced `.d2` example files into fenced ```d2 blocks instead of linking to them.
- Keep each file focused on syntax and short usage notes, not prose explanations.
- Preserve notes about syntax quirks (e.g., quoting requirements, escaping rules, reserved keywords).

## Guardrails for LLM confusion

- Add explicit warnings against syntax from similar tools (e.g., Mermaid keywords in sequence diagrams, PlantUML connectors in class diagrams).
- Include "wrong vs. right" snippets for common mistakes.
- Note when a keyword must appear in a specific context (e.g., as a `shape:` value, not a standalone block).

## Completeness for agent use

- Show both syntax variants when multiple exist (e.g., dot notation vs. nested maps).
- Include examples of cross-references and scoping (e.g., parent references with `_`, full-path references from outside containers).
- Add short examples for edge cases mentioned in prose but not shown in the original docs.

## Size limitation

Each file should be no more than 120 lines.
