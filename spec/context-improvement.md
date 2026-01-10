# Context improvement guide

This document is the entry point for improving the D2 agent via context engineering. It explains where to add context, how it is loaded, and how to read eval results to decide the next iteration.

## How context is added

1. Source material lives in `tmp/d2-docs/`.
2. Curate into agent-friendly notes in `src/agent/context/`.
   - Follow `specs/docs-preparation.md` guidelines for transforming the docs into good context
3. Register the new doc in `src/agent/context/index.ts`.

- Add import, include in `contextDocs`.
- Add aliases to `aliasMap` so the tool can find it.

4. The agent fetches context via the `get_d2_context` tool (`src/agent/tools/contextTool.ts`).
   - It takes a keyword and returns the corresponding markdown content.
   - The system prompt (`src/agent/system_prompt.md`) should mention any new topical keywords when useful.

## What to look for in eval results

Run `npm run eval`, then inspect `eval-results/visual-eval-output.json` with `jq`.
Refer to the schema to know what to look for.

Key signals:

- **Scenario success rate**: overall benchmark suites passed. Low rate means whole domains are missing or incorrect.
- **Turn success rate**: how often the full response meets all criteria. Good for high-level tracking.
- **Criteria success rate**: most granular indicator of improvement; use for iterative tuning.

## How to interpret failures

First, consider plausible causes of the failure: is there context missing?
Are there error in the evaluation criteria?
Is the judge LLM wrong? If in doubt, look at the image.
Is the solution even possible with D2?

## Iteration workflow

The file `plan/agent-refinement-log.md` is your append-only work journal (called "the journal"
below). You use it to log the stats and your analysis results and it is preserved between
refinement iterations. Keep it concise and clear. No bloat.

0. Look at the current state and previous hypotheses in the journal.
1. Record the current stats in the journal.
2. Use a sub-agent to analyze the eval output (using jq) and to explain the top failing test cases
3. Interpret failures and record hypotheses and intended improvements in the journal.
4. Improve the agent
5. Terminate

After that, the evaluation will be run automatically, and a new instance of yourself will
have a chance to check the results and iterate further. The journal will be preserved so keep
it as clear and concise as possible.
