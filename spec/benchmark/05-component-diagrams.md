# Component Diagrams Benchmark Specification

## Purpose

Test the agent's ability to create component and architecture diagrams using nested containers (boxes) and connections (arrows). Component diagrams are essential for communicating system design and should demonstrate:

- Proper nesting and hierarchical structure of components
- Accurate connections between components at different nesting levels
- Clear, descriptive labeling of both components and relationships
- Logical grouping of related components into containers

This benchmark evaluates whether the agent understands and correctly implements component diagrams with nested containers and cross-container connections.

## Test Scenarios

### Scenario 1: Simple 3-Tier Architecture

**Purpose**: Test basic multi-level architecture with linear connections

**User Request**:
```
Create a 3-tier architecture diagram with exactly three shapes:
- A shape labeled "Frontend"
- A shape labeled "Backend"
- A shape labeled "Database"

Add two connections:
- From Frontend to Backend with label "HTTP requests"
- From Backend to Database with label "SQL queries"

All shapes should be rectangles.
```

**Properties to Assert**:
- [ ] Three shapes exist
- [ ] Shape labels are displayed as: "Frontend", "Backend", "Database"
- [ ] All shapes are rectangles
- [ ] Connection exists from Frontend to Backend
- [ ] Connection exists from Backend to Database
- [ ] Frontend to Backend connection displays label "HTTP requests"
- [ ] Backend to Database connection displays label "SQL queries"
- [ ] Both connections are unidirectional (single arrow, not bidirectional)

---

### Scenario 2: Microservices Architecture

**Purpose**: Test nested containers with multiple levels and cross-container connections

**User Request**:
```
Create a microservices architecture diagram with the following structure:

Top-level shapes:
- Shape labeled "API Gateway" (rectangle)
- Shape labeled "Payment Gateway" (rectangle)

Container labeled "Services" containing:
- Shape labeled "User Service"
- Shape labeled "Product Service"
- Shape labeled "Order Service"

Container labeled "Data Layer" containing:
- Shape labeled "User Database"
- Shape labeled "Product Database"
- Shape labeled "Shared Cache"

Add these connections:
- From API Gateway to User Service with label "route"
- From API Gateway to Product Service with label "route"
- From API Gateway to Order Service with label "route"
- From User Service to User Database with label "query"
- From Product Service to Product Database with label "query"
- From Order Service to Payment Gateway with label "process payment"
- From User Service to Shared Cache with label "read/write"
- From Product Service to Shared Cache with label "read/write"
- From Order Service to Shared Cache with label "read/write"
```

**Properties to Assert**:
- [ ] Container labeled "Services" exists
- [ ] Container labeled "Data Layer" exists
- [ ] Container "Services" contains exactly three child shapes with labels: "User Service", "Product Service", "Order Service"
- [ ] Container "Data Layer" contains exactly three child shapes with labels: "User Database", "Product Database", "Shared Cache"
- [ ] Shape labeled "API Gateway" exists as top-level (not inside a container)
- [ ] Shape labeled "Payment Gateway" exists as top-level (not inside a container)
- [ ] All shape labels are displayed correctly
- [ ] Connection exists from API Gateway to User Service (inside Services container)
- [ ] Connection exists from API Gateway to Product Service (inside Services container)
- [ ] Connection exists from API Gateway to Order Service (inside Services container)
- [ ] Connection exists from User Service to User Database (both inside containers)
- [ ] Connection exists from Product Service to Product Database (both inside containers)
- [ ] Connection exists from Order Service to Payment Gateway (from container to top-level)
- [ ] Connection exists from User Service to Shared Cache (both inside containers)
- [ ] Connection exists from Product Service to Shared Cache (both inside containers)
- [ ] Connection exists from Order Service to Shared Cache (both inside containers)
- [ ] All connections display their specified labels
- [ ] All connections are unidirectional
- [ ] Containers visually distinguish their contents from top-level shapes

---

### Scenario 3: Cloud Architecture with Multi-Region Deployment

**Purpose**: Test symmetric nested structures with parallel hierarchies and shared connections

