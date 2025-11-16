# Benchmark: Simple Shapes and Labels

## Purpose

This benchmark tests the agent's ability to create basic shapes with different labels in D2 diagrams. It focuses on fundamental shape declaration patterns and label assignment.

The tests verify that the agent understands:
- How to create shapes with specific labels
- How to use multiple shapes in a single diagram
- Basic shape types and their properties

---

## Test Scenarios

### Test Case 1: Simple Diagram with Two Shapes

**User Request:**
> "Create a diagram with two shapes: one labeled 'Frontend App' and one labeled 'Backend Server'"

**Properties to Assert:**
- [ ] Exactly two shapes are declared
- [ ] A shape displays the label "Frontend App"
- [ ] A shape displays the label "Backend Server"
- [ ] Both shapes are default type (rectangle)
- [ ] No connections or relationships exist between shapes
- [ ] The generated D2 code is valid and parseable

---

### Test Case 2: Three Shapes with Different Labels

**User Request:**
> "Create a diagram with three shapes labeled: 'database', 'API Server', and 'UI Client'"

**Properties to Assert:**
- [ ] Exactly three shapes are declared
- [ ] A shape displays the label "database"
- [ ] A shape displays the label "API Server"
- [ ] A shape displays the label "UI Client"
- [ ] All shapes use default rectangle type
- [ ] No connections or relationships exist between shapes
- [ ] The generated D2 code is valid and parseable

---

### Test Case 3: Multiple Services with Descriptive Labels

**User Request:**
> "Create a diagram with these services: 'Redis Cache', 'Cloud Storage', and 'queue'"

**Properties to Assert:**
- [ ] Exactly three shapes are declared
- [ ] A shape displays the label "Redis Cache"
- [ ] A shape displays the label "Cloud Storage"
- [ ] A shape displays the label "queue"
- [ ] All shapes are default type (rectangle)
- [ ] No connections or relationships exist between shapes
- [ ] The generated D2 code is valid and parseable

---

## Success Criteria

A benchmark test passes when:

1. **All requested shapes are present** - The diagram contains exactly the number of shapes requested
2. **Labels are correct** - Each shape displays the exact label specified in the request
3. **Syntax is valid** - The generated D2 code is syntactically correct and parseable
4. **No extra elements** - No unexpected connections, styling, or other diagram elements are added
5. **Output is minimal** - The agent produces only what was requested without unnecessary complexity

---

## Error Conditions to Avoid

The agent's output should NOT contain:

- [ ] ❌ Invalid D2 syntax that fails to parse
- [ ] ❌ Unrelated connections or relationships between shapes (unless requested)
- [ ] ❌ Shape type declarations unless explicitly requested
- [ ] ❌ Duplicate shape declarations
- [ ] ❌ Incorrect labels that don't match the request
- [ ] ❌ Missing shapes that were requested
