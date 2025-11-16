# Benchmark: SQL Tables and Entity-Relationship Diagrams

## Purpose

Test the agent's ability to create entity-relationship diagrams (ERDs) using D2's `sql_table` shape. This benchmark validates that the agent correctly understands and implements:

- SQL table shape declaration and syntax
- Column definitions with proper types
- SQL constraints (primary_key, foreign_key, unique)
- Foreign key connections between tables
- Multiple tables with relationships in a single diagram

This benchmark ensures the agent can model database schemas as clear, structured entity-relationship diagrams.

## Reference Documentation

The implementation should follow D2 syntax as described in:
- SQL Tables documentation: `tmp/d2-docs/docs/tour/sql-tables.md`

Key D2 features for SQL tables:
- **SQL Table shape**: `table_name: { shape: sql_table ... }` creates a table
- **Row/Column syntax**: Each row in the table is defined as `column_name: type { constraint: constraint_value }`
- **Type definition**: The value after the colon is the column type (e.g., `int`, `string`, `varchar`, `timestamp`)
- **Constraint syntax**: `{ constraint: primary_key }`, `{ constraint: foreign_key }`, `{ constraint: unique }`
- **Multiple constraints**: Can use arrays `{ constraint: [primary_key; unique] }`
- **Foreign key connections**: Can draw connections from one table's column to another table's column

---

## Test Scenarios

### Scenario 1: Simple Single Table with Basic Columns and Types

**Description**: A single database table with multiple columns of different types and a primary key constraint.

**Request Prompt**:
```
Create a SQL table diagram for a users table with the following columns:
- id column of type int with primary_key constraint
- name column of type string with no constraints
- email column of type string with no constraints
- created_at column of type timestamp with no constraints
```

**Assertions**:
- [ ] Shape type is `sql_table`
- [ ] Table is named `users`
- [ ] Column `id` exists with type `int` and constraint `primary_key`
- [ ] Column `name` exists with type `string` and no constraints
- [ ] Column `email` exists with type `string` and no constraints
- [ ] Column `created_at` exists with type `timestamp` and no constraints
- [ ] No extraneous properties or connections are created

---

### Scenario 2: Table with Multiple Constraints

**Description**: A single table demonstrating different constraint types including primary key, unique, and foreign key.

**Request Prompt**:
```
Create a SQL table diagram for a products table with the following columns:
- product_id column of type int with primary_key constraint
- sku column of type string with unique constraint
- name column of type string with no constraints
- category_id column of type int with foreign_key constraint
- price column of type decimal with no constraints
- in_stock column of type boolean with no constraints
```

**Assertions**:
- [ ] Shape type is `sql_table`
- [ ] Table is named `products`
- [ ] Column `product_id` exists with type `int` and constraint `primary_key`
- [ ] Column `sku` exists with type `string` and constraint `unique`
- [ ] Column `name` exists with type `string` and no constraints
- [ ] Column `category_id` exists with type `int` and constraint `foreign_key`
- [ ] Column `price` exists with type `decimal` and no constraints
- [ ] Column `in_stock` exists with type `boolean` and no constraints
- [ ] Syntax is valid D2

---

### Scenario 3: Multiple Tables with Foreign Key Relationships

**Description**: Multiple related tables demonstrating a typical database schema with foreign key connections between tables.

**Request Prompt**:
```
Create an entity-relationship diagram for a blog database with the following tables and columns:

Table: authors
- author_id column of type int with primary_key constraint
- name column of type string with no constraints
- email column of type string with unique constraint

Table: posts
- post_id column of type int with primary_key constraint
- title column of type string with no constraints
- content column of type text with no constraints
- author_id column of type int with foreign_key constraint
- created_at column of type timestamp with no constraints

Table: comments
- comment_id column of type int with primary_key constraint
- post_id column of type int with foreign_key constraint
- author_id column of type int with foreign_key constraint
- content column of type text with no constraints
- created_at column of type timestamp with no constraints

Show the following foreign key relationships with connections:
- posts.author_id connects to authors.author_id
- comments.post_id connects to posts.post_id
- comments.author_id connects to authors.author_id
```

**Assertions**:
- [ ] Three tables are created: `authors`, `posts`, `comments`
- [ ] All three tables have shape type `sql_table`
- [ ] `authors` table columns:
  - [ ] `author_id` exists with type `int` and constraint `primary_key`
  - [ ] `name` exists with type `string` and no constraints
  - [ ] `email` exists with type `string` and constraint `unique`
- [ ] `posts` table columns:
  - [ ] `post_id` exists with type `int` and constraint `primary_key`
  - [ ] `title` exists with type `string` and no constraints
  - [ ] `content` exists with type `text` and no constraints
  - [ ] `author_id` exists with type `int` and constraint `foreign_key`
  - [ ] `created_at` exists with type `timestamp` and no constraints
- [ ] `comments` table columns:
  - [ ] `comment_id` exists with type `int` and constraint `primary_key`
  - [ ] `post_id` exists with type `int` and constraint `foreign_key`
  - [ ] `author_id` exists with type `int` and constraint `foreign_key`
  - [ ] `content` exists with type `text` and no constraints
  - [ ] `created_at` exists with type `timestamp` and no constraints
- [ ] Three foreign key connections are present:
  - [ ] `posts.author_id -> authors.author_id`
  - [ ] `comments.post_id -> posts.post_id`
  - [ ] `comments.author_id -> authors.author_id`
