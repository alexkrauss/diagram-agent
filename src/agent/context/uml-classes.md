# UML classes

Use `shape: class`. Each key is a field or method. Do not use `fields:`/`methods:` blocks or `extends:`; model relationships with normal connections and labels.

- Field: `name: Type`
- Method: key contains `(` and its value is the return type
- Method without value returns `void`

```d2
MyClass: {
  shape: class

  field: "[]string"
  method(a uint64): (x, y int)
}

Dog: {
  shape: class
  bark(): void
}

Dog -> MyClass: inherits
```

## Inheritance and relationships

Use normal D2 connections (optionally labeled) for inheritance or composition.
Avoid UML-only symbols like `*--`, `o--`, or `extends:`.

```d2
Animal: {
  shape: class
  name: string
}

Dog: {
  shape: class
  bark(): void
}

Dog -> Animal: inherits
```

```d2
Order -> Product: contains
```

## Visibility

Prefixes indicate visibility: `+` public, `-` private, `#` protected.
Omitting the prefix means default (package/internal) visibility—this is different from public.
Prefixes apply to fields and methods with no space; escape `#` as `\#` to avoid comment parsing.

```d2
Employee: {
  shape: class

  # Public fields: use + prefix
  +name: string

  # Private fields: use - prefix
  -salary: float

  # Protected fields: use \# prefix (escape the #)
  \#department: string

  # Default visibility: NO prefix (not public, not private)
  employeeId: int
}
```

```d2
D2 Parser: {
  shape: class

  # Public field
  +reader: io.RuneReader

  # Default visibility (no prefix)
  readerPos: d2ast.Position

  # Private field.
  -lookahead: "[]rune"

  # Protected field.
  # Escape # to avoid comment parsing.
  \#lookaheadPos: d2ast.Position

  +peek(): (r rune, eof bool)
  rewind()
  commit()

  \#peekn(n int): (s string, eof bool)
}

"github.com/terrastruct/d2parser.git" -> D2 Parser
```

## Escaping reserved keywords

```d2
my_class: {
  shape: class
  "label": string
}
```
