# Connections

Connections define relationships between shapes. Valid connection operators are `--`, `->`, `<-`, `<->`.

If you reference an undeclared shape in a connection, the shape is created.

```d2
Write Replica Canada <-> Write Replica Australia

Read Replica <- Master

Read Replica 1 -- Read Replica 2
```

## Labels

```d2
Read Replica 1 -- Read Replica 2: Kept in sync
Read Replica 1 <-> Read Replica 2: Active-active
```

## Use keys, not labels

```d2
be: Backend
fe: Frontend

# This would create new shapes
Backend -> Frontend

# This connects the existing shapes
be -> fe
```

## Chaining

```d2
# The label applies to each connection in the chain.
High Mem Instance -> EC2 <- High CPU Instance: Hosted By
```
