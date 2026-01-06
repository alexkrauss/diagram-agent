# Sequence diagrams

Sequence diagrams are D2 objects with `shape: sequence_diagram`. Order matters inside the diagram (actors and messages appear in the order they are declared).

## Basic example

```d2
shape: sequence_diagram
alice -> bob: What does it mean\nto be well-adjusted?
bob -> alice: The ability to play bridge or\ngolf as if they were games.
```

## Actor ordering

```d2
shape: sequence_diagram
# Actors appear left-to-right as a, b, c, d
# even if connections are in a different order.
a; b; c; d
c -> d
d -> a
b -> d
```

## Groups

Groups are containers inside a sequence diagram. Predeclare actors used in groups.

```d2
shape: sequence_diagram
# Predefine actors
alice
bob
shower thoughts: {
  alice -> bob: A physicist is an atom's way of knowing about atoms.
  alice -> bob: Today is the first day of the rest of your life.
}
life advice: {
  bob -> alice: If all else fails, lower your standards.
}
```

## Spans (activation boxes)

Define spans by connecting nested objects on an actor.

```d2
shape: sequence_diagram
alice.t1 -> bob
alice.t2 -> bob.a
alice.t2.a -> bob.a
alice.t2.a <- bob.a
alice.t2 <- bob.a
```

## Notes

Notes are nested objects on an actor without connections.

```d2
shape: sequence_diagram
alice -> bob
bob."In the eyes of my dog, I'm a man."
# Notes can go into groups, too
important insight: {
  bob."Cold hands, no gloves."
}
bob -> alice: Chocolate chip.
```

## Self-messages

```d2
shape: sequence_diagram
son -> father: Can I borrow your car?
friend -> father: Never lend your car to anyone to whom you have given birth.
father -> father: internal debate ensues
```
