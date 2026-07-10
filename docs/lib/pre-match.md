# Pre-Match Module Orientation for Swerve

For most BLine swerve paths, make the starting wheel direction an explicit part of autonomous preparation. Pointing the modules toward the first intended translation direction before the follower accelerates reduces the initial sideways twitch and avoids spending the first control cycles rotating modules under load.

Pre-orientation matters most when the path starts aggressively, the first movement differs substantially from the modules' resting direction, or the robot must clear a nearby obstacle precisely. It may be unnecessary for a gentle start that has been tested repeatedly and already begins with suitably aligned modules. Treat it as a path-by-path reliability decision, not a requirement to add an orientation step to every routine.

When the path benefits from pre-orientation, choose one tested method:

- **Commanded orientation:** ask the drivetrain to steer to the calculated direction, confirm it arrived, then start `FollowPath`.
- **Manual orientation:** safely align the wheel tread directions during robot staging using a marked or documented direction for each starting configuration.

Non-swerve holonomic drivetrains do not need this module-azimuth step.

## Helper

```java
Rotation2d moduleDirection =
    firstPath.getInitialModuleDirection(driveSubsystem::getPose);
```

The live-pose overload walks translation targets and selects the first target outside its handoff radius. A one-target path points toward that target.

This helper uses handoff radii when selecting the first movement target; it does not inspect the builder's optional t-ratio-based handoff setting. Verify the returned direction whenever the starting pose, first translation targets, handoff radii, or transform policy changes.

The returned angle is documented relative to robot rotation. Vendor APIs differ in azimuth sign and reference direction, so verify the value on blocks before passing it directly into a module-orientation request.

## Option 1: Command and confirm the orientation

The BLine helper only calculates an angle; your drivetrain owns the steering request and the definition of "ready." If orientation is part of the autonomous command, require the drivetrain and wait for module feedback before starting the path. In this example, `firstPathForRun` is the transformed orientation copy described under [Account for alliance transforms](#account-for-alliance-transforms), while the builder receives the original authored path:

```java
// Drivetrain method names below are team-specific placeholders.
Command orientModules = Commands.runOnce(
    () -> driveSubsystem.setModuleOrientations(
        firstPathForRun.getInitialModuleDirection(driveSubsystem::getPose)
    ),
    driveSubsystem
);

Command auto = Commands.sequence(
    orientModules,
    Commands.waitUntil(driveSubsystem::modulesAtRequestedOrientation),
    pathBuilder.build(authoredFirstPath)
);
```

`modulesAtRequestedOrientation` is a drivetrain-specific placeholder. Use the module-state feedback and tolerance your team has tested. The `runOnce` should require the drivetrain because it changes drivetrain state; the surrounding sequence then retains that requirement through the transition into `FollowPath`.

Do not replace the readiness check with an unexplained fixed delay. If you add a timeout, branch to an intentional safe fallback rather than treating the timeout as proof that the modules are ready. If your drivetrain cannot report azimuth readiness, determine a conservative procedure from logged module states and test it on blocks before relying on it in a match.

## Option 2: Align modules manually

Manual alignment avoids spending autonomous time steering the modules. For each starting configuration:

1. Calculate and verify the transformed first movement direction during practice.
2. Record a clear staging reference, such as a wheel-tread direction or alignment mark.
3. With the robot in a safe state and following your team's mechanical procedure, place each module in that direction without forcing a powered or high-reduction mechanism.
4. Recheck the selected auto and alliance before the robot is placed on the field.

The manual method is only repeatable when the reference is unambiguous and the path's first movement is stable. Recalculate the reference whenever the start pose, first pass-through target, alliance transform, or mirror policy changes.

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

## Optional disabled-periodic method

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
3. Inspect the transformed first segment in BLine Web or another trusted visualization; optionally display it with `BLineField`.
4. Run the orientation action or perform the manual staging procedure.
5. Confirm all module wheels point along the intended first field movement after conversion into the vendor's azimuth convention.
6. Confirm the readiness check succeeds only when every module is within your chosen tolerance.
7. Test both alliances and any mirror option.

Pre-orientation improves the first control cycles; it does not fix an incorrect pose, frame transform, path start, steering controller, or module offset.
