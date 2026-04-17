# Common Issues

Real-world failure modes and fixes, collected from teams running BLine during the 2026 season. Each entry is a symptom → cause → fix recipe you can walk down.

If you hit something not covered here, the [Chief Delphi thread](https://www.chiefdelphi.com/t/introducing-bline-a-new-rapid-polyline-autonomous-path-planning-suite/509778) is the right place to post.

## Robot oscillates around a waypoint and never finishes

**Symptoms:** The robot overshoots a waypoint, reverses, overshoots again, forever. Remaining-distance log (`FollowPath/remainingPathDistanceMeters`) saws around a non-zero value.

**Cause:** The handoff radius at that waypoint is smaller than the robot's stopping distance at its configured max velocity. The robot blows past the circle, backs up past the circle the other way, and never latches the handoff.

**Fix:**

1. **Add a ranged velocity cap** before the waypoint with a smaller max velocity. Walk it down until the robot can stop within the radius. This is the correct fix in 90% of cases.
2. **As a last resort**, increase the waypoint's handoff radius. Costs path precision.
3. **Don't just shrink the radius** — that makes the problem worse.

Watch `FollowPath/crossTrackError` in the same dashboard — if it's fine but the remaining-distance is oscillating, this is definitely the issue.

## Robot stalls on a bump / obstacle, wheels slipping

**Symptoms:** Robot approaches a bump, decelerates aggressively, and stalls with wheels spinning. Sometimes it gets over if you crank velocity way up, but then overshoots badly on the other side.

**Cause:** Too many waypoints clustered around the obstacle. The robot tries to decelerate into a handoff circle *while* crossing the disturbance.

**Fix:**

- **One waypoint just before** the obstacle.
- **One waypoint just past** the obstacle.
- **No intermediate waypoints on the obstacle itself.**
- If you want fine control, use **ranged constraints** set before and after the obstacle ordinal — not extra Waypoints.

This is the pattern a few teams settled on after running into bumps during the 2026 season (both etherex and teams 449 and 6989 called it out).

## Robot goes to (0, 0) before running the real path

**Symptoms:** Trigger a teleop auto-align on button-press. The robot drives to `(0, 0)` first, then to the target.

**Cause:** The path was built at binding-registration time, not at button-press time, and it captured the robot's pose as whatever `Pose2d` existed at robot startup — typically `Pose2d.kZero`.

**Fix — Option A (explicit deferral):**

```java
driveController.square().whileTrue(
    Commands.deferredProxy(() ->
        pathBuilder.build(new Path(
            new Path.Waypoint(driveSubsystem.getPose()),
            new Path.Waypoint(target)
        ))
    )
);
```

**Fix — Option B (drop the "current pose" waypoint):**

For a single-destination drive-to-pose, you don't need the robot's current pose as a waypoint at all. BLine tracks against the live pose supplier from the builder:

```java
driveController.square().whileTrue(
    Commands.deferredProxy(() -> pathBuilder.build(new Path(new Path.Waypoint(target))))
);
```

Option B is what we recommend — it removes an entire class of bugs.

## Path doesn't work on red alliance (or goes the wrong way)

**Symptoms:** Blue-side auto works perfectly. Red side drives a completely wrong path, or drives the right shape in the wrong direction.

**Possible causes:**

1. **`withDefaultShouldFlip()` not wired.** Confirm the builder has `withDefaultShouldFlip()` *or* you're calling `flip()` manually somewhere in the chain — not both, not neither.
2. **Teleop-style driver-perspective negation bleeding into auto.** Some swerve subsystems negate the commanded velocity on red (so "stick forward" points away from the driver station). If this negation is applied to the consumer BLine writes to, the auto's commanded motion is negated 180° on red. Fix: move the negation into a `joystickToLinearVelocity` helper that only applies to human stick input, not to `FollowPath`'s output.
3. **Authored paths on the red side by accident.** All paths should be authored from the blue alliance's perspective. BLine flips at runtime.
4. **Field symmetry mismatch.** If the game uses mirror symmetry (not rotational), you need `mirror()` / `withShouldMirror(...)` instead of flip. See [Alliance Flip & Mirror](lib/flip-and-mirror.md).

## Mirrored path ends pointing the wrong way for a side-mounted mechanism

**Symptoms:** `path.mirror()` flips the path across the field width, and the final heading points the wrong way for a side-mounted shooter or intake.

**Cause:** `mirror()` maps `θ → −θ` (not `θ + π`), which preserves driver-perspective "forward" but inverts the *side* of the robot the mechanism points from.

**Fix:**

- **Override the final rotation** after mirroring (`path.setElement(lastIndex, new Waypoint(pos, mechanismHeading))`).
- **Use `flip()` if the field is rotationally symmetric** — it maps `θ → θ − π`, preserving the alliance-relative side.
- **Keep separate authored paths per side** if the asymmetric mechanism makes mirror unusable.

## Last commanded velocity is still driving after the command ends

**Symptoms:** `FollowPath` finishes, but the robot keeps drifting at the last commanded speed until the next command takes over.

**Fix:** Update to BLine-Lib v0.7.2 or later. Earlier versions didn't zero the chassis speeds on command end; this was fixed after haarcz reported it. In v0.7.2+, `FollowPath.end()` explicitly writes a zeroed `ChassisSpeeds` to the consumer.

## Oscillation starting the very first path if `withTRatioBasedTranslationHandoffs(true)` is enabled

**Symptoms:** The very first path of a run oscillates around the opening translation target and never completes handoff. Subsequent paths work fine. Only affects paths with `withTRatioBasedTranslationHandoffs(true)`.

**Fix:** Update to BLine-Lib v0.8.4. Earlier versions had an initialization edge case when the robot started at or extremely near the first path target combined with t-ratio handoffs. In v0.8.4+, handoff fires as soon as *either* the t-ratio threshold is reached *or* the robot is already within the handoff radius — which resolves the stall.

## Rotation target doesn't finish interpolating before the segment does

**Symptoms:** Robot is supposed to rotate to heading X by the midpoint of a segment. The robot crosses the midpoint still rotating, never reaching heading X, and the segment ends before rotation completes.

**Possible causes:**

- `profiled_rotation: true` and the segment is short relative to the rotational acceleration limit — there literally isn't enough segment to interpolate over.
- The max rotational velocity / acceleration is too low.

**Fixes:**

1. Increase max rotational velocity and acceleration in global or path constraints.
2. Use `profiled_rotation: false` on the RotationTarget so the robot starts rotating immediately instead of tapering.
3. Move the rotation target earlier (lower `t_ratio`) so the interpolation has more segment to work with.

## Robot visibly drifts laterally during the first ~500 ms of auto

**Symptoms:** Auto starts, robot immediately drifts sideways a few cm, then recovers and continues.

**Cause:** Swerve modules weren't pre-oriented before the match started. They're pivoting under load during the first control cycle.

**Fix:** Pre-orient modules in disabled-periodic using `path.getInitialModuleDirection(driveSubsystem::getPose)`. See [Pre-Match Module Orientation](lib/pre-match.md).

## Path takes much longer than expected

**Possible causes:**

- **Constraints too conservative** — check `FollowPath/translationControllerOutput` and the active velocity. If controller output is well below the max constraint, the constraint isn't the bottleneck. If it's at the max constraint, raise the constraint.
- **End tolerance too tight** — the last few cm of approach can easily eat 500+ ms if the tolerance is sub-centimeter. Loosen to 0.05–0.08 m unless you genuinely need precision.
- **Translation P too low** — the robot never gets aggressive enough. Try `P = 5.0` as a starting point.
- **Too many elements** — each handoff involves a cursor advance and a brief heading realignment. A path with 15 waypoints spends a lot of time at handoffs; consider removing the non-essential ones.

## Robot doesn't end up facing the right direction

**Possible causes:**

- **No rotation target at the end.** A final `TranslationTarget` without a Waypoint after it leaves rotation wherever it was. Replace with a Waypoint, or add a RotationTarget with `t_ratio = 1.0` at the end.
- **Profiled rotation is spreading the turn across the whole segment.** Try `profiled_rotation: false` to snap instead.
- **Rotation P too low.** Tune starting at `P = 3.0`.

## "Ghost robot" doesn't match the real robot in sim

**Symptoms (pre-v0.5.0 only):** The simulated robot icon finishes before the real robot reaches the endpoint.

**Context:** In earlier reports, some teams expected the GUI's sim footprint to match real-robot timing. It doesn't — the sim is a simplified kinematic preview, not a physics simulation. See [Simulation → Limitations](gui/simulation.md#what-the-simulation-does-not-show).

**Modern BLine (v0.8.x):** Paths end when the *robot* (via the live pose supplier) actually reaches both end tolerances, regardless of sim timing. There is no "ghost" on the robot side — the sim footprint only exists in the GUI.

## `Unresolved dependency: com.github.edanliahovetsky:BLine-Lib:...`

**Cause:** The version tag in `build.gradle` or the vendor JSON doesn't exist on GitHub (typo, or pinned to an unreleased version).

**Fix:** Check the [BLine-Lib releases page](https://github.com/edanliahovetsky/BLine-Lib/releases) for available tags. Current stable is **v0.8.4**. Update the version string:

```gradle
implementation 'com.github.edanliahovetsky:BLine-Lib:v0.8.4'
```

If you're on the vendor JSON approach, re-run **WPILib: Manage Vendor Libraries → Install new libraries (online)** to refresh.

## Windows Defender flags the BLine-GUI installer

**Cause:** The Windows binaries are currently unsigned. False positives are occasional (not universal).

**Fix:**

1. **Install from source** via `pipx install git+https://github.com/edanliahovetsky/BLine-GUI.git` — no AV flag issues that way.
2. **Whitelist** BLine in your antivirus if you trust the download source. See the [BLine-GUI releases page](https://github.com/edanliahovetsky/BLine-GUI/releases) for the official download URL.

Code-signing for the Windows binaries is on the roadmap.

## "Unregistered event trigger key" warnings in the logs

**Cause:** Your path references an `EventTrigger` whose `lib_key` was never passed to `FollowPath.registerEventTrigger(...)`.

**Fix:** Register the key at robot init (in `RobotContainer`'s constructor). Keys match by string, case-sensitive. Typos are the most common cause.

BLine deliberately doesn't crash on missing keys — the path completes normally, only the trigger's action is skipped. Fix the typo and it'll fire next time.

## Config.json isn't being read

**Symptoms:** The defaults you set in `config.json` don't seem to take effect; BLine falls back to built-in defaults.

**Possible causes:**

- File is in the wrong place. It should be at `src/main/deploy/autos/config.json`, which deploys to `/home/lvuser/deploy/autos/config.json` on the roboRIO.
- JSON is malformed. BLine-Lib will `throw` with the error — check the console for `Failed to load global constraints from .../config.json`.
- You are also calling `Path.setDefaultGlobalConstraints(...)` in code, which takes precedence. Either use the code path or the file, not both.

Recent BLine-Lib releases (v0.8.3+) are more tolerant of config shape — they accept both flat and nested (`kinematic_constraints: { ... }`) layouts and log a warning + use a fallback when a specific key is missing rather than crashing. If you're on v0.8.2 or earlier and hit a startup crash after changing the GUI config, upgrade.

## Still stuck?

The [Chief Delphi thread](https://www.chiefdelphi.com/t/introducing-bline-a-new-rapid-polyline-autonomous-path-planning-suite/509778) is the best place to post with:

- What you're trying to do.
- A code/path snippet.
- A screenshot of your `FollowPath/remainingPathDistanceMeters` graph from AdvantageScope (or equivalent).
- Your constraints and the symptoms.

Etherex and several community members respond actively.
