# Practical Recipes

These patterns assume the drivetrain frames, localization, and three controllers already pass the [tuning checklist](getting-started/tuning.md#ready-for-path-work-checklist).

!!! warning "Choose transforms from the target's coordinate source"
    The runtime examples below use `runtimePathBuilder`, a separately constructed builder with no flip, mirror, or pose-reset option. Their targets already use the live WPILib field frame. Do not feed a live pose or already alliance-specific target to a builder that still has `withDefaultShouldFlip()`; on red, it would transform those coordinates again.

## Runtime drive-to-pose

A one-waypoint path is enough. Construct it when the command is scheduled:

```java
Command driveToScoringPose(Pose2d target) {
    return Commands.deferredProxy(() ->
        runtimePathBuilder.build(new Path(new Path.Waypoint(target)))
    );
}
```

Do not reset pose for this move. The target is the destination, not the robot's current pose.

## Hold heading during a translation-only move

A path with translation targets and no rotation target uses the live heading at initialization as its fallback:

```java
Path translateOnly = new Path(
    new Path.TranslationTarget(target.getTranslation())
);
```

Use a waypoint instead when a specific final heading matters.

## Rotate in place

Build a one-waypoint path at the live translation with the desired heading, at schedule time:

```java
Command rotateTo(Rotation2d heading) {
    return Commands.deferredProxy(() -> {
        Pose2d current = driveSubsystem.getPose();
        Path turn = new Path(new Path.Waypoint(
            current.getTranslation(),
            heading
        ));
        return runtimePathBuilder.build(turn);
    });
}
```

Keep translation tolerance reasonable so pose noise does not turn rotation-in-place into unwanted translation correction.

## Chain paths without repeated pose resets

Load the fixed paths once, capture a reset only on the first path command, and use `BLineCommands` if path events schedule commands whose subsystems also appear elsewhere in the sequence:

```java
Command firstCommand = pathBuilder
    .withPoseReset(driveSubsystem::resetPose)
    .build(first);

pathBuilder.withPoseReset(ignored -> {});
Command secondCommand = pathBuilder.build(second);

Command auto = BLineCommands.sequence(
    firstCommand,
    scoreCommand,
    secondCommand
);
```

Do not keep `withPoseReset(driveSubsystem::resetPose)` on the reused builder for every segment. Using the builder for the first reset also ensures its alliance flip/mirror is applied before the reset pose is supplied.

## Cross a bump or trench

For a region where the robot should preserve momentum:

1. Put one anchor before the feature and one after it.
2. Avoid a handoff point on top of the disturbance.
3. Use a range to control approach speed without forcing a stop on the feature.
4. Use a handoff radius the robot can enter with expected pose error.
5. Add an intentional timeout/fallback if becoming stuck should abort the remaining routine.

Test the path in the real direction and payload state. The editor simulation does not model traction or chassis contact.

## Slow into a precise endpoint

When the final pose must be accurate:

1. Keep controller gains that already work globally.
2. Add a lower max-velocity range over the final translation ordinals.
3. Confirm the max-acceleration constraint allows the robot to decelerate before the tolerance region.
4. Choose a tolerance based on the scoring requirement.
5. Plot measured speed because v0.9.1 has no final-velocity finish criterion.

Do not use an extremely tight tolerance to compensate for a path that enters the endpoint too quickly.

## Aim while translating

Use a rotation override, add a path event such as `releaseAim` before the final heading must be satisfied, and clear the override around the entire composition:

```java
FollowPath.registerEventTrigger(
    "releaseAim",
    FollowPath::clearRotationOverride
);

Command aimed = Commands.sequence(
    Commands.runOnce(() -> FollowPath.overrideRotation(
        aimingController::getOmegaRadiansPerSecond,
        FollowPath.RotationOverrideBehavior.RESPECT_CONSTRAINTS
    )),
    pathBuilder.build(path)
).finallyDo(interrupted -> FollowPath.clearRotationOverride());
```

Place the `releaseAim` event early enough for BLine to return to the authored final heading. The outer `finallyDo` is still necessary for interruption or cancellation before that event.

## Run a mechanism over a path region

Use start/stop event keys to update state, then a separate command observes that state. Compose with [BLineCommands](lib/event-triggers.md) so the outer group does not unnecessarily hold every child requirement.

The mechanism command must not require the drivetrain while `FollowPath` is active.

## Reuse a scoring pose across autos

In BLine Web:

1. Create a linked waypoint named for the field task.
2. Link each path's scoring waypoint to it.
3. Lock it after measurement/strategy approval.
4. Use collections to group the path families.
5. Export and review all affected path JSON diffs after moving it.

Linked identities are editor metadata; robot paths receive ordinary copied coordinates.

## Display the selected auto

Update one explicit Field2d slot when the chooser changes:

```java
BLineField.drawPath(field, "SelectedAuto", selectedPath);
```

Show the live robot pose on the same field and verify the alliance transform policy before enable.

## Add an intentional fallback

Geometric following waits for physical progress. For a match-critical path that should not consume the rest of auto when blocked:

```java
Command guarded = pathBuilder.build(path)
    .withTimeout(timeoutSeconds);
```

Decide what follows a timeout: stop safely, try a retreat, skip a score, or branch based on sensors. A timeout without a defined next state only hides the original failure.

## Build a useful auto chooser

BLine-Lib loads one named path at a time and does not provide a collection-aware auto builder. Keep a code-side map from readable chooser names to composed commands/paths, and draw the selected path with `BLineField`.

Editor collections can inform this organization, but they are not loaded by the robot.

## Related

- [First Path Tutorial](getting-started/quick-start.md)
- [Constraints & Ordinals](concepts/constraints.md)
- [Events & Command Groups](lib/event-triggers.md)
- [Rotation Overrides](lib/rotation-overrides.md)
- [Common Issues](common-issues.md)
