# Constraints & Ordinals

Path geometry says **where** the robot should travel. Constraints say **how quickly** BLine may command it to travel. Global defaults establish the normal envelope; path constraints override selected parts of one path.

Of these controls, **maximum translation velocity is the one you will use most while authoring paths**. It controls how aggressively the robot approaches corners, handoffs, obstacles, and the final pose. Maximum acceleration controls how quickly the commanded velocity may change; it is not a substitute for choosing an appropriate velocity along the route.

## The normal authoring loop

Use constraints as part of path creation, not as a cleanup step after the geometry is finished:

1. Draw the route with the fewest anchors that describe it clearly.
2. Decide where the robot may travel quickly and where it must slow down.
3. Run the maximum-velocity optimizer for an initial set of local caps.
4. Review the generated ranged constraints and edit any region with a mechanism, clearance, or scoring requirement the optimizer cannot know.
5. Simulate to check the structure and sequencing.
6. Test incrementally on the robot and refine local **maximum-velocity ranged constraints**.

```text
geometry  →  velocity plan  →  optimizer  →  simulate  →  robot test
   ↑                                                        |
   └─────────────── refine geometry or local caps ─────────┘
```

The optimizer makes a geometry-based first proposal. The author still owns the velocity plan.

## Constraint types

| Constraint | Units | Global default | Path-wide/ranged |
| --- | --- | --- | --- |
| Maximum translation velocity | m/s | Yes | Yes |
| Maximum translation acceleration | m/s² | Yes | Yes |
| Minimum translation velocity | m/s | No; zero when absent | Yes |
| Maximum rotation velocity | deg/s | Yes | Yes |
| Maximum rotation acceleration | deg/s² | Yes | Yes |
| Minimum rotation velocity | deg/s | No; zero when absent | Yes |
| End translation tolerance | m | Yes | One scalar per path |
| End rotation tolerance | deg | Yes | One scalar per path |

Handoff radius is configured globally or per translation element; it is not a path-specific ranged constraint. See [Handoffs, t-ratio & Completion](key-parameters.md).

## Maximum translation velocity shapes the path

A polyline does not encode a time schedule. BLine continuously drives toward the active translation target, and the active maximum-velocity constraint caps that command. This makes local maximum velocity central to normal path design:

- keep open, straight travel near the tested chassis envelope;
- lower the cap before a tight direction change or constrained opening;
- lower it while a mechanism is extended or a game piece must remain stable;
- lower it on the approach to a precise final pose; and
- leave enough distance at the lower cap for the real robot to respond.

Changing only a handoff radius changes **where** the next segment becomes active. Changing maximum velocity changes **how fast** the robot reaches that transition. Decide the intended route first, then use maximum-velocity ranged constraints to make that route achievable.

## Resolution order

For each element and constraint type, BLine-Lib resolves the value in this order:

1. The **first** path-specific ranged constraint whose inclusive bounds contain that element's ordinal.
2. The matching global maximum/default when no ranged constraint matches.
3. Zero for a minimum-velocity constraint with no matching path-specific ranged constraint.

Path end tolerances use their path scalar when present, otherwise the global value.

!!! warning "Ranged-constraint order matters in hand-authored data"
    If overlapping ranged constraints reach BLine-Lib, the first matching ranged constraint wins. BLine Web repairs its ranged-constraint model to avoid overlap, but generated Java or JSON should not depend on ambiguous ordering.

## Translation and rotation use separate ordinals

Ordinals are not raw positions in `path_elements`.

Consider:

```text
Path order:        Waypoint   Event   Translation   Rotation   Waypoint
Translation track:    1                   2                       3
Rotation track:       1                              2            3
```

- A **Waypoint** increments both tracks.
- A **Translation Target** increments only the translation track.
- A **Rotation Target** increments only the rotation track.
- An **Event Trigger** increments neither constraint track.

Translation ranged constraints use the translation track. Rotation ranged constraints use the rotation track.

### Editor versus runtime numbering

BLine Web shows ordinals starting at **1**. Exported path JSON and Java `RangedConstraint` use **zero-based** ordinals.

| BLine Web | Runtime JSON/Java |
| ---: | ---: |
| 1 | 0 |
| 2 | 1 |
| 3 | 2 |

Use the editor rather than manually converting ranged-constraint ordinals when possible.

