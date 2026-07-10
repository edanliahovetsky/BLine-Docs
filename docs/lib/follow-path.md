# Follow Paths

Build one configured `FollowPath.Builder`, then use it to create commands for fixed or runtime-generated paths.

## Builder

```java
FollowPath.Builder builder = new FollowPath.Builder(
    driveSubsystem,
    driveSubsystem::getPose,
    driveSubsystem::getRobotRelativeSpeeds,
    driveSubsystem::driveRobotRelative,
    translationPid,
    rotationPid,
    crossTrackPid
).withTRatioBasedTranslationHandoffs(true);
```

Enabling t-ratio-based handoffs is the recommended starting policy when intermediate translation targets are pass-through shaping points. The option is still off by default in BLine-Lib, so the call above is explicit. Use radius-only behavior intentionally for a target the robot must physically enter.

| Argument | Contract |
| --- | --- |
| Subsystem | Required by every built command |
| Pose supplier | Current field-relative `Pose2d` |
| Speed supplier | Current robot-relative `ChassisSpeeds` |
| Speed consumer | Accepts robot-relative `ChassisSpeeds` |
| Translation PID | Error is remaining polyline distance |
| Rotation PID | Error is heading; continuous input is enabled internally |
| Cross-track PID | Error is signed perpendicular distance from active segment |

The controllers are supplied as objects and reused by built commands. Do not run multiple commands from the same builder concurrently.

### How controller output becomes a drivetrain request

The three PIDs do not directly control motors:

1. The translation PID requests a field-relative speed magnitude from remaining polyline distance.
2. BLine points that magnitude toward the active translation target and adds the CTE correction perpendicular to the active segment.
3. The rotation PID (or an active override) requests angular velocity.
4. Active maximum velocities cap the request. Active maximum accelerations limit how quickly it may change from the follower's previous commanded speeds, including while the controller is trying to decelerate near the endpoint.
5. BLine converts the resulting request to robot-relative `ChassisSpeeds`; the drivetrain then has to realize it.

A velocity constraint is a ceiling, not a promise that the robot reaches that speed. It is also a primary path-authoring control: use local maximum-velocity ranges to slow turns and precision approaches. An acceleration constraint is a command slew limit, not a drivetrain model or proof of traction. Setting it much lower can delay both acceleration and braking and can change the apparent controller tune. Compare BLine's requested outputs with measured drivetrain speed when tuning.

## Builder options

### Alliance flip

```java
builder.withDefaultShouldFlip();
```

Uses the Driver Station alliance to apply BLine's default opposite-alliance transform. Author the base path from the blue-origin perspective.

For custom policy:

```java
builder.withShouldFlip(this::shouldFlip);
builder.withShouldMirror(this::shouldMirror);
```

Do not also mutate the same path manually unless you have intentionally accounted for both transformations.

### Pose reset

```java
builder.withPoseReset(driveSubsystem::resetPose);
```

The reset consumer is captured by every command built while this option is set. Builder options persist.

For most autonomous routines, set this option only while building the first path command, then clear it:

```java
Command first = builder
    .withPoseReset(driveSubsystem::resetPose)
    .build(firstPath);

builder.withPoseReset(ignored -> {});
Command second = builder.build(secondPath);

Command auto = Commands.sequence(first, second);
```

The first command retains the reset consumer it captured during `build`. At initialization, `FollowPath` applies its configured alliance flip and mirror before supplying the start pose to that consumer.

!!! warning "An explicit reset needs the same transform policy"
    `driveSubsystem.resetPose(firstPath.getStartPose())` uses the original authored pose. When the builder later flips or mirrors its private path copy, the reset and followed path disagree. Use the one-build pattern above, or explicitly transform a copied path once and use that same policy for both reset and following.

### Projection-based translation handoff

```java
builder.withTRatioBasedTranslationHandoffs(true);
```

This option is **off by default** and must be enabled on the builder. When enabled, it adds a projected-progress threshold, calculated as `clamp(1 − handoffRadius / segmentLength, 0, 1)`, as an alternative to entering the handoff circle. The distance-to-target condition remains active; BLine advances when either condition is satisfied.

