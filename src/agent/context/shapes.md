# Shapes

## Basics

Declare shapes by key. Keys can include spaces and punctuation.

```d2
imAShape
im_a_shape
im a shape
i'm a shape
# one hyphen in a key is not a connection
# `a--shape` would be a connection
a-shape
```

Use semicolons to declare multiple shapes on one line:

```d2
SQLite; Cassandra
```

## Labels and shape types

Set a label with `key: Label`. Default shape type is `rectangle`. Set `shape` to change it.

```d2
pg: PostgreSQL
Cloud: my cloud
Cloud.shape: cloud
```

## 1:1 ratio shapes

Some shapes keep equal width and height: `circle`, `square`.
