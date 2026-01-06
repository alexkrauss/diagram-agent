# SQL tables (ERD)

Use `shape: sql_table`. Each key becomes a row; the value is the column type. Set row constraints with `constraint`.

```d2
my_table: {
  shape: sql_table
  # The id field becomes a map like {type: int; constraint: primary_key}
  id: int {constraint: primary_key}
  last_updated: timestamp with time zone
}
```

## Constraints

Common constraints are `primary_key`, `foreign_key`, and `unique`.

```d2
x: int { constraint: [primary_key; unique] }
```

## Foreign keys

```d2
objects: {
  shape: sql_table
  id: int {constraint: primary_key}
  disk: int {constraint: foreign_key}

  json: jsonb {constraint: unique}
  last_updated: timestamp with time zone
}

disks: {
  shape: sql_table
  id: int {constraint: primary_key}
}

objects.disk -> disks.id
```

## Escaping reserved keywords

```d2
my_table: {
  shape: sql_table
  "label": string
}
```
