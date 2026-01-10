#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "google-genai>=0.6.0",
#   "json-repair>=0.55.0",
#   "jsonschema>=4.0.0",
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
from typing import Any, Callable, Dict, List, Tuple, Optional

from json_repair import repair_json
from jsonschema import Draft7Validator, ValidationError

JUDGE_MODEL = "gemini-3-flash-preview"
DEFAULT_PARALLELISM = 50

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def load_schema(name: str) -> Dict[str, Any]:
    """Load a JSON schema file from the eval-results directory."""
    schema_path = os.path.join(SCRIPT_DIR, name)
    with open(schema_path, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_input(data: Dict[str, Any]) -> None:
    """Validate input data against visual-eval-input.schema.json."""
    schema = load_schema("visual-eval-input.schema.json")
    validator = Draft7Validator(schema)
    errors = list(validator.iter_errors(data))
    if errors:
        error_msgs = [f"  - {e.json_path}: {e.message}" for e in errors[:5]]
        if len(errors) > 5:
            error_msgs.append(f"  ... and {len(errors) - 5} more errors")
        raise ValidationError(
            f"Input validation failed:\n" + "\n".join(error_msgs)
        )


def validate_output(data: Dict[str, Any]) -> None:
    """Validate output data against visual-eval-output.schema.json."""
    schema = load_schema("visual-eval-output.schema.json")
    validator = Draft7Validator(schema)
    errors = list(validator.iter_errors(data))
    if errors:
        error_msgs = [f"  - {e.json_path}: {e.message}" for e in errors[:5]]
        if len(errors) > 5:
            error_msgs.append(f"  ... and {len(errors) - 5} more errors")
        raise ValidationError(
            f"Output validation failed:\n" + "\n".join(error_msgs)
        )


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

    def p90(self) -> float:
        if not self.samples:
            return 0.0
        sorted_samples = sorted(self.samples)
        idx = int(len(sorted_samples) * 0.9)
        idx = min(idx, len(sorted_samples) - 1)
        return sorted_samples[idx]

    def max(self) -> float:
        if not self.samples:
            return 0.0
        return max(self.samples)


@dataclass
class ProgressState:
    pending: int = 0
    in_flight: int = 0
    done: int = 0
    start_time: float = field(default_factory=time.monotonic)


class StatusReporter:
    """Reports progress via an in-place status line that updates on events or timer."""

    def __init__(
        self,
        total_requests: int,
        latency_stats: LatencyStats,
        update_interval: float = 1.0,
    ):
        self.total_requests = total_requests
        self.latency_stats = latency_stats
        self.update_interval = update_interval
        self.state = ProgressState(pending=total_requests)
        self.lock = threading.Lock()
        self.stop_event = threading.Event()
        self.timer_thread: Optional[threading.Thread] = None
        self.last_line_len = 0

    def start(self) -> None:
        """Start the timer thread for periodic updates."""
        if self.total_requests == 0:
            return
        self.timer_thread = threading.Thread(target=self._timer_loop, daemon=True)
        self.timer_thread.start()
        self._print_status()

    def stop(self) -> None:
        """Stop the timer thread and print final newline."""
        self.stop_event.set()
        if self.timer_thread:
            self.timer_thread.join(timeout=2.0)
        # Clear the status line
        sys.stdout.write("\r" + " " * self.last_line_len + "\r")
        sys.stdout.flush()

    def _timer_loop(self) -> None:
        while not self.stop_event.wait(self.update_interval):
            self._print_status()

    def on_request_start(self) -> None:
        """Called when a request is sent to the API."""
        with self.lock:
            self.state.pending -= 1
            self.state.in_flight += 1
        self._print_status()

    def on_request_complete(self) -> None:
        """Called when a response is received from the API."""
        with self.lock:
            self.state.in_flight -= 1
            self.state.done += 1
        self._print_status()

    def _format_latency(self) -> str:
        stats = self.latency_stats
        if stats.count == 0:
            return "latency: n/a"
        return (
            f"avg={stats.mean():.2f}s p50={stats.median():.2f}s "
            f"p90={stats.p90():.2f}s max={stats.max():.2f}s"
        )

    def _print_status(self) -> None:
        with self.lock:
            elapsed = time.monotonic() - self.state.start_time
            status = (
                f"[pending:{self.state.pending} in-flight:{self.state.in_flight} "
                f"done:{self.state.done}/{self.total_requests}] "
                f"{self._format_latency()} | elapsed: {elapsed:.1f}s"
            )
            # Pad with spaces to clear previous content
            padded = status.ljust(self.last_line_len)
            sys.stdout.write(f"\r{padded}")
            sys.stdout.flush()
            self.last_line_len = len(status)


def load_visual_input(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: str, payload: Dict[str, Any]) -> None:
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def read_png_as_base64(path: str) -> str:
    with open(path, "rb") as handle:
        return base64.b64encode(handle.read()).decode("ascii")


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


def run_judge_batch_call(
    model: str,
    prompt: str,
    criteria: List[str],
    image_b64: str,
    on_start: Optional[Callable[[], None]] = None,
    on_complete: Optional[Callable[[], None]] = None,
) -> Tuple[List[JudgeResult], float, str | None]:
    judge_prompt = build_batch_judge_prompt(prompt, criteria)
    if on_start:
        on_start()
    start = time.monotonic()
    raw = gemini_generate_content(model, judge_prompt, image_b64, force_json=True)
    duration = time.monotonic() - start
    if on_complete:
        on_complete()
    parsed, parse_error = parse_batch_judge_result(raw, len(criteria))
    return parsed, duration, parse_error


def evaluate_dataset(
    data: Dict[str, Any],
    eval_results_dir: str,
    *,
    model: str = JUDGE_MODEL,
    parallelism: int = DEFAULT_PARALLELISM,
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

    latency_stats = LatencyStats()
    parsing_errors: List[str] = []
    parsing_errors_lock = threading.Lock()

    tasks: List[Dict[str, Any]] = []
    turn_results_map: Dict[Tuple[int, int], List[Dict[str, Any] | None]] = {}

    for test_idx, test in enumerate(raw_tests):
        turns = []
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
                for idx, criterion in enumerate(criteria):
                    results[idx] = {
                        "criterion": criterion,
                        "score": 0,
                        "rationale": image_error
                        or (
                            "Missing PNG path."
                            if not png_path
                            else "Missing image data."
                        ),
                    }
                turn_results_map[(test_idx, turn_idx)] = results
                turns.append({**turn})
                continue

            if criteria:
                tasks.append(
                    {
                        "key": (test_idx, turn_idx),
                        "criteria": criteria,
                        "prompt": prompt,
                        "image_b64": image_b64,
                    }
                )

            turn_results_map[(test_idx, turn_idx)] = results
            turns.append({**turn})
        tests.append({**test, "turns": turns})

    # Count total API requests (one per turn with criteria, batched)
    total_requests = len(tasks)

    # Set up status reporter
    status_reporter = StatusReporter(total_requests, latency_stats)
    start_time = time.monotonic()

    if tasks:
        status_reporter.start()
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=parallelism) as executor:
                future_map = {}
                for task in tasks:
                    future = executor.submit(
                        run_judge_batch_call,
                        model,
                        task["prompt"],
                        task["criteria"],
                        task["image_b64"],
                        status_reporter.on_request_start,
                        status_reporter.on_request_complete,
                    )
                    future_map[future] = task
                for future in concurrent.futures.as_completed(future_map):
                    task = future_map[future]
                    try:
                        result, duration, parse_error = future.result()
                        latency_stats.record(duration)
                        if parse_error is not None:
                            with parsing_errors_lock:
                                parsing_errors.append(parse_error)
                        entries = [
                            {
                                "criterion": criterion,
                                "score": item.score,
                                "rationale": item.rationale,
                            }
                            for criterion, item in zip(task["criteria"], result)
                        ]
                    except Exception as exc:
                        print(f"\nUnexpected judge error: {exc}", file=sys.stderr)
                        entries = [
                            {
                                "criterion": criterion,
                                "score": 0,
                                "rationale": f"Unexpected judge error: {exc}",
                            }
                            for criterion in task["criteria"]
                        ]
                    turn_key = task["key"]
                    results_list = turn_results_map.get(turn_key, [])
                    for idx, entry in enumerate(entries):
                        if results_list and idx < len(results_list):
                            results_list[idx] = entry
        finally:
            status_reporter.stop()

    total_time = time.monotonic() - start_time

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

    # Print final summary
    if latency_stats.count:
        print(
            f"Judge completed: {latency_stats.count} requests, "
            f"avg={latency_stats.mean():.2f}s, p50={latency_stats.median():.2f}s, "
            f"p90={latency_stats.p90():.2f}s, max={latency_stats.max():.2f}s, "
            f"total={total_time:.1f}s",
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
    parser.add_argument("--parallelism", type=int, default=DEFAULT_PARALLELISM)
    args = parser.parse_args()

    data = load_visual_input(args.input)
    print("Validating input against schema...", flush=True)
    validate_input(data)

    output = evaluate_dataset(
        data,
        args.eval_results_dir,
        parallelism=args.parallelism,
    )

    print("Validating output against schema...", flush=True)
    validate_output(output)

    write_json(args.output, output)

    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
