# API Reference

This is a task-oriented index for BLine-Lib v0.9.1. Use the [generated Javadocs](https://edanliahovetsky.github.io/BLine-Lib/) for every overload, parameter, and return contract.

## `Path`

### Common constructors

```java
new Path(PathElement... elements)
new Path(PathConstraints constraints, PathElement... elements)
new Path(List<PathElement> elements)
new Path(List<PathElement> elements, PathConstraints constraints)
new Path(String pathFileName)
new Path(File autosDir, String pathFileName)
```

Both `new Path(String)` and `new Path(File, String)` expect the basename without `.json`; each appends the extension. The lower-level `JsonUtils.loadPath(String)` and `JsonUtils.loadPath(File, String)` methods expect a filename that includes `.json`.

### Elements

```java
Path.Waypoint
Path.TranslationTarget
Path.RotationTarget
Path.EventTrigger
```

All implement `Path.PathElement` and provide `copy()`.

### Constraint model

```java
Path.DefaultGlobalConstraints
Path.PathConstraints
Path.RangedConstraint(double value, int startOrdinal, int endOrdinal)
Path.WaypointConstraint
Path.TranslationTargetConstraint
Path.RotationTargetConstraint
```

`PathConstraints` setters:

| Constraint family | Overloads |
| --- | --- |
| Maximum translation velocity | `setMaxVelocityMetersPerSec(double)` or `setMaxVelocityMetersPerSec(RangedConstraint...)` |
| Maximum translation acceleration | `setMaxAccelerationMetersPerSec2(double)` or `setMaxAccelerationMetersPerSec2(RangedConstraint...)` |
| Minimum translation velocity | `setMinVelocityMetersPerSec(double)` or `setMinVelocityMetersPerSec(RangedConstraint...)` |
| Maximum rotation velocity | `setMaxVelocityDegPerSec(double)` or `setMaxVelocityDegPerSec(RangedConstraint...)` |
| Maximum rotation acceleration | `setMaxAccelerationDegPerSec2(double)` or `setMaxAccelerationDegPerSec2(RangedConstraint...)` |
| Minimum rotation velocity | `setMinVelocityDegPerSec(double)` or `setMinVelocityDegPerSec(RangedConstraint...)` |
| End translation tolerance | `setEndTranslationToleranceMeters(double)` |
| End rotation tolerance | `setEndRotationToleranceDeg(double)` |

### Important methods

| Method | Purpose |
| --- | --- |
| `setDefaultGlobalConstraints(...)` | Set process-wide defaults |
| `getDefaultGlobalConstraints()` | Copy current defaults |
| `getPathConstraints()` / `setPathConstraints(...)` | Read/replace path constraint object |
| `getPathElements()` / `setPathElements(...)` | Copy/read or replace the element list |
| `addPathElement(...)`, `setElement(...)`, `removeElement(...)`, `reorderElements(...)` | Mutate path structure |
| `getTranslations()` | Waypoint/translation positions for visualization |
| `getStartPose(...)` | Resolve the starting pose |
| `getInitialModuleDirection(...)` | Compute initial module direction; verify convention on your drivetrain |
| `flip()`, `mirror()`, `undoFlip()` | Transform path geometry |
| `copy()` | Deep path copy |
| `isValid()` | Construction-time validity state |

In v0.9.1, mutation methods do not recompute validity. Prefer constructing a new finalized `Path` after structural changes.

## `FollowPath`

### Builder

```java
new FollowPath.Builder(
    Subsystem requirement,
    Supplier<Pose2d> pose,
    Supplier<ChassisSpeeds> robotRelativeSpeeds,
    Consumer<ChassisSpeeds> robotRelativeOutput,
    PIDController translation,
    PIDController rotation,
    PIDController crossTrack
)
```

Configuration:

```java
withShouldFlip(Supplier<Boolean>)
withDefaultShouldFlip()
withShouldMirror(Supplier<Boolean>)
withPoseReset(Consumer<Pose2d>)
withTRatioBasedTranslationHandoffs(boolean)
build(Path)
```

Builder options persist and are captured by each `build` call.

### Events

```java
FollowPath.registerEventTrigger(String, Runnable)
FollowPath.registerEventTrigger(String, Command)
```

### Rotation override

```java
FollowPath.overrideRotation(DoubleSupplier)
FollowPath.overrideRotation(DoubleSupplier, RotationOverrideBehavior)
FollowPath.clearRotationOverride()
```

Modes are `RESPECT_CONSTRAINTS` and `BYPASS_CONSTRAINTS`.

### Logging

```java
setDoubleLoggingConsumer(...)
setBooleanLoggingConsumer(...)
setPoseLoggingConsumer(...)
setTranslationListLoggingConsumer(...)
```

Passing `null` leaves the existing consumer unchanged in v0.9.1. Pass `ignored -> {}` to disable.

### Diagnostics

```java
getCurrentTranslationElementIndex()
getCurrentRotationElementIndex()
getRemainingPathDistanceMeters()
```

## `BLineCommands`

Requirement-safe wrappers around corresponding WPILib child-command compositions:

```java
either(...)
select(...)
defer(...)
deferredProxy(...)
sequence(...)
repeatingSequence(...)
parallel(...)
race(...)
deadline(...)
```

These proxy children to avoid outer-group requirement ownership problems around event-trigger commands. They do not make true simultaneous subsystem conflicts safe.

## `BLineField`

```java
String drawPath(Field2d field, Path path)
String drawPath(Field2d field, String objectName, Path path)
```

Draws `Path.getTranslations()` as a Field2d polyline and returns the display object name.

## `JsonUtils`

```java
loadPath(File autosDir, String pathFileName)
loadPath(String pathFileName)
loadPath(JSONObject json, Path.DefaultGlobalConstraints defaults)
loadPathFromJsonString(String json, Path.DefaultGlobalConstraints defaults)
parsePathComponents(JSONObject json, Path.DefaultGlobalConstraints defaults)
```

`ParsedPathComponents.toPath()` creates a `Path` from parsed elements and constraints.

## `FlippingUtil`

Helpers include:

```java
flipFieldPosition(...)
flipFieldRotation(...)
flipFieldPose(...)
mirrorFieldPosition(...)
mirrorFieldRotation(...)
mirrorFieldPose(...)
flipFieldSpeeds(...)
flipFeedforwards(...)
flipFeedforwardXs(...)
flipFeedforwardYs(...)
```

## `ChassisRateLimiter`

`ChassisRateLimiter.limit(...)` applies translational and rotational velocity/acceleration limits used by the follower. Most robot code should configure path constraints instead of calling it directly.

## Related guides

- [Follow Paths](follow-path.md)
- [Create Paths in Java or Load JSON](path-construction.md)
- [Events & Command Groups](event-triggers.md)
- [Rotation Overrides](rotation-overrides.md)
- [Logging & AdvantageScope](logging.md)
