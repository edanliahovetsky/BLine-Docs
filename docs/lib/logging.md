# Logging & AdvantageScope

Wire BLine logging before tuning. `FollowPath` publishes internal values through four process-wide consumers; by default they are no-ops.

## AdvantageKit setup

Register once during robot initialization:

```java
import frc.robot.lib.BLine.FollowPath;
import org.littletonrobotics.junction.Logger;

FollowPath.setDoubleLoggingConsumer(
    value -> Logger.recordOutput(value.getFirst(), value.getSecond()));
FollowPath.setBooleanLoggingConsumer(
    value -> Logger.recordOutput(value.getFirst(), value.getSecond()));
FollowPath.setPoseLoggingConsumer(
    value -> Logger.recordOutput(value.getFirst(), value.getSecond()));
FollowPath.setTranslationListLoggingConsumer(
    value -> Logger.recordOutput(value.getFirst(), value.getSecond()));
```

All keys begin with `FollowPath/`. Their full AdvantageScope location depends on the logger/output configuration, commonly under AdvantageKit real outputs.

### Disable a consumer

Passing `null` does **not** clear an existing consumer in v0.9.1; the setter ignores it. Replace it with a no-op:

```java
FollowPath.setDoubleLoggingConsumer(ignored -> {});
```

## Recommended tuning layouts

### Translation

Plot together:

- `remainingPathDistanceMeters`
- `rawTranslationControllerOutput`
- `clampedTranslationControllerOutput`
- `translationControllerOutput`
- `minTranslationVelocityMetersPerSec`
- `maxTranslationVelocityMetersPerSec`
- your drivetrain's measured translation speed
- `finishedTranslationAtSetpoint`

BLine does not publish measured chassis speed. Use the key already produced by the drivetrain or add one.

### Rotation

Plot:

- `targetRotationDeg`
- measured robot heading
- `rotationPidOutputRadPerSec`
- `outputOmegaRadPerSec`
- `rotationErrorDeg`
- `finishedRotationAtSetpoint`

### Geometry

Add `pathTranslations` and `robotTranslations` to a field view, then plot `crossTrackError` and `crossTrackControllerOutput`.

See [Tune Your Robot](../getting-started/tuning.md) for the low/correct/high gain workflow.

## Double keys

| Key suffix | Units | Meaning |
| --- | --- | --- |
| `dtSeconds` | s | Time since the prior execute cycle |
| `remainingPathDistanceMeters` | m | Robot-to-current-target distance plus all remaining polyline segments |
| `currentSegmentLengthMeters` | m | Active translation segment length |
| `currentSegmentProgress` | 0–1 | Projection progress on active translation segment |
| `translationElementIndex` | index | Active index in the expanded runtime element list |
| `rotationElementIndex` | index | Active expanded-list rotation index, or `-1` when none |
| `rotationPreviousElementIndex` | index | Prior expanded-list rotation index |
| `translationHandoffFromIndex` | index | Source index on a handoff cycle |
| `translationHandoffToIndex` | index | Destination index on a handoff cycle |
| `rawTranslationControllerOutput` | m/s | Translation PID output before max clamp |
| `clampedTranslationControllerOutput` | m/s | Output after maximum-velocity clamp |
| `translationControllerOutput` | m/s | Output after clamp and minimum baseline, before CTE and chassis rate limiting |
| `minTranslationVelocityMetersPerSec` | m/s | Active resolved minimum baseline |
| `maxTranslationVelocityMetersPerSec` | m/s | Active resolved maximum |
| `crossTrackError` | m | Signed perpendicular distance from directed active segment |
| `crossTrackControllerOutput` | m/s | Unclamped CTE correction magnitude |
| `segmentProgress` | 0–1 | Progress used for profiled rotation; emitted when applicable |
| `targetRotationDeg` | deg | Current interpolated/snap rotation setpoint |
| `rawRotationControllerOutput` | rad/s | Rotation controller result before max clamp |
| `clampedRotationControllerOutput` | rad/s | Rotation result after max clamp |
| `rotationPidOutputRadPerSec` | rad/s | Rotation PID contribution before override replacement |
| `rotationControllerOutput` | rad/s | Post-minimum/override rotation command before final chassis limiting |
| `rotationOverrideOmegaRadPerSec` | rad/s | Active external override value, otherwise zero |
| `outputOmegaRadPerSec` | rad/s | Final omega sent by the follower after limiting or bypass |
| `minRotationVelocityDegPerSec` | deg/s | Active resolved minimum rotation baseline |
| `maxRotationVelocityDegPerSec` | deg/s | Active resolved maximum rotation velocity |
| `rotationErrorDeg` | deg | Error to the full active rotation target, not always the interpolated target |
| `currentRotationTargetInitRad` | rad | Starting heading for the active rotation interpolation |
| `eventTriggerElementIndex` | index | Event-processing cursor in expanded path order |
| `eventTriggersFiredCount` | count | Reached/consumed event elements in this run, including keys with no registered action |

!!! note "Indices are not constraint ordinals"
    Element-index keys refer to the expanded runtime list where a waypoint becomes separate translation and rotation entries. The editor's translation/rotation constraint ordinals are separate domains.

In v0.9.1, the implemented cross-track sign is positive on the geometric left of a directed segment under standard WPILib coordinates. Confirm this on your plots before using the sign in robot logic.

## Boolean keys

| Key suffix | Meaning |
| --- | --- |
| `useTRatioBasedTranslationHandoffs` | Builder's optional projection-handoff setting |
| `translationHandoffOccurred` | A translation target changed on this cycle |
| `currentSegmentDegenerate` | Active segment length is effectively zero |
| `rotationHasActiveTarget` | A rotation target is being tracked |
| `translationMinimumApplied` | Minimum translation baseline raised the clamped output |
| `rotationMinimumApplied` | Minimum rotation baseline raised the clamped output |
| `rotationOverrideActive` | A static rotation override supplier is active |
| `rotationOverrideBypassesConstraints` | Override uses bypass mode |
| `finished` | Full finish predicate is true |
| `finishedIsLastTranslationElement` | No later translation target remains |
| `finishedIsLastRotationElement` | No later rotation target remains |
| `finishedTranslationAtSetpoint` | Translation PID is inside end tolerance |
| `finishedRotationAtSetpoint` | Heading is inside end rotation tolerance |

## Pose and array keys

| Key | Type | Meaning |
| --- | --- | --- |
| `FollowPath/closestPoint` | `Pose2d` | Closest point on active segment, with live robot heading |
| `FollowPath/rotationTargetPose` | `Pose2d` | Active rotation target's segment position and full target heading |
| `FollowPath/pathTranslations` | `Translation2d[]` | Planned translation anchors, emitted at initialize |
| `FollowPath/robotTranslations` | `Translation2d[]` | Sampled robot trail; every third loop, capped to recent samples |

## What to attach to a useful bug report

- BLine-Lib version and robot-code commit
- path JSON and `config.json`
- plot with identical time axes for target/error/controller/constraint/measured speed
- live and planned field traces
- pose-estimator source and update rate
- the exact observed symptom and whether the command finished, timed out, or was interrupted

This evidence separates controller tuning, active constraints, localization, event scheduling, and drivetrain response much faster than a video alone.
