# D2 basics

D2 is declarative: each line defines shapes, connections, or diagram-level settings.

## Hello world

```d2
x -> y: hello world
```

## Keys and labels

- A shape key is its identifier; the label defaults to the key.
- Use `key: Label` to set a label.
- Keys are case-insensitive.
- Use semicolons to declare multiple shapes on one line.

```d2
pg: PostgreSQL
SQLite; Cassandra
```

## Direction

Set diagram-level layout direction with `direction`.

```d2
direction: right
```

## Comments

Line comments start with `#`. Block comments use triple double-quotes.

```d2
# Line comment
x -> y

"""
Block comment
"""

y -> z
```
