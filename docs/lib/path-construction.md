# Path Construction

BLine supports three ways to create paths: loading from JSON files, defining programmatically in code, or a hybrid approach.

## Loading from JSON

The simplest approach when using BLine-GUI or hand-written JSON files.

### Basic Usage

```java
// Loads deploy/autos/paths/myPathFile.json
// Note: .json extension is added automatically
Path myPath = new Path("myPathFile");
```

Paths are loaded from `src/main/deploy/autos/paths/` by default.

### JSON File Structure

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
                "rotation_radians": 0,
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
            "rotation_radians": 1.57,
            "t_ratio": 0.5,
            "profiled_rotation": true
        },
        {
            "type": "waypoint",
            "translation_target": {
                "x_meters": 3.0,
                "y_meters": 1.0
            },
            "rotation_target": {
                "rotation_radians": 3.14,
                "profiled_rotation": true
            }
        }
    ],
    "constraints": {
        "max_velocity_meters_per_sec": [
            { "value": 4.5, "start_ordinal": 0, "end_ordinal": 1 },
            { "value": 2.0, "start_ordinal": 2, "end_ordinal": 3 }
        ],
        "max_acceleration_meters_per_sec2": 12.0,
        "end_translation_tolerance_meters": 0.03,
        "end_rotation_tolerance_deg": 2.0
    }
}
```

### Element Types in JSON

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
            "rotation_radians": 0,
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
        "rotation_radians": 1.57,
        "t_ratio": 0.5,
        "profiled_rotation": true
    }
    ```

## Defining Programmatically

For code-only workflows or dynamic path generation.

### Basic Path

```java
Path myPath = new Path(
    new Path.Waypoint(new Translation2d(1.0, 1.0), new Rotation2d(0)),
    new Path.TranslationTarget(new Translation2d(2.0, 2.0)),
    new Path.Waypoint(new Translation2d(3.0, 1.0), new Rotation2d(Math.PI))
);
```

### Path Elements

#### Waypoint

Combined position and rotation target:

```java
// From Translation2d and Rotation2d
new Path.Waypoint(new Translation2d(1.0, 1.0), new Rotation2d(0))

// From Pose2d
new Path.Waypoint(new Pose2d(1.0, 1.0, new Rotation2d(0)))
```

#### TranslationTarget

Position-only target:

```java
// From Translation2d
new Path.TranslationTarget(new Translation2d(2.0, 2.0))

// From coordinates
new Path.TranslationTarget(2.0, 2.0)
```

#### RotationTarget

Rotation-only target with position along segment:

```java
// Rotation at midpoint of segment (t_ratio = 0.5)
new Path.RotationTarget(new Rotation2d(Math.PI / 2), 0.5)
```

### With Path Constraints

```java
Path.PathConstraints constraints = new Path.PathConstraints()
    .setMaxVelocityMetersPerSec(2.0)
    .setMaxAccelerationMetersPerSec2(1.5)
    .setMaxVelocityDegPerSec(180.0)
    .setMaxAccelerationDegPerSec2(360.0)
    .setEndTranslationToleranceMeters(0.02)
    .setEndRotationToleranceDeg(1.0);

Path slowPath = new Path(
    constraints,
    new Path.Waypoint(new Translation2d(1.0, 1.0), new Rotation2d(0)),
    new Path.TranslationTarget(new Translation2d(2.0, 2.0)),
    new Path.Waypoint(new Translation2d(3.0, 1.0), new Rotation2d(Math.PI))
);
```

### With Ranged Constraints

```java
Path.PathConstraints rangedConstraints = new Path.PathConstraints()
    .setMaxVelocityMetersPerSec(
        new Path.RangedConstraint(4.0, 0, 2),   // Fast for elements 0-2
        new Path.RangedConstraint(1.5, 3, 5)    // Slow for elements 3-5
    )
    .setMaxAccelerationMetersPerSec2(3.0);

Path variedPath = new Path(
    rangedConstraints,
    // ... elements ...
);
```

