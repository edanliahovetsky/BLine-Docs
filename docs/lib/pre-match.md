# Pre-Match Module Orientation

Pointing swerve modules toward the first intended translation direction before autonomous can reduce the sideways twitch while modules rotate under load.

## Helper

```java
Rotation2d moduleDirection =
    firstPath.getInitialModuleDirection(driveSubsystem::getPose);
```

The live-pose overload walks translation targets and selects the first target outside its handoff radius. A one-target path points toward that target.

The returned angle is documented relative to robot rotation. Vendor APIs differ in azimuth sign and reference direction, so verify the value on blocks before passing it directly into a module-orientation request.

## Require the drivetrain when commanding modules

If orientation is part of the autonomous command:

```java
Command orientModules = Commands.runOnce(
    () -> driveSubsystem.setModuleOrientations(
        firstPathForRun.getInitialModuleDirection(driveSubsystem::getPose)
    ),
    driveSubsystem
);

Command auto = Commands.sequence(
    orientModules,
    pathBuilder.build(authoredFirstPath)
);
```

The `runOnce` should require the drivetrain because it changes drivetrain state.

## Account for alliance transforms

`FollowPath.Builder` flips/mirrors an internal copy when the command initializes. Calling `getInitialModuleDirection` earlier on the original blue path does not see that internal transform.

Create a separate preview copy using the same policy:

```java
Path firstPathForRun = authoredFirstPath.copy();
if (shouldFlip.get()) {
    firstPathForRun.flip();
}
if (shouldMirror.get()) {
    firstPathForRun.mirror();
}
```

Use that copy only for orientation/preview. Pass the original authored path to a builder that applies the corresponding transforms once.

## Disabled-periodic option

Some drivetrains can hold module azimuth while disabled. If your hardware/vendor implementation supports that safely, recalculate after alliance and auto selection are known:

```java
public void disabledPeriodic() {
    Path selected = transformedPreviewOfSelectedFirstPath();
    driveSubsystem.setModuleOrientations(
        selected.getInitialModuleDirection(driveSubsystem::getPose)
    );
}
```

Do not assume every module API accepts commands while disabled. Test the exact drivetrain behavior and avoid repeatedly allocating/loading path files in a periodic callback.

## Verification

1. Put the robot on blocks.
2. Select the same alliance and auto policy used in a match.
3. Display the planned path with `BLineField`.
4. Run the orientation action.
5. Confirm all module wheels point along the intended first field movement after conversion into the vendor's azimuth convention.
6. Test both alliances and any mirror option.

Pre-orientation improves the first control cycles; it does not fix an incorrect pose, frame transform, or path start.
