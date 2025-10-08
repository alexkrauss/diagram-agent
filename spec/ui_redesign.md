# UI redesign

We want to create a design for the main interface.

Main components:

- A chat panel, where the user can communicate with the model.
- A canvas panel, which previews the canvas content (the diagram DSL)
- A render panel, which shows the rendered result (as SVG)

Secondary UI parts:

- A configuration panel. Which allows selecting a provider / model, and (depending on the provider) an API Key
  This should be hideable so that it does not use screen space when not used.

## Chat panel

- Often the model does not answer with text but just updates the canvas. This should be indicated in by some small entry (like "Canvas updated.")

- User can enter text.
- User can also paste images from the clipboard.

## Canvas panel

- Should be hideable, when the user just wants to see the rendered result. Default: open
- Monospace Font in a Textarea / editor panel.

## Preview panel

-- Normally shows an image
-- May show an error message instead, in case of rendering error.
-- A button for copying the image into clipboard

## Configuration panel

Keep it simple for now.

## Other UI elements

- A small status indicator showing the state. Running / Ready
- A reset button
