# Design Philosophy

BLine takes a fundamentally different approach to path tracking compared to Bézier- and clock-driven systems like PathPlanner and Choreo. This page spells out the rationale behind the polyline architecture and where BLine earns its advantages.

## Why polylines?

### Computational efficiency

Bézier-based planners discretize trajectories into timestamped setpoints before the controller can follow them. BLine doesn't: the `Path` object is fed directly to the tracking controller, which acts on geometric state each cycle.

That design buys two concrete things:

1. **No precomputation delay for runtime-generated paths.** Useful for teleop auto-align and anything dynamic.
2. **Cheap loop-cycle cost** during execution. Each control cycle is a handful of distance/projection calculations, not a table lookup into a precomputed trajectory.

For pre-baked competition autos, the difference is smaller than it looks — most of the compute in any system happens at path-creation time regardless of the tool. The effect shows up most clearly when paths are generated on the fly.

!!! info "Measured result"
    Monte Carlo simulation validation reported a **97% reduction** in path computation time vs. PathPlanner.

### Ease of controller tuning

Tuning a time-parameterized PID to follow a Bézier trajectory is tuning *follow the clock*:

- Over-tuned gains cause erratic behavior and jittering.
- Under-tuned gains make the robot fall behind during acceleration — once behind, the follower can struggle to recover.
- Drivetrain imperfections make it hard to push the chassis to its true max velocity and acceleration.
- Many teams end up running a second profiled PID alignment routine after every path to recover the accuracy time-parameterized tracking gave up.

BLine sidesteps this entirely. The translation controller's setpoint is **zero remaining path distance** — the controller output is high at the start, tapers to zero at the endpoint, and naturally behaves like a trapezoidal profile once clamped by the velocity/acceleration constraints. The robot hits max velocity irrespective of drivetrain tuning, and the only tuning that really matters is the deceleration near the end of the path.

!!! tip "5-minute tuning window"
    Etherex's real-world tuning experience: a good translation-controller config was achieved in about 5 minutes. The reason is simple — the controller only does meaningful work at the very end of the path, so there's less surface area to tune against.

### Forgiving performance

There's **no large performance penalty for under-tuning**. The difference between optimally and sub-optimally tuned controllers is only noticeable in the last few centimeters before the endpoint. A time-parameterized controller's response is apparent along the *entire* path, and poor tuning is obvious everywhere.

### Robustness to disturbances

Because BLine is geometric rather than time-parameterized, it reacts naturally to disturbances (collisions, vision jumps, temporary stalls):

- Speed magnitude = f(remaining distance). A push backward simply raises remaining distance; the controller naturally commands more speed.
- Speed direction = pointing toward the current target. A push sideways just steers the robot back.
- The control cycle is **greedy** — each cycle computes the best command for *now*, with no expectation about what time it is.

A time-parameterized follower that was pushed off course will keep chasing its schedule rather than returning to the path. P2P-style followers (like BLine) return to the setpoint geometry, which matches how teams think about auto behavior.

