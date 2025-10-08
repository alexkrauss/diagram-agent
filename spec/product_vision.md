# Product Vision

This client-side app implements an agent loop suitable for creating diagrammatic visualizations of medium complexity.
It is intended to be used for

- Architecture diagrams
- Flowcharts
- Sequence diagrams
- (similar visualizations.)

It is not intended to be used for visualizing numerical datasets.

Users can describe a diagram via prompting or paste an image from somewhere else.
The agent will then try to create the diagram using a diagram DSL (currently: D2)
The agent can "see" its own results and thus correct its own actions.

We want to bring this to a state where it can be conveniently used by software engineers and architects for
diagrams of medium complexity (about 30 elements). We want to provide significant added value over the baseline,
which is using some SaaS or often proprietary tool for drawing or, alternatively, writing the diagram DSL themselves.

The app is easy to use without installation just from a browser, since users simply bring their own API key for a
model of their choice (of some supported and tested models). So there is no onboarding, account creation etc. Users
must manage their diagrams by some other means (by putting them into local files). Optionally, we can allow storing
in local storage.
