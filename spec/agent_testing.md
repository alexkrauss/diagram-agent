# Agent Test Harness

This document defines the required setup for testing the diagram agent properly.

## Goals

We need a test harness

- Ensure that we can iterate on prompts, tools and model choices and have a consistent view on
  the resulting overall agent performance.
- Guard against regressions
- Understand fundamental limitations of the approach
- judge the impact of any structural changes

## Requirements

- must be compatible with the overall tech stack, i.e., be written in typescript
- must call the "real models" (not mocks), since this is what we are going to test
- must include the rendering pipeline, to feed back rendered results. Thus, must find a way of rendering svgs to pixels.

- must provide a simple way to specify test scenarios in the form of chat sessions and expected results.
  -- suggestion: a yaml or similar textual format for this, interpreted by code.
- must have a way to deal with inherent nondeterminism. How do we judge if the produced diagram description is correct? Idea: Use an LLM-as-a-judge approach to at least make sure that some basic properties of the result are present (e.g., the following components must be in the picture)
