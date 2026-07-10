# Alliance Flip & Mirror

Author one path in WPILib's blue-origin field coordinates, then choose the single transform policy that matches the route you want to run. BLine provides an opposite-alliance **flip** and a same-origin **mirror**; they are not interchangeable.

## Transform definitions

| Transform | Position | Heading | Typical use |
| --- | --- | --- | --- |
| `Path.flip()` | `(x, y) → (fieldLength − x, fieldWidth − y)` | `θ → θ − π` | Blue-authored route on the opposite alliance under rotational symmetry |
| `Path.mirror()` | `(x, y) → (x, fieldWidth − y)` | `θ → −θ` | Left/right route family reflected across the field-width centerline |

Verify the intended symmetry against the current game manual and a trusted transformed-geometry check. An optional Field2d display is one way to do that; a visually similar field image by itself is not enough evidence.

## Recommended alliance policy

For ordinary opposite-alliance reuse:

```java
FollowPath.Builder pathBuilder = new FollowPath.Builder(/* ... */)
    .withDefaultShouldFlip();
```

At command initialization, this checks `DriverStation.getAlliance()` and flips the builder's private path copy for red. Author the source path once from the blue-origin perspective and do not also call `Path.flip()` manually.

For custom decisions:

```java
pathBuilder
    .withShouldFlip(shouldFlip)
    .withShouldMirror(shouldMirror);
```

When both return true, BLine applies **flip first, then mirror**.

## Reset to the transformed start

The pose reset must use the same transform policy as the followed path. `FollowPath` applies flip/mirror before invoking its captured reset consumer:

```java
Command first = pathBuilder
    .withPoseReset(driveSubsystem::resetPose)
    .build(firstPath);

pathBuilder.withPoseReset(ignored -> {});
```

Do not pair automatic builder transforms with an earlier `resetPose(firstPath.getStartPose())`; that expression reads the original authored pose. See [Follow Paths](follow-path.md#pose-reset) for the one-build reset pattern.

## Manual transformations

Make a copy when code needs an explicit transformed object for a dashboard preview or another calculation:

```java
Path preview = authoredPath.copy();
if (shouldFlip.get()) {
    preview.flip();
}
if (shouldMirror.get()) {
    preview.mirror();
}

BLineField.drawPath(field, "SelectedAuto", preview);
```

Pass the original path to a builder that applies the same policy once. Keeping preview and command transformation decisions in one helper reduces double-transform mistakes.

## State behavior in v0.9.1

- `flip()` mutates the `Path` and is guarded: a second call is a no-op until `undoFlip()`.
- `mirror()` mutates the `Path` every time. Two calls restore the original geometry.
- `FollowPath.Builder.build(...)` copies the source path, so its initialization transform does not mutate the object you supplied.
- Builder transform suppliers persist and are captured by every later `build(...)` call.

!!! warning "Build a fresh command when transform state may change"
    `mirror()` has no applied-state guard in v0.9.1, so reinitializing one mirrored `FollowPath` instance can reflect its internal path again. A flipped command also remains flipped if its supplier changes from true to false before a later initialization. Build a fresh command whenever repeating a transformed run or changing the flip/mirror decision, then verify the displayed route.

## Field dimensions

`FlippingUtil` defaults to `16.54 m × 8.07 m`, matching the current BLine Web 2026 REBUILT calibration. If a future field uses different dimensions, update `FlippingUtil.fieldSizeX` and `fieldSizeY` from authoritative field data before constructing or initializing paths.

```java
FlippingUtil.fieldSizeX = officialFieldLengthMeters;
FlippingUtil.fieldSizeY = officialFieldWidthMeters;
```

Do not derive these values by measuring a screenshot.

## Mechanism and heading checks

A mirrored side-mounted intake or shooter may face the wrong task direction even when the translation geometry looks correct. Check:

1. final robot heading;
2. side-mounted mechanism orientation;
3. pose reset after the same transform;
4. event order and event keys;
5. initial module direction; and
6. the planned and live pose on both alliance selections.

Keep separate authored paths when the game geometry or mechanism behavior is genuinely asymmetric.

## Utility methods

`FlippingUtil` also exposes `flipFieldPosition`, `flipFieldRotation`, `flipFieldPose`, `mirrorFieldPosition`, `mirrorFieldRotation`, `mirrorFieldPose`, `flipFieldSpeeds`, and feedforward helpers. `Path.flip()` temporarily forces rotational symmetry for its work; direct `FlippingUtil` use honors the process-wide `symmetryType`.

Related: [Optional Field2d Visualization](field-visualization.md) and [Pre-Match Module Orientation](pre-match.md).
