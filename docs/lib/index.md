# Library Overview

BLine-Lib is the Java library that powers path following on your FRC robot. It loads paths (from JSON or code), handles alliance flipping, and provides the path-following algorithm for holonomic drivetrains.

## Key Features

- **Simple API**: Minimal boilerplate to get paths running
- **Flexible path definition**: JSON files, code, or both
- **Customizable constraints**: Global defaults with per-path and per-segment overrides
- **Rate-limited motion**: Smooth velocity and acceleration control

## Architecture

BLine-Lib follows a simple flow: **Builder → Path → FollowPath**

1. **Builder** — Configure PID controllers, pose suppliers, and drive callbacks once
2. **Path** — Define waypoints, translation targets, and rotation targets (from JSON or code)
3. **FollowPath** — Execute path following as a WPILib Command with rate-limited motion

## Tracking Algorithm

The path tracking algorithm works by:

1. **Calculating command robot speed** via a PID controller minimizing total path distance remaining
2. **Determining velocity direction** by pointing toward the current translation target
3. **Advancing to the next target** when within the handoff radius of the current one
4. **Applying cross-track correction** to stay on the line between waypoints
5. **Interpolating rotation** based on progress between rotation targets
6. **Applying rate limiting** via `ChassisRateLimiter` to respect constraints

![Algorithm Demo](../assets/gifs/concepts/algorithm-demo.gif)

### Algorithm Robustness

The BLine path tracking algorithm is **robust in its response to sharp changes in positional data**:

- Speed magnitude computation depends on distance to the path's end
- Velocity direction depends on the next available waypoint
- All values are **acceleration-limited in 2D** for smooth robot motion
- Chassis output remains stable even during erroneous odometry jitter

**Non-time-parameterized advantage:** Unlike PathPlanner, BLine is not time-parameterized. The control cycle acts in a **greedy fashion**, making the response uniform regardless of path completion or "lag" behind an idealized path. There's no penalty for falling behind schedule—the robot simply continues toward its target.

## Installation

See the [Installation Guide](../getting-started/installation.md#bline-lib-installation) for setup instructions.

## Quick Example

```java
import frc.robot.lib.BLine.*;
import edu.wpi.first.math.controller.PIDController;

// 1. Set global constraints (once, at robot init)
Path.setDefaultGlobalConstraints(new Path.DefaultGlobalConstraints(
    4.5, 12.0, 540, 860, 0.03, 2.0, 0.2
));

// 2. Create a FollowPath builder
FollowPath.Builder pathBuilder = new FollowPath.Builder(
    driveSubsystem,
    driveSubsystem::getPose,
    driveSubsystem::getChassisSpeeds,
    driveSubsystem::drive,
    new PIDController(5.0, 0.0, 0.0),
    new PIDController(3.0, 0.0, 0.0),
    new PIDController(2.0, 0.0, 0.0)
).withDefaultShouldFlip()
 .withPoseReset(driveSubsystem::resetPose);

// 3. Load and follow a path
Path myPath = new Path("myPathFile");
Command followCommand = pathBuilder.build(myPath);
```

## Learn More

- [Path Construction](path-construction.md) — Creating paths in code and JSON
- [FollowPath Builder](follow-path.md) — Configuring the path follower
- [API Reference](api-reference.md) — Complete API documentation

