# Path Constraints

Path constraints are critical for ensuring proper robot motion and preventing overshooting during element handoff. When the robot approaches a translation target at high speed without appropriate velocity limits, it may overshoot the handoff radius and exhibit erratic behavior. Properly configured constraints ensure smooth transitions between path elements.

## Constraint Types

BLine supports six constraint types that can be applied to paths:

| Constraint | Unit | Description |
|------------|------|-------------|
| **Max Translational Velocity** | m/s | Maximum speed the robot can travel |
| **Max Translational Acceleration** | m/s² | Maximum acceleration for translation |
| **Max Rotational Velocity** | deg/s | Maximum angular speed for holonomic rotation |
| **Max Rotational Acceleration** | deg/s² | Maximum angular acceleration for rotation |
| **End Translation Tolerance** | m | How close the robot must be to the final position to finish |
| **End Rotation Tolerance** | deg | How close the robot must be to the final rotation to finish |

## Global Constraints

Global constraints define default velocity/acceleration limits and tolerances for all paths. You can set them in two ways:

### Option A: Using config.json (for JSON-based workflows)

Create a `config.json` file in `src/main/deploy/autos/`:

```json
{
    "default_max_velocity_meters_per_sec": 4.0,
    "default_max_acceleration_meters_per_sec2": 3.0,
    "default_max_velocity_deg_per_sec": 360.0,
    "default_max_acceleration_deg_per_sec2": 720.0,
    "default_end_translation_tolerance_meters": 0.05,
    "default_end_rotation_tolerance_deg": 2.0,
    "default_intermediate_handoff_radius_meters": 0.3
}
```

### Option B: Setting in Code (for code-only workflows)

Set global constraints programmatically in your robot initialization:

```java
Path.setDefaultGlobalConstraints(new Path.DefaultGlobalConstraints(
    4.0,    // maxVelocityMetersPerSec
    3.0,    // maxAccelerationMetersPerSec2
    360.0,  // maxVelocityDegPerSec
    720.0,  // maxAccelerationDegPerSec2
    0.05,   // endTranslationToleranceMeters
    2.0,    // endRotationToleranceDeg
    0.3     // intermediateHandoffRadiusMeters
));
```

### In the GUI

Global constraints are configured in **Settings → Robot Config**. These serve as defaults when no path-specific or ranged constraint is set.

## Path-Specific Constraints

Override global constraints for individual paths using `PathConstraints`:

```java
Path.PathConstraints slowConstraints = new Path.PathConstraints()
    .setMaxVelocityMetersPerSec(2.0)
    .setMaxAccelerationMetersPerSec2(1.5)
    .setMaxVelocityDegPerSec(180.0)
    .setMaxAccelerationDegPerSec2(360.0)
    .setEndTranslationToleranceMeters(0.02)
    .setEndRotationToleranceDeg(1.0);

// Create path with custom constraints
Path slowPath = new Path(
    slowConstraints,
    new Path.Waypoint(new Translation2d(1.0, 1.0), new Rotation2d(0)),
    new Path.TranslationTarget(new Translation2d(2.0, 2.0)),
    new Path.Waypoint(new Translation2d(3.0, 1.0), new Rotation2d(Math.PI))
);
```

## Ranged Constraints

Ranged constraints allow different limits for different sections of a path—essential for slowing down before tight turns or precision maneuvers.

### Defining Ranged Constraints

Each ranged constraint is defined by:

- **`value`**: The constraint value (velocity, acceleration, etc.)
- **`start_ordinal`**: The first element index this constraint applies to (inclusive)
- **`end_ordinal`**: The last element index this constraint applies to (inclusive)

### Ordinal Indexing

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

### Multiple Ranged Constraints

Paths can have **multiple ranged constraints of the same type**, allowing fine-grained control over different path sections. The first matching constraint (in array order) is used for each element.

### JSON Example

```json
{
    "path_elements": [...],
    "constraints": {
        "max_velocity_meters_per_sec": [
            { "value": 4.0, "start_ordinal": 0, "end_ordinal": 1 },
            { "value": 1.5, "start_ordinal": 2, "end_ordinal": 3 }
        ],
        "max_velocity_deg_per_sec": [
            { "value": 360.0, "start_ordinal": 0, "end_ordinal": 3 }
        ],
        "end_translation_tolerance_meters": 0.05,
        "end_rotation_tolerance_deg": 2.0
    }
}
```

### Code Example

```java
Path.PathConstraints constraints = new Path.PathConstraints()
    .setMaxVelocityMetersPerSec(
        new Path.RangedConstraint(4.0, 0, 1),   // Fast approach (ordinals 0-1)
        new Path.RangedConstraint(1.5, 2, 3)    // Slow precision (ordinals 2-3)
    )
    .setMaxVelocityDegPerSec(
        new Path.RangedConstraint(360.0, 0, Integer.MAX_VALUE)  // Apply to all
    );
```

### Visualizing in GUI

When you click on a ranged constraint's slider in the GUI, a **green overlay** highlights the affected path segments on the canvas. This shows exactly where the constraint will apply during path execution.

<!-- GIF: Clicking constraint slider showing green overlay -->
![Constraint Visualization](../assets/gifs/concepts/constraint-slider.gif)

!!! info "Start Ordinal Behavior"
    A ranged constraint that includes the starting element will affect all robot motion *leading into* that element. For example, if your robot doesn't begin at the first path element (e.g., it's placed mid-field), a velocity constraint starting at ordinal 1 will limit the robot's speed as it travels toward the first waypoint.

## How Constraints Affect Path Following

During path execution, `FollowPath` retrieves constraints for each element via `getPathElementsWithConstraints()`. The `ChassisRateLimiter` then enforces these limits by:

1. Capping the commanded velocity to the current element's max velocity
2. Limiting acceleration between cycles based on the current element's max acceleration
3. Applying these limits separately to translational and rotational motion

This ensures the robot respects velocity limits when approaching handoff radii, preventing overshoot and enabling precise element transitions.

