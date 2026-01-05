import os
from typing import Any, Dict, List


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
        test_has_error = False
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
                    if status == "fail":
                        test_has_error = True
                    criteria_html += (
                        f"<div class='criterion {status}'>"
                        f"<div class='criterion-text'>{esc(result.get('criterion'))}</div>"
                        f"<div class='criterion-score'>Score: {esc(result.get('score'))}</div>"
                        f"<details class='criterion-details'>"
                        f"<summary>Explanation</summary>"
                        f"<div class='criterion-rationale'>{esc(result.get('rationale'))}</div>"
                        f"</details>"
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
                    <div class="turn-prompt">
                      <div class="section-label">User prompt</div>
                      <pre>{esc(prompt_text)}</pre>
                    </div>
                    <div class="turn-image">
                      <img src="{esc(png_path)}" alt="Turn rendering" onerror="this.style.display='none'">
                      <div class="image-path">{esc(png_path)}</div>
                    </div>
                    <details class="d2-details">
                      <summary>Show D2</summary>
                      <pre>{esc(turn.get("d2Content") or "")}</pre>
                    </details>
                    <div class="turn-criteria">
                      <div class="section-label">Criteria</div>
                      {criteria_html}
                    </div>
                  </div>
                </div>
                """
            )

        error_badge = "<span class='test-badge test-badge-error'>Error</span>" if test_has_error else ""
        rows.append(
            f"""
            <details class="test-card {'test-error' if test_has_error else ''}" data-has-error="{str(test_has_error).lower()}">
              <summary>
                <span>{esc(test.get("fullName"))}</span>
                {error_badge}
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
    .summary {{ margin-bottom: 12px; }}
    .controls {{ margin-bottom: 20px; }}
    .controls label {{ font-size: 13px; display: inline-flex; gap: 8px; align-items: center; }}
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
    .test-error > summary {{
      background: #fff1f0;
      border-left: 4px solid #c62828;
    }}
    .test-badge {{
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 2px 6px;
      border-radius: 999px;
      font-weight: 600;
    }}
    .test-badge-error {{ color: #b71c1c; background: #ffebee; }}
    .status.pass {{ color: #2e7d32; }}
    .status.fail {{ color: #c62828; }}
    .test-body {{ padding: 16px; }}
    .turn {{ border: 1px solid #e0e0e0; padding: 12px; border-radius: 6px; margin-bottom: 12px; }}
    .turn-header {{ font-weight: 600; margin-bottom: 8px; }}
    .turn-body {{ display: flex; flex-direction: column; gap: 12px; }}
    .turn-image img {{ max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }}
    .image-path {{ font-size: 11px; color: #666; margin-top: 6px; word-break: break-all; }}
    .section-label {{ font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #4a4a4a; margin-bottom: 6px; }}
    .turn-prompt pre {{ background: #f5f5f5; padding: 8px; border-radius: 4px; margin: 0; }}
    .criterion {{
      border: 1px solid #e0e0e0;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 8px;
    }}
    .criterion.pass {{ border-left: 4px solid #2e7d32; }}
    .criterion.fail {{ border-left: 4px solid #c62828; }}
    .criterion-score {{ font-weight: 600; margin-top: 4px; }}
    .criterion-details {{ margin-top: 6px; }}
    .criterion-details summary {{ cursor: pointer; font-size: 12px; color: #4a4a4a; }}
    .criterion-rationale {{ margin-top: 6px; background: #f7f7f7; padding: 8px; border-radius: 4px; }}
    .no-criteria {{ font-size: 12px; color: #666; padding: 8px; border: 1px dashed #ccc; border-radius: 4px; }}
    .d2-details summary {{ cursor: pointer; font-size: 12px; }}
    .missing-section {{ background: #fff3e0; border: 1px solid #ffcc80; padding: 10px; border-radius: 6px; margin-bottom: 16px; font-size: 12px; }}
    pre {{ white-space: pre-wrap; }}
    body.filter-errors details[data-has-error="false"] {{ display: none; }}
  </style>
</head>
<body>
  <h1>Agent Evaluation Report</h1>
  <div class="summary">
    <div>Total tests: {summary.get("totalTests", 0)}</div>
  </div>
  <div class="controls">
    <label><input type="checkbox" id="filter-errors"> Show only tests with errors</label>
  </div>
  {f"<div class='missing-section'><strong>Missing images:</strong><ul>{''.join(f'<li>{esc(path)}</li>' for path in missing_images)}</ul></div>" if missing_images else ""}
  {''.join(rows)}
  <script>
    const filter = document.getElementById("filter-errors");
    if (filter) {{
      filter.addEventListener("change", () => {{
        document.body.classList.toggle("filter-errors", filter.checked);
      }});
    }}
  </script>
</body>
</html>
""".strip()
