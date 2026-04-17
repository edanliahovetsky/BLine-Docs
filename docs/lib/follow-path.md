# FollowPath Builder

`FollowPath.Builder` captures the per-robot configuration you need once and builds fresh `FollowPath` commands for every path you want to run. Configure it in `RobotContainer` and reuse.

## Minimal setup

```java
import frc.robot.lib.BLine.*;
import edu.wpi.first.math.controller.PIDController;

FollowPath.Builder pathBuilder = new FollowPath.Builder(
    driveSubsystem,                     // Subsystem requirement
    driveSubsystem::getPose,            // Supplier<Pose2d>  (field-frame)
    driveSubsystem::getChassisSpeeds,   // Supplier<ChassisSpeeds>  (robot-relative)
    driveSubsystem::drive,              // Consumer<ChassisSpeeds>  (robot-relative)
    new PIDController(5.0, 0.0, 0.0),   // translation controller
    new PIDController(3.0, 0.0, 0.0),   // rotation controller
    new PIDController(2.0, 0.0, 0.0)    // cross-track controller
);
```

## Constructor parameters

| Parameter | Type | Purpose |
|-----------|------|---------|
| `driveSubsystem` | `Subsystem` | Command requirement. BLine accepts any `Subsystem`, not just `SubsystemBase` (widened in v0.4.1+). |
| `poseSupplier` | `Supplier<Pose2d>` | Field-frame pose each cycle. Must match the alliance-origin convention you used to author the path (blue-origin convention is standard; BLine flips at runtime). |
| `robotRelativeSpeedsSupplier` | `Supplier<ChassisSpeeds>` | Current chassis speeds, **robot-relative**. |
| `robotRelativeSpeedsConsumer` | `Consumer<ChassisSpeeds>` | Commanded chassis speeds, **robot-relative**. BLine does the field↔robot conversion internally. |
| `translationController` | `PIDController` | Minimizes remaining path distance. |
| `rotationController` | `PIDController` | Minimizes holonomic heading error. Continuous input enabled by BLine (−π, π). |
| `crossTrackController` | `PIDController` | Minimizes perpendicular deviation from the current segment line. |

!!! warning "Speeds must be robot-relative"
    `FollowPath` computes a field-relative `ChassisSpeeds` internally, converts it to robot-relative using the current pose's rotation, and hands that to your consumer. If your drive subsystem's `drive()` expects field-relative speeds, either wrap the consumer to convert back, or expose a robot-relative method and pass that instead. CTRE Swerve Templates and most YAGSL configurations already use robot-relative `ApplyRequest` / robot-relative speeds.

## PID controllers

| Controller | Input | Output | Typical starting gain |
|------------|-------|--------|----------------------|
| **Translation** | Remaining path distance (m) | Speed magnitude (m/s) | `P = 5.0` |
| **Rotation** | Heading error (rad) | Angular velocity (rad/s) | `P = 3.0` |
| **Cross-Track** | Signed perpendicular distance from segment line (m) | Correction velocity (m/s) | `P = 2.0` |

All three are `edu.wpi.first.math.controller.PIDController`. BLine sets their tolerances from the active path's end tolerances on each command init and enables continuous input on the rotation controller.

