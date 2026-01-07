# Containers

Use dot notation to place shapes inside containers.

```d2
server
# Declares a shape inside of another shape
server.process

# Can declare the container and child in same line
im a parent.im a child

# Since connections can also declare keys, this works too
apartment.Bedroom.Bathroom -> office.Spare Room.Bathroom: Portal
```

## Nested syntax

Use nested maps to avoid repeating container prefixes.

```d2
clouds: {
  aws: {
    load_balancer -> api
    api -> db
  }
  gcloud: {
    auth -> db
  }

  gcloud -> aws
}
```

When referencing nested shapes outside the container, use the full path to avoid creating new top-level shapes.

```d2
users -> clouds.aws.load_balancer
users -> clouds.gcloud.auth
```

```d2
# Wrong: creates top-level aws/gcloud
aws.load_balancer -> aws.api

# Right
clouds.aws.load_balancer -> clouds.aws.api
```

## Container labels

Shorthand label or the reserved `label` keyword.

```d2
gcloud: Google Cloud {
  auth -> db
}
```

```d2
gcloud: {
  label: Google Cloud
  auth -> db
}
```

Use container keys (not labels) when referencing containers in connections. For multi-word labels, pick a short key and set a label.

```d2
clouds: {
  aws: "Amazon Web Services" {
    load_balancer
    db
    load_balancer -> db
  }
  gcloud: "Google Cloud Platform" {
    auth
    auth -> _.aws.db
  }

  gcloud -> aws
}

users -> clouds.aws.load_balancer
users -> clouds.gcloud.auth
```

## Reference parent

Use `_` to reference the parent container.

```d2
christmas: {
  presents
}
birthdays: {
  presents
  _.christmas.presents -> presents: regift
  _.christmas.style.fill: "#ACE1AF"
}
```
