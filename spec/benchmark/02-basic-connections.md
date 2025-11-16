# Benchmark: Basic Connections

## Purpose

Test the agent's ability to create connections between shapes in D2 diagrams. This benchmark validates that the agent correctly understands and implements:
- Connection directionality (directed, undirected, bidirectional)
- Connection labels
- Multiple connections in a diagram
- Shape references in connections

---

## Test Scenarios

### Scenario 1: Simple Directional Connections

**User Request:**
> "Create a diagram with a shape labeled 'User' and a shape labeled 'Server'. Create a directed connection from 'User' to 'Server' labeled 'request'. Create a directed connection from 'Server' to 'User' labeled 'response'."

**Properties to Assert:**
- [ ] A shape displays the label "User"
- [ ] A shape displays the label "Server"
- [ ] A directed connection exists from the User shape to the Server shape with label "request"
- [ ] A directed connection exists from the Server shape to the User shape with label "response"
- [ ] No other shapes or connections exist
- [ ] The generated D2 code is valid and parseable

---

### Scenario 2: Bi-Directional and Undirected Connections

**User Request:**
> "Create a diagram with three shapes: 'Primary Database', 'Replica Database', and 'Cache Server'. Create a bidirectional connection between 'Primary Database' and 'Replica Database' labeled 'Replication'. Create an undirected connection between 'Replica Database' and 'Cache Server' labeled 'Sync status'."

**Properties to Assert:**
- [ ] A shape displays the label "Primary Database"
- [ ] A shape displays the label "Replica Database"
- [ ] A shape displays the label "Cache Server"
- [ ] A bidirectional connection exists between Primary Database and Replica Database with label "Replication"
- [ ] An undirected connection exists between Replica Database and Cache Server with label "Sync status"
- [ ] No other shapes or connections exist
- [ ] The generated D2 code is valid and parseable

---

### Scenario 3: Connection Chaining

**User Request:**
> "Create a diagram with three shapes: 'Data Source', 'ETL Processor', and 'Data Lake'. Create two directed connections: from 'Data Source' to 'ETL Processor', and from 'ETL Processor' to 'Data Lake'. Both connections should share the label 'Data flow'."

**Properties to Assert:**
- [ ] A shape displays the label "Data Source"
- [ ] A shape displays the label "ETL Processor"
- [ ] A shape displays the label "Data Lake"
- [ ] A directed connection exists from Data Source to ETL Processor
- [ ] A directed connection exists from ETL Processor to Data Lake
- [ ] Both connections display the label "Data flow"
- [ ] No other shapes or connections exist
- [ ] The generated D2 code is valid and parseable

---

### Scenario 4: Multiple Connections to Same Shape

**User Request:**
> "Create a diagram with five shapes: 'Client', 'API Gateway', 'Auth Service', 'User Service', and 'Database'. Create these connections:
> - From 'Client' to 'API Gateway' labeled 'HTTP'
> - From 'API Gateway' to 'Auth Service' labeled 'Route'
> - From 'API Gateway' to 'User Service' labeled 'Route'
> - From 'Auth Service' to 'Database' labeled 'Query'
> - From 'User Service' to 'Database' labeled 'Query'
> - From 'Database' to 'Auth Service' labeled 'Result'
> - From 'Database' to 'User Service' labeled 'Result'"

**Properties to Assert:**
- [ ] All five shapes exist with the correct labels
- [ ] A directed connection exists from Client to API Gateway labeled "HTTP"
- [ ] A directed connection exists from API Gateway to Auth Service labeled "Route"
- [ ] A directed connection exists from API Gateway to User Service labeled "Route"
- [ ] A directed connection exists from Auth Service to Database labeled "Query"
- [ ] A directed connection exists from User Service to Database labeled "Query"
- [ ] A directed connection exists from Database to Auth Service labeled "Result"
- [ ] A directed connection exists from Database to User Service labeled "Result"
- [ ] All connections have the correct directionality
- [ ] No other shapes or connections exist
- [ ] The generated D2 code is valid and parseable

---

## Success Criteria

A benchmark test passes when:

1. **All requested shapes exist** - Each shape specified in the request is present with the correct label
2. **All requested connections exist** - Each connection specified in the request is present
3. **Connection directionality is correct** - Directed, undirected, and bidirectional connections are implemented as requested
4. **Connection labels are correct** - Each connection displays the exact label specified in the request
5. **No extra elements** - No unexpected shapes or connections are added
6. **Syntax is valid** - The generated D2 code is syntactically correct and parseable

---

## Error Conditions to Avoid

The agent's output should NOT contain:

- [ ] ❌ Invalid D2 syntax that fails to parse
- [ ] ❌ Connections with incorrect directionality
- [ ] ❌ Missing connections that were requested
- [ ] ❌ Connections between shapes that don't exist
- [ ] ❌ Incorrect or missing connection labels
- [ ] ❌ Extra connections that weren't requested
