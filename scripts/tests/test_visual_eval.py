import unittest

from scripts.visual_judge import evaluate_dataset, JudgeResult
from scripts.visual_report import render_html


class VisualEvalTests(unittest.TestCase):
    def test_evaluate_dataset_adds_scores(self):
        data = {
            "summary": {},
            "tests": [
                {
                    "fullName": "Test A",
                    "passed": True,
                    "turns": [
                        {
                            "turnIndex": 0,
                            "prompt": "USER: Draw A",
                            "criteria": ["There is a box labeled A."],
                            "pngPath": "./file/test-0/canvas-0.png",
                        }
                    ],
                }
            ],
        }

        def stub_judge(model: str, prompt: str, image_b64: str) -> JudgeResult:
            return JudgeResult(score=1, rationale="ok")

        output = evaluate_dataset(
            data,
            "stub-model",
            "eval-results",
            judge_fn=stub_judge,
            image_loader=lambda _: "fake",
        )
        criteria = output["tests"][0]["turns"][0]["judge"]["criteria"]
        self.assertEqual(criteria[0]["score"], 1)
        self.assertEqual(criteria[0]["rationale"], "ok")

    def test_render_html_contains_test_and_score(self):
        data = {
            "summary": {"totalTests": 1, "passedTests": 1, "failedTests": 0},
            "tests": [
                {
                    "fullName": "Test B",
                    "passed": True,
                    "turns": [
                        {
                            "turnIndex": 0,
                            "pngPath": "./file/test-0/canvas-0.png",
                            "d2Content": "A",
                            "prompt": "USER: Draw A",
                            "judge": {
                                "criteria": [
                                    {"criterion": "A exists", "score": 1, "rationale": "ok"}
                                ]
                            },
                        }
                    ],
                }
            ],
        }

        html = render_html(data)
        self.assertIn("Test B", html)
        self.assertIn("A exists", html)
        self.assertIn("Score: 1", html)
        self.assertIn("canvas-0.png", html)
        self.assertIn("USER: Draw A", html)

    def test_render_html_marks_missing_images_and_no_criteria(self):
        data = {
            "summary": {"totalTests": 1, "passedTests": 0, "failedTests": 1},
            "tests": [
                {
                    "fullName": "Test Missing",
                    "passed": False,
                    "turns": [
                        {
                            "turnIndex": 0,
                            "pngPath": "./missing/test-0/canvas-0.png",
                            "d2Content": "B",
                            "prompt": "USER: Draw B",
                            "judge": {"criteria": []},
                        }
                    ],
                }
            ],
        }

        html = render_html(data)
        self.assertIn("No criteria defined for this turn.", html)
        self.assertIn("Missing images:", html)


if __name__ == "__main__":
    unittest.main()