## A common recipe: fast straight, slow turn

For a path with four translation anchors:

1. Leave the open straight at the global maximum.
2. Add a maximum-translation-velocity ranged constraint covering the anchor before the turn and the turn anchor.
3. Run the optimizer for an initial cap.
4. Simulate to confirm the slowdown occurs in the intended section.
5. Test on the robot and adjust the cap from observed behavior.

Do not shrink the handoff radius as the first response to high-speed overshoot. Lower the velocity into the handoff so the robot can physically enter it.

## Java API

A scalar Java setter creates a whole-path ranged constraint:

```java
Path.PathConstraints constraints = new Path.PathConstraints()
    .setMaxVelocityMetersPerSec(3.0)
    .setMaxAccelerationMetersPerSec2(4.0)
    .setEndTranslationToleranceMeters(0.05)
    .setEndRotationToleranceDeg(2.0);
```

Use `RangedConstraint` for local values. Bounds are inclusive and zero-based:

```java
constraints.setMaxVelocityMetersPerSec(
    new Path.RangedConstraint(4.0, 0, 1),
    new Path.RangedConstraint(1.8, 2, 3)
);
```

Attach the constraints when constructing the path:

```java
Path path = new Path(elements, constraints);
```

## Runtime JSON constraint form

In BLine-Lib v0.9.1, all six velocity/acceleration constraint fields must be arrays of range objects. Only end tolerances are scalar.

```json
{
  "max_velocity_meters_per_sec": [
    { "value": 4.0, "start_ordinal": 0, "end_ordinal": 1 },
    { "value": 1.8, "start_ordinal": 2, "end_ordinal": 3 }
  ],
  "max_acceleration_meters_per_sec2": [
    { "value": 4.0, "start_ordinal": 0, "end_ordinal": 3 }
  ],
  "end_translation_tolerance_meters": 0.05,
  "end_rotation_tolerance_deg": 2.0
}
```

Place this object under the path's top-level `constraints` key. Its ordinals must correspond to real elements in that path; see [Construct Paths & JSON](../lib/path-construction.md#complete-path-json) for a complete valid file.

Do not hand-write a numeric scalar for a max/min velocity or acceleration field; v0.9.1 ignores that unsupported form.

## Minimum velocity constraints

Minimum baselines are an **advanced controller-domain tool**, not part of the normal path-authoring workflow. They force the magnitude of BLine's translation or rotation command up to a floor while the corresponding error remains outside its end tolerance.

Possible advanced uses include:

- intentionally carrying a nonzero command into the tolerance region before a chained path begins;
- shaping the portion of the endpoint approach in which the controller can request very small outputs; or
- a tested edge case that specifically requires a nonzero command floor.

Start at zero and first solve ordinary path behavior with controller tuning, maximum-velocity ranged constraints, handoff behavior, and tolerances. A minimum that is too high can carry the robot through the tolerance, create overshoot, or produce chatter.

!!! warning "A minimum does not create continuous path chaining by itself"
    `FollowPath` still sends zero chassis speeds when the command ends in BLine-Lib v0.9.1. If a composed routine uses a minimum to arrive at the final tolerance with nonzero motion, test the entire command transition and its requirements rather than assuming velocity continuity.

If the resolved minimum exceeds the resolved maximum at an ordinal, BLine warns, falls back to the global maximum, and disables the minimum there.

When an advanced use is intentional, minimum constraints use the same ranged array form:

```json
{
  "min_velocity_meters_per_sec": [
    { "value": 0.3, "start_ordinal": 2, "end_ordinal": 3 }
  ]
}
```

## Constraints are not guarantees

- A velocity cap does not prove the path is collision-free.
- An acceleration cap limits command changes; it does not model every wheel-force or voltage limit.
- The Web optimizer uses path geometry and settings to propose maximum-velocity caps; it is not a full drivetrain dynamics optimizer.
- Real motion still depends on the module controller, battery, carpet, mass distribution, pose estimate, and contact with game pieces.

Validate on the robot after completing [controller tuning](../getting-started/tuning.md); the editor preview alone is not a dynamics test.

## Next

- [Constraints & Optimizer in BLine Web](../gui/sidebar.md)
- [Construct Paths & JSON](../lib/path-construction.md)
- [Practical Recipes](../usage-tips.md)
