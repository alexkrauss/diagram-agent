# Agent Evaluation Process

This document describes the evaluation pipeline for the diagram agent, including the TypeScript DSL, the intermediate JSON format, and the HTML report.

## Architecture Overview

```
             +---------------------------+
User prompts |  .eval.ts (TS DSL tests)  |
-----------> |  conversation(...)        |
             +-------------+-------------+
                           |
                           v
             +---------------------------+
             |  Vitest eval run          |
             |  render + event capture   |
             +-------------+-------------+
                           |
                           v
             +---------------------------+
             |  eval-results/ragas-input |
             |  (JSON with turns, images)|
             +-------------+-------------+
                           |
                           v
             +---------------------------+
             |  uv run scripts/ragas_eval|
             |  judge + HTML rendering   |
             +-------------+-------------+
                           |
                           v
             +---------------------------+
             |  eval-results/eval-report |
             |  (HTML report)            |
             +---------------------------+
```

The eval suite runs the TypeScript DSL tests with full rendering and event capture, writes a JSON snapshot, then the Python runner judges each turn and renders the final HTML report.

## TypeScript DSL

Tests live in `src/agent/tests/*.eval.ts` and use the internal DSL:

- `conversation(name, createAgent, async (agent) => { ... })`
- `await agent.send(...)` executes one turn and captures all events, renders, and images.
- `agent.criteria(...)` attaches prose criteria for the judge to evaluate.

The DSL keeps tests readable while capturing everything needed for evaluation and reporting.

## Intermediate Format (ragas-input.json)

The Vitest reporter writes `eval-results/ragas-input.json` after an eval run.
It contains:

- Test metadata (name, status, timing)
- Turn records (prompt transcript, latest D2, PNG path)
- Prose criteria per turn

This file is the handoff point to the judge.

## HTML Report

The Python runner (`scripts/ragas_eval.py`) reads `ragas-input.json`, runs the visual judge, and produces:

- `eval-results/ragas-output.json` (enriched with judge scores)
- `eval-results/eval-report.html` (the primary report)

The report shows:

- Per-test PASS/FAIL from the eval assertions
- Per-turn images, prompts, and judge criteria results
- Missing images and other diagnostics

## Running the Eval

`npm run eval` runs the full pipeline:

1) `vitest run --config vitest.eval.config.ts`
2) `uv run scripts/ragas_eval.py --provider gemini --model models/gemini-3-flash-preview`

Open `eval-results/eval-report.html` to view the results.
