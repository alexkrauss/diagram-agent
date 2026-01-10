#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "google-genai>=0.6.0",
#   "json-repair>=0.55.0",
# ]
# ///
import argparse
import base64
import concurrent.futures
import json
import os
import statistics
import sys
import threading
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Tuple

from json_repair import repair_json

JUDGE_MODEL = "gemini-3-flash-preview"


@dataclass
class JudgeResult:
    score: int
    rationale: str


@dataclass
class LatencyStats:
    total: float = 0.0
    count: int = 0
    samples: List[float] = field(default_factory=list)

    def record(self, seconds: float) -> None:
        self.total += seconds
        self.count += 1
        self.samples.append(seconds)

    def mean(self) -> float:
        if not self.count:
            return 0.0
        return self.total / self.count

    def median(self) -> float:
        if not self.samples:
            return 0.0
        return statistics.median(self.samples)


def load_visual_input(path: str) -> Dict[str, Any]:
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
        'Respond with raw JSON: {"score": 1 or 0, "rationale": "..."}\n'
        "Return only the JSON object with no extra text or markdown. Do not use markdown embedding."
    )


def build_batch_judge_prompt(prompt: str, criteria: List[str]) -> str:
    criteria_block = "\n".join(f"{idx}. {text}" for idx, text in enumerate(criteria, 1))
    return (
        "You are a strict visual judge. Determine whether each criterion is met by the image.\n\n"
        f"Conversation context:\n{prompt}\n\n"
        "Criteria:\n"
        f"{criteria_block}\n\n"
        "Respond with JSON ONLY. Output must include exactly one result per criterion, "
        "in the same order, with index starting at 1.\n"
        'Format: {"results": [{"index": 1, "score": 1 or 0, "rationale": "..."}, ...]}\n'
        "Return only the JSON object with no extra text or markdown."
    )


def gemini_generate_content(
    model: str, prompt: str, image_b64: str, *, force_json: bool = False
) -> str:
    from google import genai
    from google.genai import types

    api_key = os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    image_bytes = base64.b64decode(image_b64)
    config = None
    if force_json:
        config = types.GenerateContentConfig(response_mime_type="application/json")
    kwargs = {}
    if config is not None:
        kwargs["config"] = config
    response = client.models.generate_content(
        model=model,
        contents=[
            types.Part.from_text(text=prompt),
            types.Part.from_bytes(data=image_bytes, mime_type="image/png"),
        ],
        **kwargs,
    )
    return getattr(response, "text", "") or ""


def judge_with_gemini(model: str, prompt: str, image_b64: str) -> Tuple[JudgeResult, str | None]:
    raw = gemini_generate_content(model, prompt, image_b64, force_json=True)
    return parse_judge_result(raw)


def parse_judge_result(raw: str) -> Tuple[JudgeResult, str | None]:
    """Parse judge result. Returns (result, parsing_error_or_none)."""
    try:
        data = json.loads(repair_json(raw.strip()))
        score = int(data.get("score", 0))
        rationale = str(data.get("rationale", "")).strip()
        return JudgeResult(score=1 if score == 1 else 0, rationale=rationale), None
    except Exception:
        return JudgeResult(score=0, rationale=f"Unparseable response: {raw[:500]}"), raw


def parse_batch_judge_result(raw: str, expected: int) -> Tuple[List[JudgeResult], str | None]:
    """Parse batch judge result. Returns (results, parsing_error_or_none)."""
    def clamp_score(value: Any) -> int:
        try:
            score = int(value)
        except Exception:
            score = 0
        return 1 if score == 1 else 0

    try:
        data = json.loads(repair_json(raw.strip()))
        if isinstance(data, list):
            results = data
        else:
            results = data.get("results", [])

        indexed: Dict[int, JudgeResult] = {}
        ordered: List[JudgeResult] = []
        for idx, item in enumerate(results, start=1):
            if not isinstance(item, dict):
                ordered.append(JudgeResult(score=0, rationale=str(item)))
                continue
            score = clamp_score(item.get("score", 0))
            rationale = str(item.get("rationale", "")).strip()
            entry = JudgeResult(score=score, rationale=rationale)
            index_value = item.get("index")
            if isinstance(index_value, int):
                indexed[index_value] = entry
            else:
                ordered.append(entry)

        parsed: List[JudgeResult] = []
        for position in range(1, expected + 1):
            if position in indexed:
                parsed.append(indexed[position])
            elif ordered:
                parsed.append(ordered.pop(0))
            else:
                parsed.append(JudgeResult(score=0, rationale="Missing batch result."))
        return parsed, None
    except Exception:
        fallback = JudgeResult(score=0, rationale=f"Unparseable response: {raw[:500]}")
        return [fallback for _ in range(expected)], raw


def run_judge_call(
    judge_fn: Callable[[str, str, str], Tuple[JudgeResult, str | None]],
    model: str,
    prompt: str,
    criterion: str,
    image_b64: str,
) -> Tuple[JudgeResult, float, str | None]:
    judge_prompt = build_judge_prompt(prompt, criterion)
    start = time.monotonic()
    result, parse_error = judge_fn(model, judge_prompt, image_b64)
    return result, time.monotonic() - start, parse_error


