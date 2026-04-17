# API Reference

Quick lookup for the public BLine-Lib surface. For full signatures, parameter docs, and inherited methods, see the [Javadoc](https://edanliahovetsky.github.io/BLine-Lib/).

Current release: **v0.8.4** (2026 season).

---

## `Path`

Ordered collection of path elements plus constraints. Constructed from JSON or directly in code.

### Constructors

```java
Path(String pathFileName)
Path(File autosDir, String pathFileName)
Path(PathElement... elements)
Path(PathConstraints constraints, PathElement... elements)
Path(List<PathElement> elements)
Path(List<PathElement> elements, PathConstraints constraints)
Path(List<PathElement> elements, PathConstraints constraints, DefaultGlobalConstraints globals)
```

String-based constructors load from `deploy/autos/paths/<name>.json`. Passing a `PathConstraints` overrides the global defaults for that path only.

### Static methods

```java
static void setDefaultGlobalConstraints(DefaultGlobalConstraints constraints)
```

Installs the defaults all paths fall back to when they don't specify their own. Either call this at robot init or populate `deploy/autos/config.json` and let BLine read it lazily.

### Instance methods

| Method | Returns | Notes |
|--------|---------|-------|
| `isValid()` | `boolean` | False if first/last is not a `Waypoint` / `TranslationTarget`, or if path is empty / single-rotation-only. |
| `getPathElements()` | `List<PathElement>` | Deep copy. |
| `setPathElements(List<PathElement>)` | `void` | Replaces all elements. |
| `addPathElement(PathElement)` | `Path` | Append. Returns this for chaining. |
| `getElement(int)` / `setElement(int, PathElement)` / `removeElement(int)` / `reorderElements(List<Integer>)` | — | Per-index mutations. |
| `getPathConstraints()` / `setPathConstraints(PathConstraints)` | — | Defensive-copy accessors. |
| `getDefaultGlobalConstraints()` | `DefaultGlobalConstraints` | Copy of current globals. |
| `getEndTranslationToleranceMeters()` / `getEndRotationToleranceDeg()` | `double` | Resolved from path or globals. |
| `getPathElementsWithConstraints()` | `List<Pair<PathElement, PathElementConstraint>>` | Each element paired with its resolved constraint. |
| `getPathElementsWithConstraintsNoWaypoints()` | `List<Pair<PathElement, PathElementConstraint>>` | Waypoints split into `TranslationTarget` + `RotationTarget`. Used internally by `FollowPath`. |
| `flip()` / `undoFlip()` | `void` | Alliance flip (rotational symmetry). Idempotent; `undoFlip` restores original. |
| `mirror()` | `void` | Reflect across field width centerline. Not stateful — each call re-applies. |
| `getStartPose()` / `getStartPose(Rotation2d fallback)` | `Pose2d` | First translation + first rotation. |
| `getInitialModuleDirection()` and overloads | `Rotation2d` | See [Pre-Match Module Orientation](pre-match.md). |
| `copy()` | `Path` | Deep copy preserving flipped state. |

---

## `Path.PathElement` (sealed)

Permitted implementations: `Waypoint`, `TranslationTarget`, `RotationTarget`, `EventTrigger`.

### `Path.Waypoint` *(record)*

```java
Waypoint(TranslationTarget translationTarget, RotationTarget rotationTarget)
Waypoint(Pose2d pose)
Waypoint(Pose2d pose, double handoffRadius)
Waypoint(Pose2d pose, boolean profiledRotation)
Waypoint(Pose2d pose, double handoffRadius, boolean profiledRotation)
Waypoint(Translation2d translation, Rotation2d rotation)
Waypoint(Translation2d translation, Rotation2d rotation, boolean profiledRotation)
Waypoint(Translation2d translation, double handoffRadius, Rotation2d rotation)
Waypoint(Translation2d translation, double handoffRadius, Rotation2d rotation, boolean profiledRotation)
Waypoint(double x, double y, Rotation2d rotation)
```

### `Path.TranslationTarget` *(record)*

```java
TranslationTarget(Translation2d translation, Optional<Double> intermediateHandoffRadiusMeters)
TranslationTarget(Translation2d translation)
TranslationTarget(double x, double y)
TranslationTarget(double x, double y, double handoffRadius)
```

### `Path.RotationTarget` *(record)*

```java
RotationTarget(Rotation2d rotation, double tRatio, boolean profiledRotation)
RotationTarget(Rotation2d rotation, double tRatio)  // profiledRotation defaults to true
```

### `Path.EventTrigger` *(record)*

```java
EventTrigger(double tRatio, String libKey)
```

---

## `Path.PathConstraints`

Mutable, fluent-builder-style container for per-path overrides. All setters return `this`.

```java
PathConstraints()

PathConstraints setMaxVelocityMetersPerSec(double value)
PathConstraints setMaxVelocityMetersPerSec(RangedConstraint... ranges)
PathConstraints setMaxAccelerationMetersPerSec2(double value)
PathConstraints setMaxAccelerationMetersPerSec2(RangedConstraint... ranges)
PathConstraints setMaxVelocityDegPerSec(double value)
PathConstraints setMaxVelocityDegPerSec(RangedConstraint... ranges)
PathConstraints setMaxAccelerationDegPerSec2(double value)
PathConstraints setMaxAccelerationDegPerSec2(RangedConstraint... ranges)
PathConstraints setEndTranslationToleranceMeters(double value)
PathConstraints setEndRotationToleranceDeg(double value)

// Defensive-copy getters also exist.
PathConstraints copy()
```

---

## `Path.RangedConstraint` *(record)*

```java
RangedConstraint(double value, int startOrdinal, int endOrdinal)
```

Apply a value to a contiguous range of path ordinals. Translation-side constraints use translation ordinals; rotation-side constraints use rotation ordinals. First matching range in list order wins. Use `Integer.MAX_VALUE` as `endOrdinal` for unbounded-right.

---

## `Path.DefaultGlobalConstraints`

Immutable global fallback values. Constructed once and installed via `Path.setDefaultGlobalConstraints(...)`.

```java
DefaultGlobalConstraints(
    double maxVelocityMetersPerSec,
    double maxAccelerationMetersPerSec2,
    double maxVelocityDegPerSec,
    double maxAccelerationDegPerSec2,
    double endTranslationToleranceMeters,
    double endRotationToleranceDeg,
    double intermediateHandoffRadiusMeters
)

// Getters for each field
double getMaxVelocityMetersPerSec()
double getMaxAccelerationMetersPerSec2()
double getMaxVelocityDegPerSec()
double getMaxAccelerationDegPerSec2()
double getEndTranslationToleranceMeters()
double getEndRotationToleranceDeg()
double getIntermediateHandoffRadiusMeters()

DefaultGlobalConstraints copy()
```

Global defaults do **not** support ranged constraints — use `PathConstraints` for that.

---

## `FollowPath`

WPILib `Command` that follows a `Path`. Construct via `FollowPath.Builder`, not directly.

### Static methods — event-trigger registry

```java
static void registerEventTrigger(String key, Runnable action)
static void registerEventTrigger(String key, Command command)
```

Registers actions referenced by `EventTrigger` elements. Registering the same key again replaces the previous action.

### Static methods — logging consumers

```java
static void setPoseLoggingConsumer(Consumer<Pair<String, Pose2d>>)
static void setTranslationListLoggingConsumer(Consumer<Pair<String, Translation2d[]>>)
static void setDoubleLoggingConsumer(Consumer<Pair<String, Double>>)
static void setBooleanLoggingConsumer(Consumer<Pair<String, Boolean>>)
```

Pass `null` to restore the no-op consumer. See [Logging](logging.md) for the full key reference.

### Diagnostic getters

```java
int getCurrentTranslationElementIndex()
int getCurrentRotationElementIndex()       // -1 when no active rotation target remains
double getRemainingPathDistanceMeters()    // 0.0 when not in a valid traversal state
```

---

## `FollowPath.Builder`

Fluent builder for configuring `FollowPath` commands.

### Constructor

```java
Builder(
    Subsystem driveSubsystem,
    Supplier<Pose2d> poseSupplier,
    Supplier<ChassisSpeeds> robotRelativeSpeedsSupplier,
    Consumer<ChassisSpeeds> robotRelativeSpeedsConsumer,
    PIDController translationController,
    PIDController rotationController,
    PIDController crossTrackController
)
```

### Fluent configuration

```java
Builder withShouldFlip(Supplier<Boolean> supplier)
Builder withDefaultShouldFlip()
Builder withShouldMirror(Supplier<Boolean> supplier)
Builder withPoseReset(Consumer<Pose2d> poseResetConsumer)
Builder withTRatioBasedTranslationHandoffs(boolean enabled)
```

### Building a command

```java
FollowPath build(Path path)
```

Returns a fresh, independent command for the provided path. Safe to call many times; each call produces its own command instance.

---

## `FlippingUtil`

Static helpers for flipping and mirroring coordinates. See [Alliance Flip & Mirror](flip-and-mirror.md) for usage.

```java
static FieldSymmetry symmetryType      // defaults to kRotational
static double fieldSizeX               // defaults to 16.54 m
static double fieldSizeY               // defaults to 8.07 m

static Translation2d flipFieldPosition(Translation2d)
static Rotation2d    flipFieldRotation(Rotation2d)
static Pose2d        flipFieldPose(Pose2d)

static Translation2d mirrorFieldPosition(Translation2d)
static Rotation2d    mirrorFieldRotation(Rotation2d)
static Pose2d        mirrorFieldPose(Pose2d)

static ChassisSpeeds flipFieldSpeeds(ChassisSpeeds)
static double[]      flipFeedforwards(double[])
```

`FieldSymmetry` enum: `kRotational`, `kMirrored`.

---

## `JsonUtils`

JSON loader exposed for advanced use cases (custom autos dirs, loading from strings, unit tests).

```java
static Path loadPath(String pathFileName)
static Path loadPath(File autosDir, String pathFileName)
static Path loadPath(JSONObject json, Path.DefaultGlobalConstraints globals)
static Path loadPathFromJsonString(String json, Path.DefaultGlobalConstraints globals)

static Path.DefaultGlobalConstraints loadGlobalConstraints(File autosDir)

static ParsedPathComponents parsePathComponents(
    JSONObject pathJson,
    Path.DefaultGlobalConstraints globals)

static final File PROJECT_ROOT   // deploy/autos by default
```

The `ParsedPathComponents` record splits parsing from `Path` construction; useful for benchmarking or inspecting parsed data before building a `Path`.

`JsonUtils` tolerates both the modern nested `kinematic_constraints` config shape and the legacy flat layout, and accepts aliases for older key names. Missing numeric fields fall back to safe defaults (`FALLBACK_GLOBAL_CONSTRAINTS`) and log a warning rather than crashing.

---

## JSON file formats

### `config.json`

```json
{
    "default_max_velocity_meters_per_sec": 4.5,
    "default_max_acceleration_meters_per_sec2": 10.0,
    "default_max_velocity_deg_per_sec": 600,
    "default_max_acceleration_deg_per_sec2": 2000,
    "default_end_translation_tolerance_meters": 0.03,
    "default_end_rotation_tolerance_deg": 2.0,
    "default_intermediate_handoff_radius_meters": 0.25
}
```

The GUI v0.3.0+ may write these under a `kinematic_constraints` parent object; BLine-Lib reads both shapes.

### Path `*.json`

```json
{
    "path_elements": [
        /* waypoint | translation | rotation | event_trigger */
    ],
    "constraints": {
        "max_velocity_meters_per_sec": 4.5,        // scalar or array of ranged
        "max_acceleration_meters_per_sec2": 10.0,
        "max_velocity_deg_per_sec": 600,
        "max_acceleration_deg_per_sec2": 2000,
        "end_translation_tolerance_meters": 0.03,
        "end_rotation_tolerance_deg": 2.0
    }
}
```

An optional `default_global_constraints` block can override project-wide globals for that one path only (rarely needed).

---

## See also

- [Full Javadoc](https://edanliahovetsky.github.io/BLine-Lib/) — every method signature and parameter doc.
- [Library → Overview](index.md) — conceptual architecture.
- [FollowPath Builder](follow-path.md) — in-depth usage.
- [Event Triggers](event-triggers.md) / [Alliance Flip & Mirror](flip-and-mirror.md) / [Logging](logging.md) — feature guides.
