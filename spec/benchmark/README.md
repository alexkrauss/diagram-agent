# D2 Agent Benchmark Suite

This directory contains the benchmark specifications for testing the D2 diagram generation agent. The benchmarks are organized into two tiers based on complexity and common usage patterns.

## Overview

The benchmark suite tests the agent's ability to generate D2 diagram DSL code from natural language requests. Each benchmark specification includes:
- **Purpose**: What capability is being tested
- **Test Scenarios**: Specific diagram requests with varying complexity
- **Properties to Assert**: Validation criteria for the generated D2 code
- **Success Criteria**: Clear pass/fail conditions

## Benchmark Organization

### Tier 1: Core Basics (Must Have)
These test fundamental D2 features that are essential for any diagram.

- **[01 - Simple Shapes and Labels](./01-simple-shapes-and-labels.md)**
  - Tests basic shape declarations with custom labels
  - Validates implicit vs explicit label syntax
  - Verifies shape key vs label distinction

- **[02 - Basic Connections](./02-basic-connections.md)**
  - Tests directional arrows (`->`, `<-`, `<->`)
  - Validates undirected connections (`--`)
  - Tests connection labels and chaining

- **[03 - Containers with Nesting](./03-containers-with-nesting.md)**
  - Tests hierarchical container structures
  - Validates nested syntax and dot notation
  - Tests cross-container connections and parent references

- **[04 - Basic Styling](./04-basic-styling.md)**
  - Tests fill and stroke colors
  - Validates stroke-width and stroke-dash
  - Tests font styling properties

### Tier 2: Common Use Cases (High Priority)
These test specialized diagram types and features commonly used in production.

- **[05 - Component Diagrams](./05-component-diagrams.md)**
  - Tests software architecture diagrams
  - Validates nested components with connections
  - Tests realistic 3-tier, microservices, and cloud architectures

- **[06 - Sequence Diagrams](./06-sequence-diagrams.md)**
  - Tests temporal interaction diagrams
  - Validates actors, messages, spans (activation boxes)
  - Tests groups (fragments), notes, and self-messages

- **[07 - SQL Tables](./07-sql-tables.md)**
  - Tests entity-relationship diagrams
  - Validates column types and constraints (PK, FK, UNQ)
  - Tests foreign key relationships between tables

- **[08 - UML Classes](./08-uml-classes.md)**
  - Tests UML class diagrams
  - Validates fields, methods, and visibility modifiers
  - Tests inheritance and relationships between classes

- **[09 - Icons and Images](./09-icons-and-images.md)**
  - Tests icon integration in diagrams
  - Validates icon placement (containers vs non-containers)
  - Tests standalone images with `shape: image`

- **[10 - Multi-line Text and Markdown](./10-multiline-text-and-markdown.md)**
  - Tests markdown text blocks
  - Validates code blocks with syntax highlighting
  - Tests LaTeX mathematical notation

## Running the Benchmarks

### Manual Testing
1. Read a benchmark specification file
2. Use the agent to generate D2 code for each test scenario
3. Validate the generated code against the properties to assert
4. Check success criteria for pass/fail determination

### Automated Testing (Future)
The benchmark specifications are designed to be machine-readable and could be integrated into an automated test suite that:
1. Parses the test scenarios
2. Sends requests to the agent
3. Validates generated D2 code against assertions
4. Reports success rates and failures

## Validation Strategy

Each benchmark uses a consistent validation approach:

1. **Structural Validation**: Check D2 syntax is correct and parseable
2. **Semantic Validation**: Verify the diagram represents the requested concept
3. **Property Validation**: Assert specific D2 properties are present and correct
4. **Quality Validation**: Ensure labels, naming, and organization are clear

## Success Metrics

- **Per-Benchmark**: Minimum 85% of assertions must pass
- **Critical Requirements**: All critical assertions must pass (varies by benchmark)
- **Overall Suite**: All benchmarks in Tier 1 must pass; ≥80% of Tier 2 must pass

## Documentation Reference

All benchmarks reference the official D2 documentation cloned at `../../tmp/d2-docs/`. Key documentation files:
- `docs/tour/shapes.md` - Shape types and properties
- `docs/tour/connections.md` - Connection syntax and arrowheads
- `docs/tour/containers.md` - Nesting and hierarchy
- `docs/tour/style.md` - Styling properties
- `docs/tour/sequence-diagrams.md` - Sequence diagram rules
- `docs/tour/sql-tables.md` - SQL table syntax
- `docs/tour/uml-classes.md` - UML class syntax
- `docs/tour/icons.md` - Icon and image handling
- `docs/tour/text.md` - Text, markdown, and code blocks

## Contributing

When adding new benchmarks:
1. Follow the established format from existing benchmarks
2. Include clear test scenarios with expected outputs
3. Define specific, testable assertions
4. Provide success criteria
5. Number the file sequentially (11-, 12-, etc.)
6. Update this README with the new benchmark

## Exclusions

The following D2 features are explicitly excluded from the current benchmark suite:
- Advanced grid diagrams
- Complex glob patterns and filters
- Composition (layers, scenarios, steps)
- Variables and imports
- Custom themes
- Position keywords and manual layout
- Interactive features (tooltips, links)

These may be added in future tiers as needed.
