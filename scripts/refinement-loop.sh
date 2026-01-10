#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

KEEP_GOING_FILE="$ROOT_DIR/keep_going"
JOURNAL_FILE="$ROOT_DIR/plan/agent-refinement-log.md"
EVAL_OUTPUT="/tmp/diagent-eval-output-$$.log"

# Create the stop-condition file
touch "$KEEP_GOING_FILE"
echo "Created $KEEP_GOING_FILE - delete this file to stop the loop."

# Ensure journal directory exists
mkdir -p "$(dirname "$JOURNAL_FILE")"

while [ -f "$KEEP_GOING_FILE" ]; do
    echo "=== Starting refinement iteration ==="

    # Run eval and capture output
    echo "Running npm run eval..."
    if ! npm run eval 2>&1 | tee "$EVAL_OUTPUT"; then
        echo "Eval failed with error. Stopping."
        rm -f "$KEEP_GOING_FILE"
        exit 1
    fi

    # Check if keep_going was deleted during eval
    if [ ! -f "$KEEP_GOING_FILE" ]; then
        echo "keep_going file deleted. Stopping."
        exit 0
    fi

    # Extract success rates and log to journal
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    SUCCESS_RATES=$(grep "success rate" "$EVAL_OUTPUT" || echo "No success rates found")

    {
        echo ""
        echo "## $TIMESTAMP"
        echo ""
        echo '```'
        echo "$SUCCESS_RATES"
        echo '```'
        echo ""
    } >> "$JOURNAL_FILE"

    echo "Logged results to journal."

    # Call the agent with the context-improvement prompt
    echo "Calling agent..."
    claude --dangerously-skip-permissions --verbose -p "$(cat spec/context-improvement.md)"

    echo "Agent completed. Starting next iteration..."
done

echo "keep_going file not found. Stopping."
