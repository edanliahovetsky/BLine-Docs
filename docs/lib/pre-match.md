# Pre-Match Module Orientation

Before an autonomous path starts running, the swerve modules are pointed somewhere — whatever direction they happened to land on during enable, or whatever the default was when the robot was last disabled. If that's **not** the direction the robot is about to drive, the modules have to pivot under load during the first control cycle. You'll see the robot drift a few cm laterally, and position error accumulates from frame zero.

BLine exposes a helper to get the direction the modules should be pre-oriented to, so you can set them *before* the match timer starts.

## The API

```java
Rotation2d dir = path.getInitialModuleDirection();
```

Returns the direction the modules should face to minimize initial drift. Walks the path's translation targets and:

1. If there's exactly one translation target, returns the direction from the robot's current pose to that target.
2. If there are multiple, returns the direction to the first target whose handoff radius doesn't already contain the robot's current pose.
3. Falls back to the last translation target if everything is already within handoff.

The returned rotation is **relative to the robot's current heading**, so it's ready to pass straight to your drive subsystem's module orientation setter.

### Overloads

| Signature | Use when |
|-----------|----------|
| `getInitialModuleDirection()` | Default — uses `path.getStartPose()` (rotation 0 if no rotation target). |
| `getInitialModuleDirection(Rotation2d fallbackRotation)` | Provides a fallback rotation for the start pose calculation. |
| `getInitialModuleDirection(Supplier<Pose2d> poseSupplier)` | Uses an arbitrary pose supplier — useful for live robot pose rather than path start pose. |

For pre-match orientation, the live-pose overload is often what you want: you're pointing modules based on where the robot *currently* is, not where the path's start says it should be.

## Typical wiring

### Option A: In disabled-periodic

Keep modules pointed at the first target while the robot is disabled on the field:

```java
@Override
public void disabledPeriodic() {
    Path first = autoChooser.getSelected().getFirstPath();
    if (first != null) {
        driveSubsystem.setModuleOrientations(
            first.getInitialModuleDirection(driveSubsystem::getPose)
        );
    }
}
```

This keeps the orientation current as the robot's pose updates from vision.

### Option B: In auto-init

Orient once at the start of autonomous, right before the follow command runs:

```java
public Command getAutonomousCommand() {
    Path first = new Path("scoreFirst");
    return Commands.sequence(
        Commands.runOnce(() -> driveSubsystem.setModuleOrientations(
            first.getInitialModuleDirection(driveSubsystem::getPose)
        )),
        pathBuilder.build(first),
        // ... rest of auto
    );
}
```

The `runOnce` doesn't require the drive subsystem, so it runs before the `FollowPath` command acquires the subsystem on its first cycle.

### Option C: In the command sequence

Put the orientation call inside a `deadline` so any vision updates happen right up until the follow command schedules:

```java
Commands.deadline(
    pathBuilder.build(first),
    Commands.run(() -> driveSubsystem.setModuleOrientations(
        first.getInitialModuleDirection(driveSubsystem::getPose)
    )).withTimeout(0.0)
);
```

This is overkill for most teams — Option A or B is the recommended pattern.

## Why it matters

For a typical swerve under load, rotating all four modules 90° takes tens of milliseconds. That's:

- A cross-track error that compounds as the robot starts accelerating.
- A non-deterministic start — the amount of drift depends on how close the starting orientation happened to be.
- Trouble for routines that begin near a scoring element (reef, amp, speaker) where those first few centimeters matter.

Pre-orienting modules means by the time the match starts, every wheel is already pointing in the direction of the first commanded motion vector. Frame zero looks clean.

## Physical orientation vs. commanded orientation

Two approaches work:

- **Commanded** — tell the drive subsystem to hold the modules at a heading. Requires the subsystem to expose a `setModuleOrientations(Rotation2d)` method (or equivalent).
- **Physical** — at robot setup, physically rotate the modules to the correct heading before enabling.

Commanded is easier to automate and handles vision-updated pose. Physical is more reliable when you don't have a module-orientation method available. Either works.

## Caveats

- **`getInitialModuleDirection()` can return the wrong direction if the robot is already "past" the first target.** The fallback to the last target is defensive, not always useful. Always pass the live pose supplier when calling this in pre-match — it handles paths whose start pose isn't exactly where the robot is.
- **Do not call this after the path has already been flipped manually.** If you call `getInitialModuleDirection()` before `flip()`, then flip, the stored direction is stale. If you're using `withDefaultShouldFlip()`, either flip the path manually first or compute the direction in auto-init *after* alliance is known.
- **For single-waypoint paths** (drive-to-pose), the returned direction points at the single waypoint, which is exactly what you want.
