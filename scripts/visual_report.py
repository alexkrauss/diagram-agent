#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# ///
import argparse
import json
import os
from typing import Any, Dict, List


def load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def get_criterion_score(result: Dict[str, Any]) -> float:
    """Get the score for a criterion, supporting both old and new format."""
    # New format: summary_score (float 0-1)
    if "summary_score" in result:
        return float(result["summary_score"])
    # Old format: score (int 0 or 1)
    return float(result.get("score", 0))


def compute_metrics(data: Dict[str, Any]) -> Dict[str, Any]:
    tests = data.get("tests", [])
    scenario_totals: Dict[str, Dict[str, int]] = {}
    turn_total = 0
    turn_success = 0
    criteria_total = 0
    criteria_success = 0.0  # Now a float for partial scores

    for test in tests:
        scenario = ""
        hierarchy = test.get("hierarchy") or []
        if hierarchy:
            scenario = str(hierarchy[0])
        else:
            scenario = str(test.get("fullName") or "Unknown scenario")
        test_all_ok = True
        turns = test.get("turns", [])
        for turn in turns:
            judge = turn.get("judge", {})
            judge_criteria = judge.get("criteria", [])
            turn_total += 1
            if not judge_criteria:
                turn_success += 1
                continue
            turn_ok = True
            for result in judge_criteria:
                criteria_total += 1
                score = get_criterion_score(result)
                criteria_success += score
                if score < 1.0:
                    turn_ok = False
            if turn_ok:
                turn_success += 1
            else:
                test_all_ok = False

        if scenario not in scenario_totals:
            scenario_totals[scenario] = {"total": 0, "success": 0}
        scenario_totals[scenario]["total"] += 1
        if turns and test_all_ok:
            scenario_totals[scenario]["success"] += 1

    return {
        "scenario_total": len(scenario_totals),
        "scenario_success": sum(
            1
            for counts in scenario_totals.values()
            if counts["success"] == counts["total"] and counts["total"] > 0
        ),
        "turn_total": turn_total,
        "turn_success": turn_success,
        "criteria_total": criteria_total,
        "criteria_success": criteria_success,
    }


