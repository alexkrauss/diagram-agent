# Sequence Diagrams Benchmark Specification

## Purpose

Test the agent's ability to create sequence diagrams using `shape: sequence_diagram`. Sequence diagrams are used to model interactions between actors (participants) over time, showing the temporal ordering of messages. This benchmark evaluates whether the agent understands:

- How to set up a sequence diagram with `shape: sequence_diagram`
- How to declare and order actors properly
- How to create connections (messages) between actors in the correct temporal order
- How to use spans (activation boxes/lifespans) to show periods of activity
- How to create groups (fragments/frames) to segment the sequence
- How to add self-messages for internal operations
- How to add notes attached to actors
- Understanding that **order matters** in sequence diagrams (unlike other D2 shapes)
- Understanding D2's unique scoping rules for sequence diagrams

## Reference Documentation

The implementation should follow D2 syntax as described in:
- Sequence diagrams documentation: `tmp/d2-docs/docs/tour/sequence-diagrams.md`

Key D2 features for sequence diagrams:
- **Sequence diagram shape**: Set `shape: sequence_diagram` on the parent container
- **Actors**: Declared directly by name or by their first appearance in a connection
- **Messages**: Created via connections (`actor1 -> actor2` or `actor1 <- actor2`)
- **Message ordering**: Order is significant; messages appear in declaration order
- **Spans**: Created by connecting nested objects on actors (e.g., `alice.t1 -> bob`)
- **Groups**: Containers within the sequence diagram that hold connections/messages with a label
- **Notes**: Nested objects on actors with no connections (e.g., `alice."Note text"`)
- **Self-messages**: Messages from an actor to itself (e.g., `alice -> alice`)
- **Scoping**: All children of a sequence diagram share the same scope (actors referenced are the same throughout)

---

## Test Scenarios

### Scenario 1: Simple Actor-to-Actor Messages

**Description**: A basic sequence diagram with two actors exchanging messages

**Request Prompt**:
```
Create a sequence diagram showing the following conversation:
- Two actors: "Alice" and "Bob"
- Message 1: Alice sends to Bob with label "What does it mean to be well-adjusted?"
- Message 2: Bob sends to Alice with label "The ability to play bridge or golf as if they were games."

Messages must appear in this exact order.
```

**Assertions**:
- [ ] `shape: sequence_diagram` is set on the parent
- [ ] Actor "Alice" exists in the diagram
- [ ] Actor "Bob" exists in the diagram
- [ ] Exactly two messages exist
- [ ] First message flows from Alice to Bob
- [ ] First message has label "What does it mean to be well-adjusted?"
- [ ] Second message flows from Bob to Alice
- [ ] Second message has label "The ability to play bridge or golf as if they were games."
- [ ] Messages appear in the specified temporal order
- [ ] The diagram renders without errors

---

### Scenario 2: Sequence Diagram with Spans (Activation Boxes)

**Description**: A sequence diagram showing activation periods where actors are actively participating

**Request Prompt**:
```
Create a sequence diagram showing this exact interaction:
- Three actors: "Alice", "Bob", and "Charlie"
- Message 1: Alice sends to Bob with label "Send request"
- Activation period: Bob is now actively working
- Message 2: During Bob's activation, Bob sends to Charlie with label "Query data"
- Message 3: Charlie sends back to Bob (still activated) with label "Return results"
- Bob's activation period ends
- Message 4: Bob sends to Alice with label "Send response"

Use spans to show Bob's activation period during messages 2 and 3.
```

**Assertions**:
- [ ] `shape: sequence_diagram` is set on the parent
- [ ] Actor "Alice" exists in the diagram
- [ ] Actor "Bob" exists in the diagram
- [ ] Actor "Charlie" exists in the diagram
- [ ] Four messages exist in the diagram
- [ ] Message 1 flows from Alice to Bob with label "Send request"
- [ ] Message 2 flows from Bob to Charlie with label "Query data"
- [ ] Message 3 flows from Charlie to Bob with label "Return results"
- [ ] Message 4 flows from Bob to Alice with label "Send response"
- [ ] Messages 2 and 3 visually show Bob in an activation/active state
- [ ] Messages appear in the specified temporal order (1→2→3→4)
- [ ] The diagram renders with visible activation periods

