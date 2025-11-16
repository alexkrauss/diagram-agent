# Benchmark: Icons and Images (09-icons-and-images)

## Purpose

Test the agent's ability to add icons and images to shapes in D2 diagrams. This benchmark validates that the agent correctly understands and implements D2's icon and image capabilities.

The tests verify that the agent understands:
- How to add icon properties to shapes using valid icon URLs
- How to use `shape: image` for standalone image shapes
- That icons work correctly alongside other shape properties like labels and styling

---

## Reference

Based on D2 documentation: `docs/tour/icons.md`

### Key Icon and Image Properties

- **icon**: URL pointing to an icon image file (supports https URLs, particularly from https://icons.terrastruct.com)
- **shape: image**: Dedicated shape type for displaying standalone images

---

## Test Scenario 1: Basic Icons on Different Shape Types

### Description

Test the agent's ability to apply icons to various shape types.

### User Request

```
Create a diagram with three shapes representing different services:
1. A container labeled "AWS Account" that has an icon from https://icons.terrastruct.com/aws%2FArchitecture%20Service%20Icons%2FCompute%2FAWSLambda_light-bg.svg
2. A rectangle labeled "Database" with an icon from https://icons.terrastruct.com/tech/022-database.svg
3. A circle labeled "User" with an icon from https://icons.terrastruct.com/tech/032-user.svg
```

### Properties to Assert

| Property | Expected Value | Validation |
|----------|----------------|-----------|
| Shape labeled "AWS Account" has icon | `https://icons.terrastruct.com/aws%2FArchitecture%20Service%20Icons%2FCompute%2FAWSLambda_light-bg.svg` | Exact match |
| Shape labeled "AWS Account" is a container | `container` | Exact match "container" |
| Shape labeled "Database" has icon | `https://icons.terrastruct.com/tech/022-database.svg` | Exact match |
| Shape labeled "User" has icon | `https://icons.terrastruct.com/tech/032-user.svg` | Exact match |
| Shape labeled "User" is a circle | `circle` | Exact match "circle" |

---

## Test Scenario 2: Container with Icon and Nested Shapes

### Description

Test the agent's ability to add icons to containers while maintaining the container's structure with nested child shapes.

### User Request

```
Create a system architecture diagram with a container representing "Kubernetes Cluster" that has an icon
from https://icons.terrastruct.com/tech/167-kubernetes.svg. Inside this container, add two rectangles:
one labeled "Pod A" and another labeled "Pod B".
```

### Properties to Assert

| Property | Expected Value | Validation |
|----------|----------------|-----------|
| Shape labeled "Kubernetes Cluster" is a container | `container` | Exact match "container" |
| Shape labeled "Kubernetes Cluster" has icon | `https://icons.terrastruct.com/tech/167-kubernetes.svg` | Exact match |
| Container children count | 2 | Exactly 2 child shapes ("Pod A" and "Pod B") |
| Child 1 label | `Pod A` | Exact match |
| Child 2 label | `Pod B` | Exact match |

---

## Test Scenario 3: Standalone Image Using shape: image

### Description

Test the agent's ability to create standalone image shapes using `shape: image`.

### User Request

```
Create a simple diagram with a standalone image shape labeled "Team Logo" that displays the image
from https://icons.terrastruct.com/tech/010-user-group.svg.
```

### Properties to Assert

| Property | Expected Value | Validation |
|----------|----------------|-----------|
| Shape labeled "Team Logo" has shape type | `image` | Exact match "image" |
| Shape labeled "Team Logo" has icon | `https://icons.terrastruct.com/tech/010-user-group.svg` | Exact match |

---

## Test Scenario 4: Icons with Other Shape Properties

### Description

Test the agent's ability to add icons to shapes while preserving other shape properties like labels, styling, and connections.

### User Request

```
Create a diagram with a rectangle labeled "Processed Data" that has:
1. An icon from https://icons.terrastruct.com/tech/021-copy.svg
2. A fill color of #E8F4F8
3. A font-color of #2C3E50
4. Another rectangle labeled "Output" connected with an arrow
```

### Properties to Assert

| Property | Expected Value | Validation |
|----------|----------------|-----------|
| Shape labeled "Processed Data" has icon | `https://icons.terrastruct.com/tech/021-copy.svg` | Exact match |
| Shape labeled "Processed Data" has fill color | `#E8F4F8` | Exact match |
| Shape labeled "Processed Data" has font color | `#2C3E50` | Exact match |
| Connection exists | Processed Data to Output | Arrow connection present |
| Shape labeled "Output" exists | Present | Shape exists |

---

## Validation Rules

### Icon URL Requirements

- **Protocol**: Must use HTTPS (not HTTP)
- **Domain**: Preferably from https://icons.terrastruct.com
- **Format**: URLs must be complete and valid

### shape: image Requirements

- **Usage**: Use `shape: image` only for standalone image shapes
- **Icon Property**: Must include `icon` property with valid URL
- **Not Mixed**: Do not apply `shape: image` to containers or shapes with children

### Icons with Other Properties

- **Icon Compatibility**: Icons work with any non-image shape type (rectangle, circle, container, etc.)
- **Connection Compatibility**: Shapes with icons can have connections to other shapes

---

## Success Criteria

The agent successfully passes this benchmark when:

1. **Test Scenario 1**: Icons are added to multiple shape types with correct URLs
2. **Test Scenario 2**: Container shapes with icons include both the icon property and nested child shapes
3. **Test Scenario 3**: Standalone image shapes are created using `shape: image` with proper icon URLs
4. **Test Scenario 4**: Icons coexist with other shape properties (styling, connections, labels)
5. **No Syntax Errors**: Generated D2 code is syntactically valid and parseable
6. **URL Validation**: All icon URLs are valid HTTPS URLs

---

## Test Data

### Common Icon URLs (from https://icons.terrastruct.com)

#### AWS Icons
```
AWS Account: https://icons.terrastruct.com/aws%2FArchitecture%20Service%20Icons%2FCompute%2FAWSLambda_light-bg.svg
AWS EC2: https://icons.terrastruct.com/aws%2FArchitecture%20Service%20Icons%2FCompute%2FAmazonEC2_light-bg.svg
AWS RDS: https://icons.terrastruct.com/aws%2FArchitecture%20Service%20Icons%2FDatabase%2FAmazonRDS_light-bg.svg
AWS S3: https://icons.terrastruct.com/aws%2FArchitecture%20Service%20Icons%2FStorage%2FAmazonSimpleStorageServiceS3_light-bg.svg
```

#### Technology Icons
```
Database: https://icons.terrastruct.com/tech/022-database.svg
Kubernetes: https://icons.terrastruct.com/tech/167-kubernetes.svg
User: https://icons.terrastruct.com/tech/032-user.svg
User Group: https://icons.terrastruct.com/tech/010-user-group.svg
Copy/Document: https://icons.terrastruct.com/tech/021-copy.svg
Server: https://icons.terrastruct.com/tech/097-server.svg
Cloud: https://icons.terrastruct.com/tech/015-cloud.svg
Lock/Security: https://icons.terrastruct.com/tech/033-lock.svg
```

---

## Notes

- The agent should use URLs from https://icons.terrastruct.com as the primary source for test data
- When users provide generic icon descriptions (e.g., "database icon"), the agent should map these to appropriate URLs from the terrastruct icon collection
- The agent should understand that `shape: image` is a dedicated shape type for images, distinct from adding icons to other shapes

---

## Error Conditions to Avoid

The agent's output should NOT contain:

- [ ] HTTP URLs (must use HTTPS)
- [ ] Incomplete or malformed URLs
- [ ] `shape: image` applied to containers or shapes with children
- [ ] Icons applied to connection labels (icons are for shapes, not connections)
- [ ] Duplicate icon assignments to the same shape
