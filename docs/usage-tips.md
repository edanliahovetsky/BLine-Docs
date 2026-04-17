# Tuning & Usage Tips

Practical advice for getting BLine working well on a real robot. A lot of this distills experience from teams running BLine during the 2026 season — it's all empirical, not theoretical.

## PID tuning

### Tune in this order: translation → rotation → cross-track

1. **Translation controller first, with rotation and CTE set to zero.** The easiest way is to author a path with a single Waypoint whose rotation matches the robot's current heading, and tune a straight-line move on a long distance. Watch for:
    - Controller saturates (output = max velocity) through most of the path — that's correct.
    - Controller smoothly decelerates through the last meter or so.
    - Robot stops inside the end tolerance without oscillating.

2. **Add the rotation controller.** Author a waypoint that requires rotation during the move. Tune until:
    - Rotation reaches the target heading without overshoot.
    - No jitter at the endpoint.

3. **Finally, tune CTE.** On a longer multi-segment path, observe the `FollowPath/crossTrackError` log key. Tune just high enough to pull the robot back onto the line over the course of long segments. Don't over-tune — see below.

### Recommended starting gains

| Controller | P | I | D |
|------------|---|---|---|
| Translation | 5.0 | 0.0 | 0.0 |
| Rotation | 3.0 | 0.0 | 0.0 |
| Cross-track | 2.0 | 0.0 | 0.0 |

These are real-world starting points, not lab values. Most teams end up close to them after tuning.

!!! warning "Never use I on the translation controller"
    The translation controller's setpoint is zero remaining distance. An integrator accumulates error while the robot is far from the endpoint and drives instability. Use P-only (or P + D if you need damping). Integrators on rotation and CTE are fine and can help with steady-state offsets.

!!! warning "Don't over-tune CTE"
    CTE's output sums with the translation output (no clamp), so aggressive CTE gains can fight the translation command during turns. You'll see fishtailing and corner instability. Tune CTE *after* translation and rotation feel right, and keep it gentle — just enough to pull the robot back onto long segment lines.

### Tune at maximum velocities

Stress-test your translation-controller gains at the max velocity and acceleration your path constraints allow. If you tune at 2 m/s and then run a path at 4 m/s, you'll see overshoot and instability at the endpoint you didn't see during tuning.

If you ever *increase* the max velocity after tuning, re-test. If you *decrease* max acceleration after tuning, re-test — the slower deceleration can change the tail behavior.

### Diagnosing PID issues from the logs

Log `FollowPath/remainingPathDistanceMeters` and `FollowPath/crossTrackError` to AdvantageScope. What to look for:

- **Clean monotonic remaining-distance curve** → translation is tuned well.
- **Bouncy/oscillating remaining-distance near zero** → tolerance too tight or translation P slightly too high.
- **Sustained non-zero CTE over a long segment** → CTE P too low.
- **CTE that swings + and − rapidly** → CTE P too high (or segment is genuinely short / path is at high curvature).
- **Robot stops short, command never finishes** → check end tolerances; loosen them first, then re-examine PID.

A remaining-distance graph is, in etherex's own words, "the single most useful piece of evidence" when debugging PID behavior.

## End tolerances

Start with **0.05–0.08 m translation tolerance** and **2–4° rotation tolerance**, then tighten if needed. Good values for common use cases:

| Use case | Translation | Rotation |
|----------|-------------|----------|
| General autonomous | 0.05–0.08 m | 2–4° |
| Precision scoring | 0.02–0.04 m | 1–2° |
| "Get in the zone" alignment | 0.08–0.15 m | 3–5° |

Tight tolerances take disproportionately longer as the PID lingers in the low-output regime near the endpoint. If a path is mysteriously slow at its tail, loosen tolerances first.

## Constraints: the primary shaping tool

### Velocity limiting is how you control motion

**Max translational velocity is the primary knob** for shaping path behavior. Teams come from PathPlanner/Choreo expecting to tune paths by editing shape; in BLine you tune by editing *velocity caps* on sections of the path.

Example: the robot overshoots a waypoint at the end of a long straight section:

1. First reach: add a ranged `setMaxVelocityMetersPerSec` cap over the last 1–2 ordinals before the waypoint.
2. If that's not enough: add a second cap that goes even lower at the very end.
3. Only after that: consider shrinking the handoff radius or the endpoint tolerance.

