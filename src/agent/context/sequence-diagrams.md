# Sequence diagrams

Sequence diagrams are D2 objects with `shape: sequence_diagram`. Order matters inside the diagram (actors and messages appear in the order they are declared).

Do not use Mermaid-style `sequence_diagram` blocks or `actor`/`participant` keywords. Actors are plain keys (optionally relabeled). The literal `sequence_diagram` should only appear as a value of `shape:`.

```d2
checkout: {
  shape: sequence_diagram
  customer: Customer
  website: Website
  customer -> website: Submit order
}
```

Avoid Mermaid-only keywords like `activate`, `deactivate`, `note`, or `span`. Use D2 spans and notes (nested objects) instead.

```d2
# Wrong
sequence_diagram: {
  Alice -> Bob: Hello
}

# Right
shape: sequence_diagram
Alice -> Bob: Hello
```

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

Use labels to preserve capitalization from the prompt.

```d2
shape: sequence_diagram
alice: Alice
bob: Bob
alice -> bob: Hello
```

## Scoping

Actors inside nested blocks still refer to the same top-level actors in the sequence diagram.

```d2
Office chatter: {
  shape: sequence_diagram
  alice: Alice
  bob: Bobby
  awkward small talk: {
    alice -> bob: uhm, hi
    bob -> alice: oh, hello
    icebreaker attempt: {
      alice -> bob: what did you have for lunch?
    }
    unfortunate outcome: {
      bob -> alice: that's personal
    }
  }
}
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

Define spans by connecting nested objects on an actor. Spans appear where they are declared, so order them alongside messages.

```d2
shape: sequence_diagram
alice.t1 -> bob
alice.t2 -> bob.a
alice.t2.a -> bob.a
alice.t2.a <- bob.a
alice.t2 <- bob.a
```

## Notes

Notes are nested objects on an actor without connections. Place them in sequence order to control where they appear. Do not create standalone note shapes.

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