**User Request**:
```
Create a cloud architecture diagram with the following structure:

Top-level shapes:
- Shape labeled "CDN" (rectangle)
- Shape labeled "Monitoring Service" (rectangle)

Container labeled "US-East Region" containing:
- Shape labeled "Load Balancer"
- Shape labeled "Web Cluster"
- Shape labeled "App Cluster"

Container labeled "EU-West Region" containing:
- Shape labeled "Load Balancer"
- Shape labeled "Web Cluster"
- Shape labeled "App Cluster"

Container labeled "Data Center" containing:
- Shape labeled "Database"

Add these connections:
- From CDN to the Load Balancer in US-East Region with label "route traffic"
- From CDN to the Load Balancer in EU-West Region with label "route traffic"
- From Load Balancer to Web Cluster (within US-East Region) with label "forward"
- From Web Cluster to App Cluster (within US-East Region) with label "API call"
- From Load Balancer to Web Cluster (within EU-West Region) with label "forward"
- From Web Cluster to App Cluster (within EU-West Region) with label "API call"
- From App Cluster in US-East Region to Database with label "SQL query"
- From App Cluster in EU-West Region to Database with label "SQL query"
- From Load Balancer in US-East Region to Monitoring Service with label "metrics"
- From Load Balancer in EU-West Region to Monitoring Service with label "metrics"
```

**Properties to Assert**:
- [ ] Container labeled "US-East Region" exists
- [ ] Container labeled "EU-West Region" exists
- [ ] Container labeled "Data Center" exists
- [ ] Container "US-East Region" contains exactly three child shapes with labels: "Load Balancer", "Web Cluster", "App Cluster"
- [ ] Container "EU-West Region" contains exactly three child shapes with labels: "Load Balancer", "Web Cluster", "App Cluster"
- [ ] Container "Data Center" contains exactly one child shape labeled "Database"
- [ ] Shape labeled "CDN" exists as top-level
- [ ] Shape labeled "Monitoring Service" exists as top-level
- [ ] All shape labels are displayed correctly
- [ ] Connection exists from CDN to Load Balancer in US-East Region (top-level to nested)
- [ ] Connection exists from CDN to Load Balancer in EU-West Region (top-level to nested)
- [ ] Connection exists from Load Balancer to Web Cluster (both within US-East Region)
- [ ] Connection exists from Web Cluster to App Cluster (both within US-East Region)
- [ ] Connection exists from Load Balancer to Web Cluster (both within EU-West Region)
- [ ] Connection exists from Web Cluster to App Cluster (both within EU-West Region)
- [ ] Connection exists from App Cluster in US-East Region to Database (nested to nested across containers)
- [ ] Connection exists from App Cluster in EU-West Region to Database (nested to nested across containers)
- [ ] Connection exists from Load Balancer in US-East Region to Monitoring Service (nested to top-level)
- [ ] Connection exists from Load Balancer in EU-West Region to Monitoring Service (nested to top-level)
- [ ] All connections display their specified labels
- [ ] All connections are unidirectional
- [ ] Both regional containers have identical internal structure (3 shapes with same labels)
- [ ] Both app clusters connect to the same database
- [ ] Both load balancers connect to the same monitoring service

---

## Success Criteria

The agent successfully completes this benchmark when:

1. **Scenario 1**: All 8 assertions pass
2. **Scenario 2**: At least 20 out of 22 assertions pass
3. **Scenario 3**: At least 23 out of 25 assertions pass
4. All diagrams render without D2 syntax errors
5. All specified shapes, containers, and connections are present and correctly related

## Error Conditions

Common failure modes to watch for:

1. **Missing nested elements**: Creating containers without populating them with specified children
2. **Wrong nesting level**: Placing shapes at top-level when they should be inside containers, or vice versa
3. **Missing connections**: Failing to create all specified connections
4. **Wrong connection endpoints**: Connecting to wrong shapes or using incorrect references to nested shapes
5. **Missing labels**: Shapes or connections without their specified labels
6. **Wrong connection direction**: Reversed arrow direction from what was specified
7. **Incomplete containers**: Missing child shapes from containers
8. **Extra elements**: Creating shapes or connections not specified in the request
