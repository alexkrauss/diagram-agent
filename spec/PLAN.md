# Implementation Plan: Conversation Testing Harness

**Status**: Types defined, implementation pending

**Context**: This document contains the concrete implementation plan for the conversation testing DSL. It will be discarded once implementation is complete. For permanent design documentation, see `conversation-testing.md`.

## Current State

✅ **Complete**:
- Type definitions in `src/agent/tests/conversation-testing.ts`
- Example tests in `src/agent/tests/example.test.ts`
- Design documentation in `spec/conversation-testing.md`

⏳ **Pending**:
- Implementation of conversation testing harness
- D2 parsing for canvas state
- Metrics collection for eval mode

## Implementation Tasks

### Phase 1: Core Infrastructure

#### Task 1.1: AgentWrapper Implementation

**File**: `src/agent/tests/conversation-testing.ts`

**Responsibilities**:
- Wrap DiagramAgent instance
- Implement `send()` method that calls agent and waits for completion
- Implement `canvas` getter that returns current canvas state
- Implement `conversation` getter that returns conversation history
- Implement `state` getter that returns agent state
- Implement `reset()` method

**Implementation notes**:
- Need to handle async completion of agent.sendMessage()
- Agent events may be useful for detecting when agent is done
- May need to poll agent state or use event callbacks

**Dependencies**: Requires concrete DiagramAgent implementation

---

#### Task 1.2: CanvasState Implementation

**File**: `src/agent/tests/conversation-testing.ts`

**Responsibilities**:
- Parse D2 code to extract elements and connections
- Implement `diff()` method to compare states
- Populate all readonly properties

**Implementation notes**:
- D2 parsing can be basic initially (regex-based)
- Elements: lines like `name:` or `name {`
- Connections: lines with `->` or `--`
- Full D2 parser not needed for MVP

**Parsing strategy**:
```typescript
function parseD2(code: string): { elements: string[], connections: Connection[] } {
  const lines = code.split('\n');
  const elements: string[] = [];
  const connections: Connection[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Element: "Name:" or "Name {"
    if (/^(\w+):\s*/.test(trimmed) || /^(\w+)\s*{/.test(trimmed)) {
      const match = trimmed.match(/^(\w+)/);
      if (match) elements.push(match[1]);
    }

    // Connection: "A -> B" or "A -- B"
    if (/->|--/.test(trimmed)) {
      const match = trimmed.match(/(\w+)\s*(->|--)\s*(\w+)/);
      if (match) {
        connections.push({
          from: match[1],
          to: match[3],
          type: match[2],
        });
      }
    }
  }

  return { elements, connections };
}
```

---

#### Task 1.3: ConversationState Implementation

**File**: `src/agent/tests/conversation-testing.ts`

**Responsibilities**:
- Wrap agent.getConversationHistory()
- Implement filtered views (userMessages, assistantMessages, canvasUpdates)
- Implement convenience accessors (last, lastUser, lastAssistant, lastCanvas)
- Implement search methods (find, findAll)

**Implementation notes**:
- Most properties are derived from `messages` array
- Use array methods for filtering and searching
- Cache computed values if performance becomes an issue

---

#### Task 1.4: conversation() Function

**File**: `src/agent/tests/conversation-testing.ts`

**Responsibilities**:
- Integrate with Vitest (wrap `describe()` and `it()`)
- Wrap the provided agent instance
- Call test function with AgentWrapper
- Handle errors based on mode (strict vs eval)
- Record results if in eval mode
- Clean up agent after test

**Implementation structure**:
```typescript
export function conversation(
  name: string,
  agent: DiagramAgent,
  fn: (agent: AgentWrapper) => Promise<void>
): void {
  describe(name, () => {
    it('completes conversation', async () => {
      // Wrap the provided agent
      const wrappedAgent = new AgentWrapperImpl(agent);

      // Execute test
      try {
        await fn(wrappedAgent);

        // In eval mode: record success
        if (isEvalMode()) {
          EvalResults.record(name, { passed: true, ... });
        }
      } catch (error) {
        // In strict mode: re-throw
        if (!isEvalMode()) {
          throw error;
        }

        // In eval mode: record failure
        EvalResults.record(name, { passed: false, error, ... });
      }
    });
  });
}
```

**Key simplification**: The test creates and provides the agent, eliminating the need for configuration management.

---

### Phase 2: Eval Mode Support

#### Task 2.1: Assertion Recording

**File**: `src/agent/tests/conversation-testing.ts`

**Responsibilities**:
- Intercept assertion failures in eval mode
- Record each assertion result
- Continue execution after failures

**Implementation approach**:
Wrap the test function execution in a try-catch that captures assertion errors:

```typescript
const recorder = new AssertionRecorder();

try {
  await fn(agentWithRecorder);
} catch (error) {
  if (isEvalMode() && isAssertionError(error)) {
    recorder.recordFailure(error);
    // Don't re-throw in eval mode
  } else {
    throw error;
  }
}
```

**Challenge**: Vitest assertion errors stop execution. We need to either:
1. Wrap each assertion call (complex)
2. Use domain-specific expect() wrapper (cleaner)
3. Accept that eval mode runs until first error (acceptable for MVP)

**Recommendation**: Option 3 for MVP - record partial results, then error