Tuning order is **translation → rotation → cross-track**. See [Tuning & Usage Tips](../usage-tips.md#pid-tuning) for the full procedure.

!!! warning "Don't use the integral term on the translation controller"
    The translation controller's setpoint is zero remaining distance. An integrator accumulates while the robot is far from the endpoint and drives instability. Use P-only (or P + D if needed) for translation. Integrators on rotation and CTE are fine.

## Fluent builder methods

Each method returns the builder so you can chain them. Settings persist across `build(...)` calls until you change them.

### `withDefaultShouldFlip()`

```java
pathBuilder.withDefaultShouldFlip();
```

Automatically flips the path for the red alliance using `DriverStation.getAlliance()`. Wire this if you're authoring every path from the blue-origin perspective (the convention). Uses rotational field symmetry by default via `FlippingUtil`.

### `withShouldFlip(Supplier<Boolean>)`

```java
pathBuilder.withShouldFlip(() -> SmartDashboard.getBoolean("FlipPath", false));
```

Custom flip logic if the default alliance rule doesn't fit (e.g., dashboard toggle for testing, alternate origin conventions).

### `withShouldMirror(Supplier<Boolean>)`

```java
pathBuilder.withShouldMirror(() -> fieldConfiguration.shouldMirror());
```

Applies `Path.mirror()` when the supplier returns true. Mirroring reflects the path across the field width centerline (`y → fieldSizeY − y`) and maps `θ → −θ`. This is **not** the same as `flip()` — see [Alliance Flip & Mirror](flip-and-mirror.md) for when each makes sense.

Flip and mirror both apply at command init time and can be combined.

### `withPoseReset(Consumer<Pose2d>)`

```java
pathBuilder.withPoseReset(driveSubsystem::resetPose);
```

When set, `FollowPath.initialize()` calls the consumer with the path's start pose. Useful for the first path in auto (so odometry starts at the known location).

Set once, it applies to **every** subsequent `build(...)`. To turn it off on a per-path basis while reusing the same builder, override with a no-op: `.withPoseReset(p -> {})`.

### `withTRatioBasedTranslationHandoffs(boolean)`

```java
pathBuilder.withTRatioBasedTranslationHandoffs(true);
```

When enabled, translation handoffs fire as soon as **either**:

- The robot is within the current target's handoff radius (normal behavior), or
- The robot's projection onto the current segment passes `1 − handoff_radius / segment_length`.

This is more robust on high-speed paths where a collision or aggressive initial target could push the robot outside the radius and stall the handoff. Default is `false` (radius-only handoffs).

Use it for specific high-risk paths; leave it off for general-purpose paths. See v0.8.4 release notes if you're comparing against older behavior — an initialization edge case at the very start of a path was fixed in v0.8.4 so you can safely enable t-ratio handoffs even when the robot starts close to the first target.

## Building a command

```java
Path path = new Path("scoreFirst");
Command cmd = pathBuilder.build(path);
cmd.schedule();
```

`build(path)`:

- Deep-copies the path so the command can safely flip/mirror without mutating the original.
- Wires the required subsystem, flip/mirror/pose-reset policies, and PID controllers.
- Returns a fresh `FollowPath` command.

Each call produces an independent command; safe to build the same path multiple times if needed.

### What the command does

When scheduled:

1. `initialize()` — optionally flip/mirror the path, optionally reset odometry to the start pose, reset PID controller internal state and tolerances, clear traversal cursors, and log `FollowPath/pathTranslations`.
2. `execute()` — advances translation cursor, selects rotation target, fires any due event triggers, computes and rate-limits the commanded `ChassisSpeeds`, logs state.
3. `isFinished()` — returns true when the robot is on the last translation element, past the last rotation target, with translation and rotation both at their setpoints.
4. `end(interrupted)` — sends a zeroed `ChassisSpeeds` to the drive consumer. This was added in v0.7.2 after reports of the last commanded speed latching past command completion.

### No mid-path stopping

BLine paths run to completion (end tolerances satisfied) unless interrupted. For routines that need to stop mid-route, split into separate paths and chain them:

```java
return Commands.sequence(
    pathBuilder.build(toFirstScore),
    new ScoreCommand(),
    pathBuilder.build(toIntake),
    new IntakeCommand(),
    pathBuilder.build(toSecondScore),
    new ScoreCommand()
);
```

For actions that fire *during* a path, use [Event Triggers](event-triggers.md).

## Diagnostic getters

`FollowPath` exposes a few getters for dashboards or custom logic:

```java
int getCurrentTranslationElementIndex();
int getCurrentRotationElementIndex();     // -1 when no active rotation target remains
double getRemainingPathDistanceMeters();  // 0.0 when not in a valid traversal state
```

`getRemainingPathDistanceMeters()` was added in v0.8.1 for dashboards and auto sequencing that want to display or react to progress.

## A complete `RobotContainer` skeleton

```java
public class RobotContainer {
    private final DriveSubsystem drive = new DriveSubsystem();
    private final FollowPath.Builder pathBuilder;

    public RobotContainer() {
        Path.setDefaultGlobalConstraints(new Path.DefaultGlobalConstraints(
            4.5, 10.0, 600, 2000, 0.03, 2.0, 0.25
        ));

        FollowPath.registerEventTrigger("deployIntake", intake::deploy);
        FollowPath.registerEventTrigger("shoot", new ShootCommand(shooter));

        pathBuilder = new FollowPath.Builder(
            drive,
            drive::getPose,
            drive::getChassisSpeeds,
            drive::drive,
            new PIDController(5.0, 0.0, 0.0),
            new PIDController(3.0, 0.0, 0.0),
            new PIDController(2.0, 0.0, 0.0)
        )
        .withDefaultShouldFlip()
        .withPoseReset(drive::resetPose);

        // AdvantageKit logging
        FollowPath.setDoubleLoggingConsumer(p -> Logger.recordOutput(p.getFirst(), p.getSecond()));
        FollowPath.setBooleanLoggingConsumer(p -> Logger.recordOutput(p.getFirst(), p.getSecond()));
        FollowPath.setPoseLoggingConsumer(p -> Logger.recordOutput(p.getFirst(), p.getSecond()));
        FollowPath.setTranslationListLoggingConsumer(p -> Logger.recordOutput(p.getFirst(), p.getSecond()));
    }

    public Command getAutonomousCommand() {
        Path first = new Path("scoreFirst");
        drive.setModuleOrientations(first.getInitialModuleDirection());
        return pathBuilder.build(first);
    }
}
```

## Related

- [Event Triggers](event-triggers.md) — registering actions for triggers referenced by paths.
- [Alliance Flip & Mirror](flip-and-mirror.md) — `withDefaultShouldFlip`, `withShouldMirror`, symmetry choices.
- [Pre-Match Module Orientation](pre-match.md) — `getInitialModuleDirection()` for optimal auto starts.
- [Logging](logging.md) — what keys the follower publishes.
- [Tuning & Usage Tips](../usage-tips.md) — PID tuning procedure.