- [ ] All connections reference correct table and column names
- [ ] Syntax is valid D2

---

## Properties to Assert (All Scenarios)

### SQL Table Shape Requirements
- [ ] Shape property is explicitly set to `sql_table`
- [ ] Table name is appropriate and matches the request
- [ ] Shape is declared with proper syntax: `table_name: { shape: sql_table ... }`

### Column Definition Requirements
- [ ] Each column is defined with format: `column_name: type`
- [ ] Column names match the request exactly
- [ ] Column types are correct as specified in the request
- [ ] No extraneous columns are created

### Constraint Requirements
- [ ] Constraints are properly specified for columns that require them
- [ ] Only requested columns have constraints
- [ ] Constraint types match the request (primary_key, foreign_key, unique)

### Foreign Key Connection Requirements
- [ ] Connections use correct syntax: `table1.column1 -> table2.column2`
- [ ] Both referenced tables exist in the diagram
- [ ] Both referenced columns exist in their respective tables
- [ ] Connection direction matches the foreign key relationship
- [ ] All requested foreign key relationships are represented

### Type Definition Requirements
- [ ] Column types accurately reflect the request
- [ ] Common SQL types are used as specified (int, varchar, string, text, boolean, decimal, timestamp, etc.)
- [ ] Types are placed directly after the column name with colon separator

### Syntax Validation
- [ ] All table declarations are syntactically valid D2
- [ ] All column definitions are properly formatted
- [ ] All constraint definitions use valid syntax
- [ ] All connections are syntactically correct
- [ ] Generated D2 code is parseable and renderable

---

## Common Issues to Watch For

1. **Missing shape property**: Forgetting to declare `shape: sql_table` at the start of each table definition
2. **Incorrect constraint syntax**: Using wrong format like `primary_key: true` instead of `{ constraint: primary_key }`
3. **Missing foreign key connections**: Creating foreign key columns but not adding connections between tables
4. **Incorrect connection syntax**: Using wrong format like `posts -> authors` instead of `posts.author_id -> authors.author_id`
5. **Extra constraints**: Adding constraints that were not requested
6. **Column name mismatch**: Using different column names than specified in the request
7. **Incomplete table definition**: Missing columns or constraints from the original request
8. **Wrong column types**: Using different types than specified in the request

---

## Evaluation Method

For each test scenario:

1. **Run the agent** with the provided request
2. **Extract the generated D2 code** from the canvas output
3. **Parse the D2 structure** to identify tables, columns, constraints, and connections
4. **Validate table definitions**:
   - Verify `shape: sql_table` is present
   - Verify each column has correct name, type, and constraints as specified
5. **Validate constraints**:
   - Verify constraint syntax is correct
   - Verify constraints match the request
6. **Validate connections**:
   - Verify all foreign key connections are present
   - Verify connection syntax references correct table and column names
   - Verify connection direction is correct
7. **Validate syntax**:
   - Attempt to render the diagram to ensure no parsing errors
   - Check for balanced braces and proper D2 syntax
8. **Compare against assertions**:
   - Verify all properties listed in the assertions are present and correct

---

## Success Criteria

The agent successfully completes this benchmark when:

1. All three scenarios generate syntactically valid D2 diagrams
2. Each diagram renders without errors
3. For each scenario, at least 90% of the evaluation criteria are satisfied
4. All requested tables are present with correct names
5. All requested columns are present with correct types
6. All requested constraints are present
7. All foreign key connections are present and correctly reference table and column names
8. No extraneous columns, constraints, or connections are added beyond what was requested
9. The generated diagrams accurately represent the requested database schema

---

## Example Valid Outputs

### Example 1: Simple Users Table
```d2
users: {
  shape: sql_table
  id: int { constraint: primary_key }
  username: string { constraint: unique }
  email: string
  created_at: timestamp
}
```

### Example 2: Multi-Table Schema
```d2
customers: {
  shape: sql_table
  customer_id: int { constraint: primary_key }
  name: string
  email: string
}

orders: {
  shape: sql_table
  order_id: int { constraint: primary_key }
  customer_id: int { constraint: foreign_key }
  order_date: timestamp
  total: decimal
}

orders.customer_id -> customers.customer_id
```

### Example 3: Complex ERD with Multiple Relationships
```d2
users: {
  shape: sql_table
  user_id: int { constraint: primary_key }
  email: string { constraint: unique }
}

posts: {
  shape: sql_table
  post_id: int { constraint: primary_key }
  user_id: int { constraint: foreign_key }
  title: string
}

comments: {
  shape: sql_table
  comment_id: int { constraint: primary_key }
  post_id: int { constraint: foreign_key }
  user_id: int { constraint: foreign_key }
  text: text
}

posts.user_id -> users.user_id
comments.post_id -> posts.post_id
comments.user_id -> users.user_id
```

---

## Reference

D2 SQL Tables Documentation: https://d2lang.com/tour/sql-tables

Key D2 SQL Table Syntax:
- Table declaration: `table_name: { shape: sql_table ... }`
- Column with type: `column_name: type_name`
- Column with constraint: `column_name: type_name { constraint: constraint_name }`
- Multiple constraints: `column_name: type_name { constraint: [constraint_1; constraint_2] }`
- Foreign key connection: `table1.column1 -> table2.column2`
