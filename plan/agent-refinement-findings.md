# Agent refinement findings

## Iterations

- Run 1 (basic context + tool): Scenario 2/7 (28.6%), Turn 16/28 (57.1%), Criteria 80/112 (71.4%).
- Run 2 (added sequence/sql/uml context docs): Scenario 3/7 (42.9%), Turn 16/28 (57.1%), Criteria 82/112 (73.2%).
- Run 3 (prompt tightened to forbid Mermaid and added sequence/UML/SQL hints): Scenario 3/7 (42.9%), Turn 21/28 (75.0%), Criteria 97/112 (86.6%).

Note: One Run 3 attempt timed out in eval:exec; a retry completed successfully.

## Suite results (Run 3)

- Simple Shapes and Labels: 9/9 criteria
- Basic Styling: 10/10 criteria
- SQL Tables and Entity-Relationship Diagrams: 13/13 criteria
- Basic Connections: 17/18 criteria
- Containers with Nesting: 18/22 criteria
- UML Class Diagrams: 17/21 criteria
- Sequence Diagrams: 13/19 criteria

## Remaining misses (Run 3)

- Containers: missing top-level labels or unexpected containers/connections in some tests.
- Connections: one bidirectional labeled connection missed.
- UML: visibility modifiers and a protected method still missing in one case.
- Sequence: activation spans and note placement/ordering not fully satisfied in a few prompts.
