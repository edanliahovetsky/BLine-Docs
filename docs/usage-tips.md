# Usage Tips

Best practices and recommendations for getting the most out of BLine.

## Constraint Tuning

### Max Translational Velocity is Key

The **max translational velocity constraint** is the primary ranged constraint recommended for most use cases. It is the most effective method for counteracting overshoot at sharp turns—other than increasing the handoff radius, which reduces path precision.

By limiting velocity before tight corners, the robot can decelerate in time and follow the intended path more accurately.

```java
Path.PathConstraints constraints = new Path.PathConstraints()
    .setMaxVelocityMetersPerSec(
        new Path.RangedConstraint(4.0, 0, 2),   // Fast on straight sections
        new Path.RangedConstraint(1.5, 3, 4)    // Slow before sharp turn
    );
```

### Balancing Handoff Radius and Velocity

| Scenario | Solution |
|----------|----------|
| Robot overshoots turns | Lower velocity OR increase handoff radius |
| Robot hesitates at waypoints | Increase handoff radius OR increase velocity |
| Robot cuts corners | Decrease handoff radius OR lower velocity |
| Path precision matters | Smaller handoff radius + lower velocity |

!!! danger "Avoid the Worst Case"
    If the handoff radius is too small for the robot's velocity, it may overshoot and miss the handoff zone entirely. This causes erratic path behavior. When in doubt, err on the side of larger radii.

## PID Tuning

### Tune at Maximum Velocities

!!! warning "Critical"
    When tuning the translation and rotation PID controllers, **stress-test your controller gains at maximum robot velocity and acceleration** for both translation and rotation.

If you limit max acceleration *after* tuning your controllers, or increase max allowable velocity beyond what was used during tuning, you will likely experience:

- Overshoot when reaching the path endpoint
- Unexpected behavior during path following

Always tune your controllers within the full operating range of velocities and accelerations that your path constraints allow.

### Translation Controller

The translation controller determines how aggressively the robot accelerates toward its destination.

| Symptom | Adjustment |
|---------|------------|
| Robot accelerates too slowly | Increase P |
| Robot oscillates near endpoints | Add D (0.1-0.5) |
| Robot overshoots destination | Decrease P or add D |

**Starting point:** P = 5.0, I = 0.0, D = 0.0

### Rotation Controller

Controls how quickly the robot rotates toward target headings.

| Symptom | Adjustment |
|---------|------------|
| Rotation is sluggish | Increase P |
| Robot oscillates on heading | Add D |
| Rotation overshoots | Decrease P or add D |

**Starting point:** P = 3.0, I = 0.0, D = 0.0

### Cross-Track Controller

Keeps the robot on the line between waypoints.

| Symptom | Adjustment |
|---------|------------|
| Robot drifts off path | Increase P |
| Robot jitters on straight paths | Decrease P |
| Robot fights itself on curves | Decrease P |

**Starting point:** P = 2.0, I = 0.0, D = 0.0

## Path Design

### Use TranslationTargets for Path Shaping

Don't overuse Waypoints. If you just need the robot to pass through a point without a specific heading, use a TranslationTarget instead:

```java
// Good: Only specify rotation where it matters
new Path(
    new Path.Waypoint(start, Rotation2d.fromDegrees(0)),      // Face forward at start
    new Path.TranslationTarget(2.0, 3.0),                      // Just pass through
    new Path.TranslationTarget(4.0, 3.5),                      // Path shaping
    new Path.Waypoint(scoringPosition, Rotation2d.fromDegrees(180))  // Face target
);
```

### Use RotationTargets for Mid-Segment Rotation

When you need to rotate while driving but don't need an extra waypoint:

```java
new Path(
    new Path.Waypoint(start, Rotation2d.fromDegrees(0)),
    new Path.RotationTarget(Rotation2d.fromDegrees(90), 0.5),  // Rotate at midpoint
    new Path.Waypoint(end, Rotation2d.fromDegrees(90))
);
```

### Single-Element Paths for Simple Moves

Don't overcomplicate simple movements. A single Waypoint is valid:

```java
// Simple drive-to-position
Path simpleMove = new Path(
    new Path.Waypoint(new Translation2d(3.0, 2.0), Rotation2d.fromDegrees(45))
);
```

## Autonomous Performance

### Pre-Orient Swerve Modules

For optimal autonomous start, pre-orient your swerve modules toward the initial path direction before the match begins:

```java
// During disabled periodic or auto init
Path firstPath = new Path("firstAutoPath");
Rotation2d initialDirection = firstPath.getInitialModuleDirection();
driveSubsystem.setModuleOrientations(initialDirection);
```

This prevents the micro-deviations that occur when modules need to rotate during the initial acceleration.

### Use Pose Reset Wisely

The `withPoseReset()` option resets odometry to the path's starting pose. Use this for:

- **First path in autonomous**: Ensures odometry matches expected starting position
- **After significant odometry drift**: Reset to a known position

```java
// Builder with pose reset enabled
pathBuilder.withPoseReset(driveSubsystem::resetPose);
```

Don't use pose reset for every path—only when starting from a known position.

## Workflow Recommendations

### Choose Your Workflow

| Workflow | Best For |
|----------|----------|
| **GUI + Lib + JSON** | Visual path design, iteration, easy adjustments |
| **JSON + Lib** | Teams comfortable editing JSON directly |
| **Code Only** | Dynamic paths, generated paths, full code control |

### Iterate Quickly

BLine is designed for rapid iteration:

1. Design paths in GUI or JSON
2. Test on hardware
3. Adjust constraints and positions
4. Repeat

The fast path computation time (97% faster than spline-based alternatives) means you can iterate quickly without waiting.

### Use the Simulation for Quick Checks

The GUI simulation provides immediate feedback, but remember its limitations:

- **Good for**: Rough timing estimates, path flow validation, constraint effects
- **Not accurate for**: Exact timing, real drivetrain dynamics, PID behavior

Always validate on hardware for final tuning.

## Common Issues

### Robot Overshoots at Turns

**Causes:**
- Velocity too high for handoff radius
- Handoff radius too small

**Solutions:**
1. Add velocity constraint before the turn
2. Increase handoff radius at that element
3. Add an intermediate TranslationTarget to break up the path

### Robot Hesitates at Waypoints

**Causes:**
- Handoff radius too small
- Velocity constraint too aggressive

**Solutions:**
1. Increase handoff radius
2. Review velocity constraints

### Path Takes Longer Than Expected

**Causes:**
- Constraints too conservative
- Too many elements
- End tolerances too tight

**Solutions:**
1. Review constraint values
2. Simplify path with fewer elements
3. Loosen end tolerances if precision isn't critical

### Robot Doesn't Face Correct Heading

**Causes:**
- Missing rotation target
- Profiled rotation causing slow transition
- Rotation controller P too low

**Solutions:**
1. Add RotationTarget or Waypoint with desired heading
2. Try non-profiled rotation for immediate heading change
3. Tune rotation controller gains