Enable it for most paths whose intermediate translation targets are **pass-through shaping points**, then validate the behavior on the robot. It prevents a disturbed or fast-moving robot from getting stuck trying to re-enter a handoff circle after its projected progress has already passed the intended transition. Radius-only handoff can still be appropriate when an intermediate target represents a deliberate must-enter gate and the robot is constrained to approach it reliably. The option does not change completion at the final target because there is no later translation target to hand off to.

See [Handoffs, t-ratio & Completion](../concepts/key-parameters.md#recommended-for-pass-through-anchors-t-ratio-handoff).

## Build a fixed path

```java
Path score = new Path("score-left");
Command followScore = builder.build(score);
```

`build` captures a copy of the supplied path. Later mutations of the original do not change the built command.

## Build a runtime path at schedule time

Do not evaluate a live pose while configuring controller bindings at robot startup:

```java
// Wrong: getPose() runs while RobotContainer is being constructed.
controller.a().whileTrue(
    runtimeBuilder.build(new Path(
        new Path.Waypoint(driveSubsystem.getPose()),
        new Path.Waypoint(targetPose)
    ))
);
```

Defer construction:

```java
controller.a().whileTrue(
    Commands.deferredProxy(() ->
        runtimeBuilder.build(new Path(new Path.Waypoint(targetPose)))
    )
);
```

A single final waypoint is enough for drive-to-pose. `FollowPath` starts from the live supplied pose and holds the live starting heading only when the path has no rotation target.

Here, `runtimeBuilder` is a dedicated `FollowPath.Builder` with no flip, mirror, or pose-reset option because `targetPose` already uses the current WPILib field coordinate frame. Give a runtime builder its own controller objects, or otherwise guarantee it cannot run concurrently with commands that reuse the same controllers.

If a target is instead a canonical blue-authored pose that should move to the opposite alliance, use the transforming builder intentionally. Do not transform a live pose or an already alliance-specific target a second time.

## Add a timeout or fallback

BLine follows physical progress. If the robot is blocked and cannot reach the next element, the command can continue indefinitely.

Choose a policy appropriate to the routine:

```java
AtomicBoolean timedOut = new AtomicBoolean(false);

Command timeout = Commands.waitSeconds(3.0)
    .andThen(Commands.runOnce(() -> timedOut.set(true)));

Command guardedPath = Commands.sequence(
    Commands.runOnce(() -> timedOut.set(false)),
    Commands.race(
        builder.build(path),
        timeout
    )
).finallyDo(interrupted ->
    Logger.recordOutput("Auto/PathTimedOut", timedOut.get())
);
```

Reset the flag at initialization so state cannot leak across schedules. A plain `.withTimeout(3.0)` is enough when you do not need to distinguish a timeout in logs; the outer decorator's `finallyDo` interruption flag does **not** identify which side of that race won. A timeout trades recovery opportunity for schedule certainty, so use it where getting stuck would make the rest of the auto unsafe or meaningless.

## Completion and interruption

The command finishes when the final translation and rotation elements are active and both errors are inside their tolerances. v0.9.1 has no measured final-velocity criterion.

On normal end, interruption, or defensive invalid-path exit, the follower sends zero robot-relative `ChassisSpeeds`.

## Diagnostics

Each command exposes:

```java
follow.getCurrentTranslationElementIndex();
follow.getCurrentRotationElementIndex();
follow.getRemainingPathDistanceMeters();
```

The indices refer to the expanded internal element list, not the separate constraint ordinals shown in BLine Web.

Use the logging consumers for controller output, target, constraint, event, and finish-state detail. See [Logging & AdvantageScope](logging.md).

## Common integration checks

- Supplier and consumer are robot-relative.
- Human driver-perspective transforms are not applied to autonomous output.
- Pose reset happens once, at the intended transformed start.
- Fixed paths are loaded before they are needed.
- Runtime paths are constructed when scheduled.
- T-ratio-based handoff is enabled for normal pass-through anchors, or radius-only behavior is a deliberate choice.
- Swerve modules are [pre-oriented](pre-match.md) before an autonomous path begins.
- A physically blocked path has an intentional timeout/fallback policy.
- Rotation overrides are cleared before a conflicting final heading check.
