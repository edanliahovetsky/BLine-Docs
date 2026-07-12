# BLine-Lib Overview

BLine-Lib v0.9.1 is the Java/WPILib 2026 robot-side library. It loads or constructs paths and exposes `FollowPath`, a WPILib command for holonomic drivetrains.

The editor is optional. Robot code can either load an exported path JSON file or construct a custom `Path` directly from Java elements and constraints. Both forms are passed to the same `FollowPath.Builder.build(Path)` method.

## Drivetrain contract

`FollowPath.Builder` needs:

- the drivetrain `Subsystem` requirement;
- a field-relative `Pose2d` supplier;
- a **robot-relative** `ChassisSpeeds` supplier;
- a **robot-relative** `ChassisSpeeds` consumer; and
- translation, rotation, and cross-track `PIDController` instances.

The library returns ordinary robot-relative chassis-speed requests. Converting those into module states or vendor-specific requests remains the drivetrain's job.

## Main public classes

| Class | Purpose |
| --- | --- |
| `Path` | Elements, global/path constraints, loading, transformations, start pose, and copies |
| `FollowPath` | Runtime command, builder, events, logging, rotation override, and diagnostics |
| `BLineCommands` | Requirement-safe wrappers for WPILib command composition around event-driven autos |
| `BLineField` | Draw path translation points into a WPILib `Field2d` |
| `JsonUtils` | Load/parse path and configuration JSON |
| `FlippingUtil` | Field flip/mirror helpers for poses, rotations, translations, speeds, and feedforwards |
| `ChassisRateLimiter` | Translation/rotation acceleration limiting used by the follower |

## Minimal patterns

Configure one reusable follower builder:

```java
FollowPath.Builder builder = new FollowPath.Builder(
    driveSubsystem,
    driveSubsystem::getPose,
    driveSubsystem::getRobotRelativeSpeeds,
    driveSubsystem::driveRobotRelative,
    translationPid,
    rotationPid,
    crossTrackPid
).withDefaultShouldFlip();
```

Then choose either source for the path:

=== "Construct in Java"

    ```java
    Path path = new Path(
        new Path.Waypoint(1.0, 0.8, Rotation2d.fromDegrees(0)),
        new Path.TranslationTarget(1.5, 1.1),
        new Path.Waypoint(2.0, 0.8, Rotation2d.fromDegrees(0))
    );

    Command follow = builder.build(path);
    ```

    No editor or path JSON is involved. Configure the global defaults in Java as well if this project does not deploy `autos/config.json`; see [Create Paths in Java or Load JSON](path-construction.md#construct-a-path-directly-in-java).

=== "Load exported JSON"

    ```java
    Path path = new Path("first-straight");
    Command follow = builder.build(path);
    ```

    This loads `autos/paths/first-straight.json` and the adjacent `autos/config.json`.

Reset localization once at the transformed start of an autonomous routine. See [First Path Tutorial](../getting-started/quick-start.md#one-time-pose-reset).

## Runtime lifecycle

`FollowPath`:

1. copies the supplied path when built;
2. applies the configured flip and mirror at command initialization;
3. optionally resets pose if the builder captured a pose-reset consumer;
4. resets translation/rotation controller state;
5. calculates constrained chassis speeds each execute cycle;
6. fires eligible events;
7. finishes on final translation/rotation tolerances; and
8. sends zero `ChassisSpeeds` on end or interruption.

## Shared static state

These APIs affect all BLine commands in the process:

- default global constraints;
- event-trigger registry;
- logging consumers; and
- rotation override.

Configure them intentionally during robot initialization and clear rotation overrides when their use ends.

## Learn by task

- [Follow Paths](follow-path.md)
- [Create Paths in Java or Load JSON](path-construction.md)
- [Events & Command Groups](event-triggers.md)
- [Rotation Overrides](rotation-overrides.md)
- [Optional Field2d Visualization](field-visualization.md)
- [Alliance Flip & Mirror](flip-and-mirror.md)
- [Logging & AdvantageScope](logging.md)
- [API Reference](api-reference.md)

For method-level detail, use the [generated Javadocs](https://edanliahovetsky.github.io/BLine-Lib/).
