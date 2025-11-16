#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "google-genai",
#   "openai",
#   "anthropic",
# ]
# ///
import argparse
import base64
import json
import os
from dataclasses import dataclass
from typing import Any, Callable, Dict, List

@dataclass
class JudgeResult:
    score: int
    rationale: str


def load_ragas_input(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: str, payload: Dict[str, Any]) -> None:
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def read_png_as_base64(path: str) -> str:
    with open(path, "rb") as handle:
        return base64.b64encode(handle.read()).decode("ascii")


def build_judge_prompt(prompt: str, criterion: str) -> str:
    return (
        "You are a strict visual judge. Determine whether the criterion is met by the image.\n\n"
        f"Conversation context:\n{prompt}\n\n"
        f"Criterion:\n{criterion}\n\n"
        'Respond with JSON: {"score": 1 or 0, "rationale": "..."}'
    )


def judge_with_openai(model: str, prompt: str, image_b64: str) -> JudgeResult:
    from openai import OpenAI

    client = OpenAI()
    response = client.responses.create(
        model=model,
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt},
                    {
                        "type": "input_image",
                        "image_url": f"data:image/png;base64,{image_b64}",
                    },
                ],
            }
        ],
    )
    raw = response.output_text
    return parse_judge_result(raw)


def judge_with_anthropic(model: str, prompt: str, image_b64: str) -> JudgeResult:
    import anthropic

    client = anthropic.Anthropic()
    response = client.messages.create(
        model=model,
        max_tokens=500,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": image_b64,
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    )
    raw = response.content[0].text if response.content else ""
    return parse_judge_result(raw)


def judge_with_gemini(model: str, prompt: str, image_b64: str) -> JudgeResult:
    from google import genai
    from google.genai import types

    api_key = os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    image_bytes = base64.b64decode(image_b64)
    response = client.models.generate_content(
        model=model,
        contents=[
            types.Part.from_text(text=prompt),
            types.Part.from_bytes(data=image_bytes, mime_type="image/png"),
        ],
    )
    return parse_judge_result(getattr(response, "text", "") or "")


def parse_judge_result(raw: str) -> JudgeResult:
    try:
        data = json.loads(raw)
        score = int(data.get("score", 0))
        rationale = str(data.get("rationale", "")).strip()
        return JudgeResult(score=score, rationale=rationale)
    except Exception:
        return JudgeResult(score=0, rationale=f"Unparseable response: {raw[:500]}")


def evaluate_turn(
    turn: Dict[str, Any],
    judge_fn: Callable[[str, str, str], JudgeResult],
    model: str,
    eval_results_dir: str,
    image_loader: Callable[[str], str] = read_png_as_base64,
) -> Dict[str, Any]:
    criteria = turn.get("criteria", [])
    prompt = turn.get("prompt", "")
    png_path = turn.get("pngPath")

    results = []
    for criterion in criteria:
        if not png_path:
            results.append(
                {"criterion": criterion, "score": 0, "rationale": "Missing PNG path."}
            )
            continue

        absolute_path = os.path.join(eval_results_dir, png_path.lstrip("./"))
        image_b64 = image_loader(absolute_path)
        judge_prompt = build_judge_prompt(prompt, criterion)
        result = judge_fn(model, judge_prompt, image_b64)
        results.append(
            {"criterion": criterion, "score": result.score, "rationale": result.rationale}
        )

    return {
        **turn,
        "judge": {
            "model": model,
            "criteria": results,
        },
    }


def evaluate_dataset(
    data: Dict[str, Any],
    judge_fn: Callable[[str, str, str], JudgeResult],
    model: str,
    eval_results_dir: str,
    image_loader: Callable[[str], str] = read_png_as_base64,
) -> Dict[str, Any]:
    output = dict(data)
    tests = []

    for test in data.get("tests", []):
        turns = [
            evaluate_turn(turn, judge_fn, model, eval_results_dir, image_loader)
            for turn in test.get("turns", [])
        ]
        tests.append({**test, "turns": turns})

    output["tests"] = tests
    output["judge_model"] = model
    return output


