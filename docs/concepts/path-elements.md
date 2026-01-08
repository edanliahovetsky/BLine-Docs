# Path Elements

BLine represents autonomous paths as sequences of **path elements**. Understanding these elements is essential for effective path planning, whether you're using the GUI or defining paths in code.

## Element Types

A **Path** is a sequence of path elements that define where the robot should go and what holonomic rotation it should have:

| Element | Description |
|---------|-------------|
| **Waypoint** | A point with both a position (translation) and holonomic rotation target |
| **TranslationTarget** | A position-only target—the robot drives through this point |
| **RotationTarget** | A rotation-only target that interpolates based on progress along a segment |

### Visual Representation in GUI

| Element | Canvas Appearance |
|---------|-------------------|
| **Waypoint** | Orange rectangle with rotation handle |
| **TranslationTarget** | Blue circle |
| **RotationTarget** | Green dashed rectangle with rotation handle |

<!-- GIF: Show all three element types on canvas -->
![Element Types](../assets/gifs/concepts/element-types.gif)

## Waypoints

A **Waypoint** combines both translation and rotation—the robot drives to this position AND rotates to the specified rotation.

### When to Use Waypoints

Use Waypoints when the robot needs to face a specific direction at a location:

- Scoring positions (need to face the target)
- Intake stations (need to face the game piece source)
- Any position where rotation matters

### Code Example

```java
// Create a waypoint at (1.0, 1.0) facing 0 degrees
new Path.Waypoint(new Translation2d(1.0, 1.0), new Rotation2d(0))

// Or from a Pose2d
new Path.Waypoint(new Pose2d(1.0, 1.0, new Rotation2d(0)))
```

### JSON Example

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

## Translation Targets

A **TranslationTarget** is a position-only target—the robot drives through this point without changing its rotation setpoint.

### When to Use Translation Targets

Use TranslationTargets for intermediate points where rotation doesn't matter:

- Avoiding obstacles
- Path shaping (creating curves)
- Points along a route where you don't care about rotation

### Code Example

```java
// Create a translation target at (2.0, 2.0)
new Path.TranslationTarget(new Translation2d(2.0, 2.0))

// Or directly from coordinates
new Path.TranslationTarget(2.0, 2.0)
```

### JSON Example

```json
{
    "type": "translation",
    "x_meters": 2.5,
    "y_meters": 2.0,
    "intermediate_handoff_radius_meters": 0.2
}
```

## Rotation Targets

A **RotationTarget** is a rotation-only target positioned along a segment between anchors. The robot turns to this holonomic rotation while traveling between translation points.

### When to Use Rotation Targets

Use RotationTargets when you need the robot to rotate mid-segment without adding a translation point:

- Preparing rotation for the next action
- Smooth rotation transitions
- Rotation control were translation does not matter

### The t_ratio Parameter

RotationTargets exist *between* anchors (Waypoints or TranslationTargets). The **t_ratio** parameter (0.0–1.0) determines where along the segment the rotation occurs:

| t_ratio | Position |
|---------|----------|
| `0.0` | Rotation at the start of the segment |
| `0.5` | Rotation at the midpoint |
| `1.0` | Rotation at the end of the segment |

In the GUI, simply drag the RotationTarget along its connecting line to adjust the t_ratio visually.

<!-- GIF: Dragging a rotation target along a segment -->
![Rotation Target t_ratio](../assets/gifs/concepts/rotation-t-ratio.gif)

### Code Example

```java
// Rotate to 90 degrees at the midpoint of the segment
new Path.RotationTarget(new Rotation2d(Math.PI / 2), 0.5)
```

### JSON Example

```json
{
    "type": "rotation",
    "rotation_radians": 1.57,
    "t_ratio": 0.5,
    "profiled_rotation": true
}
```

## Profiled vs Non-Profiled Rotation

Both Waypoints and RotationTargets support a **profiled rotation** setting that controls how the robot transitions to the target rotation:

### Profiled Rotation (Default)

The robot smoothly interpolates its rotation based on its t-ratio progression along the path. As the robot travels between anchors, its rotation setpoint gradually transitions toward the target rotation proportional to how far it has traveled along the segment.

### Non-Profiled Rotation

The robot immediately snaps to the target rotation when it enters the segment—no interpolation based on position. This is useful when you want an immediate rotation change.

Toggle this setting per-element in the GUI sidebar under "Profiled Rotation", or set `profiled_rotation` in JSON/code.

## Building Complete Paths

A path is simply a sequence of these elements. Here's an example combining all three types:

```java
Path myPath = new Path(
    // Start at (1,1) facing 0 degrees
    new Path.Waypoint(new Translation2d(1.0, 1.0), new Rotation2d(0)),
    
    // Drive through (2,2) - rotation unchanged
    new Path.TranslationTarget(new Translation2d(2.0, 2.0)),
    
    // Rotate to 90 degrees at midpoint of next segment
    new Path.RotationTarget(new Rotation2d(Math.PI / 2), 0.5),
    
    // End at (3,1) facing 180 degrees
    new Path.Waypoint(new Translation2d(3.0, 1.0), new Rotation2d(Math.PI))
);
```

!!! tip "Single-Element Paths"
    Paths can consist of just **one Waypoint or TranslationTarget**—useful for simple point-to-point moves. Note that a path with only a RotationTarget is invalid (you need at least one translation element).

