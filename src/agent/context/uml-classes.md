# UML classes

Use `shape: class`. Each key is a field or method.

- Field: `name: Type`
- Method: key contains `(` and its value is the return type
- Method without value returns `void`

```d2
MyClass: {
  shape: class

  field: "[]string"
  method(a uint64): (x, y int)
}
```

## Visibility

Prefixes indicate visibility: `+` public, `-` private, `#` protected.

```d2
D2 Parser: {
  shape: class

  # Default visibility is + so no need to specify.
  +reader: io.RuneReader
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