def render_html(data: Dict[str, Any]) -> str:
    tests = data.get("tests", [])
    summary = data.get("summary", {})
    missing_images: List[str] = []

    def esc(text: Any) -> str:
        return (
            str(text)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&#39;")
        )

    rows = []
    for test in tests:
        turn_blocks = []
        for turn in test.get("turns", []):
            criteria_html = ""
            judge = turn.get("judge", {})
            judge_criteria = judge.get("criteria", [])
            if not judge_criteria:
                criteria_html = "<div class='no-criteria'>No criteria defined for this turn.</div>"
            else:
                for result in judge_criteria:
                    status = "pass" if result.get("score") else "fail"
                    criteria_html += (
                        f"<div class='criterion {status}'>"
                        f"<div class='criterion-text'>{esc(result.get('criterion'))}</div>"
                        f"<div class='criterion-score'>{result.get('score')}</div>"
                        f"<div class='criterion-rationale'>{esc(result.get('rationale'))}</div>"
                        "</div>"
                    )

            png_path = turn.get("pngPath") or ""
            if png_path:
                candidate = os.path.join("eval-results", png_path.lstrip("./"))
                if not os.path.exists(candidate):
                    missing_images.append(png_path)
            prompt_text = turn.get("prompt") or ""
            turn_blocks.append(
                f"""
                <div class="turn">
                  <div class="turn-header">Turn {turn.get("turnIndex")}</div>
                  <div class="turn-body">
                    <div class="turn-image">
                      <img src="{esc(png_path)}" alt="Turn rendering" onerror="this.style.display='none'">
                      <div class="image-path">{esc(png_path)}</div>
                    </div>
                    <div class="turn-criteria">
                      <div class="turn-prompt"><strong>Prompt</strong><pre>{esc(prompt_text)}</pre></div>
                      {criteria_html}
                    </div>
                  </div>
                  <details>
                    <summary>Show D2</summary>
                    <pre>{esc(turn.get("d2Content") or "")}</pre>
                  </details>
                </div>
                """
            )

        rows.append(
            f"""
            <details>
              <summary>
                <span>{esc(test.get("fullName"))}</span>
                <span class="status {'pass' if test.get('passed') else 'fail'}">
                  {'PASS' if test.get('passed') else 'FAIL'}
                </span>
              </summary>
              <div class="test-body">
                {''.join(turn_blocks)}
              </div>
            </details>
            """
        )

    return f"""
<!DOCTYPE html>
<html>
<head>
  <title>Agent Evaluation Report</title>
  <style>
    body {{
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f9f9f9;
    }}
    h1 {{ margin-top: 0; }}
    .summary {{ margin-bottom: 20px; }}
    details {{
      background: #fff;
      border-radius: 8px;
      margin-bottom: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.08);
    }}
    summary {{
      cursor: pointer;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      background: #fafafa;
    }}
    .status.pass {{ color: #2e7d32; }}
    .status.fail {{ color: #c62828; }}
    .test-body {{ padding: 16px; }}
    .turn {{ border: 1px solid #e0e0e0; padding: 12px; border-radius: 6px; margin-bottom: 12px; }}
    .turn-header {{ font-weight: 600; margin-bottom: 8px; }}
    .turn-body {{ display: grid; grid-template-columns: minmax(200px, 1fr) 2fr; gap: 12px; }}
    .turn-image img {{ max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }}
    .image-path {{ font-size: 11px; color: #666; margin-top: 6px; word-break: break-all; }}
    .turn-prompt pre {{ background: #f5f5f5; padding: 8px; border-radius: 4px; }}
    .criterion {{
      border: 1px solid #e0e0e0;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 8px;
    }}
    .criterion.pass {{ border-left: 4px solid #2e7d32; }}
    .criterion.fail {{ border-left: 4px solid #c62828; }}
    .criterion-score {{ font-weight: 600; margin-top: 4px; }}
    .no-criteria {{ font-size: 12px; color: #666; padding: 8px; border: 1px dashed #ccc; border-radius: 4px; }}
    .legend {{ font-size: 12px; color: #666; margin-top: 6px; }}
    .missing-section {{ background: #fff3e0; border: 1px solid #ffcc80; padding: 10px; border-radius: 6px; margin-bottom: 16px; font-size: 12px; }}
    pre {{ white-space: pre-wrap; }}
  </style>
</head>
<body>
  <h1>Agent Evaluation Report</h1>
  <div class="summary">
    <div>Total tests: {summary.get("totalTests", 0)}</div>
    <div>Passed: {summary.get("passedTests", 0)} | Failed: {summary.get("failedTests", 0)}</div>
    <div class="legend">PASS/FAIL reflects test assertions from the eval suite, not the judge scores.</div>
  </div>
  {f"<div class='missing-section'><strong>Missing images:</strong><ul>{''.join(f'<li>{esc(path)}</li>' for path in missing_images)}</ul></div>" if missing_images else ""}
  {''.join(rows)}
</body>
</html>
""".strip()


def get_judge_fn(provider: str) -> Callable[[str, str, str], JudgeResult]:
    if provider == "openai":
        return judge_with_openai
    if provider == "anthropic":
        return judge_with_anthropic
    if provider == "gemini":
        return judge_with_gemini
    raise ValueError(f"Unknown judge provider: {provider}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Ragas visual judge and render HTML.")
    parser.add_argument("--input", default="eval-results/ragas-input.json")
    parser.add_argument("--output", default="eval-results/ragas-output.json")
    parser.add_argument("--html", default="eval-results/eval-report.html")
    parser.add_argument("--provider", choices=["openai", "anthropic", "gemini"], required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--eval-results-dir", default="eval-results")
    args = parser.parse_args()

    data = load_ragas_input(args.input)
    judge_fn = get_judge_fn(args.provider)
    output = evaluate_dataset(data, judge_fn, args.model, args.eval_results_dir)
    write_json(args.output, output)

    html = render_html(output)
    with open(args.html, "w", encoding="utf-8") as handle:
        handle.write(html)

    print(f"Wrote {args.output}")
    print(f"Wrote {args.html}")


if __name__ == "__main__":
    main()
