# Constraints

Constraints are the primary knob you'll use to shape robot motion in BLine. Velocity limits in particular are how you keep the robot from overshooting turns — far more effective than shrinking handoff radii, which costs path precision.

## The six constraint types

| Constraint | Unit | Applies to |
|------------|------|------------|
| **Max Translational Velocity** | m/s | Every translation segment |
| **Max Translational Acceleration** | m/s² | Translation rate limiting |
| **Max Rotational Velocity** | deg/s | Holonomic rotation |
| **Max Rotational Acceleration** | deg/s² | Rotation rate limiting |
| **End Translation Tolerance** | m | Path-completion check |
| **End Rotation Tolerance** | deg | Path-completion check |

Velocity and acceleration constraints can be applied **globally**, **per path**, or **per range of ordinals** within a path. Tolerances apply per path (or globally as defaults) only.

There is also a seventh related value, the **intermediate handoff radius** (m), which is configurable per-translation-element and as a global default. See [Key Parameters](key-parameters.md#handoff-radius).

## Global defaults

Global defaults provide fallback values when a path doesn't override them. Set them once, before the first `Path` is created.

=== "Via config.json"

    `src/main/deploy/autos/config.json`:

    ```json
    {
        "default_max_velocity_meters_per_sec": 4.5,
        "default_max_acceleration_meters_per_sec2": 10.0,
        "default_max_velocity_deg_per_sec": 600,
        "default_max_acceleration_deg_per_sec2": 2000,
        "default_end_translation_tolerance_meters": 0.03,
        "default_end_rotation_tolerance_deg": 2.0,
        "default_intermediate_handoff_radius_meters": 0.25
    }
    ```

    The GUI also accepts a nested `kinematic_constraints` object — BLine-Lib v0.8.3+ reads both shapes. Older configs are migrated automatically when the GUI opens a project.

=== "In code"

    ```java
    Path.setDefaultGlobalConstraints(new Path.DefaultGlobalConstraints(
        4.5,    // maxVelocityMetersPerSec
        10.0,   // maxAccelerationMetersPerSec2
        600,    // maxVelocityDegPerSec
        2000,   // maxAccelerationDegPerSec2
        0.03,   // endTranslationToleranceMeters
        2.0,    // endRotationToleranceDeg
        0.25    // intermediateHandoffRadiusMeters
    ));
    ```

=== "In the GUI"

    **Settings → Edit Config…** writes `config.json` for you. Always set the kinematic defaults before designing paths.

!!! info "Global defaults do **not** support ranged constraints"
    You can only set a single scalar value for each global default. "Fast here, slow there" behavior must be specified at the path level via [ranged constraints](#ranged-constraints).

## Path-specific constraints

`Path.PathConstraints` overrides global defaults for an individual path. Use the fluent builder:

```java
Path.PathConstraints constraints = new Path.PathConstraints()
    .setMaxVelocityMetersPerSec(2.0)
    .setMaxAccelerationMetersPerSec2(6.0)
    .setMaxVelocityDegPerSec(180)
    .setMaxAccelerationDegPerSec2(720)
    .setEndTranslationToleranceMeters(0.02)
    .setEndRotationToleranceDeg(1.0);

Path slow = new Path(
    constraints,
    new Path.Waypoint(startPose),
    new Path.Waypoint(endPose)
);
```

Any field you don't set falls back to the global default. You can load a path from JSON and still override constraints in code via `path.setPathConstraints(...)` if you need to mutate them dynamically.

## Ranged constraints

Ranged constraints apply a velocity or acceleration value only to elements within a given **ordinal range**. This is how you slow down through a tight turn without dragging the entire path down.

```java
Path.PathConstraints ranged = new Path.PathConstraints()
    .setMaxVelocityMetersPerSec(
        new Path.RangedConstraint(4.0, 0, 2),           // fast through ordinals 0–2
        new Path.RangedConstraint(1.5, 3, 4),           // slow through ordinals 3–4
        new Path.RangedConstraint(4.0, 5, Integer.MAX_VALUE) // fast after ordinal 5
    );
```

### Ordinals — translation and rotation tracked separately

| Element type | Translation ordinal | Rotation ordinal |
|--------------|:-------------------:|:----------------:|
| `Waypoint`          | increments | increments |
| `TranslationTarget` | increments | — |
| `RotationTarget`    | — | increments |
| `EventTrigger`      | — | — |

A translation-side ranged constraint (`setMaxVelocityMetersPerSec`, `setMaxAccelerationMetersPerSec2`) matches the **translation ordinal** of the element it's applied to. A rotation-side ranged constraint matches the **rotation ordinal**. Event triggers don't participate in ordinals at all.

**Worked example:**

| Element | Translation ord. | Rotation ord. |
|---------|:---:|:---:|
| Waypoint | 0 | 0 |
| TranslationTarget | 1 | — |
| RotationTarget | — | 1 |
| TranslationTarget | 2 | — |
| Waypoint | 3 | 2 |

A `RangedConstraint(1.5, 2, 3)` on `setMaxVelocityMetersPerSec` caps speed while the robot drives to ordinals 2 and 3 (the third TranslationTarget and the final Waypoint). A `RangedConstraint(360, 0, 1)` on `setMaxVelocityDegPerSec` caps angular speed while the robot pursues rotation ordinals 0 and 1.

!!! info "Matching rule"
    For each element, BLine walks the constraint list in array order and uses the **first** range whose `[start_ordinal, end_ordinal]` contains the element's ordinal. If no range matches, the global default is used — so "unconstrained" elements still respect the global cap.

    Because the first matching range wins, **list order matters** when ranges overlap.

!!! tip "Unbounded ranges"
    Use `Integer.MAX_VALUE` as `endOrdinal` to say "from this ordinal onward." BLine treats the range as unbounded-right.

### JSON form

```json
{
    "path_elements": [ /* ... */ ],
    "constraints": {
        "max_velocity_meters_per_sec": [
            { "value": 4.5, "start_ordinal": 0, "end_ordinal": 2 },
            { "value": 1.5, "start_ordinal": 3, "end_ordinal": 4 }
        ],
        "max_acceleration_meters_per_sec2": [
            { "value": 10.0, "start_ordinal": 0, "end_ordinal": 2147483647 }
        ],
        "max_velocity_deg_per_sec": 540,
        "max_acceleration_deg_per_sec2": 2000,
        "end_translation_tolerance_meters": 0.03,
        "end_rotation_tolerance_deg": 2.0
    }
}
```

A constraint that is a plain number is treated as a single unbounded range. Mix and match freely.

### In the GUI

When you click a ranged constraint's slider, a green overlay highlights the affected segments on the canvas. Drag the slider handles to change the start/end ordinals, or open the **constraint pop-out editor** (BLine-GUI v0.5.0+) for a wider editing surface.

![Constraint Visualization](../assets/gifs/canvas/constraint-overlay.gif)

## How constraints actually shape motion

At every cycle, BLine's `FollowPath`:

1. Resolves the **active constraint** for the current target element (looking up translation ordinal for velocity/accel, rotation ordinal for rot velocity/accel).
2. Clamps the translation controller's output to the max translational velocity.
3. Feeds the commanded `ChassisSpeeds` into `ChassisRateLimiter`, which limits both the 2D translational rate and the rotational rate based on the active max accelerations.

The cross-track controller's output is **not** clamped by the velocity constraint — it's summed with the clamped translation output before rate limiting. This matters when you tune CTE gains: it can contribute meaningful perpendicular velocity on top of the translation command.

!!! tip "Prefer velocity limits to shrink handoff radii"
    When a path overshoots a turn, the first-line fix is a ranged velocity cap **before** the turn. Shrinking the handoff radius is a last resort: if the robot is still moving faster than the radius allows, it can miss the handoff zone entirely and oscillate.

## See also

- [Key Parameters](key-parameters.md) — handoff radii, t_ratios, and end tolerances in depth.
- [Tuning & Usage Tips](../usage-tips.md) — how to choose numeric values for all of the above.
- [Library: Path Construction](../lib/path-construction.md) — ranged constraints in JSON and code.
