# Path Construction

BLine supports three equally-supported ways to define a path:

1. **Load from JSON** — most common when using BLine-GUI.
2. **Build programmatically in code** — for dynamic paths or code-only workflows.
3. **Hybrid** — load a path from JSON, then mutate or replace elements before running it.

All three produce the same `Path` object.

## Loading from JSON

Place your file at `src/main/deploy/autos/paths/<name>.json` (the GUI writes there by default) and load it by name without the extension:

```java
Path scoreFirst = new Path("scoreFirst");  // loads deploy/autos/paths/scoreFirst.json
```

`new Path(String)` delegates to `JsonUtils.loadPath(...)`, which:

1. Reads the JSON file.
2. Parses path elements, constraints, and an optional in-file override of global constraints.
3. If no override is present, loads global defaults from `deploy/autos/config.json`.

!!! info "No `.json` extension in the constructor"
    `new Path("scoreFirst")` is correct. `new Path("scoreFirst.json")` is not (it would look for `scoreFirst.json.json`).

### JSON schema

Minimal viable path:

```json
{
    "path_elements": [
        {
            "type": "waypoint",
            "translation_target": { "x_meters": 1.0, "y_meters": 1.0 },
            "rotation_target": { "rotation_radians": 0.0, "profiled_rotation": true }
        },
        {
            "type": "waypoint",
            "translation_target": { "x_meters": 3.0, "y_meters": 1.0 },
            "rotation_target": { "rotation_radians": 3.14159, "profiled_rotation": true }
        }
    ]
}
```

With every optional field populated:

```json
{
    "path_elements": [
        {
            "type": "waypoint",
            "translation_target": {
                "x_meters": 1.0,
                "y_meters": 1.0,
                "intermediate_handoff_radius_meters": 0.2
            },
            "rotation_target": {
                "rotation_radians": 0.0,
                "profiled_rotation": true
            }
        },
        {
            "type": "translation",
            "x_meters": 2.5,
            "y_meters": 2.0,
            "intermediate_handoff_radius_meters": 0.2
        },
        {
            "type": "rotation",
            "rotation_radians": 1.5708,
            "t_ratio": 0.5,
            "profiled_rotation": true
        },
        {
            "type": "event_trigger",
            "t_ratio": 0.7,
            "lib_key": "shoot"
        },
        {
            "type": "waypoint",
            "translation_target": { "x_meters": 3.0, "y_meters": 1.0 },
            "rotation_target": { "rotation_radians": 3.14159, "profiled_rotation": true }
        }
    ],
    "constraints": {
        "max_velocity_meters_per_sec": [
            { "value": 4.5, "start_ordinal": 0, "end_ordinal": 1 },
            { "value": 2.0, "start_ordinal": 2, "end_ordinal": 3 }
        ],
        "max_acceleration_meters_per_sec2": 10.0,
        "max_velocity_deg_per_sec": 540,
        "max_acceleration_deg_per_sec2": 2000,
        "end_translation_tolerance_meters": 0.03,
        "end_rotation_tolerance_deg": 2.0
    }
}
```

### Element types in JSON

=== "Waypoint"

    ```json
    {
        "type": "waypoint",
        "translation_target": {
            "x_meters": 1.0,
            "y_meters": 1.0,
            "intermediate_handoff_radius_meters": 0.2
        },
        "rotation_target": {
            "rotation_radians": 0.0,
            "profiled_rotation": true
        }
    }
    ```

=== "TranslationTarget"

    ```json
    {
        "type": "translation",
        "x_meters": 2.5,
        "y_meters": 2.0,
        "intermediate_handoff_radius_meters": 0.2
    }
    ```

=== "RotationTarget"

    ```json
    {
        "type": "rotation",
        "rotation_radians": 1.5708,
        "t_ratio": 0.5,
        "profiled_rotation": true
    }
    ```

=== "EventTrigger"

    ```json
    {
        "type": "event_trigger",
        "t_ratio": 0.5,
        "lib_key": "myAction"
    }
    ```

    Register the action in code with `FollowPath.registerEventTrigger("myAction", ...)` before running any path that references it. See [Event Triggers](event-triggers.md).

### Constraint value forms

Inside the `constraints` block, velocity/acceleration values accept two shapes:

- **Scalar** — applies to the entire path: `"max_acceleration_meters_per_sec2": 10.0`.
- **Array of ranged constraints** — per-ordinal-range values:
    ```json
    "max_velocity_meters_per_sec": [
        { "value": 4.5, "start_ordinal": 0, "end_ordinal": 2 },
        { "value": 1.5, "start_ordinal": 3, "end_ordinal": 4 }
    ]
    ```

