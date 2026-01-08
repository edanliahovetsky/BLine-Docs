# API Reference

Complete reference for BLine-Lib classes and methods.

For the full Javadoc, see the [**online documentation**](https://edanliahovetsky.github.io/BLine-Lib/).

## Path Class

The `Path` class represents a sequence of path elements with optional constraints.

### Constructors

```java
// Load from JSON file (adds .json automatically)
Path(String filename)

// Create programmatically
Path(PathElement... elements)

// Create with custom constraints
Path(PathConstraints constraints, PathElement... elements)
```

### Static Methods

```java
// Set global defaults for all paths
static void setDefaultGlobalConstraints(DefaultGlobalConstraints constraints)
```

### Instance Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getStartPose()` | `Pose2d` | Starting pose for odometry reset |
| `getInitialModuleDirection()` | `Rotation2d` | Direction modules should face at start |
| `flip()` | `void` | Mirror path for opposite alliance |
| `undoFlip()` | `void` | Revert alliance flip |
| `getPathElementsWithConstraints()` | `List<...>` | Elements with resolved constraints |

---

## Path.Waypoint

A point with both position and rotation.

### Constructors

```java
// From Translation2d and Rotation2d
Waypoint(Translation2d translation, Rotation2d rotation)

// From Pose2d
Waypoint(Pose2d pose)
```

### JSON Format

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

---

## Path.TranslationTarget

A position-only target.

### Constructors

```java
// From Translation2d
TranslationTarget(Translation2d translation)

// From coordinates
TranslationTarget(double x, double y)
```

### JSON Format

```json
{
    "type": "translation",
    "x_meters": 2.5,
    "y_meters": 2.0,
    "intermediate_handoff_radius_meters": 0.2
}
```

---

## Path.RotationTarget

A rotation-only target positioned along a segment.

### Constructors

```java
// With t_ratio for position along segment
RotationTarget(Rotation2d rotation, double tRatio)
```

### JSON Format

```json
{
    "type": "rotation",
    "rotation_radians": 1.57,
    "t_ratio": 0.5,
    "profiled_rotation": true
}
```

---

## Path.DefaultGlobalConstraints

Global constraint defaults for all paths.

### Constructor

```java
DefaultGlobalConstraints(
    double maxVelocityMetersPerSec,
    double maxAccelerationMetersPerSec2,
    double maxVelocityDegPerSec,
    double maxAccelerationDegPerSec2,
    double endTranslationToleranceMeters,
    double endRotationToleranceDeg,
    double intermediateHandoffRadiusMeters
)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `maxVelocityMetersPerSec` | `double` | Max translational velocity (m/s) |
| `maxAccelerationMetersPerSec2` | `double` | Max translational acceleration (m/s²) |
| `maxVelocityDegPerSec` | `double` | Max rotational velocity (deg/s) |
| `maxAccelerationDegPerSec2` | `double` | Max rotational acceleration (deg/s²) |
| `endTranslationToleranceMeters` | `double` | Final position tolerance (m) |
| `endRotationToleranceDeg` | `double` | Final rotation tolerance (deg) |
| `intermediateHandoffRadiusMeters` | `double` | Default handoff radius (m) |

---

## Path.PathConstraints

Fluent builder for path-specific constraints.

### Methods

All methods return `this` for chaining.

| Method | Parameter | Description |
|--------|-----------|-------------|
| `setMaxVelocityMetersPerSec` | `double` | Set max translation velocity |
| `setMaxAccelerationMetersPerSec2` | `double` | Set max translation acceleration |
| `setMaxVelocityDegPerSec` | `double` | Set max rotation velocity |
| `setMaxAccelerationDegPerSec2` | `double` | Set max rotation acceleration |
| `setEndTranslationToleranceMeters` | `double` | Set end position tolerance |
| `setEndRotationToleranceDeg` | `double` | Set end rotation tolerance |

### Ranged Constraints

For ranged constraints, pass `RangedConstraint` objects:

```java
setMaxVelocityMetersPerSec(RangedConstraint... constraints)
```

---

## Path.RangedConstraint

A constraint that applies to a range of ordinals.

### Constructor

```java
RangedConstraint(double value, int startOrdinal, int endOrdinal)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `double` | The constraint value |
| `startOrdinal` | `int` | First element index (inclusive) |
| `endOrdinal` | `int` | Last element index (inclusive) |

---

## FollowPath.Builder

Builder for creating path-following commands.

### Constructor

```java
Builder(
    SubsystemBase driveSubsystem,
    Supplier<Pose2d> poseSupplier,
    Supplier<ChassisSpeeds> speedsSupplier,
    Consumer<ChassisSpeeds> speedsConsumer,
    PIDController translationController,
    PIDController rotationController,
    PIDController crossTrackController
)
```

### Methods

| Method | Parameter | Description |
|--------|-----------|-------------|
| `build` | `Path` | Create command for the specified path |
| `withPoseReset` | `Consumer<Pose2d>` | Reset pose at path start |
| `withDefaultShouldFlip` | — | Auto-flip based on alliance |
| `withShouldFlip` | `Supplier<Boolean>` | Custom flip logic |

---

## config.json Format

Global configuration file (`src/main/deploy/autos/config.json`):

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

---

## Path JSON Format

Complete path file format (`src/main/deploy/autos/paths/*.json`):

```json
{
    "path_elements": [
        // Array of path elements (waypoint, translation, rotation)
    ],
    "constraints": {
        "max_velocity_meters_per_sec": 4.5,
        // Or ranged:
        "max_velocity_meters_per_sec": [
            { "value": 4.5, "start_ordinal": 0, "end_ordinal": 1 }
        ],
        "max_acceleration_meters_per_sec2": 12.0,
        "max_velocity_deg_per_sec": 540,
        "max_acceleration_deg_per_sec2": 860,
        "end_translation_tolerance_meters": 0.03,
        "end_rotation_tolerance_deg": 2.0
    }
}
```

