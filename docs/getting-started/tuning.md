# Tune Your Robot

Tune BLine in three passes: **translation**, then **rotation**, then **cross-track correction**. Change one controller at a time and compare repeatable logs from the same test path.

## Before changing gains

Confirm that:

- the pose moves the correct distance and direction when the robot is pushed by hand;
- gyro heading follows the WPILib coordinate convention;
- the speed supplier and consumer are robot-relative;
- individual swerve-module velocity and steering control are already stable;
- the path uses conservative max velocity and acceleration;
- minimum-velocity constraints are disabled; and
- the test area is clear and controlled.

A controller cannot compensate for an incorrect wheel radius, gear ratio, coordinate frame, or noisy pose estimate.

## Wire the evidence first

Connect the four `FollowPath` logging consumers before testing. The full setup is in [Logging & AdvantageScope](../lib/logging.md).

For translation tuning, plot these signals on the same time axis:

| Signal | What it tells you |
| --- | --- |
| `FollowPath/remainingPathDistanceMeters` | Distance through the remaining polyline, including robot-to-current-target distance. |
| `FollowPath/rawTranslationControllerOutput` | Translation PID request before constraint clamping. |
| `FollowPath/clampedTranslationControllerOutput` | Request after the active maximum velocity. |
| `FollowPath/translationControllerOutput` | Request after max clamping and any minimum baseline, before CTE and chassis rate limiting. |
| `FollowPath/maxTranslationVelocityMetersPerSec` | Active max-velocity ceiling. |
| Your drivetrain's measured translation speed | Whether the chassis follows the requested speed. BLine does not publish measured chassis speed. |
| `FollowPath/finishedTranslationAtSetpoint` | Whether translation is inside the configured end tolerance. |

!!! tip "Keep every comparison fair"
    Use the same start pose, path, battery condition, constraints, payload, and graph axes. Record the gain values in the log annotation or tuning notes.

## 1. Tune translation

Create a straight path long enough to reach the velocity cap and stop. Keep the start and end headings equal, use no intermediate elements, set rotation and CTE gains to zero, and begin with `I = 0` and `D = 0`.

1. Start with a low translation `P`.
2. Run the path and save the log.
3. Increase `P` until the robot reaches the active velocity cap early in the path and settles into the tolerance without repeated rebound.
4. If the last approach is noisy, consider a small `D` only after verifying the pose signal and drivetrain response.
5. Re-test after raising maximum velocity or changing acceleration.

![Illustrative remaining-distance responses for translation P that is too low, appropriate, and too high](../assets/images/tuning/translation-p-response.svg)

*Illustrative response shapes, not measured robot data. Your plots should use identical axes and test conditions.*

### Read the shape

| Plot shape | Likely interpretation | Next move |
| --- | --- | --- |
| Long shallow tail; raw output leaves the clamp early | `P` is too low, or the drivetrain cannot produce the requested low speed | Increase `P` gradually; also compare measured speed and pose. |
| Fast approach, clean transition out of the clamp, one arrival inside tolerance | Translation is in a useful range | Repeat from several start distances and at the intended max speed. |
| Remaining distance repeatedly falls and rebounds near zero | `P` may be too high, tolerance may be too tight, or pose is noisy | Reduce `P`, inspect direction reversals, and verify tolerance/noise. |

The translation PID matters most near the endpoint. Far from the end, its raw output commonly exceeds the max-velocity constraint and is intentionally clamped.

!!! warning "Completion does not check final velocity"
    BLine-Lib v0.9.1 finishes when the final translation and rotation targets are inside tolerance. It does not also require near-zero measured velocity. Entering a loose tolerance at high speed can finish the command and immediately request zero. Validate the endpoint at full competition speed.

## 2. Tune rotation

Restore the chosen translation gains. Keep CTE at zero and use a path that translates while changing heading through a clear, visible angle.

Plot:

- `FollowPath/targetRotationDeg`;
- your drivetrain's measured heading;
- `FollowPath/rotationPidOutputRadPerSec`;
- `FollowPath/outputOmegaRadPerSec`; and
- `FollowPath/finishedRotationAtSetpoint`.

Increase rotation `P` until heading follows the target without sustained lag, then back away if it overshoots or chatters. Test the wraparound near `-180°` and `180°`, because the rotation controller uses continuous input.

If a profiled target cannot finish during a short segment, first inspect the active rotational velocity/acceleration limits and move the target earlier. More gain cannot create time or acceleration that the constraint removes.

## 3. Tune cross-track correction

Restore translation and rotation. Use one long segment, then introduce a small lateral starting offset or safe disturbance. Plot:

- `FollowPath/crossTrackError`;
- `FollowPath/crossTrackControllerOutput`;
- `FollowPath/pathTranslations`; and
- `FollowPath/robotTranslations`.

Raise CTE `P` only until the robot returns smoothly toward the segment. Aggressive CTE can fight the main translation vector and create fishtailing.

!!! note "Orbiting an intermediate target is usually not a CTE test"
    If the robot overshoots an intermediate element, reverses, and repeats, check the handoff radius and velocity into that element first. Use CTE to correct lateral distance from a long segment—not to compensate for a handoff the robot cannot enter.

Use P-only CTE as the conservative starting point. In v0.9.1 the CTE controller is not reset at every command initialization, so integral state can persist across commands.

## Shape the path after the controllers are stable

Controller gains should work across paths. Shape a specific path with:

1. **maximum velocity ranges** before sharp direction changes or precision areas;
2. **maximum acceleration ranges** where traction or mechanism stability matters;
3. **handoff radii** that the robot can physically enter at the chosen speed; and
4. **end tolerances** that match the real scoring requirement.

The BLine Web optimizer can propose maximum-velocity ranges, but its output is a starting point to review and test—not a dynamics guarantee. See [Constraints & Optimizer](../gui/sidebar.md).

### Minimum velocity is advanced

`min_velocity_meters_per_sec` and `min_velocity_deg_per_sec` can overcome static friction or drivetrain deadband while the corresponding error remains outside tolerance. Start at zero.

If a minimum exceeds the resolved maximum, BLine warns, falls back to the global maximum, and disables that minimum. A minimum that is merely too high can still cause endpoint overshoot or chatter.

## Keep tuning notes

Use one row per run:

| Run | Translation P/D | Rotation P/D | CTE P/D | Max vel/accel | Tolerances | Result |
| --- | --- | --- | --- | --- | --- | --- |
| 1 |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |

Save the matching log and note the robot configuration or commit. “It looked better” is hard to reproduce; a plot and exact settings are reviewable by the whole programming team.

## Ready-for-path-work checklist

- Translation reaches the cap and settles without repeated rebound.
- Rotation follows both small and wraparound heading changes.
- CTE removes a lateral offset without fishtailing.
- The command finishes consistently at the intended tolerance.
- The endpoint remains safe at full configured velocity and acceleration.
- Blue and red alliance transforms have both been tested.
- Logs make the active constraint and controller outputs visible.

Next, learn how to [shape motion with constraints](../concepts/constraints.md) and apply the [practical path recipes](../usage-tips.md).
