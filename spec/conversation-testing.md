# Conversation Testing Design

This document describes the design philosophy and approach for testing the DiagramAgent using a conversation-style DSL.

## Motivation

Testing an AI agent is fundamentally different from testing traditional software:

1. **Non-determinism**: Agent outputs vary between runs
2. **Partial success**: Some aspects may work while others don't
3. **Continuous improvement**: We want to track progress over time, not just pass/fail
4. **Multi-turn interactions**: Agents maintain state across conversation turns

Traditional unit testing (100% pass required) doesn't fit this model well. We need an approach that supports both **development** (strict pass/fail) and **evaluation** (metrics collection).

## Design Principles

### 1. Separation of Concerns

Test code clearly separates three phases:

```typescript
// ACTION: What we do
await agent.send("Create a diagram...");

// OBSERVATION: What state exists
const canvas = agent.canvas;
const conversation = agent.conversation;

// ASSERTION: What we expect
expect(canvas.content).toContain("...");
```

**Why?** This makes tests readable and makes it clear what's being tested.

### 2. Single Entry Point

All state is accessed through the `agent` parameter:

```typescript
conversation('My test', async (agent) => {
  agent.send(...)           // Actions
  agent.canvas              // Canvas state
  agent.conversation        // Conversation state
  agent.state               // Agent internal state
});
```

**Why?** Simplicity. No confusion about where state comes from.

### 3. Plain Assertions

Tests use standard Vitest assertions, not custom matchers:

```typescript
// Standard assertions
expect(agent.canvas.content).toContain("Web Server");
expect(agent.canvas.elements.length).toBe(3);
expect(agent.conversation.userMessages.length).toBe(2);
```

**Why?** Avoids over-engineering. Standard assertions are sufficient and well-understood.

### 4. Multi-turn Support

Agent instances maintain state across turns in a conversation:

```typescript
conversation("Build incrementally", async (agent) => {
  await agent.send("Create box A");
  expect(agent.canvas.elements).toContain("A");

  await agent.send("Add box B");
  expect(agent.canvas.elements).toContain("A", "B"); // A still exists
});
```

**Why?** Real usage involves multi-turn conversations. Tests must reflect this.

## File-Based Test Organization

Tests are organized by file extension:

### Regular Tests (`.test.ts`)

**Purpose**: Standard unit tests for components, utilities, and non-agent code

**Behavior**:

- Tests fail immediately on assertion errors
- Standard Vitest test runner behavior
- Exit code indicates pass/fail

**How to run**:

```bash
npm test
```

### Evaluation Tests (`.eval.ts`)

**Purpose**: Comprehensive agent evaluation and metrics collection

**Behavior**:

- Assertions are recorded but don't cause test failure
- Metrics computed: pass rate, average score, duration
- Detailed metrics collected in `EvalResults`
- Exit code 0 (success) regardless of assertion results
- Uses the conversation testing DSL

**When to use**: Evaluating agent behavior, model changes, tracking progress over time

**How to run**:

```bash
npm run eval
```

**Why separate evaluation tests?**

Agent evaluation has different needs than unit testing:

- **Non-determinism**: Agent outputs vary between runs
- **Partial success**: Some aspects may work while others don't
- **Continuous improvement**: Track progress over time, not just pass/fail
- **Complete results needed**: You want to know pass rates and which scenarios fail, not just the first error

## API Design

### Core Function: `conversation()`

Wraps a Vitest test with conversation-specific setup:

```typescript
conversation(
  name: string,
  agent: DiagramAgent,
  fn: (agent: AgentWrapper) => Promise<void>
): void
```

**Responsibilities**:

1. Wrap the provided agent instance
2. Provide wrapped agent to test function
3. Handle errors based on mode (strict vs eval)
4. Collect metrics if in eval mode
5. Clean up after test

**Design note**: Tests create and configure their own agent instances, giving them full control over initialization. The harness simply wraps the agent for testing convenience.

### AgentWrapper

Provides testing-friendly interface to DiagramAgent:

```typescript
interface AgentWrapper {
  send(message: string): Promise<void>; // Action
  canvas: CanvasState; // Observation
  conversation: ConversationState; // Observation
  state: AgentState; // Observation
  reset(): void; // Utility
}
```

**Key design choice**: `canvas` and `conversation` are properties (getters), not methods. This makes test code cleaner:

