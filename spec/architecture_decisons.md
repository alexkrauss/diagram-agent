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