---

### Scenario 3: Sequence Diagram with Groups

**Description**: A sequence diagram organized into logical sections or interaction phases using groups (fragments/frames)

**Request Prompt**:
```
Create a sequence diagram with the following structure:
- Two actors: "Alice" and "Bob"
- Group 1: Label "Greeting phase"
  - Message: Alice to Bob with label "Hello"
  - Message: Bob to Alice with label "Hi there!"
- Group 2: Label "Business phase"
  - Message: Alice to Bob with label "How's the project?"
  - Message: Bob to Alice with label "Going well!"
- Group 3: Label "Goodbye phase"
  - Message: Bob to Alice with label "Goodbye"

Groups must appear in this exact order. All messages within each group must maintain their specified order.
```

**Assertions**:
- [ ] `shape: sequence_diagram` is set on the parent
- [ ] Actor "Alice" exists in the diagram
- [ ] Actor "Bob" exists in the diagram
- [ ] Three distinct groups exist in the diagram
- [ ] First group has label "Greeting phase"
- [ ] First group contains message from Alice to Bob with label "Hello"
- [ ] First group contains message from Bob to Alice with label "Hi there!"
- [ ] Second group has label "Business phase"
- [ ] Second group contains message from Alice to Bob with label "How's the project?"
- [ ] Second group contains message from Bob to Alice with label "Going well!"
- [ ] Third group has label "Goodbye phase"
- [ ] Third group contains message from Bob to Alice with label "Goodbye"
- [ ] Groups appear in the specified order (Greeting → Business → Goodbye)
- [ ] Messages within each group maintain their specified order
- [ ] Diagram renders with visible group boundaries/frames

---

### Scenario 4: Complex Sequence with Self-Messages, Notes, and Mixed Features

**Description**: A realistic sequence diagram combining multiple sequence diagram features

**Request Prompt**:
```
Create a sequence diagram for an e-commerce checkout flow with this exact sequence:
- Three actors: "Customer", "Website", and "PaymentService"
- Step 1: Customer sends to Website with label "Submit order"
- Step 2: Website sends to itself (self-message) with label "Validate order"
- Step 3: Website sends to PaymentService with label "Request payment"
- Step 4: Add a note on Customer with text "Waiting for confirmation"
- Step 5: PaymentService sends to Website with label "Payment approved"
- Step 6: Website sends to Customer with label "Order confirmed"
- Step 7: Add a note on Website with text "Order complete"

All steps must appear in this exact order. The note in step 4 must appear between steps 3 and 5. The note in step 7 must appear after step 6.
```

**Assertions**:
- [ ] `shape: sequence_diagram` is set on the parent
- [ ] Actor "Customer" exists in the diagram
- [ ] Actor "Website" exists in the diagram
- [ ] Actor "PaymentService" exists in the diagram
- [ ] Six messages exist in the diagram
- [ ] Message 1 flows from Customer to Website with label "Submit order"
- [ ] Message 2 flows from Website to itself with label "Validate order"
- [ ] Message 2 is visually displayed as a self-message (loop/arc)
- [ ] Message 3 flows from Website to PaymentService with label "Request payment"
- [ ] Message 4 flows from PaymentService to Website with label "Payment approved"
- [ ] Message 5 flows from Website to Customer with label "Order confirmed"
- [ ] Note exists on Customer with text "Waiting for confirmation"
- [ ] Note on Customer appears between message 3 and message 4
- [ ] Note exists on Website with text "Order complete"
- [ ] Note on Website appears after message 5
- [ ] All messages appear in the specified temporal order (1→2→3→4→5)
- [ ] Diagram renders with clear message flow and annotations

---

## Key Properties to Assert Across All Scenarios

### Sequence Diagram Setup
- [ ] `shape: sequence_diagram` is set correctly on the parent container
- [ ] No extraneous properties are added to the sequence_diagram unless requested
- [ ] The sequence diagram is at the root level or properly nested if requested

