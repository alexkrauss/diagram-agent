# Benchmark Design Principles

- We specify and test the visual and structural properties of the diagram, but
  not its implementation details (such as: how are labels used, how is the DSL
  formatted).
- The user requests (prompts) should be unambiguous, so that the benchmark is
  stable enough: Do not make the model guess.
