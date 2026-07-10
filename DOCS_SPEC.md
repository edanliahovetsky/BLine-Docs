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

## Visual Media

Use screenshots and short animations when they make a workflow, UI state, spatial relationship, or robot behavior easier to understand than prose alone. Visuals should teach something specific rather than decorate a page.

### Choosing A Visual

- Use a screenshot for a stable location, control, configuration, or result.
- Use a GIF or other short animation when motion, sequencing, simulation, or direct manipulation is the point.
- Give each visual one clear teaching goal and place it next to the text it supports.
- Keep the surrounding instructions complete enough that the visual is helpful but not the only way to understand an essential step.
- Reuse an asset only when it demonstrates the same current behavior in every context where it appears.

### Freshness And Provenance

- Capture current editor visuals from the public BLine-Web version that the documentation describes. Do not use the legacy BLine-GUI as a source for current workflows.
- Do not show unreleased UI in general documentation. It is acceptable on a clearly labeled prerelease page when the source revision is identified.
- When a UI change affects a visible label, layout, control, sequence, or result shown in an asset, review every affected screenshot and animation. Replace stale assets in the same documentation change.
- Remove superseded and unreferenced assets instead of retaining indistinguishable old versions.
- When adding or replacing editor visuals, name the BLine-Web release, deployed version, or source revision used for capture in the PR description. The visual itself needs a version label only when the version is relevant to the reader.

### Capture And Accessibility

- Record one focused action at a time. A UI GIF should meet these limits unless the page documents a specific reason for an exception:

| Property | Standard |
| --- | --- |
| Duration | Target 5-12 seconds. Split a longer workflow into focused visuals or use video instead. |
| Width | Prefer 1280 px when labels remain clear and the file stays within the size limit; use 960 px for a smaller output. Do not exceed 1280 px without a specific need. |
| Frame rate | Use 10-15 fps; default to 12 fps for UI demonstrations. |
| File size | Keep the final GIF below 15 MB. Treat 15 MB as a rejection threshold, not a target, and prefer the smallest readable result. |
| Playback speed | Keep playback close to real time. If adjusted, stay between 0.75x and 1.25x. |

- Begin with useful context, show the key action and its result, and end on a stable confirmation frame.
- Leave about 0.7-1.4 seconds between visible pointer or keyboard actions and 0.8-2 seconds after a state-changing action so the result can be read.
- Never compress the gap between user actions below 0.5 seconds. Avoid more than 2.5 seconds of static dead time unless a real processing delay is part of the behavior being demonstrated.
- Use representative demo data, a consistent viewport and theme within a workflow, deliberate pointer movement, and a clearly visible end state.
- Exclude personal information, secrets, debug overlays, notifications, unrelated browser chrome, and other temporary UI.
- Write alt text that describes the visual's instructional purpose rather than repeating its filename or a generic label such as "demo."
- Do not rely on motion, color, or audio alone to communicate required information. Avoid rapid flashing and respect reduced-motion preferences.
- Make the first frame and adjacent prose useful in static output such as the generated PDF. Provide playback controls or a static alternative when a longer or continuously looping animation is necessary.
- Crop and optimize media so labels remain legible without imposing unnecessary page weight. Prefer a static image when animation adds little instructional value.
- Use only project-owned media or third-party media whose license permits inclusion and attribution.

### Visual Validation

- Inspect each new or changed visual in the rendered site at desktop and narrow-screen widths.
- Confirm that the visual matches the current documented UI and that its alt text, placement, first frame, and loading behavior are useful.
- Verify GIF duration, pixel dimensions, frame rate, playback speed, and file size from the generated file rather than judging them by eye.
- Inspect the frame after each key action as well as the first, transition, and final frames. Each action's result must be visible before the next action begins.
- Check for empty or broken media references and remove obsolete assets after replacements.
- Check static or PDF output when a page depends on animation to explain a behavior.

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
- screenshots or animations that show any affected workflow, label, layout, control, or result

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

For changes involving visual media, perform the checks in [Visual Validation](#visual-validation) and confirm that replaced assets are no longer referenced.

For docs generated from a source change, PR descriptions should briefly name the source behavior that was verified. When editor visuals are added or replaced, also identify the BLine-Web version or revision used for capture.
