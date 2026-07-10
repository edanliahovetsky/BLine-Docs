# Common Issues

Start from the symptom. Change one thing at a time and save the matching log.

## The BLine-Lib dependency does not resolve

Confirm the installed/tagged version exists. Current stable is `v0.9.1`:

```gradle
implementation 'com.github.edanliahovetsky:BLine-Lib:v0.9.1'
```

Reinstall the vendor URL and refresh Gradle. Use the direct GitHub vendor JSON if the metrics endpoint is temporarily unavailable. See [Installation](getting-started/installation.md#2-install-bline-lib).

## Browser Save did not update the robot project

Browser **Save** writes browser persistent storage. Choose **Export Autos Folder…**, extract the archive, and copy `autos/` to `src/main/deploy/`. See [Import, Export & Backups](gui/exporting.md).

## `config.json` is not read

Check:

- deployed location is `src/main/deploy/autos/config.json`;
- JSON parses successfully;
- keys are inside `kinematic_constraints` or use the supported flat names;
- the path file was also deployed; and
- code is loading the same autos directory you inspected.

A missing/unreadable config can fail file-based loading. Missing individual numeric keys in a parseable config use library fallbacks. Programmatically constructed paths use the current process-wide static defaults; file-based path loads always read the `config.json` in their autos directory and update that static state.

## The robot drives toward `(0, 0)` first

The path or command was probably constructed while `RobotContainer` was starting, capturing a pose before localization was valid.

For runtime targets, use `Commands.deferredProxy(...)` and construct the path when scheduled. A one-waypoint path needs only the target; do not prepend a stale current-pose waypoint. See [Follow Paths](lib/follow-path.md#build-a-runtime-path-at-schedule-time).

## The robot drives the right shape in the wrong direction

Check the drivetrain contract first:

- speed supplier is robot-relative;
- speed consumer accepts robot-relative `ChassisSpeeds`;
- no human driver-perspective transform is applied to autonomous output;
- pose uses WPILib field coordinates; and
- module/vendor axis conventions match the conversion code.

Disable at low speed before trying to tune gains.

## Blue works but red fails

Most cases are a transform applied zero or two times.

- Author paths from the blue-origin perspective.
- Use `withDefaultShouldFlip()` **or** manual `Path.flip()`, not both.
- If resetting pose, let the first `FollowPath` command supply its transformed start pose through `withPoseReset(...)`; do not explicitly reset to the unflipped authored start.
- Keep driver-input alliance negation outside the BLine speed consumer.
- Verify whether the task needs alliance flip, same-alliance mirror, or separate paths.
- Draw the transformed preview on Field2d before enable.

See [Alliance Flip & Mirror](lib/flip-and-mirror.md).

## The robot orbits an intermediate target

The robot is likely moving too fast to enter the handoff radius.

1. Plot `translationHandoffOccurred` and active max velocity.
2. Lower the velocity over the approach range.
3. Confirm the radius is realistic for pose error and stopping distance.
4. Consider projection-based handoffs for a tested high-speed pass-through.

Do not start by raising CTE gain; orbiting a target is usually a handoff/velocity problem.

## The robot stalls or slows on a bump

Avoid an anchor or small handoff circle on top of the obstacle. Place anchors before and after it, preserve an intentional approach speed, and keep the range/geometry simple while the chassis is disturbed.

The editor simulation cannot predict traction or beaching.

## The endpoint chatters or oscillates

Plot remaining distance, raw/clamped/final translation output, measured speed, and tolerance state.

Check:

- translation `P` too high;
- end tolerance tighter than pose noise/physical need;
- minimum velocity baseline too high;
- measured drivetrain deadband or module response;
- entry velocity too high; and
- localization jumps near the target.

Use the [translation tuning plots](getting-started/tuning.md#1-tune-translation).

## The command finishes while still moving

BLine-Lib v0.9.1 has no final measured-velocity criterion. If the robot enters both tolerances with momentum, the command finishes and sends zero speeds.

Add a lower max-velocity range before the final anchor and validate measured velocity at the finish. Tightening tolerance alone may make the behavior slower or less stable without producing a gentle arrival.

## A physically blocked path never finishes

Geometric tracking waits for actual progress. If the robot cannot move, add an intentional timeout or sensor-based fallback to the command composition. Decide what the robot should do after the fallback; do not merely hide the delay.

## Rotation never reaches the target

Check:

- final anchor actually contains a rotation target;
- active max rotation velocity/acceleration;
- profiled target has enough segment length;
- rotation gain and measured heading;
- JSON explicitly sets `profiled_rotation`; and
- a static rotation override is not holding another heading.

An incompatible override can prevent the final rotation predicate from completing even after translation is done.

## An event cancels the whole autonomous routine

The triggered command probably conflicts with requirements held by the outer command group.

- Compose the outer routine with `BLineCommands` when later/earlier children share event subsystems.
- Do not trigger a command requiring the drivetrain during `FollowPath`.
- Remember that a scheduled event command is not automatically canceled at path end.

See [Events & Command Groups](lib/event-triggers.md).

## An event does not fire

Check:

- exact case-sensitive `lib_key` registration;
- event `t_ratio` is inside `[0,1]`;
- same-segment events are listed in increasing ratio order;
- JSON includes a nonempty key; and
- the robot's projected progress actually passes the marker.

Plot `eventTriggerElementIndex` and `eventTriggersFiredCount`.

## A JSON constraint has no effect

In v0.9.1, max/min velocity and acceleration constraints must be arrays of range objects. Numeric scalars for those six fields are ignored. Only end tolerances are scalar. See [Runtime JSON form](concepts/constraints.md#runtime-json-constraint-form).

Also remember that editor ordinals are one-based while runtime JSON ordinals are zero-based.

## Optimizer values are marked stale

Geometry, handoff, rotation, path-default, or optimizer-setting inputs changed after generation. Re-run **Auto all**, then confirm manual ranges were preserved and inspect the new caps. “Refreshed” still does not mean robot-validated.

## Editor preview differs from the robot

Expected: the preview is idealized and does not use the robot's PID controllers or dynamics.

Compare:

- live pose versus physical position;
- robot-relative frame wiring;
- deployed `config.json` and path file;
- active constraint logs;
- measured versus requested chassis speed;
- module control and current limits; and
- events/transforms in actual robot code.

## Windows blocks the desktop build

Current prerelease installers may be unsigned. Verify the download source. If the team cannot approve the desktop build, use the hosted browser editor and export the autos folder.

## How to ask for help

Post an issue or use the [Chief Delphi thread](https://www.chiefdelphi.com/t/introducing-bline-a-new-rapid-polyline-autonomous-path-planning-suite/509778) with:

- BLine-Web and BLine-Lib versions;
- robot-code commit;
- path JSON and `config.json`;
- exact frame/pose setup;
- one screenshot with aligned log plots;
- planned and live field traces; and
- whether the command finished, timed out, or was interrupted.