def render_html(data: Dict[str, Any]) -> str:
    tests = data.get("tests", [])
    summary = data.get("summary", {})
    metrics = compute_metrics(data)
    missing_images: List[str] = []
    num_opinions = data.get("opinions", 1)

    def esc(text: Any) -> str:
        return (
            str(text)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&#39;")
        )

    def render_opinions(opinions: List[Dict[str, Any]]) -> str:
        """Render multiple opinions as expandable details."""
        if not opinions or len(opinions) <= 1:
            # Single opinion - render inline
            if opinions:
                return f"<div class='criterion-rationale'>{esc(opinions[0].get('rationale', ''))}</div>"
            return ""

        html = "<div class='opinions-list'>"
        for idx, opinion in enumerate(opinions, 1):
            score = opinion.get("score", 0)
            status_class = "pass" if score == 1 else "fail"
            html += (
                f"<div class='opinion {status_class}'>"
                f"<span class='opinion-label'>Opinion {idx}:</span> "
                f"<span class='opinion-score'>Score {score}</span>"
                f"<div class='opinion-rationale'>{esc(opinion.get('rationale', ''))}</div>"
                f"</div>"
            )
        html += "</div>"
        return html

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
                    score = get_criterion_score(result)
                    # Determine status: pass (1.0), partial (0 < x < 1), fail (0)
                    if score >= 1.0:
                        status = "pass"
                    elif score > 0:
                        status = "partial"
                    else:
                        status = "fail"
                    if status != "pass":
                        test_has_error = True

                    # Format score display
                    if "summary_score" in result:
                        score_display = f"{score:.2f}"
                    else:
                        score_display = str(int(score))

                    opinions = result.get("opinions", [])
                    opinions_html = render_opinions(opinions)

                    criteria_html += (
                        f"<div class='criterion {status}'>"
                        f"<div class='criterion-text'>{esc(result.get('criterion'))}</div>"
                        f"<div class='criterion-score'>Score: {score_display}</div>"
                        f"<details class='criterion-details'>"
                        f"<summary>{'Opinions' if len(opinions) > 1 else 'Explanation'}</summary>"
                        f"{opinions_html}"
                        f"</details>"
                        "</div>"
                    )

            # Build turn events HTML from turnEvents array (in chronological order)
            turn_events = turn.get("turnEvents", [])
            events_html = ""
            for event in turn_events:
                event_type = event.get("type", "")
                if event_type == "user_message":
                    content = event.get("content", "")
                    events_html += f"<div class='event event-user'><div class='event-label'>User</div><pre>{esc(content)}</pre></div>"
                elif event_type == "assistant_message":
                    content = event.get("content", "")
                    events_html += f"<div class='event event-assistant'><div class='event-label'>Assistant</div><pre>{esc(content)}</pre></div>"
                elif event_type == "tool_call":
                    tool_name = event.get("toolName", "")
                    args = event.get("arguments", {})
                    if tool_name == "get_d2_context":
                        keyword = args.get("keyword", "unknown")
                        events_html += f"<div class='event event-tool'>Loaded context: <code>{esc(keyword)}</code></div>"
                    else:
                        events_html += f"<div class='event event-tool'>Called: <code>{esc(tool_name)}</code></div>"

            png_path = turn.get("pngPath") or ""
            if png_path:
                candidate = os.path.join("eval-results", png_path.lstrip("./"))
                if not os.path.exists(candidate):
                    missing_images.append(png_path)
            turn_blocks.append(
                f"""
                <div class="turn">
                  <div class="turn-header">Turn {turn.get("turnIndex")}</div>
                  <div class="turn-body">
                    <div class="turn-conversation">
                      <div class="section-label">Conversation</div>
                      {events_html}
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
    .criterion.partial {{ border-left: 4px solid #f9a825; background: #fffde7; }}
    .criterion.fail {{ border-left: 4px solid #c62828; }}
    .criterion-score {{ font-weight: 600; margin-top: 4px; }}
    .criterion-details {{ margin-top: 6px; }}
    .criterion-details summary {{ cursor: pointer; font-size: 12px; color: #4a4a4a; }}
    .criterion-rationale {{ margin-top: 6px; background: #f7f7f7; padding: 8px; border-radius: 4px; }}
    .opinions-list {{ margin-top: 6px; }}
    .opinion {{ padding: 8px; border-radius: 4px; margin-bottom: 6px; background: #f7f7f7; }}
    .opinion.pass {{ border-left: 3px solid #2e7d32; }}
    .opinion.fail {{ border-left: 3px solid #c62828; }}
    .opinion-label {{ font-weight: 600; font-size: 12px; }}
    .opinion-score {{ font-size: 12px; color: #666; margin-left: 8px; }}
    .opinion-rationale {{ margin-top: 4px; font-size: 13px; }}
    .no-criteria {{ font-size: 12px; color: #666; padding: 8px; border: 1px dashed #ccc; border-radius: 4px; }}
    .d2-details summary {{ cursor: pointer; font-size: 12px; }}
    .turn-conversation {{ margin-bottom: 12px; }}
    .event {{ margin-bottom: 8px; padding: 8px; border-radius: 4px; }}
    .event-label {{ font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #666; margin-bottom: 4px; }}
    .event-user {{ background: #e3f2fd; border-left: 3px solid #1976d2; }}
    .event-assistant {{ background: #f3e5f5; border-left: 3px solid #7b1fa2; }}
    .event-tool {{ font-size: 12px; color: #666; background: #f0f4f8; padding: 4px 8px; border-radius: 4px; border-left: 3px solid #4a90d9; }}
    .event-tool code {{ background: #e1e8ed; padding: 1px 4px; border-radius: 2px; }}
    .event pre {{ margin: 0; white-space: pre-wrap; font-size: 13px; }}
    .missing-section {{ background: #fff3e0; border: 1px solid #ffcc80; padding: 10px; border-radius: 6px; margin-bottom: 16px; font-size: 12px; }}
    pre {{ white-space: pre-wrap; }}
    body.filter-errors details[data-has-error="false"] {{ display: none; }}
  </style>
</head>
<body>
  <h1>Agent Evaluation Report</h1>
  <div class="summary">
    <div>Total tests: {summary.get("totalTests", 0)}</div>
    <div>Scenario success rate: {metrics["scenario_success"]}/{metrics["scenario_total"]} ({(metrics["scenario_success"] / metrics["scenario_total"] * 100) if metrics["scenario_total"] else 0:.1f}%)</div>
    <div>Turn success rate: {metrics["turn_success"]}/{metrics["turn_total"]} ({(metrics["turn_success"] / metrics["turn_total"] * 100) if metrics["turn_total"] else 0:.1f}%)</div>
    <div>Criteria success rate: {metrics["criteria_success"]:.1f}/{metrics["criteria_total"]} ({(metrics["criteria_success"] / metrics["criteria_total"] * 100) if metrics["criteria_total"] else 0:.1f}%)</div>
    {f"<div>Opinions per criterion: {num_opinions}</div>" if num_opinions > 1 else ""}
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Render HTML report from visual eval output.")
    parser.add_argument("--input", default="eval-results/visual-eval-output.json")
    parser.add_argument("--html", default="eval-results/eval-report.html")
    args = parser.parse_args()

    data = load_json(args.input)
    metrics = compute_metrics(data)
    html = render_html(data)
    with open(args.html, "w", encoding="utf-8") as handle:
        handle.write(html)

    scenario_total = metrics["scenario_total"]
    turn_total = metrics["turn_total"]
    criteria_total = metrics["criteria_total"]
    scenario_rate = (
        (metrics["scenario_success"] / scenario_total * 100)
        if scenario_total
        else 0.0
    )
    turn_rate = (metrics["turn_success"] / turn_total * 100) if turn_total else 0.0
    criteria_rate = (
        (metrics["criteria_success"] / criteria_total * 100)
        if criteria_total
        else 0.0
    )

    print(
        "Scenario success rate: "
        f"{metrics['scenario_success']}/{scenario_total} ({scenario_rate:.1f}%)"
    )
    print(
        "Turn success rate: "
        f"{metrics['turn_success']}/{turn_total} ({turn_rate:.1f}%)"
    )
    print(
        "Criteria success rate: "
        f"{metrics['criteria_success']:.1f}/{criteria_total} ({criteria_rate:.1f}%)"
    )
    print(f"Wrote {args.html}")


if __name__ == "__main__":
    main()