End tolerances are scalar only.

### Loading from a custom directory or string

```java
// Custom autos directory (useful in tests)
Path path = new Path(new File("/path/to/autos"), "scoreFirst");

// From a JSON string (e.g. network data)
Path path = JsonUtils.loadPathFromJsonString(jsonText, globalConstraints);
```

## Building paths in code

The `Path` constructors accept varargs of `PathElement` and an optional `PathConstraints`:

```java
Path simple = new Path(
    new Path.Waypoint(new Translation2d(1.0, 1.0), Rotation2d.fromDegrees(0)),
    new Path.TranslationTarget(new Translation2d(2.0, 2.0)),
    new Path.Waypoint(new Translation2d(3.0, 1.0), Rotation2d.fromDegrees(180))
);
```

### Element constructors worth knowing

```java
// Waypoints
new Path.Waypoint(pose);                                         // Pose2d in
new Path.Waypoint(pose, handoffRadius);                          // custom radius
new Path.Waypoint(translation, rotation);                        // Translation2d + Rotation2d
new Path.Waypoint(translation, rotation, /*profiledRotation=*/ false);

// Translation targets
new Path.TranslationTarget(x, y);
new Path.TranslationTarget(x, y, handoffRadius);
new Path.TranslationTarget(new Translation2d(x, y));

// Rotation targets
new Path.RotationTarget(rotation, tRatio);                       // profiled by default
new Path.RotationTarget(rotation, tRatio, /*profiledRotation=*/ false);

// Event triggers
new Path.EventTrigger(tRatio, "myKey");
```

### Path-specific constraints

```java
Path.PathConstraints slow = new Path.PathConstraints()
    .setMaxVelocityMetersPerSec(2.0)
    .setMaxAccelerationMetersPerSec2(6.0)
    .setMaxVelocityDegPerSec(180)
    .setMaxAccelerationDegPerSec2(720)
    .setEndTranslationToleranceMeters(0.02)
    .setEndRotationToleranceDeg(1.0);

Path alignment = new Path(
    slow,
    new Path.Waypoint(startPose),
    new Path.Waypoint(endPose)
);
```

### Ranged constraints

Pass multiple `RangedConstraint` values to the setter:

```java
Path.PathConstraints ranged = new Path.PathConstraints()
    .setMaxVelocityMetersPerSec(
        new Path.RangedConstraint(4.0, 0, 2),   // ordinals 0–2 capped at 4.0 m/s
        new Path.RangedConstraint(1.5, 3, 4),   // ordinals 3–4 capped at 1.5 m/s
        new Path.RangedConstraint(4.0, 5, Integer.MAX_VALUE)
    );
```

The **first matching range wins**, so if ranges overlap, order matters. See [Constraints → Ranged constraints](../concepts/constraints.md#ranged-constraints) for the ordinal model.

## Global defaults

`Path.setDefaultGlobalConstraints(...)` installs defaults that any subsequently-created path falls back to:

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

If you don't call this method, BLine loads defaults from `deploy/autos/config.json` the first time a `Path` is constructed. Setting defaults programmatically is the right choice in code-only workflows.

## Alliance flipping, mirroring, and copies

Most teams configure flipping on the builder (`withDefaultShouldFlip()`) and don't touch the path manually. For the details — including when to prefer `mirror()` over `flip()`, how symmetry types are handled, and how to construct a mirrored or flipped copy without mutating the original — see [Alliance Flip & Mirror](flip-and-mirror.md).

Quick reference:

```java
Path red = blue.copy();
red.flip();              // rotational symmetry — red alliance mirror image
// ...
blue.mirror();           // vertical mirror across the field width centerline
```

## Utilities for preparing a path

```java
Path.getStartPose()                // first translation + first rotation (default 0° if none)
Path.getStartPose(fallbackRot)     // same, but use fallbackRot if no rotation target exists
Path.getInitialModuleDirection()   // direction modules should face at path start (see pre-match page)
Path.isValid()                     // false if first/last element is not a waypoint or translation target
Path.copy()                        // deep copy, preserves flipped state
```

## Single-element paths

A path consisting of a single `Waypoint` or `TranslationTarget` is valid and useful:

```java
// Simple drive-to-pose
Path alignToReef = new Path(
    new Path.Waypoint(reefScoringPose)
);
pathBuilder.build(alignToReef).schedule();
```

A path that is only a `RotationTarget` or only an `EventTrigger` is **invalid** — `isValid()` returns `false` and `FollowPath.initialize()` will refuse to execute it.
