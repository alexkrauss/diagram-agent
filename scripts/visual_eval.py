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
import concurrent.futures
import json
import os
import sys
import threading
from _thread import LockType
from dataclasses import dataclass
from typing import Any, Callable, Dict, List


@dataclass
class JudgeResult:
    score: int
    rationale: str


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
        'Respond with JSON: {"score": 1 or 0, "rationale": "..."}\n'
        "Return only the JSON object with no extra text or markdown."
    )


def judge_with_openai(model: str, prompt: str, image_b64: str) -> JudgeResult:
    from openai import OpenAI

    client = OpenAI()
    response = client.responses.create(
        model=model,
        response_format={"type": "json_object"},
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
    executor: concurrent.futures.Executor | None = None,
    semaphore: threading.Semaphore | None = None,
    progress_cb: Callable[[Dict[str, Any], int, int, int, int, str], None]
    | None = None,
    progress_state: Dict[str, Any] | None = None,
    progress_lock: LockType | None = None,
    total_criteria: int = 0,
    test_name: str = "",
    image_loader: Callable[[str], str] = read_png_as_base64,
) -> Dict[str, Any]:
    criteria = turn.get("criteria", [])
    prompt = turn.get("prompt", "")
    png_path = turn.get("pngPath")
    image_b64 = None
    image_error = ""

    results = []
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
            image_error = f"Unexpected image load error: {absolute_path} ({exc})"
            print(image_error, file=sys.stderr)

    def report_progress(criterion_index: int) -> None:
        if progress_cb and progress_state is not None:
            if progress_lock:
                with progress_lock:
                    progress_cb(
                        progress_state,
                        total_criteria,
                        turn.get("turnIndex") or 0,
                        criterion_index,
                        len(criteria),
                        test_name,
                    )
            else:
                progress_cb(
                    progress_state,
                    total_criteria,
                    turn.get("turnIndex") or 0,
                    criterion_index,
                    len(criteria),
                    test_name,
                )

    def run_judge(judge_prompt: str) -> JudgeResult:
        if semaphore is None:
            return judge_fn(model, judge_prompt, image_b64)
        with semaphore:
            return judge_fn(model, judge_prompt, image_b64)

    immediate_results: Dict[int, Dict[str, Any]] = {}
    futures: Dict[int, concurrent.futures.Future[JudgeResult]] = {}

    for idx, criterion in enumerate(criteria, start=1):
        if not png_path:
            immediate_results[idx] = {
                "criterion": criterion,
                "score": 0,
                "rationale": "Missing PNG path.",
            }
            report_progress(idx)
            continue
        if not image_b64:
            immediate_results[idx] = {
                "criterion": criterion,
                "score": 0,
                "rationale": image_error or "Missing image data.",
            }
            report_progress(idx)
            continue

        judge_prompt = build_judge_prompt(prompt, criterion)
        if executor is None:
            try:
                result = run_judge(judge_prompt)
                immediate_results[idx] = {
                    "criterion": criterion,
                    "score": result.score,
                    "rationale": result.rationale,
                }
            except Exception as exc:
                print(f"Unexpected judge error: {exc}", file=sys.stderr)
                immediate_results[idx] = {
                    "criterion": criterion,
                    "score": 0,
                    "rationale": f"Unexpected judge error: {exc}",
                }
            report_progress(idx)
            continue

        future = executor.submit(run_judge, judge_prompt)
        future.add_done_callback(lambda _f, idx=idx: report_progress(idx))
        futures[idx] = future

    for idx, criterion in enumerate(criteria, start=1):
        if idx in immediate_results:
            results.append(immediate_results[idx])
            continue
        future = futures.get(idx)
        if not future:
            results.append(
                {
                    "criterion": criterion,
                    "score": 0,
                    "rationale": "Missing judge future.",
                }
            )
            continue
        try:
            result = future.result()
            results.append(
                {
                    "criterion": criterion,
                    "score": result.score,
                    "rationale": result.rationale,
                }
            )
        except Exception as exc:
            print(f"Unexpected judge error: {exc}", file=sys.stderr)
            results.append(
                {
                    "criterion": criterion,
                    "score": 0,
                    "rationale": f"Unexpected judge error: {exc}",
                }
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
    parallelism: int = 30,
    image_loader: Callable[[str], str] = read_png_as_base64,
) -> Dict[str, Any]:
    output = dict(data)
    tests = []

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

    progress_state = {"done": 0}
    report_every = 1 if total_criteria <= 50 else max(1, total_criteria // 50)

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
        if done == 1 or done == total or done % report_every == 0:
            name = test_name or "Unnamed test"
            print(
                f"[{done}/{total}] {name} turn {turn_index} "
                f"criterion {criterion_index}/{criterion_count}",
                flush=True,
            )

    semaphore = threading.Semaphore(parallelism)
    progress_lock = threading.Lock()
    with concurrent.futures.ThreadPoolExecutor(max_workers=parallelism) as executor:
        for test in raw_tests:
            turns = []
            for turn in test.get("turns", []):
                turns.append(
                    evaluate_turn(
                        turn,
                        judge_fn,
                        model,
                        eval_results_dir,
                        executor,
                        semaphore,
                        progress_cb,
                        progress_state,
                        progress_lock,
                        total_criteria,
                        test.get("fullName") or "",
                        image_loader,
                    )
                )
            tests.append({**test, "turns": turns})

    output["tests"] = tests
    output["judge_model"] = model
    return output


def get_judge_fn(provider: str) -> Callable[[str, str, str], JudgeResult]:
    if provider == "openai":
        return judge_with_openai
    if provider == "anthropic":
        return judge_with_anthropic
    if provider == "gemini":
        return judge_with_gemini
    raise ValueError(f"Unknown judge provider: {provider}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run visual eval judge and render HTML."
    )
    parser.add_argument("--input", default="eval-results/visual-eval-input.json")
    parser.add_argument("--output", default="eval-results/visual-eval-output.json")
    parser.add_argument(
        "--provider", choices=["openai", "anthropic", "gemini"], required=True
    )
    parser.add_argument("--model", required=True)
    parser.add_argument("--eval-results-dir", default="eval-results")
    parser.add_argument("--parallelism", type=int, default=10)
    args = parser.parse_args()

    data = load_visual_input(args.input)
    judge_fn = get_judge_fn(args.provider)
    output = evaluate_dataset(
        data,
        judge_fn,
        args.model,
        args.eval_results_dir,
        args.parallelism,
    )
    write_json(args.output, output)

    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