def run_judge_batch_call(
    model: str,
    prompt: str,
    criteria: List[str],
    image_b64: str,
) -> Tuple[List[JudgeResult], float, str | None]:
    judge_prompt = build_batch_judge_prompt(prompt, criteria)
    start = time.monotonic()
    raw = gemini_generate_content(model, judge_prompt, image_b64, force_json=True)
    duration = time.monotonic() - start
    parsed, parse_error = parse_batch_judge_result(raw, len(criteria))
    return parsed, duration, parse_error


def evaluate_dataset(
    data: Dict[str, Any],
    eval_results_dir: str,
    *,
    model: str = JUDGE_MODEL,
    judge_fn: Callable[[str, str, str], JudgeResult] = judge_with_gemini,
    parallelism: int = 10,
    batch_criteria: bool = False,
    image_loader: Callable[[str], str] = read_png_as_base64,
) -> Dict[str, Any]:
    output = dict(data)
    tests: List[Dict[str, Any]] = []

    raw_tests = data.get("tests", [])
    total_criteria = sum(
        len(turn.get("criteria", []))
        for test in raw_tests
        for turn in test.get("turns", [])
    )
    total_turns = sum(len(test.get("turns", [])) for test in raw_tests)
    if total_criteria:
        print(
            f"Evaluating {total_turns} turns and {total_criteria} criteria...",
            flush=True,
        )
    else:
        print("No criteria found to evaluate.", flush=True)

    progress_state = {"done": 0, "start": time.monotonic()}
    report_every = 1 if total_criteria <= 50 else max(1, total_criteria // 50)
    latency_stats = LatencyStats()
    parsing_errors: List[str] = []
    progress_lock = threading.Lock()

    def format_latency(latency: LatencyStats) -> str:
        if latency.count == 0:
            return "avg n/a"
        return f"avg {latency.mean():.2f}s, p50 {latency.median():.2f}s"

    def progress_cb(
        state: Dict[str, Any],
        total: int,
        turn_index: int,
        criterion_index: int,
        criterion_count: int,
        test_name: str,
    ) -> None:
        state["done"] += 1
        done = state["done"]
        elapsed = time.monotonic() - state["start"]
        eta = (elapsed / done) * (total - done) if done else 0.0
        if done == 1 or done == total or done % report_every == 0:
            name = test_name or "Unnamed test"
            pct = (done / total) * 100 if total else 100.0
            print(
                f"[{done}/{total} {pct:5.1f}%] ETA {eta:6.1f}s | "
                f"{format_latency(latency_stats)} | {name} "
                f"turn {turn_index} criterion {criterion_index}/{criterion_count}",
                flush=True,
            )

    tasks: List[Dict[str, Any]] = []
    turn_results_map: Dict[Tuple[int, int], List[Dict[str, Any] | None]] = {}

    for test_idx, test in enumerate(raw_tests):
        turns = []
        test_name = test.get("fullName") or ""
        for turn_idx, turn in enumerate(test.get("turns", [])):
            criteria = turn.get("criteria", [])
            prompt = turn.get("prompt", "")
            png_path = turn.get("pngPath")
            image_b64 = None
            image_error = ""
            if png_path:
                absolute_path = os.path.join(eval_results_dir, png_path.lstrip("./"))
                try:
                    image_b64 = image_loader(absolute_path)
                except FileNotFoundError:
                    image_error = f"Missing image file: {absolute_path}"
                    print(image_error, file=sys.stderr)
                except OSError as exc:
                    image_error = f"Failed to read image: {absolute_path} ({exc})"
                    print(image_error, file=sys.stderr)
                except Exception as exc:
                    image_error = (
                        f"Unexpected image load error: {absolute_path} ({exc})"
                    )
                    print(image_error, file=sys.stderr)

            results: List[Dict[str, Any] | None] = [None] * len(criteria)
            if not png_path or not image_b64:
                for idx, criterion in enumerate(criteria, start=1):
                    results[idx - 1] = {
                        "criterion": criterion,
                        "score": 0,
                        "rationale": image_error
                        or (
                            "Missing PNG path."
                            if not png_path
                            else "Missing image data."
                        ),
                    }
                    with progress_lock:
                        progress_cb(
                            progress_state,
                            total_criteria,
                            turn.get("turnIndex") or 0,
                            idx,
                            len(criteria),
                            test_name,
                        )
                turn_results_map[(test_idx, turn_idx)] = results
                turns.append({**turn})
                continue

            if batch_criteria and criteria:
                tasks.append(
                    {
                        "key": (test_idx, turn_idx),
                        "criteria": criteria,
                        "prompt": prompt,
                        "image_b64": image_b64,
                        "turn_index": turn.get("turnIndex") or 0,
                        "criterion_count": len(criteria),
                        "test_name": test_name,
                        "batch": True,
                    }
                )
            else:
                for idx, criterion in enumerate(criteria, start=1):
                    tasks.append(
                        {
                            "key": (test_idx, turn_idx),
                            "criterion_index": idx - 1,
                            "criterion": criterion,
                            "prompt": prompt,
                            "image_b64": image_b64,
                            "turn_index": turn.get("turnIndex") or 0,
                            "criterion_count": len(criteria),
                            "test_name": test_name,
                            "batch": False,
                        }
                    )

            turn_results_map[(test_idx, turn_idx)] = results
            turns.append({**turn})
        tests.append({**test, "turns": turns})

    if tasks:
        with concurrent.futures.ThreadPoolExecutor(max_workers=parallelism) as executor:
            future_map = {}
            for task in tasks:
                if task.get("batch"):
                    future = executor.submit(
                        run_judge_batch_call,
                        model,
                        task["prompt"],
                        task["criteria"],
                        task["image_b64"],
                    )
                else:
                    future = executor.submit(
                        run_judge_call,
                        judge_fn,
                        model,
                        task["prompt"],
                        task["criterion"],
                        task["image_b64"],
                    )
                future_map[future] = task
            for future in concurrent.futures.as_completed(future_map):
                task = future_map[future]
                try:
                    result, duration, parse_error = future.result()
                    latency_stats.record(duration)
                    if parse_error is not None:
                        with progress_lock:
                            parsing_errors.append(parse_error)
                    if task.get("batch"):
                        entries = [
                            {
                                "criterion": criterion,
                                "score": item.score,
                                "rationale": item.rationale,
                            }
                            for criterion, item in zip(task["criteria"], result)
                        ]
                    else:
                        entries = [
                            {
                                "criterion": task["criterion"],
                                "score": result.score,
                                "rationale": result.rationale,
                            }
                        ]
                except Exception as exc:
                    print(f"Unexpected judge error: {exc}", file=sys.stderr)
                    if task.get("batch"):
                        entries = [
                            {
                                "criterion": criterion,
                                "score": 0,
                                "rationale": f"Unexpected judge error: {exc}",
                            }
                            for criterion in task["criteria"]
                        ]
                    else:
                        entries = [
                            {
                                "criterion": task["criterion"],
                                "score": 0,
                                "rationale": f"Unexpected judge error: {exc}",
                            }
                        ]
                turn_key = task["key"]
                results_list = turn_results_map.get(turn_key, [])
                if task.get("batch"):
                    for idx, entry in enumerate(entries):
                        if results_list and idx < len(results_list):
                            results_list[idx] = entry
                        with progress_lock:
                            progress_cb(
                                progress_state,
                                total_criteria,
                                task["turn_index"],
                                idx + 1,
                                task["criterion_count"],
                                task["test_name"],
                            )
                else:
                    if results_list and task["criterion_index"] < len(results_list):
                        results_list[task["criterion_index"]] = entries[0]
                    with progress_lock:
                        progress_cb(
                            progress_state,
                            total_criteria,
                            task["turn_index"],
                            task["criterion_index"] + 1,
                            task["criterion_count"],
                            task["test_name"],
                        )

    for test_idx, test in enumerate(tests):
        for turn_idx, turn in enumerate(test.get("turns", [])):
            results = turn_results_map.get((test_idx, turn_idx), [])
            finalized: List[Dict[str, Any]] = []
            for result in results:
                if result is None:
                    finalized.append(
                        {
                            "criterion": "",
                            "score": 0,
                            "rationale": "Missing judge result.",
                        }
                    )
                else:
                    finalized.append(result)
            turn["judge"] = {"model": model, "criteria": finalized}

    output["tests"] = tests
    output["judge_model"] = model
    if latency_stats.count:
        print(
            "Judge latency summary: "
            f"n={latency_stats.count}, avg={latency_stats.mean():.2f}s, "
            f"p50={latency_stats.median():.2f}s, "
            f"min={min(latency_stats.samples):.2f}s, "
            f"max={max(latency_stats.samples):.2f}s",
            flush=True,
        )

    # Write parsing errors to file
    parsing_errors_path = os.path.join(eval_results_dir, "parsing_errors.json")
    with open(parsing_errors_path, "w", encoding="utf-8") as f:
        json.dump(parsing_errors, f, indent=2)
    if parsing_errors:
        print(f"Wrote {len(parsing_errors)} parsing errors to {parsing_errors_path}")

    return output


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run visual eval judge and render HTML."
    )
    parser.add_argument("--input", default="eval-results/visual-eval-input.json")
    parser.add_argument("--output", default="eval-results/visual-eval-output.json")
    parser.add_argument("--eval-results-dir", default="eval-results")
    parser.add_argument("--parallelism", type=int, default=10)
    parser.add_argument(
        "--batch-criteria",
        action="store_true",
        help="Batch criteria per turn into a single judge call.",
    )
    args = parser.parse_args()

    data = load_visual_input(args.input)
    output = evaluate_dataset(
        data,
        args.eval_results_dir,
        parallelism=args.parallelism,
        batch_criteria=args.batch_criteria,
    )
    write_json(args.output, output)

    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
