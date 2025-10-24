# Architecture Decision Record

## Template

### DECISION SUMMARY (YYYY-MM-DD)

Decision Details (one paragraph)

**Rationale:** The reasoning that leads to the decision. This will help readers
understand if any assumptions for the decision may have changed.

## Decisions

### Self-contained in-browser app.

The diagramming tools runs completely in the browser and does not rely on
a server component.

**Rationale**:

- Easy to use for anybody.
- No hosting costs, scales immediately.
- Users bring their own API key for models.

### Diagramming Language D2

We start with D2 as a language, as it seems most modern, produces nices graphs
and is able to run in a browser (via WASM).

**Rationale**:

- mostry a question of taste. This can be changed.
- start with one thing. May add others later.

### Choice of agent toolkit: OpenAI Agent SDK

The original idea was that the agent SDK should make it easier to build an agent loop.
Still, currently, the agent component must maintain its own state (the conversation history),
which means that we do not really earn much from using that library.

When to reconsider?

- When we run into problems
- When we want to work with other models.

### Conversation Testing Design

We use a custom setup built on vitest to systematically evaluate the agent on multi-turn conversations.

The design principles are:

- **Don't fail fast, but create a full report**. Even if some assertions in the suite fail, we want to complete the full suite and have a comprehensive report.
- **Built on top of vitest**. We (ab)use vitest here for our eval suite, but these are different from tests.
  We use the extension `.eval.ts` for these, and run them with `npm run eval`, using a special vitest config.
- **Internal DSL to model testing of conversations**. Each convensation has a separate agent. Tests can send messages
  to the agent and use standard vitest `expect`s to express assertions. Wrappers around the agend and the `expect`
  method capture events and store them as part of vitest metadata.
- **Custom HTML reporter** to produce a nice rendered evaluation report from that metadata.

See src/agent/tests/example.eval.ts for an example that shows how to write evaluations.

**Rationale**:

- We haven't found any existing framework to handle this well and support nicely written evaluation files. promptfoo
  turned out to be a disaster and there are few other frameworks in typescript. Other languages produce too much overhead.

When to reconsider?

- When we need more specific evaluation tools, such as statistical stuff or special metrics that are present in
  frameworks but hard to add here.
