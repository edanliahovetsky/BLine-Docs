# Alliance Flip & Mirror

BLine offers two related transformations for reusing a single authored path on a different side of the field: **flip** (for opposite-alliance symmetry) and **mirror** (for reflecting across the field width centerline). They are similar but not interchangeable — pick the one that matches the symmetry of this year's field.

## The two transformations

### `Path.flip()` — opposite-alliance rotational symmetry

Most FRC fields are rotationally symmetric: the red alliance side is the blue alliance side rotated 180° around the field center. `Path.flip()` uses this convention:

- `(x, y) → (fieldSizeX − x, fieldSizeY − y)`
- `θ → θ − π` (same orientation relative to the alliance station)

Call this when you've authored paths from the blue alliance's perspective and want them to work for the red alliance.

```java
Path myPath = new Path("scoreFirst");  // authored blue-side
myPath.flip();                         // now red-side
```

`flip()` is **idempotent-within-a-path**: calling `flip()` a second time is a no-op; call `undoFlip()` to restore the original coordinates.

`FollowPath.Builder.withDefaultShouldFlip()` wires this up automatically from `DriverStation.getAlliance()`, so in almost all cases you don't need to call `flip()` manually.

### `Path.mirror()` — vertical reflection across the field width centerline

Some years the field isn't rotationally symmetric — it's **mirrored**: the red side is the blue side reflected across the field's vertical centerline. Added in BLine-Lib **v0.8.2** to support this case:

- `(x, y) → (x, fieldSizeY − y)`
- `θ → −θ` (note: **not** `θ ± π`)

```java
Path myPath = new Path("leftAuto");
myPath.mirror();   // reflected across field width
```

Unlike `flip()`, `mirror()` does not track a boolean state — each call re-applies the mirror. This is deliberate: mirror is often used for left-side / right-side path families where you want an explicit, repeatable transformation.

### Which one do I want?

| Symmetry of this year's field | Transformation |
|--------------------------------|---------------|
| Rotational (blue ↔ red by 180° rotation) | `flip()` / `withDefaultShouldFlip()` |
| Vertical mirror (blue ↔ red by y-flip) | `mirror()` / `withShouldMirror(...)` |
| "Left vs right" autos on the same alliance | `mirror()` — keep one authored path per alliance, mirror at runtime for the other side |

If the game manual describes the red side as a "180° rotation of the blue side," use `flip()`. If it describes the sides as mirror images across the length of the field, use `mirror()`.

!!! info "Heading behavior differs"
    Flip shifts heading by π (so a blue-side 90° becomes a red-side 270°, keeping the robot pointing the same relative direction on the field). Mirror negates heading (so a blue-side 90° becomes a red-side −90° / 270°). For side-mounted mechanisms, a mirrored path can still end with a heading that points the *wrong* way relative to the mechanism — see the gotcha below.

## Wiring via the builder

The builder has two independent policies:

```java
pathBuilder
    .withDefaultShouldFlip()                  // alliance-aware flip
    .withShouldMirror(() -> leftAutoSelected);  // arbitrary mirror policy
```

When the command initializes:

1. If the flip supplier returns true, `path.flip()` is called.
2. If the mirror supplier returns true, `path.mirror()` is called.

Both transformations can be applied in the same command if needed; they operate on a **copy** of the original path so the source `Path` object is not mutated.

Use `withShouldFlip(Supplier<Boolean>)` for custom flip logic beyond `DriverStation.getAlliance()`.

## Manually flipping / mirroring

```java
Path red = blue.copy();
red.flip();

Path rightSide = leftSide.copy();
rightSide.mirror();
```

Always `copy()` first if you intend to use both versions of the path — `flip()` and `mirror()` mutate the instance they are called on.

## Known gotchas

### Mirrored path + side-mounted mechanism

Because `mirror()` maps `θ → −θ` (not `θ + π`), a side-mounted shooter or side intake can end up pointing the wrong way on the mirrored side of the field. Options:

1. **Override the final rotation target** after mirroring: `path.setElement(lastIndex, new Waypoint(pos, mechanismHeading))`.
2. **Use `flip()` if it matches the field** — it maps `θ → θ − π`, which preserves a side-mechanism's alliance-relative orientation.
3. **Keep separate authored paths for each side** when the mechanism orientation matters asymmetrically.

### Flip + mirror + manual flip = confusion

If you also call `flip()` manually inside code and the builder has `withDefaultShouldFlip()` enabled, you can end up double-flipping. Stick with one policy per project:

- **Builder does the flipping** (recommended) — never call `flip()` manually.
- **Or you do it manually** — disable `withDefaultShouldFlip()` in the builder.

### Global symmetry state

`FlippingUtil.symmetryType` is a static global. As of v0.8.2, `Path.flip()` explicitly forces `kRotational` for its own work and restores the previous value afterward — so it can no longer accidentally change global symmetry state for other callers. If you use `FlippingUtil` directly elsewhere in your code, that's still your responsibility.

## `FlippingUtil` helpers

All coordinate math is exposed as static methods you can use directly (for custom vision transforms, etc.):

| Method | Description |
|--------|-------------|
| `flipFieldPosition(Translation2d)` | Alliance flip (honors current `symmetryType`). |
| `flipFieldRotation(Rotation2d)` | Same, for rotation. |
| `flipFieldPose(Pose2d)` | Combined. |
| `mirrorFieldPosition(Translation2d)` | y → fieldSizeY − y. |
| `mirrorFieldRotation(Rotation2d)` | θ → −θ. |
| `mirrorFieldPose(Pose2d)` | Combined. |
| `flipFieldSpeeds(ChassisSpeeds)` | Flip field-relative speeds. |
| `flipFeedforwards(double[])` | Flip swerve feedforwards (only matters for `kMirrored`). |

Field dimensions default to 16.54 m × 8.07 m — the 2024+ FRC field dimensions. Override by setting `FlippingUtil.fieldSizeX` / `fieldSizeY` if a future field differs.

## Related

- [FollowPath Builder → withDefaultShouldFlip / withShouldMirror](follow-path.md#fluent-builder-methods)
- [Path Construction → Utilities](path-construction.md#utilities-for-preparing-a-path)
