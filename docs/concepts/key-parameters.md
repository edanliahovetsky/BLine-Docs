# Key Parameters

This page covers the parameters that most directly shape BLine's behavior during a path: handoff radius, t_ratio, profiled rotation, and end tolerances. Tuning these well is usually the difference between a path that "works in sim" and a path that wins matches.

## Handoff radius

The **intermediate handoff radius** determines how close the robot must get to the current translation target before BLine switches to tracking the next one. It's rendered on the canvas as a **magenta dashed circle** around each translation element.

![Handoff Radius Visualization](../assets/gifs/concepts/handoff-radius.gif)

### How it works

BLine continuously checks the robot's position against the current translation target. When one of these conditions holds, the follower advances:

- The robot is within the current target's handoff radius, **or**
- (if enabled) the robot's progress along the segment exceeds `1 − handoff_radius / segment_length`.

The second condition is the "t-ratio based handoff" described below.

### Tuning guidelines

| Radius | Effect | Typical use |
|--------|--------|-------------|
| **Too small** | Robot may overshoot the zone at speed and oscillate back. Worst failure mode. | Never intentional. |
| **Small** | Higher precision at the waypoint. Robot decelerates more. | Scoring/alignment waypoints. |
| **Medium** (0.2–0.35 m) | Smooth, balanced transitions. | Most intermediate elements. |
| **Large** | Path cuts corners. | Through wide-open sections where precision doesn't matter. |

!!! danger "Mismatched radius and velocity is the #1 oscillation cause"
    The most common oscillation cause we've seen is a handoff radius that's far smaller than the robot's stopping distance at the configured max velocity. If the robot blows past the circle, it reverses, blows past again, and the path never completes. If you see that, **lower the velocity before the waypoint** (via a ranged constraint) rather than chasing the radius.

!!! tip "Smooth turns: prefer more elements over a larger radius"
    For cleaner curves through turns, add extra TranslationTargets along the arc instead of enlarging the handoff radius. More elements create a gentler polyline that the robot can track precisely; bigger radii just cut the corner.

### Setting the radius

- **Per translation element** — in the GUI sidebar (**Handoff Radius (m)**) or in JSON (`intermediate_handoff_radius_meters` inside a `translation` / `waypoint.translation_target`).
- **Globally (default)** — `default_intermediate_handoff_radius_meters` in `config.json` or the `DefaultGlobalConstraints` constructor.

### t-ratio based handoffs (optional)

For high-speed paths, you can opt into `withTRatioBasedTranslationHandoffs(true)` on `FollowPath.Builder`. With this flag enabled:

- Handoff still fires immediately if the robot is within the target's handoff radius.
- Handoff also fires when the robot's projection onto the current segment passes `1 − handoff_radius / segment_length`.

This is more robust on risky, high-speed paths where collisions or temporary overshoot could push the robot outside the handoff circle. The default is `false` (radius-only handoffs); only turn it on if you have a specific reason. See [FollowPath Builder → t-ratio handoffs](../lib/follow-path.md#withtratiobasedtranslationhandoffsboolean) for details.

---

## t_ratio (rotation targets and event triggers)

`t_ratio` ∈ [0, 1] specifies where along a segment the behavior applies:

| `t_ratio` | Position along segment |
|-----------|-----------------------|
| `0.0` | At the start |
| `0.5` | At the midpoint |
| `1.0` | At the end |

For **RotationTargets**, t_ratio is used two ways:

- As the **anchor point** for profiled rotation: the target is fully achieved when the robot's projection onto the segment reaches `t_ratio`.
- As a **switching threshold**: once the robot's projection passes `t_ratio`, BLine considers this rotation target complete and looks ahead to the next rotation target.

For **EventTriggers**, t_ratio is the **firing threshold**: the trigger fires when the robot's projection along its segment first crosses this value.

![Adjusting t_ratio](../assets/gifs/concepts/t-ratio-drag.gif)

!!! info "Projection is robust to disturbances"
    t_ratio is evaluated against the robot's **projected position** on the straight-line segment, not raw distance. That means bumps, vision jumps, or cross-track error don't break rotation timing or event triggers — they fire when the robot is *alongside* the trigger point on the segment, not when it hits a specific coordinate.

---

## Profiled rotation

Both Waypoints and RotationTargets carry a `profiled_rotation` flag.

### Profiled (default)

The rotation setpoint **interpolates smoothly** from the previous rotation target to this one, following the robot's segment progress. Produces graceful sweep-style turns — the robot rotates *as* it translates.

Interpolation uses the shortest angular path (wrapped via WPILib's `MathUtil.angleModulus`), so you don't need to worry about `-π`/`π` edge cases.

### Non-profiled

The rotation setpoint **snaps** to the target heading immediately. The rotation controller then drives toward it as fast as the rotational velocity/acceleration constraints allow.

Use non-profiled when:

- You want the robot to rotate first, then drive (e.g., aim before launching).
- Mid-segment rotation needs to happen quickly, not spread across the segment.

### In the GUI

Toggle **Profiled Rotation** in the element's properties panel in the sidebar.

---

## End tolerances

End tolerances decide when `FollowPath` reports finished. Both must be satisfied:

- **End translation tolerance** (m) — translation controller is within this distance of zero remaining path distance.
- **End rotation tolerance** (deg) — the robot's heading is within this many degrees of the final rotation target.

### Picking values

Start with a **base translation tolerance between 0.05 m and 0.08 m**, then decrease incrementally only if you need the extra precision.

Tight tolerances cost runtime:

- Smaller tolerance → more time spent in the low-speed convergence regime at the end of the path. Risk of the PID oscillating near zero.
- Larger tolerance → path ends sooner, but position error can be noticeable.

Typical good values:

| Use case | Translation tol | Rotation tol |
|----------|-----------------|--------------|
| General autonomous | 0.05–0.08 m | 2–4° |
| Precision scoring | 0.02–0.04 m | 1–2° |
| "Get in the zone" alignment | 0.08–0.15 m | 3–5° |

### Setting tolerances

- Per path: `PathConstraints.setEndTranslationToleranceMeters(...)` / `setEndRotationToleranceDeg(...)`.
- Globally: `default_end_translation_tolerance_meters` / `default_end_rotation_tolerance_deg` in `config.json`.

---

## How these parameters interact

Every cycle of `FollowPath`:

1. The translation controller computes speed from **remaining path distance**.
2. That speed is **clamped to max translational velocity** (global or ranged).
3. Direction is set by pointing at the **next translation target**.
4. The cross-track controller adds a **perpendicular correction** toward the segment line.
5. Rotation is resolved from the active rotation target using `t_ratio` and profiled/non-profiled rules, then driven by the rotation controller.
6. The full `ChassisSpeeds` is **acceleration-limited in 2D** and passed to the drive consumer.
7. If the robot enters a target's **handoff radius**, the translation cursor advances.
8. On the final target, the robot is considered done once **both end tolerances** are satisfied.

!!! tip "Balance rules of thumb"
    - Higher velocity ⇒ larger handoff radius needed (or use t-ratio handoffs).
    - Tight turns ⇒ lower velocity on that section via a ranged constraint.
    - Precision endpoints ⇒ smaller tolerances, smaller handoff radius, lower velocity near the end.
    - Long path, mild drift ⇒ tune the CTE controller; it's designed for exactly this.
