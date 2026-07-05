# BLine Documentation Spec

This file defines how BLine public documentation should be maintained. It is safe for contributors and automation to use as the public source of truth for docs quality.

## Goals

BLine docs should help FRC students and mentors build working autonomous paths quickly, understand the tradeoffs behind BLine's polyline model, and look up exact API or workflow details without guessing.

Every docs change should preserve three properties:

- **Source-grounded.** API names, defaults, versions, file formats, UI labels, and behavior must be verified from source or released artifacts.
- **Task useful.** Pages should answer what a user is trying to do or understand.
- **Scannable.** Users should be able to find commands, examples, tables, and troubleshooting steps quickly.

## Page Types

Use the page's job to decide how to write it.

| Type | Purpose | Examples |
| --- | --- | --- |
| Tutorial | Get a new user to first success in order. | Installation, Quick Start |
| How-to | Complete a specific task. | Logging, flip/mirror, event triggers |
| Concept | Build mental model and explain tradeoffs. | Path elements, constraints, design philosophy |
| Reference | Provide precise lookup material. | API reference, logging keys, JSON fields |
| Troubleshooting | Diagnose symptoms and fixes. | Common issues |

Do not force every page into the same heading template. Match the structure to the page type.

## Writing Rules

- Write for FRC students and mentors.
- Prefer concrete robot/path examples over abstract prose.
- Define terms before relying on them.
- Separate "what to do" from "why it works".
- Keep tutorials linear and avoid side quests.
- Keep reference pages compact and table-friendly.
- Keep troubleshooting pages symptom-first.
- Avoid marketing language inside technical pages.
- Avoid undocumented claims about performance, adoption, versions, or compatibility.

## Source Of Truth

Use the relevant source before changing docs:

- **BLine-Lib:** public Java API, path loading, constraints, defaults, logging, event triggers, flip/mirror, module orientation, robot behavior.
- **BLine-Web:** current editor workflows, import/export, simulation, visible terminology, settings, downloads, and generated files.
- **BLine-GUI:** legacy context only unless explicitly maintaining legacy docs.
- **BLine-Docs:** public documentation structure, navigation, examples, and current claims.

If source and docs disagree, fix the docs or clearly mark the uncertainty before merging.

## Docs-Required Changes

Update or explicitly review docs when a change affects what users must know, do, install, configure, or expect.

Library changes that usually require docs review:

- public API signatures, constructors, records, or builder methods
- path JSON schema or file locations
- default constraints, tolerances, handoff radii, velocity/acceleration behavior, or tuning guidance
- event trigger registration or firing behavior
- alliance flip, mirror, or pre-match module orientation behavior
- logging keys, value meanings, or logging consumer behavior
- installation, dependency, release, or version changes

Web/editor changes that usually require docs review:

- menu, sidebar, canvas, simulation, protrusion, import, export, save, or download workflows
- visible labels, terminology, settings, or defaults
- platform support or install/download behavior
- JSON compatibility or generated path file behavior

Changes that usually do not require docs updates:

- internal refactors
- private helpers
- tests only
- formatting only
- dependency updates with no user-visible effect
- implementation changes that preserve documented behavior

## Validation

Before merging docs changes:

```bash
mkdocs build
```

Also check affected links/navigation when adding, moving, or renaming pages.

For docs generated from a source change, PR descriptions should briefly name the source behavior that was verified.
