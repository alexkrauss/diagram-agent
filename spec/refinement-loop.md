# Scripted refinement loop

I want to programmatically run claude code in a loop using the prompt in `spec/context-improvement.md`.

To do this, I need a bash script that runs the following:

- Run `npm run eval` (redirecting the output to a file with tee)
- If the eval errors, stop
- If it runs through:
  - Create a new heading in the journal file with a timestamp. Log the success rates there as a baseline (grep for "success rate", its three lines)
  - Call the agent programmatically.

Repeat from start.

Stop condition: a file "keep_going" that is created at the beginning of the script has been deleted externally.
