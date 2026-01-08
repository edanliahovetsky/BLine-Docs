# Library Overview

BLine-Lib is the Java library that powers path following on your FRC robot. It loads paths (from JSON or code), handles alliance flipping, and provides the path-following algorithm for holonomic drivetrains.

## Key Features

- **Simple API**: Minimal boilerplate to get paths running
- **Flexible path definition**: JSON files, code, or both
- **Automatic alliance flipping**: Paths work for both red and blue alliances
- **Customizable constraints**: Global defaults with per-path and per-segment overrides
- **Rate-limited motion**: Smooth velocity and acceleration control

## Architecture

BLine-Lib consists of three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                         Path                                 │
│  Defines waypoints, translation targets, rotation targets    │
│  Loaded from JSON or constructed in code                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      FollowPath                              │
│  Command that executes path following                        │
│  Uses PID controllers for translation, rotation, cross-track │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   ChassisRateLimiter                         │
│  Enforces velocity and acceleration constraints              │
│  Applied per-element based on ranged constraints             │
└─────────────────────────────────────────────────────────────┘
```

## Tracking Algorithm

The path tracking algorithm works by:

1. **Calculating command robot speed** via a PID controller minimizing total path distance remaining
2. **Determining velocity direction** by pointing toward the current translation target
3. **Advancing to the next target** when within the handoff radius of the current one
4. **Applying cross-track correction** to stay on the line between waypoints
5. **Interpolating rotation** based on progress between rotation targets
6. **Applying rate limiting** via `ChassisRateLimiter` to respect constraints

![Algorithm Demo](../assets/gifs/algorithm-demo.gif)

## Installation

See the [Installation Guide](../getting-started/installation.md#bline-lib-installation) for setup instructions.

## Quick Example

```java
import frc.robot.lib.BLine.*;
import edu.wpi.first.math.controller.PIDController;

// 1. Set global constraints (once, at robot init)
Path.setDefaultGlobalConstraints(new Path.DefaultGlobalConstraints(
    4.0, 3.0, 360.0, 720.0, 0.05, 2.0, 0.3
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

