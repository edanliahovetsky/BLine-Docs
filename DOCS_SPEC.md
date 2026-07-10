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
- Build the relevant mental model before asking the reader to tune, diagnose, or optimize behavior.
- Separate "what to do" from "why it works".
- Distinguish shipped product defaults, tutorial starting values, full-speed tuning values, and advanced overrides. State the context whenever publishing a recommended number.
- Explain the intended supported workflow in tutorials and how-to pages. Keep exact incidental mechanics in concept or reference material when foregrounding them would distract from the normal workflow.
- Keep tutorials linear and avoid side quests.
- Keep reference pages compact and table-friendly.
- Keep troubleshooting pages symptom-first.
- Give a secondary feature one canonical explanatory page. Link to it briefly elsewhere instead of repeating the same checklist across unrelated workflows.
- Avoid marketing language inside technical pages.
- Avoid undocumented claims about performance, adoption, versions, or compatibility.

## Learning Progression

Organize beginner material in this order:

1. achieve one safe, observable success;
2. understand the controller or path concept involved;
3. tune at the intended operating envelope;
4. shape real paths with normal authoring tools; and
5. introduce advanced overrides and edge-case controls.

Do not send a new reader directly from first success into controller tuning without first defining PID at an FRC-appropriate level and explaining the separate jobs of BLine's translation, rotation, and cross-track controllers. Link to the relevant WPILib fundamentals instead of duplicating the complete WPILib controls curriculum.

## Visual Media

Use screenshots and short animations when they make a workflow, UI state, spatial relationship, or robot behavior easier to understand than prose alone. Visuals should teach something specific rather than decorate a page.

### Choosing A Visual

- Use a screenshot for a stable location, control, configuration, or result.
- Use a GIF or other short animation when motion, sequencing, simulation, or direct manipulation is the point.
- Use aligned plots when controller response, constraint effects, or tuning comparisons are the point. Keep axes and test conditions consistent across the compared cases.
- Label synthetic controller plots as illustrative rather than measured robot data. Preserve the real signal's units, sign convention, and mathematical domain even when the curve is schematic.
- Give introductory spatial and control concepts a diagram, annotated screenshot, animation, or plot when prose alone would require the reader to invent the mental model.
- When a tutorial introduces a current GUI workflow, show the exact starting configuration and the resulting state with a screenshot or focused animation when those states are not obvious from text alone.
- Give each visual one clear teaching goal and place it next to the text it supports.
- Keep the surrounding instructions complete enough that the visual is helpful but not the only way to understand an essential step.
- Reuse an asset only when it demonstrates the same current behavior in every context where it appears.

### Freshness And Provenance

- Capture current editor visuals from the public BLine-Web version that the documentation describes. Do not use the legacy BLine-GUI as a source for current workflows.
- Use the latest officially released FRC season field image supported by the current public BLine-Web version for general-purpose screenshots, GIFs, and demos.
- Use an older field only when the season itself is relevant to a historical or compatibility example. Label that season next to the visual and do not reuse the asset to demonstrate a current workflow.
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
- Let short documentation GIFs loop automatically only while they are in the viewport. Do not add bespoke Play, Stop, or Replay controls to ordinary demonstrations.
- Show a useful static poster when motion is outside the viewport, when the reader prefers reduced motion, and in print/PDF output. For reduced motion and print, prefer the informative stable result rather than an empty pre-action frame. The adjacent prose must remain sufficient without animation.
- Make the first frame and final stable frame useful enough that entering or leaving the viewport does not produce a confusing state.
- Crop and optimize media so labels remain legible without imposing unnecessary page weight. Prefer a static image when animation adds little instructional value.
- Use only project-owned media or third-party media whose license permits inclusion and attribution.

### Visual Validation

- Inspect each new or changed visual in the rendered site at desktop and narrow-screen widths.
- Confirm that the visual matches the current documented UI and that its alt text, placement, first frame, and loading behavior are useful.
- Confirm that an animated demonstration starts without a button when it enters the viewport, returns to its poster when it leaves, and stays static under `prefers-reduced-motion`.
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

Source establishes what the software does. Maintainer guidance may establish the recommended way to use that behavior. When those differ, document the mechanics accurately while presenting the maintainer-approved workflow as a recommendation rather than an undocumented runtime guarantee.

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
