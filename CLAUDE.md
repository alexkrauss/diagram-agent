# Agent instructions

## Project Overview

This is a React-based web application that provides an interactive UI for an AI agent that generates and modifies D2 diagrams. The agent uses OpenAI's GPT models with function calling to understand user requests and generate D2 diagram DSL code.

## Development Commands

- **Typecheck and tests**: `npm run check` (Mandatory: always run this before declaring work as complete!)
- **Start development server**: `npm run dev`
- **Build for production**: `npm run build` (runs TypeScript compiler then Vite build)
- **Run the benchmark**: `npm run eval` (needs openai key and gemini key in environment variable)

## Architecture

### Core Components

- **App.tsx**: Main UI component containing:
  - API key input
  - User request textarea
  - Agent execution log display
  - D2 canvas output display
  - Handles agent instantiation and event processing

- **src/agent/**: Core agent implementation
  - **D2Agent.ts**: Main agent class implementing agentic loop
    - Manages conversation with OpenAI API
    - Executes tool calls
    - Maintains canvas state
    - Emits events for UI updates
  - **types.ts**: TypeScript interfaces for messages, tools, and agent configuration
  - **tools.ts**: Tool definitions (currently only `replace_canvas` tool)
  - **index.ts**: Exports and default system prompt defining agent behavior and D2 syntax

### Agent Loop Pattern

The D2Agent implements a standard agentic loop:

1. Initialize messages with system prompt and user request
2. Call OpenAI API with available tools
3. If response contains tool calls, execute them and continue loop
4. If response has no tool calls, agent is done
5. Maximum 10 iterations (configurable via `maxIterations`)

### Event System

The agent emits events through a callback for UI updates:

- `log`: General logging messages
- `tool_call`: When executing a tool
- `canvas_update`: When D2 diagram content changes
- `error`: When errors occur
- `complete`: When agent finishes successfully

### Tech Stack

- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- OpenAI API for LLM capabilities
- Strict TypeScript configuration enabled
- We use functional separation of packages (source folders), not technical. Example: config/, ui/, agent/ instead of components/, hooks/.

## Evaluations

The evaluation has three parts, explained in detail in spec/agent-testing.md:

- Execution part (`npm run eval:exec`): Runs the agent on the evaluation suite
- Judge part (`npm run eval:judge`): Runs a judge LLM on the result and checks criteria
- Report part (`rpm run eval:report`): Produces HTML report and computes scores.

<!-- BACKLOG.MD MCP GUIDELINES START -->

<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for all task and project management activities.

**CRITICAL GUIDANCE**

- If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
- If your client only supports tools or the above request fails, call `backlog.get_workflow_overview()` tool to load the tool-oriented overview (it lists the matching guide tools).

- **First time working here?** Read the overview resource IMMEDIATELY to learn the workflow
- **Already familiar?** You should have the overview cached ("## Backlog.md Overview (MCP)")
- **When to read it**: BEFORE creating tasks, or when you're unsure whether to track work

These guides cover:
- Decision framework for when to create tasks
- Search-first workflow to avoid duplicates
- Links to detailed guides for task creation, execution, and completion
- MCP tools reference

You MUST read the overview resource to understand the complete workflow. The information is NOT summarized here.

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->
