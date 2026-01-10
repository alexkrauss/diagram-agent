# Icons & Images

Icons and images enhance diagrams with visual elements. D2 supports URLs for icons.

## Adding icons to shapes

Use the `icon` property with a URL:

```d2
deploy: {
  icon: https://icons.terrastruct.com/aws%2FDeveloper%20Tools%2FAWS-CodeDeploy.svg
}

backup: {
  icon: https://icons.terrastruct.com/aws%2FStorage%2FAWS-Backup.svg
}
```

Alternative dot notation:

```d2
server.icon: https://icons.terrastruct.com/tech/022-server.svg
```

## Icons on connections

Connections can also have icons:

```d2
deploy -> backup: {
  icon: https://icons.terrastruct.com/infra%2F002-backup.svg
}
```

## Standalone image shapes

Use `shape: image` for shapes that are purely an image with no border:

```d2
server: {
  shape: image
  icon: https://icons.terrastruct.com/tech/022-server.svg
}

github: {
  shape: image
  icon: https://icons.terrastruct.com/dev/github.svg
}

server -> github
```

Both `shape: image` and `icon:` are required for standalone images.

## Icons with other styling

Icons work alongside fill, stroke, and font-color:

```d2
data: Processed Data {
  shape: rectangle
  icon: https://icons.terrastruct.com/essentials%2F092-copy.svg
  style: {
    fill: "#E8F4F8"
    font-color: "#2C3E50"
  }
}
```

## Container icons

Container icons appear in the top-left corner:

```d2
cluster: Kubernetes Cluster {
  icon: https://icons.terrastruct.com/azure%2FContainer%20Service.svg

  pod_a: Pod A
  pod_b: Pod B
}
```

## Common mistakes

Wrong - using `image:` instead of `icon:`:
```d2
# WRONG
server.image: https://example.com/icon.svg
```

Right - use `icon:`:
```d2
# CORRECT
server.icon: https://example.com/icon.svg
```

Wrong - standalone image without `shape: image`:
```d2
# WRONG - icon appears inside a rectangle
logo: {
  icon: https://example.com/logo.svg
}
```

Right - add `shape: image` for borderless standalone images:
```d2
# CORRECT
logo: {
  shape: image
  icon: https://example.com/logo.svg
}
```

## Icon resources

Free icons for software diagrams: https://icons.terrastruct.com
