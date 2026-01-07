# Connections

Connections define relationships between shapes. Valid connection operators:

- `->` directed (one-way arrow)
- `<-` directed (reverse arrow)
- `<->` **bidirectional** (arrows on both ends, for two-way relationships like replication)
- `--` undirected (no arrows, for associations)

If you reference an undeclared shape in a connection, the shape is created.

```d2
# Bidirectional: arrows on both ends (e.g., mutual sync, replication)
Primary Database <-> Replica Database: Replication

# Directed: one-way arrow
Read Replica <- Master

# Undirected: no arrows (association, no direction implied)
Read Replica 1 -- Read Replica 2: Sync status
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
