# Logging

`FollowPath` publishes a rich set of internal state through four pluggable static logging consumers. Wire them to your logger of choice (AdvantageKit, WPILog, SmartDashboard, etc.) once, and every `FollowPath` command run emits telemetry.

All four consumers default to no-op, so logging is zero-cost until you opt in.

## Wiring

Register all four at robot init. For AdvantageKit, a one-liner per consumer is typical:

```java
import edu.wpi.first.math.Pair;
import edu.wpi.first.math.geometry.Pose2d;
import edu.wpi.first.math.geometry.Translation2d;
import frc.robot.lib.BLine.FollowPath;
import org.littletonrobotics.junction.Logger;

FollowPath.setDoubleLoggingConsumer(
    p -> Logger.recordOutput(p.getFirst(), p.getSecond()));
FollowPath.setBooleanLoggingConsumer(
    p -> Logger.recordOutput(p.getFirst(), p.getSecond()));
FollowPath.setPoseLoggingConsumer(
    p -> Logger.recordOutput(p.getFirst(), p.getSecond()));
FollowPath.setTranslationListLoggingConsumer(
    p -> Logger.recordOutput(p.getFirst(), p.getSecond()));
```

For plain NetworkTables:

```java
FollowPath.setDoubleLoggingConsumer(p -> NetworkTableInstance.getDefault()
    .getTable("FollowPath").getEntry(keyTail(p.getFirst())).setDouble(p.getSecond()));
// ... similar for the others
```

!!! info "Consumers are set **on the FollowPath class, not the command**"
    In the very first releases, examples showed consumers being passed to `FollowPath.Builder`. They moved to static setters on `FollowPath` itself (etherex clarified this early on the Chief Delphi thread). There is no per-command override — all running `FollowPath` instances share the same consumers.

## Published keys

All keys are prefixed with `FollowPath/`.

### Double

| Key | Units | Meaning |
|-----|-------|---------|
| `FollowPath/dtSeconds` | s | Time delta between successive `execute()` calls. |
| `FollowPath/remainingPathDistanceMeters` | m | Remaining straight-line path distance from robot to end. |
| `FollowPath/currentSegmentLengthMeters` | m | Length of the current translation segment. |
| `FollowPath/currentSegmentProgress` | 0–1 | Robot's projection progress along the current segment. |
| `FollowPath/translationElementIndex` | — | Current translation cursor index. |
| `FollowPath/rotationElementIndex` | — | Current rotation cursor index (−1 when inactive). |
| `FollowPath/rotationPreviousElementIndex` | — | Last completed rotation target index. |
| `FollowPath/translationControllerOutput` | m/s | Clamped output of the translation PID. |
| `FollowPath/crossTrackControllerOutput` | m/s | CTE PID output (unclamped). |
| `FollowPath/crossTrackError` | m | Signed cross-track error (`+` = right of path). |
| `FollowPath/rotationControllerOutput` | rad/s | Rotation PID output. |
| `FollowPath/targetRotationDeg` | deg | Current rotation setpoint sent to the rotation PID. |
| `FollowPath/rotationErrorDeg` | deg | Shortest-angle heading error. |
| `FollowPath/currentRotationTargetInitRad` | rad | Heading at the start of the active rotation segment (for profile interpolation). |
| `FollowPath/segmentProgress` | 0–1 | Progress used for the rotation profile. |
| `FollowPath/translationHandoffFromIndex` / `...ToIndex` | — | Emitted on each handoff cycle. |
| `FollowPath/eventTriggerElementIndex` | — | Current event-trigger walk cursor. |
| `FollowPath/eventTriggersFiredCount` | — | Number of triggers fired so far in this run. |

### Boolean

| Key | Meaning |
|-----|---------|
| `FollowPath/finished` | True when `isFinished()` returns true. |
| `FollowPath/finishedIsLastRotationElement` | True when rotation cursor is past the last rotation target. |
| `FollowPath/finishedIsLastTranslationElement` | True when translation cursor is on the last translation element. |
| `FollowPath/finishedTranslationAtSetpoint` | True when translation PID reports at-setpoint (remaining distance within end tolerance). |
| `FollowPath/finishedRotationAtSetpoint` | True when heading is within end rotation tolerance. |
| `FollowPath/translationHandoffOccurred` | True on the cycle a translation handoff happened. |
| `FollowPath/currentSegmentDegenerate` | True if the current segment is effectively zero-length. |
| `FollowPath/rotationHasActiveTarget` | True when a rotation target is currently being tracked. |
| `FollowPath/useTRatioBasedTranslationHandoffs` | Echoes the builder setting for the current run. |

### Pose

| Key | Meaning |
|-----|---------|
| `FollowPath/closestPoint` | Closest point on the current segment to the robot, packaged as a `Pose2d` with the robot's heading. |
| `FollowPath/rotationTargetPose` | Where the active rotation target lives on the segment (translation on the segment line + the target heading). |

### Translation2d[]

| Key | Meaning |
|-----|---------|
| `FollowPath/pathTranslations` | All translation targets in order. Emitted once at `initialize()`. |
| `FollowPath/robotTranslations` | Robot position samples collected during the run. Sampled every 3rd `execute()` cycle, capped at the most recent 300 samples. |

## Viewing in AdvantageScope

With AdvantageKit wired to the consumers above, the keys appear under `NT:/AdvantageKit/RealOutputs/FollowPath/...`. Three useful visualizations:

- **Robot trail.** Drop `FollowPath/robotTranslations` onto the 2D/3D field viewer to see the actual traversed path as a trail.
- **Path outline.** Drop `FollowPath/pathTranslations` onto the same field viewer for the nominal path.
- **Remaining distance curve.** Chart `FollowPath/remainingPathDistanceMeters` over time — a clean monotonic decay is what you want to see. Oscillations near the end are a PID tuning signal.

When debugging, a screenshot of the remaining-distance graph is typically the single most useful piece of evidence. (Etherex asked for exactly this on the Chief Delphi thread more than once.)

## Testing tips

- **Log `FollowPath/translationHandoffOccurred` + index keys** to spot unexpected handoffs or stalls.
- **Log `FollowPath/currentSegmentDegenerate`** when debugging zero-length-segment bugs (which were fixed in v0.8.0 but a useful sanity-check signal).
- **Log `FollowPath/crossTrackError`** during CTE tuning — under-tuned will show sustained error, over-tuned will show oscillation.
- **Log `FollowPath/rotationErrorDeg`** during rotation tuning to spot overshoot / oscillation at the endpoint.

## Disabling logging

Pass `null` to any setter to restore the no-op. Recommended in a competition build if you're logging a *lot* and want to cut NT/log volume:

```java
FollowPath.setDoubleLoggingConsumer(null);  // reverts to no-op
```

Or be selective — keep `boolean` + `pose` keys, skip the high-frequency `double` keys.