## Ordinal Indexing for Ranged Constraints

!!! warning "Important: Separate Ordinal Counters"
    Translation and rotation ordinals are tracked **separately**:

    - **Translation ordinal** increments for each `TranslationTarget` and each `Waypoint`
    - **Rotation ordinal** increments for each `RotationTarget` and each `Waypoint`

This means a `Waypoint` (which contains both translation and rotation) increments **both** counters, while standalone `TranslationTarget` and `RotationTarget` elements only increment their respective counter.

**Example ordinal assignment:**

| Path Element | Translation Ordinal | Rotation Ordinal |
|--------------|:-------------------:|:----------------:|
| Waypoint (start) | 0 | 0 |
| TranslationTarget | 1 | — |
| RotationTarget (t_ratio=0.5) | — | 1 |
| TranslationTarget | 2 | — |
| Waypoint (end) | 3 | 2 |

When the path follower processes each element, it checks if any ranged constraint applies by testing:

```
startOrdinal <= currentOrdinal && endOrdinal >= currentOrdinal
```

If a constraint matches, that value is used; otherwise, the global default is applied.

## Global Constraints

Set default constraints that apply to all paths when no path-specific constraint is set.

### Using config.json

Create `src/main/deploy/autos/config.json`:

```json
{
    "default_max_velocity_meters_per_sec": 4.5,
    "default_max_acceleration_meters_per_sec2": 12.0,
    "default_max_velocity_deg_per_sec": 540,
    "default_max_acceleration_deg_per_sec2": 860,
    "default_end_translation_tolerance_meters": 0.03,
    "default_end_rotation_tolerance_deg": 2.0,
    "default_intermediate_handoff_radius_meters": 0.2
}
```

### In Code

```java
Path.setDefaultGlobalConstraints(new Path.DefaultGlobalConstraints(
    4.5,    // maxVelocityMetersPerSec
    12.0,   // maxAccelerationMetersPerSec2
    540,    // maxVelocityDegPerSec
    860,    // maxAccelerationDegPerSec2
    0.03,   // endTranslationToleranceMeters
    2.0,    // endRotationToleranceDeg
    0.2     // intermediateHandoffRadiusMeters
));
```

## Alliance Flipping

BLine automatically handles path mirroring for the opposite alliance.

### Automatic Flipping

When using `.withDefaultShouldFlip()` on your builder, paths are automatically flipped based on `DriverStation.getAlliance()`:

```java
FollowPath.Builder pathBuilder = new FollowPath.Builder(...)
    .withDefaultShouldFlip();  // Auto-flip for red alliance
```

### Manual Flipping

You can also flip paths manually:

```java
Path myPath = new Path("myPathFile");

// Flip for opposite alliance
myPath.flip();

// Undo the flip
myPath.undoFlip();
```

### Custom Flip Logic

For custom flip behavior:

```java
FollowPath.Builder pathBuilder = new FollowPath.Builder(...)
    .withShouldFlip(() -> {
        // Your custom logic
        return DriverStation.getAlliance() == Alliance.Red;
    });
```

## Path Utilities

### Get Starting Pose

Useful for resetting odometry:

```java
Path myPath = new Path("myPathFile");
Pose2d startPose = myPath.getStartPose();
```

### Get Initial Module Direction

Get the direction swerve modules should face at path start:

```java
Rotation2d initialDirection = myPath.getInitialModuleDirection();
driveSubsystem.setModuleOrientations(initialDirection);
```

## Single-Element Paths

Paths can consist of just **one Waypoint or TranslationTarget**:

```java
// Simple point-to-point move
Path simpleMove = new Path(
    new Path.Waypoint(new Translation2d(3.0, 2.0), new Rotation2d(0))
);
```

!!! note
    A path with only a RotationTarget is invalid—you need at least one translation element.

