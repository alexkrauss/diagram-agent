# Benchmark: Containers with Nesting

## Purpose

Test the agent's ability to create and manage nested container structures in D2 diagrams. This benchmark verifies that the agent correctly understands container hierarchies and how to reference elements across different nesting levels.

---

## Test Scenarios

### Scenario 1: Simple Container with Child Shapes

**User Request:**
> "Create a diagram with a container labeled 'server' that contains two child shapes: 'web' and 'database'."

**Properties to Assert:**
- [ ] A container displays the label "server"
- [ ] A shape labeled "web" exists as a child of the server container
- [ ] A shape labeled "database" exists as a child of the server container
- [ ] Both child shapes are visually contained within the server container
- [ ] No connections exist
- [ ] The generated D2 code is valid and parseable

---

### Scenario 2: Multi-Level Nesting with Connections

**User Request:**
> "Create a diagram with a container labeled 'clouds'. Inside 'clouds', create two containers: 'aws' and 'gcloud'. Inside 'aws', create shapes 'load_balancer' and 'api', and inside 'gcloud', create shape 'auth'. Also inside 'clouds' at the same level as 'aws' and 'gcloud', create a shape 'db'. Create these connections: from 'load_balancer' to 'api', from 'api' to 'db', from 'auth' to 'db', and from 'gcloud' to 'aws'."

**Properties to Assert:**
- [ ] A container labeled "clouds" exists at the top level
- [ ] Containers labeled "aws" and "gcloud" exist as children of clouds
- [ ] Shape labeled "load_balancer" exists as a child of aws
- [ ] Shape labeled "api" exists as a child of aws
- [ ] Shape labeled "auth" exists as a child of gcloud
- [ ] Shape labeled "db" exists as a child of clouds (sibling to aws and gcloud)
- [ ] A connection exists from load_balancer to api
- [ ] A connection exists from api to db
- [ ] A connection exists from auth to db
- [ ] A connection exists from gcloud to aws
- [ ] All nesting relationships are correct (3 levels deep)
- [ ] The generated D2 code is valid and parseable

---

### Scenario 3: Container Labels

**User Request:**
> "Create a diagram with a container labeled 'clouds'. Inside 'clouds', create two containers: one labeled 'Amazon Web Services' and one labeled 'Google Cloud Platform'. Inside 'Amazon Web Services', create shapes 'load_balancer' and 'db'. Inside 'Google Cloud Platform', create shape 'auth'. Create a connection from 'load_balancer' to 'db', from 'auth' to 'db', and from 'Google Cloud Platform' to 'Amazon Web Services'. Also create a shape 'users' (at the top level, outside 'clouds') with connections to 'load_balancer' in 'Amazon Web Services' and to 'auth' in 'Google Cloud Platform'."

**Properties to Assert:**
- [ ] A container labeled "clouds" exists at the top level
- [ ] A container labeled "Amazon Web Services" exists as a child of clouds
- [ ] A container labeled "Google Cloud Platform" exists as a child of clouds
- [ ] Shape labeled "load_balancer" exists as a child of Amazon Web Services
- [ ] Shape labeled "db" exists as a child of Amazon Web Services
- [ ] Shape labeled "auth" exists as a child of Google Cloud Platform
- [ ] Shape labeled "users" exists at the top level (not inside clouds)
- [ ] All specified connections exist with correct source and target
- [ ] The generated D2 code is valid and parseable

---

### Scenario 4: Cross-Container Connections

**User Request:**
> "Create a diagram with two containers: 'apartment' and 'office'. Inside 'apartment', create shapes 'bedroom' and 'bathroom'. Inside 'office', create shapes 'spare_room' and 'bathroom'. Create a connection from the bathroom in 'apartment' to the bathroom in 'office' labeled 'Portal'."

**Properties to Assert:**
- [ ] A container labeled "apartment" exists at the top level
- [ ] A container labeled "office" exists at the top level
- [ ] Shape labeled "bedroom" exists as a child of apartment
- [ ] Shape labeled "bathroom" exists as a child of apartment
- [ ] Shape labeled "spare_room" exists as a child of office
- [ ] Shape labeled "bathroom" exists as a child of office
- [ ] A connection exists from apartment's bathroom to office's bathroom with label "Portal"
- [ ] The generated D2 code is valid and parseable

---

### Scenario 5: Sibling Container References with Styling

**User Request:**
> "Create a diagram with two containers at the same level: 'christmas' and 'birthdays'. Inside each container, create a shape called 'presents'. Create a connection from the 'presents' in 'christmas' to the 'presents' in 'birthdays' labeled 'regift'. Set the fill color of the 'christmas' container to light green (#ACE1AF)."

**Properties to Assert:**
- [ ] A container labeled "christmas" exists at the top level
- [ ] A container labeled "birthdays" exists at the top level
- [ ] Shape labeled "presents" exists as a child of christmas
- [ ] Shape labeled "presents" exists as a child of birthdays
- [ ] A connection exists from christmas's presents to birthdays's presents with label "regift"
- [ ] The christmas container has a fill color of #ACE1AF
- [ ] The generated D2 code is valid and parseable

---

## Success Criteria

A benchmark test passes when:

1. **Container hierarchy is correct** - All containers and shapes exist with the correct parent-child relationships
2. **Labels are correct** - Containers and shapes display the correct labels as specified
3. **Connections are correct** - All connections exist between the correct shapes, including cross-container connections
4. **Styling is applied** - Any requested styling (colors, etc.) is correctly applied
5. **No extra elements** - No unexpected shapes, containers, or connections are added
6. **Syntax is valid** - The generated D2 code is syntactically correct and parseable

---

## Error Conditions to Avoid

The agent's output should NOT contain:

- [ ] ❌ Invalid D2 syntax that fails to parse
- [ ] ❌ Incorrect nesting (shapes in wrong containers)
- [ ] ❌ Missing containers or shapes
- [ ] ❌ Connections that reference non-existent shapes
- [ ] ❌ Incorrect container or shape labels
- [ ] ❌ Missing connections between nested elements