### Actor Management
- [ ] All requested actors appear in the diagram
- [ ] Actor names match the specified names exactly
- [ ] Actors are not duplicated or appear with multiple different names
- [ ] Same actor is consistently referenced throughout the diagram

### Message Ordering
- [ ] All requested messages are present
- [ ] Messages appear in the diagram in the order specified in the request
- [ ] No extraneous messages exist
- [ ] Message flow direction matches the request (from X to Y)
- [ ] Message labels match the specified text exactly

### Spans (Activation Boxes)
- [ ] Activation periods are visually shown when requested
- [ ] Activation spans cover the correct messages/time period
- [ ] Spans show the correct actor as being active

### Groups (Fragments/Frames)
- [ ] All requested groups exist in the diagram
- [ ] Group labels match the specified text exactly
- [ ] Groups contain only their intended messages
- [ ] Groups appear in the specified order
- [ ] Group labels are visible in the diagram

### Self-Messages
- [ ] Self-messages are visually distinct (shown as a loop/arc back to the same actor)
- [ ] Self-messages appear at the correct position in the sequence
- [ ] Self-message labels match the specified text exactly

### Notes
- [ ] All requested notes appear in the diagram
- [ ] Note text matches the specified text exactly
- [ ] Notes are associated with the correct actor
- [ ] Notes appear at the correct position in the temporal sequence

### Syntax and Rendering
- [ ] D2 syntax is valid and parseable
- [ ] Diagram renders without compilation errors
- [ ] All visual elements are correctly positioned

---

## Common Issues to Watch For

1. **Incorrect actor scoping**: Creating multiple instances of the same actor instead of referencing the same one
2. **Message order confusion**: Messages appearing out of order or in a different sequence than specified
3. **Missing actors or messages**: Not including all requested elements
4. **Label mismatches**: Message or group labels not matching the specified text
5. **Note placement errors**: Notes appearing at the wrong position in the sequence
6. **Self-message confusion**: Not recognizing when a message should be from an actor to itself, or not rendering it as a loop
7. **Incomplete sequences**: Missing messages, groups, or notes from the request
8. **Temporal ordering violations**: Declaring messages in a different order than requested
9. **Group structure errors**: Messages appearing in the wrong group or outside groups when they should be inside

---

## Success Criteria

The agent successfully completes this benchmark when:

1. **All four scenarios generate syntactically valid D2 diagrams**
   - Each scenario produces code that can be compiled and rendered by D2
   - No syntax errors or parsing failures

2. **Sequence diagrams render correctly**
   - All diagrams display actors, messages, and interactions
   - Temporal ordering is visually apparent (messages flow from top to bottom)
   - Activation periods and groups are visually distinct

3. **For each scenario, at least 85% of the assertions pass**
   - Scenario 1: Basic message ordering is correct
   - Scenario 2: Spans are properly visualized and ordered
   - Scenario 3: Groups are properly structured and labeled
   - Scenario 4: Complex features (self-messages, notes) are correctly implemented

4. **Critical requirements met**
   - `shape: sequence_diagram` is properly set
   - Message ordering respects the temporal sequence
   - All requested actors, messages, groups, and notes are present
   - Labels match the specified text
   - Visual rendering is correct (self-messages appear as loops, spans show activation, groups show boundaries)

5. **No false negatives or missed requests**
   - All requested actors, messages, and annotations are present
   - No features are omitted or truncated

---

## Error Conditions to Avoid

The agent's output should NOT contain:

- [ ] ❌ Multiple declarations of `shape: sequence_diagram` (only one per diagram)
- [ ] ❌ Messages declared out of the specified temporal order
- [ ] ❌ Missing actors, messages, groups, or notes that were requested
- [ ] ❌ Incorrect message flow directions (from/to swapped)
- [ ] ❌ Label text that doesn't match the specified text
- [ ] ❌ Notes appearing at the wrong position in the sequence
- [ ] ❌ Groups containing the wrong messages
- [ ] ❌ Self-messages that don't loop back to the same actor
- [ ] ❌ Extraneous or unrequested messages, groups, or actors
- [ ] ❌ Malformed connection syntax that prevents rendering
- [ ] ❌ Activation periods that don't cover the correct messages