```typescript
agent.canvas.content; // Clean
agent.getCanvas().content; // Verbose
```

### State Objects

#### CanvasState

Represents the diagram at a point in time:

```typescript
interface CanvasState {
  content: string; // Raw D2 code
}
```

**Why this structure?**

- Simple access to raw D2 content for string/regex matching
- Can be extended in the future with parsed structure if needed

#### ConversationState

Represents the conversation history:

```typescript
interface ConversationState {
  messages: ConversationMessage[]; // All messages in chronological order
}
```

**Why this structure?**

- Full history available for inspection
- Tests can filter/query messages as needed using standard array methods

## Metrics and Reporting

Evaluation tests (`.eval.ts` files) automatically collect detailed metrics:

### Per-Conversation Metrics

```typescript
interface EvaluationResult {
  name: string;
  passed: boolean; // Did all assertions pass?
  score: number; // Aggregate score (0-1)
  assertions: AssertionResult[]; // Individual assertion results
  duration: number; // Execution time
  error?: string; // Any uncaught errors
}
```

### Per-Assertion Metrics

```typescript
interface AssertionResult {
  description: string; // What was tested
  passed: boolean; // Did it pass?
  score: number; // Score (0-1)
  reason?: string; // Why it passed/failed
}
```

### Aggregate Report

```typescript
interface EvaluationReport {
  totalConversations: number;
  passedConversations: number;
  passRate: number; // Percentage
  averageScore: number; // 0-1
  conversations: EvaluationResult[];
}
```

**Usage**:

```typescript
// After all tests complete (in eval mode)
const report = EvalResults.generateReport();
console.table(report);
fs.writeFileSync("eval-results.json", JSON.stringify(report, null, 2));
```

## Implementation Strategy

The implementation follows a clear separation:

1. **Test infrastructure** (Vitest integration)

   - Wrap Vitest's `describe()` and `it()`
   - Handle mode detection
   - Manage lifecycle

2. **Agent wrapping** (State management)

   - Wrap provided DiagramAgent instances
   - Provide clean access to state
   - Parse D2 code for structure

3. **Metrics collection** (Eval mode)
   - Intercept assertion failures
   - Record results instead of throwing
   - Generate reports

**Key simplification**: Tests create their own agent instances, eliminating the need for global configuration or factory management.

## Usage Examples

### Simple Evaluation Test

Create a file ending in `.eval.ts`:

```typescript
// src/agent/tests/basic.eval.ts
import { conversation } from "./conversation-testing";
import { createMyAgent } from "../implementations/MyAgent";

function createTestAgent() {
  return createMyAgent({ apiKey: process.env.OPENAI_API_KEY, model: "gpt-4o" });
}

conversation("Create basic diagram", createTestAgent, async (agent) => {
  await agent.send("Create boxes A and B");
  expect(agent.canvas.content).toContain("A");
  expect(agent.canvas.content).toContain("B");
});
```

Run with: `npm run eval`

### Multi-Turn Evaluation

```typescript
// src/agent/tests/incremental.eval.ts
conversation("Build incrementally", createTestAgent, async (agent) => {
  await agent.send("Create Web Server");
  expect(agent.canvas.content).toContain("Web Server");

  await agent.send("Add Database");
  expect(agent.canvas.content).toContain("Web Server");
  expect(agent.canvas.content).toContain("Database");
});
```

### Organized Evaluation Suite

```typescript
// src/agent/tests/architecture.eval.ts
import { describe } from "vitest";

describe("DiagramAgent - Architecture Diagrams", () => {
  conversation("Three-tier architecture", createTestAgent, async (agent) => {
    await agent.send("Create a three-tier architecture");
    expect(agent.canvas.content).toContain("Frontend");
  });

  conversation("Microservices", createTestAgent, async (agent) => {
    await agent.send("Create a microservices diagram");
    const messages = agent.conversation.messages;
    expect(messages.length).toBeGreaterThan(0);
  });
});
```

### State Comparison

```typescript
conversation("Validate changes", createTestAgent, async (agent) => {
  await agent.send("Create A");
  const contentBefore = agent.canvas.content;

  await agent.send("Add B");
  const contentAfter = agent.canvas.content;

  expect(contentAfter).toContain("B");
  expect(contentAfter.length).toBeGreaterThan(contentBefore.length);
});
```
