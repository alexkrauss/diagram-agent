# Enabling the agent to produce better results by providing resources about the d2 language.

Objective: Achieve better agent scores as determined by `npm run eval`.

Currently, the diagramming agent produces weak results due to lack of knowledge
of the D2 diagramming language. Your goals is to improve the results by means of context
engineering.

Approach:

1. Inspect the d2 documentation repository, which is checked out in tmp/d2-docs/.
   This contains relevant material in source form.

2. Pick some basic material and copy it over to a new src/agent/context/ folder.
   Clean it up in such a way that external references to examples are inlined and
   Boilerplate or presentational material is removed. This type of docs are only for
   our agent, not for human viewers.
   Write the changes that need to be made to files to a file in spec/docs-preparation.md
   so that we can automate them later.

3. Add some of the very basic language syntax to the system prompt. Add a tool that the agent
   can use to gather more information. The tools takes a keyword and then produces the content
   of the respective markdown file into the agent's context.
   Write a unit test that proves that the mechanism works.

4. Curate context in such a way that the eval outcome improves as much as possible. Iterate
   step by step, always running `npm run eval` to check the scores. To know what's going on
   in detail, inspect `eval-results/visual-eval-output.json`. Since this is a large file, use
   jq.

   Summarize findings in a file `plan/agent-refinement-findings.md`

Acceptance Criteria:

[ ] We have some basic material from the documentation in agent-consumable form in src/agent/context.
[ ] There is a mechanism with which the agent can request more information, which is then taken from
the above directory.
[ ] Using the evaluation, we can observe that the agent uses the additional context, which
leads to more successful diagramming.
