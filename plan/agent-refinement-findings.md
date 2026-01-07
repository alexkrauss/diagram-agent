# Agent refinement findings

## Iterations

- Run 1 (basic context + tool): Scenario 2/7 (28.6%), Turn 16/28 (57.1%), Criteria 80/112 (71.4%).
- Run 2 (added sequence/sql/uml context docs): Scenario 3/7 (42.9%), Turn 16/28 (57.1%), Criteria 82/112 (73.2%).
- Run 3 (prompt tightened to forbid Mermaid and added sequence/UML/SQL hints): Scenario 3/7 (42.9%), Turn 21/28 (75.0%), Criteria 97/112 (86.6%).
- Run 4 (context + prompt refinements for containers/sequence/styles/UML): Scenario 2/7 (28.6%), Turn 22/28 (78.6%), Criteria 105/114 (92.1%).

Note: One Run 3 attempt timed out in eval:exec; a retry completed successfully.

## Suite results (Run 4)

- Simple Shapes and Labels: 9/9 criteria
- Basic Styling: 9/10 criteria
- SQL Tables and Entity-Relationship Diagrams: 13/13 criteria
- Basic Connections: 17/18 criteria
- Containers with Nesting: 20/22 criteria
- UML Class Diagrams: 19/21 criteria
- Sequence Diagrams: 18/21 criteria

## Remaining misses (Run 4)

- Containers: sibling containers and container labels occasionally not recognized in visual judge.
- Connections: bidirectional labeled connection still missed in one test.
- UML: visibility modifiers flagged as missing in one test.
- Sequence: basic actor-to-actor sequence still output as non-sequence syntax in one test.
- Styling: font color criteria missed in one test.

## Iteration 5 (2026-01-07)

### Observations

**High variance in eval results:** Running the same eval multiple times produces significantly different results (82-95% criteria success). This makes optimization difficult to measure.

| Run | Criteria | Rate |
|-----|----------|------|
| Baseline | 108/114 | 94.7% |
| After changes #1 | 107/114 | 93.9% |
| After changes #2 | 94/114 | 82.5% |
| After changes #3 | 106/114 | 93.0% |
| After changes #4 | 105/114 | 92.1% |
| After changes #5 | 101/114 | 88.6% |
| After changes #6 | 99/114 | 86.8% |

**Average after changes: ~102/114 (89.5%)**

### Context changes made

1. **UML visibility (uml-classes.md + system_prompt.md)**
   - Clarified that omitting visibility prefix means default (package), NOT public
   - Added explicit Employee class example showing `+name`, `-salary`, `\#department`, and `employeeId` (no prefix)
   - Updated system prompt to list all visibility prefixes explicitly

2. **Bidirectional connections (connections.md + system_prompt.md)**
   - Added bullet list explaining `->` (directed), `<->` (bidirectional), `--` (undirected)
   - Added labeled example: `Primary Database <-> Replica Database: Replication`
   - Updated system prompt to distinguish bidirectional from undirected

3. **Sibling containers (containers.md)**
   - Added explicit "Sibling containers" section with example
   - Showed `christmas` and `birthdays` as separate top-level blocks
   - Demonstrated cross-sibling connection using full paths

### Consistent failure patterns

These failures appear across most runs:
- **Bidirectional connection** - Agent uses `->` instead of `<->` for bidirectional
- **UML default visibility** - Agent adds `+` prefix when it should be omitted
- **Sibling containers** - Visual layout not recognized as "same level" by judge

### High-variance failure patterns

These failures appear intermittently:
- Sequence diagrams - sometimes pass completely, sometimes fail multiple criteria
- Container Labels test - sometimes passes, sometimes fails all criteria
- Styling font tests - occasionally fail

### Hypotheses for limited improvement

1. **LLM reliability** - GPT-4o doesn't consistently follow context even when retrieved
2. **Context retrieval** - Agent doesn't always call `get_d2_context` before generating diagrams
3. **Visual judge variance** - The vision-based evaluation may have its own variance
4. **Baseline was outlier** - The initial 94.7% run may have been unusually good

### Recommendations

1. **Reduce variance** - Run multiple evals and average, or set temperature=0
2. **Force context loading** - Consider preloading relevant context in system prompt
3. **Simplify tests** - Break complex tests into smaller, more focused criteria
4. **Investigate judge** - Check if visual judge introduces additional variance
