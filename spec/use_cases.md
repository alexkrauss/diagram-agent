# Use Cases

## Core Diagram Creation

**US-001: Create diagram from text description**

- As a user, I can describe a diagram in natural language and have the agent generate the corresponding D2 diagram, so I can quickly visualize my ideas without learning the DSL syntax.

**US-002: Iteratively refine diagram**

- As a user, I can request modifications to an existing diagram through conversational prompts (e.g., "make box A bigger", "change the color", "add a connection between X and Y"), so I can fine-tune the visualization without manual code editing.

**US-003: Recreate diagram from image**

- As a user, I can paste an image of an existing diagram and have the agent analyze and recreate it in D2 DSL, so I can convert diagrams from other tools into editable D2 format.

## Configuration

**US-004: Configure API key**

- As a user, I can input my own API key for supported LLM providers, so I can use the app without account creation or subscription fees.

**US-005: Select LLM model**

- As a user, I can choose between different LLM providers and models, so I can use my preferred model or switch based on performance/cost considerations.

## Export and Persistence

**US-006: Export diagram as image**

- As a user, I can export my diagram as SVG or PNG format, so I can use it in documentation, presentations, or other materials.

**US-007: Access D2 source code**

- As a user, I can view and copy the generated D2 DSL code, so I can save it to files or further edit it manually if needed.

**US-008: Store diagrams in browser**

- As a user, I can save my diagrams in browser local storage, so I can return to previous work without managing external files.

## Agent Transparency

**US-009: View agent reasoning**

- As a user, I can see the agent's execution log and actions, so I understand what the agent is doing and can debug issues if the output isn't as expected.

**US-010: Agent self-correction**

- As a user, the agent can see its own diagram output and automatically correct mistakes, so I get better results without multiple manual iterations.

## Diagram Types and Quality

**US-011: Create architecture diagrams**

- As a software architect, I can create system architecture diagrams showing components, services, and their relationships, so I can document and communicate system design.

**US-012: Create flowcharts**

- As a developer, I can create flowcharts showing process flows and decision points, so I can document algorithms and business logic.

**US-013: Create sequence diagrams**

- As a developer, I can create sequence diagrams showing interactions between components over time, so I can document API flows and system behaviors.

**US-014: Proper sequence diagram layout**

- As a user creating sequence diagrams, the agent generates diagrams with correct temporal ordering (top-to-bottom flow) and proper actor/participant positioning, so the diagram accurately represents the interaction timeline.

**US-015: Hierarchical structure support**

- As a user, I can create diagrams with nested containers and grouped elements (boxes within boxes), so I can represent hierarchical relationships like packages, modules, or organizational structures.

**US-016: Consistent styling**

- As a user, I receive diagrams with consistent and professional styling (colors, shapes, fonts), so the output looks polished without manual styling adjustments.

**US-017: Automatic layout optimization**

- As a user, the agent generates diagrams with good automatic layout that minimizes edge crossings and maintains readability, so I don't need to manually adjust positioning for diagrams up to ~30 elements.

**US-018: Connection labels and annotations**

- As a user, I can have labeled connections and annotations on diagram elements, so I can document relationships, protocols, or other important details directly on the diagram.
