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
