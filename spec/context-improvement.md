# Context improvement guide

This document is the entry point for improving the D2 agent via context engineering. It explains where to add context, how it is loaded, and how to read eval results to decide the next iteration.

## How context is added

1. Source material lives in `tmp/d2-docs/`.
2. Curate into agent-friendly notes in `src/agent/context/`.
   - Keep examples as inline ```d2 code blocks.
   - Remove frontmatter, JSX, and visual embed boilerplate.
   - Focus on syntax + short usage notes.
3. Register the new doc in `src/agent/context/index.ts`.
   - Add import, include in `contextDocs`.
   - Add aliases to `aliasMap` so the tool can find it.
4. The agent fetches context via the `get_d2_context` tool (`src/agent/tools/contextTool.ts`).
   - It takes a keyword and returns the corresponding markdown content.
   - The system prompt (`src/agent/system_prompt.md`) should mention any new topical keywords when useful.
5. Document the extraction rules in `spec/docs-preparation.md` so prep can be automated later.

## What to look for in eval results

Run `npm run eval`, then inspect `eval-results/visual-eval-output.json` with `jq`.

Key signals:

- **Scenario success rate**: overall benchmark suites passed. Low rate means whole domains are missing or incorrect.
- **Turn success rate**: how often the full response meets all criteria. Good for high-level tracking.
- **Criteria success rate**: most granular indicator of improvement; use for iterative tuning.

Useful jq snippets:

```sh
jq '{total: ([.tests[].turns[].judge.criteria[].score] | length), passed: ([.tests[].turns[].judge.criteria[].score | select(.==1)] | length)}' eval-results/visual-eval-output.json
```

```sh
jq '[.tests[] | {suite: (.fullName | split(" > ")[0]), scores: [.turns[].judge.criteria[].score]}]
  | group_by(.suite)
  | map({suite: .[0].suite, total: (map(.scores) | add | length), passed: (map(.scores) | add | map(select(.==1)) | length)})' \
  eval-results/visual-eval-output.json
```

```sh
jq -r '.tests[]
  | .turns[]
  | .judge.criteria[]
  | select(.score==0)
  | .criterion' eval-results/visual-eval-output.json
```

## How to interpret failures

- If failures mention **wrong syntax** (e.g., Mermaid/PlantUML), add guardrails to the system prompt and provide D2 examples in context.
- If failures mention **missing features** (e.g., spans, notes, UML visibility), add focused context docs and ensure keywords map to them.
- If failures mention **labels or structure** (e.g., container labels, parent references), enrich examples in context with the exact forms used in tests.

## Iteration workflow

1. Identify top failing suites and criteria (use jq queries above).
2. Add or refine context for those features.
3. Update `spec/docs-preparation.md` with extraction steps.
4. Run `npm run eval` and compare deltas.
5. Record findings in `plan/agent-refinement-findings.md`.