---

#### Task 2.2: EvalResults Implementation

**File**: `src/agent/tests/conversation-testing.ts`

**Responsibilities**:
- Store results from all conversations
- Generate aggregate metrics
- Produce reports in various formats

**Implementation**:
```typescript
class EvalResultsImpl {
  private static results: EvaluationResult[] = [];

  static record(name: string, result: EvaluationResult): void {
    this.results.push(result);
  }

  static getAll(): EvaluationResult[] {
    return [...this.results];
  }

  static generateReport(): EvaluationReport {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;

    return {
      totalConversations: total,
      passedConversations: passed,
      passRate: passed / total,
      averageScore: this.results.reduce((sum, r) => sum + r.score, 0) / total,
      conversations: this.results,
    };
  }

  static clear(): void {
    this.results = [];
  }
}
```

---

#### Task 2.3: Report Generation

**File**: New file `src/agent/tests/report-generator.ts`

**Responsibilities**:
- Format evaluation results for human consumption
- Export to JSON, Markdown, CSV
- Generate summary statistics

**Integration**:
Hook into Vitest's `afterAll()`:

```typescript
// In conversation-testing.ts
import { afterAll } from 'vitest';

if (isEvalMode()) {
  afterAll(() => {
    const report = EvalResults.generateReport();

    // Console output
    console.log('\n=== Evaluation Results ===');
    console.log(`Pass Rate: ${(report.passRate * 100).toFixed(1)}%`);
    console.log(`Average Score: ${report.averageScore.toFixed(2)}`);

    // File output
    fs.writeFileSync('eval-results.json', JSON.stringify(report, null, 2));
    console.log('\nDetailed results written to eval-results.json');
  });
}
```

---

### Phase 3: Polish and Documentation

#### Task 3.1: Error Messages

Improve error messages for common mistakes:
- Agent is not properly instantiated → Clear message about implementation
- Invalid D2 code → Helpful message about what's wrong
- Assertion failures in eval mode → Helpful context

#### Task 3.2: Type Exports

Ensure all types are properly exported for external use:
```typescript
export type {
  AgentWrapper,
  CanvasState,
  ConversationState,
  Connection,
  CanvasDiff,
  EvaluationResult,
  EvaluationReport,
  AssertionResult,
};
```

#### Task 3.3: Usage Documentation

Create `src/agent/tests/README.md` with:
- How to create agent instances for tests
- How to write conversation tests
- How to run in strict vs eval mode
- How to interpret results

---

## Implementation Order

**Recommended sequence**:

1. **Start with Phase 1, Tasks 1.1-1.3** (Core wrappers)
   - Implement AgentWrapper
   - Implement CanvasState with basic D2 parsing
   - Implement ConversationState

2. **Phase 1, Task 1.4** (conversation function)
   - Wire up with Vitest
   - Support strict mode only initially

3. **Test with example.test.ts**
   - Create a concrete agent implementation or mock
   - Verify tests run
   - Debug issues

4. **Phase 2** (Eval mode)
   - Add metrics collection
   - Add report generation

5. **Phase 3** (Polish)
   - Improve error messages
   - Complete documentation

---

## Testing the Implementation

### Verification Steps

1. **Type checking**:
   ```bash
   npx tsc --noEmit
   ```
   Should pass with no errors.

2. **Example test (will fail until agent implementation is provided)**:
   ```bash
   npm test src/agent/tests/example.test.ts
   ```
   Should fail with "not implemented" errors initially.

3. **After implementation**:
   ```bash
   npm test src/agent/tests/example.test.ts
   ```
   Should run tests (may pass or fail depending on agent quality).

4. **Eval mode**:
   ```bash
   EVAL_MODE=true npm test src/agent/tests/example.test.ts
   ```
   Should generate eval-results.json.

---

## Dependencies

### Required

- Concrete DiagramAgent implementation (not yet available)
  - Tests will create instances directly
  - No factory pattern needed
- Vitest (already installed)
- TypeScript (already installed)

### Optional

- Better D2 parser (for more accurate element/connection extraction)
- D2 CLI (for rendering validation in future)
- Image comparison library (for visual regression testing in future)

---

## Known Limitations

1. **Basic D2 parsing**: Initial parsing is regex-based, may miss complex structures
2. **Single assertion failure in eval mode**: First assertion stops execution
3. **No rendering validation**: Canvas validation is text-based only
4. **No parallelization**: Conversations run sequentially

These are acceptable for MVP and can be improved iteratively.

---

## Success Criteria

Implementation is complete when:

- ✅ All types are implemented (not just defined)
- ✅ example.test.ts runs without TypeScript errors
- ✅ Tests fail with meaningful errors about missing agent implementation
- ✅ Strict mode works: tests fail fast on errors
- ✅ Eval mode works: tests collect metrics and generate reports
- ✅ Documentation is complete and clear

---

## Next Steps After Implementation

1. **Integrate with real agent implementation**
2. **Add more test scenarios**
3. **Improve D2 parsing accuracy**
4. **Add rendering validation**
5. **Create CI/CD integration**
6. **Track metrics over time**

---

**Note**: This PLAN.md file should be deleted once implementation is complete. The permanent documentation is in `spec/conversation-testing.md`.
