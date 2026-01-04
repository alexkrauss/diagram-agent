#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# ///
import argparse
import json

from visual_report import render_html


def load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def main() -> None:
    parser = argparse.ArgumentParser(description="Render HTML report from visual eval output.")
    parser.add_argument("--input", default="eval-results/visual-eval-output.json")
    parser.add_argument("--html", default="eval-results/eval-report.html")
    args = parser.parse_args()

    data = load_json(args.input)
    html = render_html(data)
    with open(args.html, "w", encoding="utf-8") as handle:
        handle.write(html)

    print(f"Wrote {args.html}")


if __name__ == "__main__":
    main()
