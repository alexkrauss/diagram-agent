# Benchmark: UML Class Diagrams

## Purpose

This benchmark tests the agent's ability to create UML class diagrams using the `class` shape in D2. It validates that the agent correctly understands and implements:

- Class shape declaration with `shape: class`
- Field definitions with types
- Method definitions with parameters and return types
- UML visibility modifiers (+, -, #, and implicit public)
- Relationships between classes (inheritance, associations, composition)
- Complex class structures with multiple fields and methods

---

## Reference D2 Syntax

### Class Shape Basics

In D2, UML classes are created using the `class` shape:

**1. Simple class with fields:**
```d2
MyClass: {
  shape: class
  name: string
  age: int
}
```

Each key in a class represents either a field or a method. The value of a field key is its type.

**2. Methods are identified by parentheses:**
```d2
MyClass: {
  shape: class
  getId(): int
  setName(name: string): void
}
```

Any key containing `(` is treated as a method. The value is the return type. A method without a value has a return type of `void`.

**3. Visibility modifiers:**
```d2
MyClass: {
  shape: class
  +publicField: string
  -privateField: int
  #protectedField: bool
  defaultPublic: string
}
```

UML visibility prefixes:
- `+` : public
- `-` : private
- `#` : protected
- (none) : public (default)

---

## Test Scenarios

### Scenario 1: Simple Class with Typed Fields

**Request**: "Create a UML class diagram for a Person class with fields: name (string), age (integer), and email (string)"

**Properties to Assert**:
- [ ] Class named `Person` exists
- [ ] `shape: class` is declared
- [ ] Field named `name` exists with type `string`
- [ ] Field named `age` exists with type `int` or `integer`
- [ ] Field named `email` exists with type `string`
- [ ] All fields use default visibility (no prefix)

---

### Scenario 2: Class with Methods and Return Types

**Request**: "Create a User class with methods: getId (returns integer), getName (returns string), and login (takes username parameter which is a string, returns boolean)"

**Properties to Assert**:
- [ ] Class named `User` exists
- [ ] `shape: class` is declared
- [ ] Method named `getId` exists with no parameters and return type `int` or `integer`
- [ ] Method named `getName` exists with no parameters and return type `string`
- [ ] Method named `login` exists with parameter named `username` of type `string` and return type `bool` or `boolean`

---

### Scenario 3: Class with Visibility Modifiers

**Request**: "Create an Employee class where: name is public (string type), salary is private (float type), department is protected (string type), and employeeId has default visibility (int type)"

**Properties to Assert**:
- [ ] Class named `Employee` exists
- [ ] `shape: class` is declared
- [ ] Public field named `name` with type `string` (with `+` prefix)
- [ ] Private field named `salary` with type `float` (with `-` prefix)
- [ ] Protected field named `department` with type `string` (with `#` prefix)
- [ ] Field named `employeeId` with type `int` or `integer` (no prefix)

---

### Scenario 4: Complex Class with Fields, Methods, and Mixed Visibility

**Request**: "Create a BankAccount class with: private field accountNumber (string type), private field balance (float type), public method deposit that takes parameter amount (float type) and returns void, public method getBalance that takes no parameters and returns float, and a protected method calculateInterest that takes parameter rate (float type) and returns float"

**Properties to Assert**:
- [ ] Class named `BankAccount` exists
- [ ] `shape: class` is declared
- [ ] Private field named `accountNumber` with type `string` (with `-` prefix)
- [ ] Private field named `balance` with type `float` (with `-` prefix)
- [ ] Public method named `deposit` with parameter `amount` of type `float` and return type `void` (with `+` prefix)
- [ ] Public method named `getBalance` with no parameters and return type `float` (with `+` prefix)
- [ ] Protected method named `calculateInterest` with parameter `rate` of type `float` and return type `float` (with `#` prefix)

---

### Scenario 5: Multiple Classes with Inheritance and Relationships

**Request**: "Create a class diagram with: a base class Animal with field name (string type) and field age (int type), and methods eat() that returns void and sleep() that returns void; a Dog class that inherits from Animal with an additional method bark() that returns void; a Cat class that inherits from Animal with an additional method meow() that returns void"

**Properties to Assert**:
- [ ] Class named `Animal` exists with `shape: class`
- [ ] Animal has field named `name` with type `string`
- [ ] Animal has field named `age` with type `int` or `integer`
- [ ] Animal has method named `eat` with no parameters and return type `void`
- [ ] Animal has method named `sleep` with no parameters and return type `void`
- [ ] Class named `Dog` exists with `shape: class`
- [ ] Dog has method named `bark` with no parameters and return type `void`
- [ ] Class named `Cat` exists with `shape: class`
- [ ] Cat has method named `meow` with no parameters and return type `void`
- [ ] Inheritance relationship exists from Dog to Animal
- [ ] Inheritance relationship exists from Cat to Animal

---

### Scenario 6: Mixed Scenario with Complex Types and Relationships

**Request**: "Create a class diagram showing: a Product class with field sku (string type), field name (string type), field price (float type), and method calculateTax that takes parameter rate (float type) and returns float; an Order class with field orderId (int type), field items (array type), field totalAmount (float type), method addItem() that returns void, and method getTotal() that returns float; show that Order contains Products with a relationship"

**Properties to Assert**:
- [ ] Class named `Product` exists with `shape: class`
- [ ] Product has field named `sku` with type `string`
- [ ] Product has field named `name` with type `string`
- [ ] Product has field named `price` with type `float`
- [ ] Product has method named `calculateTax` with parameter `rate` of type `float` and return type `float`
- [ ] Class named `Order` exists with `shape: class`
- [ ] Order has field named `orderId` with type `int` or `integer`
- [ ] Order has field named `items` with type `array`
- [ ] Order has field named `totalAmount` with type `float`
- [ ] Order has method named `addItem` with no parameters and return type `void`
- [ ] Order has method named `getTotal` with no parameters and return type `float`
- [ ] A relationship exists from Order to Product

---

## Properties to Assert (All Scenarios)

### Class Shape Declaration
- `shape: class` is present in each class definition
- Class name matches the requested class name

### Fields and Types
- Each requested field exists with the correct name
- Each field has the correct type as specified
- Fields with visibility modifiers have the correct prefix (+, -, #)
- Fields without explicit visibility modifiers are accessible (default public)

### Methods and Parameters
- Each requested method exists with the correct name
- Methods have the correct parameters with correct names and types
- Methods have the correct return types
- Methods with visibility modifiers have the correct prefix (+, -, #)

### Visibility Modifiers
- Public visibility is indicated with `+` prefix when explicitly requested
- Private visibility is indicated with `-` prefix
- Protected visibility is indicated with `#` prefix
- Default visibility (no prefix) is used when public is implied but not explicitly stated

### Relationships Between Classes
- Inheritance relationships exist between the correct classes
- Composition/association relationships exist between the correct classes
- All shapes referenced in relationships exist in the diagram

### Syntax Validation
- Generated D2 code is syntactically valid
- The code can be parsed and rendered without errors

---

## Error Conditions to Avoid

The agent's output should NOT contain:

- [ ] ❌ Missing `shape: class` declaration
- [ ] ❌ Missing requested classes
- [ ] ❌ Missing requested fields
- [ ] ❌ Missing requested methods
- [ ] ❌ Incorrect field names
- [ ] ❌ Incorrect method names
- [ ] ❌ Incorrect field types
- [ ] ❌ Incorrect method parameter types
- [ ] ❌ Incorrect method return types
- [ ] ❌ Incorrect visibility modifiers
- [ ] ❌ Missing visibility modifiers when explicitly requested
- [ ] ❌ Missing inheritance relationships
- [ ] ❌ Missing composition/association relationships
- [ ] ❌ Relationship arrows that reference non-existent classes
- [ ] ❌ Extra classes, fields, or methods not requested

---

## Success Criteria

A benchmark test passes when:

1. **All classes are present** - The diagram contains exactly the classes requested with correct names
2. **Shape types are correct** - Each class has `shape: class` declared
3. **Fields are correct** - All requested fields exist with correct names and types
4. **Methods are correct** - All requested methods exist with correct names, parameters (with names and types), and return types
5. **Visibility is correct** - Visibility modifiers (+, -, #) match the user's explicit request
6. **Relationships are correct** - Inheritance and association relationships exist between the correct classes
7. **Syntax is valid** - The generated D2 code is syntactically correct and parseable
8. **Types are preserved** - Field and return types match specifications
9. **No extra elements** - No unexpected classes, fields, or relationships are added
10. **Output is minimal** - The agent produces only what was requested

---

## Reference

D2 UML Classes Documentation: https://d2lang.com/tour/uml-classes

Key concepts:
- Class shape: `shape: class`
- Fields: `fieldName: type`
- Methods: `methodName(): returnType` or `methodName(param: type): returnType`
- Visibility: `+` (public), `-` (private), `#` (protected)
- Relationships: Connections between classes using arrows (`->`, `<-`, `<->`)
