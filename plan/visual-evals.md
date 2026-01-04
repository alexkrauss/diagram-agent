# Visual Eval Plan

Goal: evaluate each agent "return control" turn using a visual judge LLM with prose criteria, while keeping the TypeScript conversation DSL for running the agent and collecting artifacts. The TypeScript side only emits JSON; a Python runner enriches with judge scores and generates the final HTML report.

## Step 1: Define minimal prose-criteria DSL in TypeScript (done)
- Add a small API in the eval DSL (e.g., `criteria(...)`) that attaches a list of prose strings to a test/turn.
- Ensure each criterion is plain text and stored verbatim; no schema or typed assertion language.
- Mark completion when a single eval file can declare 2-3 criteria per test without JSON/YAML.
- Unit test: add a vitest test that registers criteria and asserts they are stored on the test/turn metadata.

## Step 2: Capture "return control" turns and assemble turn records (done)
- Record a turn immediately after each `await agent.send(...)` completes (this is the turn boundary).
- Each record must include: test id, turn index, conversation transcript up to that turn, latest PNG path, latest D2 content, and the prose criteria for that turn.
- Mark completion when running one eval produces turn records for every user turn (not every canvas update).
- Unit test: add a test that sends two messages, triggers multiple canvas updates per turn, and asserts exactly two turn records with the last canvas update per turn.

## Step 3: Export a visual-eval dataset (done)
- Write a dataset writer that saves a JSON file under `eval-results/` containing all turn records plus run metadata.
- Fields should be stable and simple: `test_id`, `turn_index`, `prompt`, `answer`, `criteria`, `png_path`, `d2_content`.
- Mark completion when a single eval run produces `eval-results/visual-eval-input.json`.
- Unit test: add a test that serializes a small in-memory run and asserts the JSON schema shape.

## Step 4: Add a visual judge runner (uv/uvx) (done)
- Implement a Python script (e.g., `scripts/visual_eval.py`) that:
  - loads `eval-results/visual-eval-input.json`,
  - calls a visual judge LLM on each row with the PNG + criteria,
  - writes `eval-results/visual-eval-output.json` that includes the original data plus per-criterion scores and rationales.
- Provide a `uvx` command to run it without manual venv management.
- Mark completion when the script can run against one test and produce output JSON.
- Unit test: add a python unit test that stubs the judge call and validates output structure for one row.

## Step 5: Support multiple judge models (done)
- Add a config flag (env or CLI) for model selection: Anthropic, OpenAI, Gemini.
- Write outputs to separate files or include a `judge_model` field in the results.
- Mark completion when two different models can be run back-to-back on the same dataset.
- Unit test: add a python unit test that runs the scorer with two fake model configs and asserts `judge_model` is reflected in output.

## Step 6: Generate HTML report in Python (done)
- Move HTML generation to the Python runner using a template that mirrors the existing report layout.
- The runner should read `visual-eval-output.json` and emit `eval-results/eval-report.html`.
- Display per-criterion pass/fail (or numeric score) and judge rationale near the corresponding PNG.
- Mark completion when the report shows judge results for each turn.
- Unit test: add a python test that renders a minimal dataset and asserts the HTML includes the test name, an image path, and a criterion score.

## Step 7: Add a minimal usage path (done)
- Document the full flow:
  1) `npm run eval` to generate artifacts and `eval-results/visual-eval-input.json`,
  2) `uvx python scripts/visual_eval.py ...` to score and render HTML,
  3) open `eval-results/eval-report.html` to view results.
- Mark completion when the README section matches the actual commands and output paths.
- Unit test: none (documentation only).

## Step 8: Add criteria to the first test and render once (done)
- Add `agent.criteria(...)` to the first test in `01-simple-shapes-and-labels.eval.ts`, replacing text-based `expect` assertions.
- Use prose criteria derived from `spec/benchmark/01-simple-shapes-and-labels.md`.
- Mark completion when `visual-eval-input.json` contains non-empty `criteria` for that first test and `eval-report.html` shows judge output.
- Unit test: none (covered by manual run to verify HTML rendering).

## Step 9: Show prompts in the HTML report (done)
- Include per-turn prompt text (or transcript) in the HTML output next to each image.
- Mark completion when the prompt is visible for each turn in `eval-report.html`.
- Unit test: extend the HTML rendering test to assert prompt text appears.

## Step 10: Investigate missing PNG images (pending)
- Identify why some `pngPath` entries do not exist on disk (render failures, missing writes, or stale paths).
- Add logging or a report section that flags missing images explicitly.
- Mark completion when the missing PNGs are explained or no longer present after a rerun.
- Unit test: add a python test that flags a missing PNG path in the output report.

## Step 11: Clarify PASS/FAIL semantics in HTML (done)
- Explain whether PASS/FAIL refers to test assertions, judge criteria, or both.
- Update the report to label the source of PASS/FAIL and/or show judge aggregate status.
- Mark completion when the HTML clearly states the basis for PASS/FAIL.
- Unit test: add a python test that asserts the PASS/FAIL legend appears.

## Step 12: Handle Gemini SDK deprecation warning later (done)
- Migrate from `google-generativeai` to `google.genai` when ready.
- Mark completion when the warning no longer appears on a run.
- Unit test: none (integration behavior).