!!! warning "Known edge case"
    When the robot is at high velocity relative to max acceleration *and* close to a handoff radius boundary *and* a significant disturbance occurs, the combination can still fault. The standard mitigations are (a) use a forgiving handoff radius on high-speed segments, (b) enable [t-ratio based handoffs](key-parameters.md#t-ratio-based-handoffs-optional), or (c) tighten velocity limits through the disturbance-prone region.

### Path simplicity

BLine paths are simple to reason about: a list of points. A single-element BLine path with one waypoint is a valid, useful path — essentially a drive-to-pose command without the overhead of a separate solution. That matters for teleop auto-align (Reefscape reef, Crescendo amp, etc.) and for any "go to this pose" workflow.

For more complex paths, BLine uses path elements, handoff radii, and ranged velocity limits as the primary motion-control primitives — analogous to Bézier control points, anchors, and optimizer output but with direct, visual meaning.

---

## Control architecture

### Three PID controllers

| Controller | Purpose | Input | Output |
|------------|---------|-------|--------|
| **Translation** | Drive to the final path element | Remaining path distance (m) | Desired translational speed magnitude (m/s) |
| **Rotation** | Track current rotation target | Heading error (rad) | Angular velocity (rad/s) |
| **Cross-track (CTE)** | Stay on the line between path segments | Perpendicular distance from line (m) | Correction velocity (m/s) |

Each cycle: translation controller produces a speed magnitude, direction is set by pointing at the current translation target, CTE adds a perpendicular nudge, rotation is resolved from profiled/non-profiled interpolation, and the combined `ChassisSpeeds` is rate-limited before being sent to the drivetrain.

### Why the CTE controller earns its keep

The translation controller is maxed out for most of a path (its output saturates to the active velocity constraint). That means the path the robot actually takes between two elements depends mostly on *how the direction vector evolves*, which is determined by the geometry of the next target. Over long segments, small position errors from the nominal line don't get corrected — the robot just drives "toward the point from here," not "back to the line, then toward the point."

The CTE controller explicitly minimizes the perpendicular distance from the current path segment and is additive with the translation output. It pulls the robot back onto the segment line over time.

!!! warning "Don't over-tune CTE"
    An aggressively tuned CTE controller can overpower the translation controller during turns, especially at high speeds — you'll see the robot "fishtailing" into turns. Tune translation first, then rotation, then CTE. CTE gains should feel *gentle*.

### Algorithm robustness

The tracking algorithm is robust in its response to sharp changes in positional data:

- Speed magnitude depends on distance to the path's end — a vision jump "backward" increases remaining distance, naturally commanding more speed.
- Direction depends on the next available waypoint — independent of transient position errors along the segment.
- All outputs are **acceleration-limited in 2D** via `ChassisRateLimiter`, keeping commanded chassis motion smooth even when the underlying pose estimate is noisy.
- The control cycle is greedy — the response is uniform regardless of path completion or "lag" behind any idealized path.

---

## Where BLine shines (and where it doesn't)

| Feature | BLine | PathPlanner / Choreo | AutoPilot |
|---------|-------|---------------------|-----------|
| Path type | Polyline | Bézier curves | Drive-to-point |
| Time-parameterized | No | Yes | No |
| Precomputation required | No | Yes | No |
| Tuning difficulty | Low | Medium–High | Low |
| Intermediary element control | Full | Full | Limited (best at 1–2 translation elements) |
| Real-time path creation | Excellent | Limited | Excellent |
| Complex multi-element paths | Yes | Yes | Limited |
| Single-point moves | Yes | Overkill | Yes |

**vs. PathPlanner / Choreo:** if you want the smoothest possible curvature and you're willing to invest heavily in time-parameterized PID tuning, Bézier systems can win on paper. In practice, tuning and robustness issues often make them behave worse on the field. BLine is designed to give up a little theoretical optimality for a lot of practical tunability.

**vs. AutoPilot:** AutoPilot is excellent for single-point and two-point moves. BLine is designed for longer routines with meaningful intermediate-element control — 3+ translation elements is where BLine starts to decisively pull ahead.

---

## Localization is orthogonal

BLine takes a `Pose2d` supplier and trusts it. How you produce that pose is entirely your call:

- **Wheel odometry only.** Works fine in auto if your drivetrain is well-tuned (correct gear ratios, wheel size, filters) and slip is controlled (stator current limits, sane velocity/acceleration limits).
- **Vision + wheel odometry.** Strongly recommended for any multi-path routine or anything that could get bumped, since wheel odometry drifts and never self-corrects. Use PhotonVision, Limelight MegaTag, QuestNav, etc.
- **Vision-only.** Also fine, subject to the same caveats as any vision-driven autonomy.

BLine has no opinion here — the library just receives whatever pose you hand it, and quality of localization puts an upper bound on the accuracy of path following regardless of the follower you use.

---

## Future direction

- **On-the-fly path planning.** BLine currently leaves A*/Theta*-style obstacle-aware planning to the user. It's possible to pair BLine with a simple obstacle-aware planner (using translational velocity limits and forgiving handoff radii as the primary tuning knobs), and a first-class integration is on the roadmap.
- **End-velocity control.** Ending a path at a non-zero translational velocity is not currently supported; it's a planned feature.
- **Dynamic handoff radii.** Radii that scale with cross-track error or segment completion are under consideration as a mitigation for the high-speed/near-handoff-boundary edge case.

See the [Chief Delphi thread](https://www.chiefdelphi.com/t/introducing-bline-a-new-rapid-polyline-autonomous-path-planning-suite/509778) for ongoing discussion and release notes.
