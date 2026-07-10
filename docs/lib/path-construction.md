# Construct Paths & JSON

Create paths from exported runtime JSON or directly in Java. Both produce the same `Path` model used by `FollowPath`.

## Runtime folder

BLine-Lib resolves:

```text
deploy/autos/
├── config.json
└── paths/
    └── score-left.json
```

On the roboRIO, `deploy` is WPILib's deploy directory. Desktop/test fallback is `src/main/deploy`.

Load by filename without `.json`:

```java
Path scoreLeft = new Path("score-left");
```

`new Path("score-left")` appends the extension and loads `autos/paths/score-left.json`. The lower-level `JsonUtils.loadPath("score-left.json")` expects the extension.

## `config.json`

Every file-based load through `new Path(String)`, `new Path(File, String)`, or `JsonUtils.loadPath(File, String)` reads `autos/config.json` beside that path tree and makes those values the process-wide defaults. BLine Web writes the nested form:

```json
{
  "kinematic_constraints": {
    "default_max_velocity_meters_per_sec": 4.5,
    "default_max_acceleration_meters_per_sec2": 12.0,
    "default_intermediate_handoff_radius_meters": 0.45,
    "default_max_velocity_deg_per_sec": 720.0,
    "default_max_acceleration_deg_per_sec2": 1500.0,
    "default_end_translation_tolerance_meters": 0.03,
    "default_end_rotation_tolerance_deg": 2.0
  }
}
```

Flat versions of the same keys are also accepted. A missing or unreadable config file can fail file-based path loading; deploy it with the path files.

Programmatic workflows can set the process-wide defaults:

```java
Path.setDefaultGlobalConstraints(new Path.DefaultGlobalConstraints(
    4.5,
    12.0,
    720.0,
    1500.0,
    0.03,
    2.0,
    0.45
));
```

Global defaults are static. Programmatic element constructors use the current static values; if none have been established, they attempt to load the default deploy `autos/config.json`. Supplying explicit defaults to a constructor or calling `Path.setDefaultGlobalConstraints(...)` changes what later programmatic paths inherit, but a later file-based path load reads its own autos-directory config again.

## Complete path JSON

```json
{
  "path_elements": [
    {
      "type": "waypoint",
      "translation_target": {
        "x_meters": 4.0,
        "y_meters": 2.0,
        "intermediate_handoff_radius_meters": 0.35
      },
      "rotation_target": {
        "rotation_radians": 0.0,
        "profiled_rotation": true
      }
    },
    {
      "type": "event_trigger",
      "t_ratio": 0.4,
      "lib_key": "deployIntake"
    },
    {
      "type": "translation",
      "x_meters": 6.0,
      "y_meters": 2.8,
      "intermediate_handoff_radius_meters": 0.4
    },
    {
      "type": "rotation",
      "rotation_radians": 1.5708,
      "t_ratio": 0.5,
      "profiled_rotation": true
    },
    {
      "type": "waypoint",
      "translation_target": {
        "x_meters": 7.5,
        "y_meters": 3.4
      },
      "rotation_target": {
        "rotation_radians": 1.5708,
        "profiled_rotation": true
      }
    }
  ],
  "constraints": {
    "max_velocity_meters_per_sec": [
      { "value": 3.5, "start_ordinal": 0, "end_ordinal": 1 },
      { "value": 1.5, "start_ordinal": 2, "end_ordinal": 2 }
    ],
    "max_acceleration_meters_per_sec2": [
      { "value": 4.0, "start_ordinal": 0, "end_ordinal": 2 }
    ],
    "end_translation_tolerance_meters": 0.05,
    "end_rotation_tolerance_deg": 2.0
  }
}
```

### Element fields

| Type | Required fields | Important optional fields |
| --- | --- | --- |
| `translation` | `x_meters`, `y_meters` | `intermediate_handoff_radius_meters` |
| `rotation` | `rotation_radians` | `t_ratio`, `profiled_rotation` |
| `event_trigger` | `lib_key` | `t_ratio` |
| `waypoint` | nested translation and rotation targets | handoff radius, `profiled_rotation` |

Write `profiled_rotation` explicitly. If JSON omits it, v0.9.1 reads `false`; common Java constructors default it to `true`. Omitted rotation/event `t_ratio` defaults to `0.5`.

Keep event `t_ratio` inside `[0,1]` and include a nonempty `lib_key`. A missing key causes the parser to skip the event.

### Constraint fields

All max/min velocity and acceleration fields must be arrays of:

```json
{ "value": 2.0, "start_ordinal": 0, "end_ordinal": 3 }
```

Only `end_translation_tolerance_meters` and `end_rotation_tolerance_deg` are scalar path constraints. A numeric scalar for a velocity/acceleration field is not supported by BLine-Lib v0.9.1.

See [Constraints & Ordinals](../concepts/constraints.md) for the separate zero-based translation/rotation domains.

## Build in Java

```java
Path path = new Path(
    new Path.Waypoint(
        new Translation2d(4.0, 2.0),
        Rotation2d.fromDegrees(0)
    ),
    new Path.TranslationTarget(new Translation2d(6.0, 2.8)),
    new Path.RotationTarget(
        Rotation2d.fromDegrees(90),
        0.5,
        true
    ),
    new Path.EventTrigger(0.7, "deployIntake"),
    new Path.Waypoint(
        new Translation2d(7.5, 3.4),
        Rotation2d.fromDegrees(90)
    )
);
```

Attach path constraints at construction:

```java
Path.PathConstraints limits = new Path.PathConstraints()
    .setMaxVelocityMetersPerSec(
        new Path.RangedConstraint(3.5, 0, 1),
        new Path.RangedConstraint(1.5, 2, 2)
    )
    .setEndTranslationToleranceMeters(0.05);

Path constrained = new Path(elements, limits);
```

## Prefer construction over mutation

`Path` exposes add/set/remove/reorder methods, but v0.9.1 validates at construction and does not rerun validation after every mutation. Prefer assembling a final list and constructing a new `Path`, especially for runtime-generated paths.

If mutation is unavoidable, enforce valid first/final anchor types yourself and exercise the exact result before scheduling it.

## Load from another source

```java
Path fromDirectory = JsonUtils.loadPath(autosDirectory, "score-left.json");

Path fromText = JsonUtils.loadPathFromJsonString(
    jsonText,
    defaults
);
```

Use these overloads for tooling/tests. Normal robot projects should keep the exported `autos` layout so the editor, deploy process, and runtime agree.

## Verify after loading

```java
if (!path.isValid()) {
    DriverStation.reportError("Invalid BLine path", false);
}
```

Also check file-loading errors during robot initialization rather than discovering them when autonomous starts.

If the team uses Elastic, Glass, or another Field2d-compatible dashboard, it may also publish the loaded geometry as an optional visual check:

```java
BLineField.drawPath(field, "ScoreLeft", path);
```

Path validity and load-error handling do not depend on this visualization.