### Build constraint intuition by iterating

The first two paths will feel awkward. By the third, you'll have intuition for what velocity caps make sense on what kinds of sections. The GUI simulation helps — a simulated slowdown visibly highlights where the cap is active.

### Don't over-constrain

Leaving constraints at the global default is fine for most of a path. Ranged constraints exist for the 1–2 specific sections where you need something different. Don't set a ranged constraint on every ordinal; most ordinals should use the global default.

## Handoff radii

### Start with the default

A 0.2–0.25 m global default handoff radius works for most paths. Per-element overrides are for specific tight or loose moments.

### Sizing rules of thumb

- **High-speed straight-line transitions** → larger radius (0.3–0.5 m) or enable [t-ratio handoffs](lib/follow-path.md#withtratiobasedtranslationhandoffsboolean).
- **Precision final waypoint** → smaller radius (0.05–0.1 m) *paired with* a ranged velocity cap that brings the robot below its can-it-stop-here threshold.
- **Tight turn intermediate point** → default, then use velocity cap to control overshoot.

### The oscillation failure mode

If the handoff radius is smaller than the robot's stopping distance at its configured max velocity, the robot overshoots the circle. Once past, it reverses. The path never completes. Symptoms:

- Robot visibly lurches past a waypoint, reverses, lurches again.
- Remaining distance graph saws around zero at a specific target.
- Command never reports finished.

**Fix**: lower the velocity into that waypoint (ranged constraint) before enlarging the radius. Enlarging the radius reduces path precision; lowering velocity just adds a few hundred ms.

## Path design

### Use TranslationTargets for shape, Waypoints for rotation-specific points

Every Waypoint pins rotation, which costs rotation bandwidth during that segment. For a mid-path curve where rotation doesn't matter, use a TranslationTarget. Reserve Waypoints for points where the robot genuinely needs a specific heading.

### Don't pile Waypoints through obstacles

**Bump / obstacle strategy:**

- **One waypoint just before the obstacle.**
- **One waypoint just past the obstacle.**
- **No intermediate waypoints inside the obstacle itself.**

If you put a Waypoint on top of the bump, the robot tries to decelerate into the handoff circle mid-bump, loses traction, and stalls with wheels spinning. Keep the handoff decisions away from the disturbance zone.

### Smooth turns with more elements, not bigger radii

For a smooth curve through a turn, add a few extra TranslationTargets along the arc with default handoff radii. The polyline naturally approximates a curve. This gives cleaner path tracking than inflating handoff radii and letting the robot cut corners.

Don't over-do it — oversaturating a path with TranslationTargets creates many small segments where handoff decisions happen rapidly. 3–5 well-placed elements usually beats 10 marginal ones.

### Single-element paths are fine

A single-Waypoint path is the cleanest drive-to-pose command. Use it for teleop auto-align and simple "go here" actions:

```java
Path align = new Path(new Path.Waypoint(reefScoringPose));
pathBuilder.build(align).schedule();
```

## Autonomous starts

### Always pre-orient modules

Before the match starts, point the swerve modules in the direction the robot will drive first:

```java
Path first = new Path("firstAutoPath");
Rotation2d dir = first.getInitialModuleDirection(driveSubsystem::getPose);
driveSubsystem.setModuleOrientations(dir);
```

Call from disabled-periodic so the orientation stays current as vision updates the robot's pose. See [Pre-Match Module Orientation](lib/pre-match.md) for the full pattern.

### Use `withPoseReset` for the first path

The very first `FollowPath` in auto should reset the robot's pose to the path's start pose, so that subsequent odometry/vision fusion starts from a known origin:

```java
pathBuilder.withPoseReset(driveSubsystem::resetPose);
```

Subsequent paths in the same routine don't need it — the pose is already anchored.

## On-the-fly paths (teleop auto-align)

### Snapshot the pose at schedule time, not at bindings time

A common bug: if you build a path inside a binding's setup code, it captures the robot's pose at **robot startup**, not at button-press time.

```java
// BUG: getRobotWaypoint() returns the robot's pose right now, at setup
driveController.square().whileTrue(
    pathBuilder.build(new Path(getRobotWaypoint(), new Path.Waypoint(target)))
);
```

Fix by deferring the build with `Commands.deferredProxy(...)`:

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

### Or: skip the "current pose" waypoint entirely

For a single-destination drive-to-pose, you don't actually need the robot's current pose as a waypoint at all — BLine tracks against the live pose from the builder's supplier. Just build a one-waypoint path with the target:

```java
driveController.square().whileTrue(
    Commands.deferredProxy(() -> pathBuilder.build(new Path(new Path.Waypoint(target))))
);
```

Cleaner, fewer moving parts, and no pose-capture bug possible.

## Event triggers

### Triggers fire once per run

They're not continuous. For "while the robot is in region X" behavior, flip boolean state with Show/Hide-style trigger pairs and have a separate parallel command observe it via `waitUntil`. See [Event Triggers → Toggle state pattern](concepts/event-triggers.md#toggle-state-let-a-wait-until-drive-behavior).

### Register at init, not at path build time

`FollowPath.registerEventTrigger(...)` is static and persistent. Call it once in `RobotContainer`'s constructor. Don't register per path — you'll either double-register (no-op since it replaces) or forget and have an "unregistered key" warning in your logs.

## Alliance flipping & mirroring

### Pick one policy per project

Either the builder handles flipping (`withDefaultShouldFlip()`) and you never call `flip()` manually, or you handle it manually and the builder does not. Mixing leads to double-flip bugs.

### Author everything from the blue-alliance perspective

It's the FRC convention and it's what `withDefaultShouldFlip()` assumes. Never author red-side paths directly — you'll make your life harder on every JSON edit.

### Mirror ≠ Flip — they transform heading differently

- `flip()` maps θ → θ − π. Preserves alliance-relative orientation.
- `mirror()` maps θ → −θ. Does **not** preserve mechanism orientation — a side-mounted shooter can point wrong after mirroring.

Use `flip()` for opposite-alliance when the field has rotational symmetry. Use `mirror()` for left/right-side path families or fields with mirror symmetry. See [Alliance Flip & Mirror](lib/flip-and-mirror.md) for specifics.

## Localization

BLine doesn't care how you produce the pose. But the quality of the pose bounds the quality of path following:

- **Wheel odometry only** is fine for single-path auto routines when the drivetrain is well-tuned and slip is controlled. Drift accumulates over time — expect trouble for multi-path routines.
- **Vision + wheel odometry** is the standard. Use PhotonVision MegaTag, Limelight, QuestNav, etc. Strongly recommended for anything with more than ~1 path.
- **Vision-only** also works; same quality caveats as any vision-driven autonomy.

For teleop auto-align, vision updates are essentially required — you're targeting a pose on the field, and wheel odometry drifts in teleop just like it does in auto.

## Workflow recommendations

| Workflow | Fit |
|----------|-----|
| **GUI + Lib + JSON** | Most teams. Visual iteration, paths in Git. |
| **JSON-only + Lib** | Comfortable writing JSON, or generating it programmatically from another tool. |
| **Code-only + Lib** | Fully dynamic paths (auto-align to computed poses, pathfinding integration). |

These aren't mutually exclusive — hybrid workflows (visual paths for fixed autos, code-only paths for teleop align) are common.

### Iterate fast

BLine is built around empirical iteration. Design → simulate in sim (not the GUI, a real WPILib physics sim) → test on the robot → adjust → repeat. Because path computation is effectively free and the tracking controller is forgiving to under-tuning, you can iterate on paths in between match runs without re-tuning everything.

## Why BLine usually doesn't need a "second alignment routine"

Time-parameterized path followers often finish a path slightly early or slightly off — you see teams tack a second "aim PID" command onto the end of every autonomous move to recover.

BLine doesn't need this because:

- The translation controller's setpoint is the final position's remaining distance, not a time-parameterized trajectory.
- The command finishes when both end tolerances are met, not when a clock runs out.
- The only tuning that matters at the endpoint is what the translation PID does in the last few cm — and that's exactly where tolerances come in.

Chain paths directly. If the endpoint isn't precise enough, tighten the translation tolerance on the last path, not add a separate alignment step.

## See also

- [Common Issues](common-issues.md) — specific failure modes and fixes.
- [Concepts → Key Parameters](concepts/key-parameters.md) — parameter reference for every knob mentioned here.
- [Library → FollowPath Builder](lib/follow-path.md) — builder method reference.
