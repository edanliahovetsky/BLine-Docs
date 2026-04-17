# Library Overview

**BLine-Lib** is the Java library that runs path-following on your FRC robot. It loads `Path` objects (from JSON or code), wires them into a WPILib `Command`, and follows them against your drivetrain's pose estimate using three cooperating PID controllers plus 2D rate limiting.

The current release is **v0.8.4** (2026 season). See [Installation](../getting-started/installation.md#bline-lib) for setup, or start with the [Quick Start](../getting-started/quick-start.md) for an end-to-end walkthrough.

## What's in the package

| Class | Role |
|-------|------|
| `Path` | Immutable(-ish) container of path elements + constraints. Construct from JSON or code. |
| `Path.PathElement` | Sealed interface for the four element types (`Waypoint`, `TranslationTarget`, `RotationTarget`, `EventTrigger`). |
| `Path.PathConstraints` | Per-path velocity / acceleration / tolerance overrides, with optional ranged constraints. |
| `Path.DefaultGlobalConstraints` | Global fallbacks for every path in the project. |
| `FollowPath` | WPILib `Command` that follows a `Path`. Also hosts static logging hooks and the event-trigger registry. |
| `FollowPath.Builder` | Fluent builder that captures drive subsystem, suppliers/consumers, PID controllers, flip/mirror/pose-reset policy. Reused across paths. |
| `ChassisRateLimiter` | 2D translational + rotational rate limiter used internally by `FollowPath`. |
| `FlippingUtil` | Alliance-aware coordinate flipping and vertical mirroring helpers. |
| `JsonUtils` | JSON loader for paths and global constraints. Handles legacy and nested config shapes. |

For class-level reference, see the generated [Javadoc](https://edanliahovetsky.github.io/BLine-Lib/). This documentation focuses on how to use the pieces together; the Javadoc covers every method signature.

## Architecture at a glance

```
┌─────────────────────┐       ┌─────────────────────┐
│  deploy/autos/      │ read  │                     │
│   config.json       ├──────▶│    JsonUtils        │
│   paths/xyz.json    │       │                     │
└─────────────────────┘       └─────────┬───────────┘
                                        │
                                        ▼
┌─────────────────────┐       ┌─────────────────────┐
│  Robot code         │       │                     │
│  new Path(...)      ├──────▶│       Path          │
│  or new Path("xyz") │       │                     │
└─────────────────────┘       └─────────┬───────────┘
                                        │
                                        ▼
┌─────────────────────┐       ┌─────────────────────┐
│ FollowPath.Builder  │ build │                     │
│  (PID, suppliers,   ├──────▶│  FollowPath Command │──▶ drive consumer
│   flip/mirror, etc) │       │                     │
└─────────────────────┘       └─────────────────────┘
```

1. **Path construction.** Either JSON (via `new Path("file")`) or programmatic (via `new Path(elements...)`). Constraints either come from global defaults, a JSON `constraints` block, or an explicit `PathConstraints` object.
2. **Builder configuration.** `FollowPath.Builder` captures per-robot setup (subsystem, pose supplier, speeds supplier/consumer, three PIDs) plus optional policies (`withDefaultShouldFlip`, `withShouldMirror`, `withPoseReset`, `withTRatioBasedTranslationHandoffs`).
3. **Command build.** `builder.build(path)` returns a fresh `FollowPath` command bound to that path. Safe to call many times with the same builder.
4. **Command execution.** The command resets traversal state, optionally flips/mirrors the path, resets odometry if requested, and runs the tracking loop every cycle until both end tolerances are met.

## The tracking loop

Each cycle, `FollowPath.execute()`:

1. **Advances translation targets.** If the robot is within the current target's handoff radius (or past the t-ratio threshold when t-ratio handoffs are enabled), move to the next translation target — potentially skipping multiple in one cycle if the path has a run of tight targets.
2. **Selects the active rotation target.** Based on the current translation segment and the robot's progress along it.
3. **Processes event triggers.** Any trigger whose `t_ratio` the robot has passed on its current segment is fired (once).
4. **Computes translation command.** Translation PID on *remaining path distance*, clamped to max velocity, directed at the current target. Cross-track correction added perpendicular to the segment line.
5. **Computes rotation command.** Rotation PID against the active target (profiled interpolation or direct snap).
6. **Rate-limits the combined `ChassisSpeeds`.** Translational rate limited in 2D, rotational rate limited scalarly, via `ChassisRateLimiter`.
7. **Drives.** Converts to robot-relative and passes to the drive consumer.
8. **Logs.** All internal state goes through the static logging consumers (disabled until you set them — see [Logging](logging.md)).

The command reports **finished** when the translation cursor is on the last translation element, the rotation cursor is past the last rotation target, the translation controller is at its setpoint (remaining distance < end translation tolerance), and the heading is within the end rotation tolerance.

## A minimal example

```java
import frc.robot.lib.BLine.*;
import edu.wpi.first.math.controller.PIDController;

// Once, at robot init
Path.setDefaultGlobalConstraints(new Path.DefaultGlobalConstraints(
    4.5, 10.0, 600, 2000, 0.03, 2.0, 0.25
));

FollowPath.Builder pathBuilder = new FollowPath.Builder(
    driveSubsystem,
    driveSubsystem::getPose,
    driveSubsystem::getChassisSpeeds,
    driveSubsystem::drive,
    new PIDController(5.0, 0.0, 0.0),   // translation
    new PIDController(3.0, 0.0, 0.0),   // rotation
    new PIDController(2.0, 0.0, 0.0)    // cross-track
)
.withDefaultShouldFlip()
.withPoseReset(driveSubsystem::resetPose);

// For each path you want to run
Path path = new Path("scoreFirst");
Command cmd = pathBuilder.build(path);
cmd.schedule();
```

## Learn more

- [Path Construction](path-construction.md) — building paths from JSON and code, global / path-specific / ranged constraints.
- [FollowPath Builder](follow-path.md) — every builder method, including flipping, mirroring, and t-ratio handoffs.
- [Event Triggers](event-triggers.md) — registering actions and firing them mid-path.
- [Alliance Flip & Mirror](flip-and-mirror.md) — when to flip, when to mirror, and how they differ.
- [Pre-Match Module Orientation](pre-match.md) — the `getInitialModuleDirection()` helper and why to use it.
- [Logging](logging.md) — consumer-based AdvantageKit-style logging keys.
- [API Reference](api-reference.md) — quick lookup for every public type.
