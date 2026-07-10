# Constraints & Ordinals

Constraints limit the chassis command BLine produces. Global defaults establish the normal envelope; path constraints override selected parts of one path.

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

Handoff radius is configured globally or per translation element; it is not a path-range constraint. See [Handoffs, t-ratio & Completion](key-parameters.md).

## Resolution order

For each element and constraint type, BLine-Lib resolves the value in this order:

1. The **first** path range whose inclusive bounds contain that element's ordinal.
2. The matching global maximum/default when no range matches.
3. Zero for a minimum-velocity constraint with no matching path range.

Path end tolerances use their path scalar when present, otherwise the global value.

!!! warning "Range order matters in hand-authored data"
    If overlapping ranges reach BLine-Lib, the first matching range wins. BLine Web repairs its range model to avoid overlap, but generated Java or JSON should not depend on ambiguous ordering.

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

Translation velocity/acceleration ranges use the translation track. Rotation ranges use the rotation track.

### Editor versus runtime numbering

BLine Web shows ordinals starting at **1**. Exported path JSON and Java `RangedConstraint` use **zero-based** ordinals.

| BLine Web | Runtime JSON/Java |
| ---: | ---: |
| 1 | 0 |
| 2 | 1 |
| 3 | 2 |

Use the editor rather than manually translating ranges when possible.

## A common recipe: fast straight, slow turn

For a path with four translation anchors:

1. Leave the open straight at the global maximum.
2. Add a max-translation-velocity range covering the anchor before the turn and the turn anchor.
3. Run the optimizer or choose a conservative manual cap.
4. Simulate to confirm the slowdown occurs in the intended section.
5. Test on the robot and adjust from logs.

Do not shrink the handoff radius as the first response to high-speed overshoot. Lower the velocity into the handoff so the robot can physically enter it.

## Java API

A scalar Java setter creates a whole-path range:

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
  "min_velocity_meters_per_sec": [
    { "value": 0.3, "start_ordinal": 0, "end_ordinal": 1 }
  ],
  "end_translation_tolerance_meters": 0.05,
  "end_rotation_tolerance_deg": 2.0
}
```

Place this object under the path's top-level `constraints` key. Its ordinals must correspond to real elements in that path; see [Construct Paths & JSON](../lib/path-construction.md#complete-path-json) for a complete valid file.

Do not hand-write a numeric scalar for a max/min velocity or acceleration field; v0.9.1 ignores that unsupported form.

## Minimum velocity constraints

Minimum baselines are an advanced tool for static friction or drivetrain deadband. They apply only while the corresponding error is outside its end tolerance.

Start at zero. A value that is too high can cause overshoot or chatter. If the resolved minimum exceeds the resolved maximum at an ordinal, BLine warns, falls back to the global maximum, and disables the minimum there.

## Constraints are not guarantees

- A velocity cap does not prove the path is collision-free.
- An acceleration cap limits command changes; it does not model every wheel-force or voltage limit.
- The Web optimizer uses path geometry and settings to propose caps; it is not a full drivetrain dynamics optimizer.
- Real motion still depends on the module controller, battery, carpet, mass distribution, pose estimate, and contact with game pieces.

Validate with [robot tuning logs](../getting-started/tuning.md), not the editor preview alone.

## Next

- [Constraints & Optimizer in BLine Web](../gui/sidebar.md)
- [Construct Paths & JSON](../lib/path-construction.md)
- [Practical Recipes](../usage-tips.md)
