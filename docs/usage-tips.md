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
    If the radius is too small, the robot may overshoot and miss the handoff zone entirely at high velocities—this causes erratic path behavior and is the **worst-case scenario**. Conversely, if the handoff radius is too large, the robot will switch targets too early, causing path instability.

!!! tip "Smooth Turns: Add More Elements"
    For smoother, more accurate navigation through turns, try adding a few extra **TranslationTargets** or **Waypoints** along the curve.  
    This approach lets the robot follow the desired path more naturally—without needing aggressive velocity constraints or oversize handoff radii.  
    More elements create a gentler, better-controlled trajectory through each bend. 
    Just be sure not to oversaturate your paths and keep them as sparse as possible.



## PID Tuning

### Tune at Maximum Velocities

!!! warning "Critical"
    When tuning the translation and rotation PID controllers, **stress-test your controller gains at maximum robot velocity and acceleration** for both translation and rotation.

If you limit max acceleration *after* tuning your controllers, or increase max allowable velocity beyond what was used during tuning, you will likely experience:

- Overshoot when reaching the path endpoint
- Unexpected behavior during path following

Always tune your controllers within the full operating range of velocities and accelerations that your path constraints allow.

### Tuning Order

The PID controllers should be tuned in the following order: translation, rotation, and finally cross-track. 

### Translation Controller

The translation controller minimizes total path distance remaining.

!!! warning "Controller Instability"
    Avoid using the PID integral term for the translation controller. Use the integral term will cause translation controller instability. Integral term use in other controllers (Rotation and Cross-Track) is fine. 

**Starting gains:** P = 5.0, I = 0.0, D = 0.0

### Rotation Controller

Controls minimizes error in holonomic heading (rotation).

**Starting gains:** P = 3.0, I = 0.0, D = 0.0

### Cross-Track Controller

Keeps the robot on the line between waypoints or translation targets. It should be used to reduce path deviation in longer path segments over time, rather than on sharp turns. 

!!! warning "Controller Instability"
    Be weary of cross-track controller over-tuning (were the controller overpowers the translation controller). An over-tuned cross track controller will cause undesirable behavior around turns, especially during high velocities. 

**Starting gains:** P = 2.0, I = 0.0, D = 0.0

## Path Design

### Use TranslationTargets for Path Shaping

Don't overuse Waypoints. If you just need the robot to pass through a point without a specific rotation, use a TranslationTarget instead:

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

!!! warning "Paths Run to Completion"
    BLine paths cannot be stopped midway through execution. If you need the robot to stop partway through a route, break it into separate Path objects:

    ```java
    Commands.sequence(
        pathBuilder.build(toFirstScore),     // Drive to scoring position
        new ScoreCommand(),                  // Stop to score
        pathBuilder.build(toPickup),         // Drive to pickup location
        new IntakeCommand()                  // Stop to intake
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

### Use the Simulation for Quick Checks

The GUI simulation provides immediate feedback, but remember its limitations:

- **Good for**: Rough timing estimates, path flow validation, constraint effects
- **Not accurate for**: Exact timing, real drivetrain dynamics, PID behavior

## Event Triggers

!!! info "Coming Soon"
    Built-in event trigger support is a planned feature and will be added in a future release.

Currently, BLine does not support event triggers built into paths. However, you can replicate trigger-like functionality using WPILib commands:

### Using WaitUntil for Trigger Behavior

```java
// Trigger an action when the robot passes a certain point
Commands.sequence(
    Commands.parallel(
        pathBuilder.build(myPath),
        Commands.waitUntil(() -> {
            // Check if robot has passed x = 3.0 meters
            return driveSubsystem.getPose().getX() > 3.0;
        }).andThen(new IntakeCommand())
    )
);
```

### Using Deadlines with Path Progress

```java
// Run intake while following path, then score
Commands.sequence(
    Commands.deadline(
        pathBuilder.build(scoringPath),
        new IntakeCommand()  // Runs until path completes
    ),
    new ScoreCommand()
);
```

### Checking Path Progress

For more precise triggering, access the path follower's current state:

```java
// Using getter methods on the FollowPath command
FollowPath followCommand = (FollowPath) pathBuilder.build(myPath);

Commands.parallel(
    followCommand,
    Commands.waitUntil(() -> followCommand.getCurrentSegmentIndex() >= 2)
        .andThen(new PrepareScoreCommand())
);
```

## Why No Second Alignment Routine?

Unlike time-parameterized path followers, BLine typically doesn't require a separate alignment routine after paths complete.

**Why other tools often need it:**

- Time-parameterized tracking can finish "early" if the robot falls behind
- Controller tuning affects endpoint accuracy
- Robot may not be precisely positioned when path completes

**Why BLine doesn't:**

- The translation controller minimizes distance to the endpoint, not time
- The robot continues driving until within tolerance, regardless of how long it takes
- No penalty for "falling behind"—the greedy algorithm simply continues toward the target

This means you can typically chain path commands directly without intermediate alignment steps.

