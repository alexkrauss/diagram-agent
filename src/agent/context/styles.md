# Styles

Style values live under `style`. You can set them via `shape.style.*` or a `style` block on shapes or connections.

## Fill

```d2
direction: right
x -> y: hi
y -> z
x.style.fill: "#f4a261"
y.style.fill: honeydew
z.style.fill: "linear-gradient(#f69d3c, #3f87a6)"
```

## Stroke

```d2
direction: right
x -> y: hi {
  style: {
    stroke: deepskyblue
  }
}
# Quotes required for hex colors
x.style.stroke: "#f4a261"
```

## Stroke width

```d2
direction: right
x -> y: hi {
  style: {
    stroke-width: 8
  }
}
x.style.stroke-width: 1
```

## Font color

```d2
direction: right
x -> y: hi {
  style: {
    font-color: red
  }
}
x.style.font-color: "#f4a261"
```
