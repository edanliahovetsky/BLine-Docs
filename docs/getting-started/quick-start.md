# Quick Start

This page walks through creating and following your first BLine path end-to-end. It assumes:

- You have [installed BLine-Lib](installation.md#bline-lib) in a WPILib FRC robot project.
- Your robot has a holonomic drivetrain with a reliable pose estimate.
- You are comfortable with WPILib command-based programming (subsystems, commands, `Pose2d`).

## 1. Set global constraints

Global constraints provide fallback velocity/acceleration limits, end tolerances, and a default handoff radius that apply to every path unless a path-specific constraint overrides them. Set them once, before constructing any paths. Pick the approach that matches your workflow:

=== "Via config.json (GUI / JSON workflows)"

    Create `src/main/deploy/autos/config.json`:

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

    BLine-Lib auto-loads this file when it constructs the first `Path`. If you design paths in BLine-GUI, the GUI writes this file for you from its **Settings → Edit Config** dialog.

=== "Via Code (code-only workflow)"

    ```java
    // In Robot.robotInit() or RobotContainer's constructor
    Path.setDefaultGlobalConstraints(new Path.DefaultGlobalConstraints(
        4.5,    // maxVelocityMetersPerSec
        10.0,   // maxAccelerationMetersPerSec2
        600,    // maxVelocityDegPerSec
        2000,   // maxAccelerationDegPerSec2
        0.03,   // endTranslationToleranceMeters
        2.0,    // endRotationToleranceDeg
        0.25    // intermediateHandoffRadiusMeters
    ));
    ```

The numbers above are reasonable starting points; see [Tuning & Usage Tips](../usage-tips.md) for how to tune them.

## 2. Build a reusable `FollowPath.Builder`

`FollowPath.Builder` wires BLine to your drivetrain: a pose supplier, chassis-speeds supplier/consumer, and three PID controllers. Build it once (typically in `RobotContainer`) and reuse it for every path.

```java
import frc.robot.lib.BLine.*;
import edu.wpi.first.math.controller.PIDController;

FollowPath.Builder pathBuilder = new FollowPath.Builder(
    driveSubsystem,                     // Subsystem requirement
    driveSubsystem::getPose,            // Supplier<Pose2d>
    driveSubsystem::getChassisSpeeds,   // Supplier<ChassisSpeeds> (robot-relative)
    driveSubsystem::drive,              // Consumer<ChassisSpeeds>  (robot-relative)
    new PIDController(5.0, 0.0, 0.0),   // translation — minimizes remaining distance
    new PIDController(3.0, 0.0, 0.0),   // rotation    — minimizes heading error
    new PIDController(2.0, 0.0, 0.0)    // cross-track — minimizes perpendicular deviation
)
.withDefaultShouldFlip()                // auto-flip when on the red alliance
.withPoseReset(driveSubsystem::resetPose); // reset odometry at each path's start pose
```

!!! info "The three PID controllers"
    - **Translation** sets speed magnitude based on *remaining path distance*. Its output gets direction added by pointing at the next target and is then clamped to the active max-velocity constraint.
    - **Rotation** drives holonomic heading toward the current rotation target (either profiled along the segment or snapped to the target when `profiled_rotation=false`).
    - **Cross-track** nudges the robot back onto the straight line between the previous and current translation targets — useful on long segments, not a substitute for velocity limiting through turns.

    Tune them in that order: translation first, then rotation, then CTE. See [Tuning & Usage Tips](../usage-tips.md#pid-tuning).

!!! tip "Drive-subsystem consumer must be robot-relative"
    BLine's follower computes a field-relative `ChassisSpeeds`, converts it to robot-relative via the current pose, and passes that to the consumer. If your drive subsystem accepts field-relative speeds, convert them back inside the consumer. (CTRE Swerve Templates and most YAGSL setups use robot-relative `ApplyRequest` / drive methods, so this just works.)

## 3. Create and follow a path

=== "From JSON"

    Place a file like `deploy/autos/paths/scoreFirst.json` (BLine-GUI writes this for you). Load it by name, without the extension:

    ```java
    Path scorePath = new Path("scoreFirst");
    Command followCommand = pathBuilder.build(scorePath);
    ```

=== "In code"

    ```java
    Path scorePath = new Path(
        new Path.Waypoint(new Translation2d(1.0, 1.0), Rotation2d.fromDegrees(0)),
        new Path.TranslationTarget(new Translation2d(2.0, 2.0)),
        new Path.Waypoint(new Translation2d(3.0, 1.0), Rotation2d.fromDegrees(180))
    );
    Command followCommand = pathBuilder.build(scorePath);
    ```

## 4. Use it in autonomous

BLine paths always run to completion — the command finishes only when both the end translation and end rotation tolerances are met. To add pauses, scoring, or intake actions, split your routine into multiple paths:

```java
public Command getAutonomousCommand() {
    return Commands.sequence(
        pathBuilder.build(new Path("toFirstScore")),
        new ScoreCommand(),
        pathBuilder.build(new Path("toPickup")),
        new IntakeCommand(),
        pathBuilder.build(new Path("toSecondScore")),
        new ScoreCommand()
    );
}
```

If you need actions to fire *during* a path (as opposed to between paths), use [Event Triggers](../concepts/event-triggers.md).

## 5. Pre-orient swerve modules (strongly recommended)

Before the match starts, point the swerve modules in the direction the robot is about to drive. This prevents the small lateral drift you'd otherwise see in the first few tens of milliseconds while modules pivot under load.

```java
Path firstAuto = new Path("firstAutoPath");
Rotation2d initialDirection = firstAuto.getInitialModuleDirection();
driveSubsystem.setModuleOrientations(initialDirection);
```

Call this from disabled-periodic or an auto-init command. See [Pre-Match Module Orientation](../lib/pre-match.md) for details.

## Add path-specific constraints (optional)

Override global defaults per path:

```java
Path.PathConstraints slow = new Path.PathConstraints()
    .setMaxVelocityMetersPerSec(2.0)
    .setMaxAccelerationMetersPerSec2(6.0)
    .setEndTranslationToleranceMeters(0.02)
    .setEndRotationToleranceDeg(1.0);

Path alignment = new Path(
    slow,
    new Path.Waypoint(new Translation2d(1.0, 1.0), Rotation2d.fromDegrees(0)),
    new Path.Waypoint(new Translation2d(3.0, 1.0), Rotation2d.fromDegrees(180))
);
```

Or vary limits across the path using [ranged constraints](../concepts/constraints.md#ranged-constraints):

```java
Path.PathConstraints ranged = new Path.PathConstraints()
    .setMaxVelocityMetersPerSec(
        new Path.RangedConstraint(4.0, 0, 2),  // fast through ordinals 0–2
        new Path.RangedConstraint(1.5, 3, 5)   // slow through ordinals 3–5
    );
```

## Common workflows

| Workflow | When it fits |
|----------|--------------|
| **GUI + Lib + JSON** | You want to iterate visually. Save paths as JSON, check them into Git. Most teams. |
| **JSON-only + Lib** | You're comfortable writing JSON by hand, or generating it from another tool. |
| **Code-only + Lib** | Fully dynamic paths (e.g. auto-align to the nearest scoring position computed at runtime). |

Nothing stops you from mixing these — the code-only `Path.Waypoint(...)` API and the JSON loader produce the same `Path` object at the end.

## Next steps

- [Core Concepts →](../concepts/path-elements.md) — path elements, constraints, handoff radii, event triggers.
- [GUI Overview →](../gui/index.md) — the visual editor, simulation preview, and keyboard shortcuts.
- [FollowPath Builder →](../lib/follow-path.md) — every builder option in depth.
- [Tuning & Usage Tips →](../usage-tips.md) — how to actually tune the PIDs and pick tolerances.
- [Common Issues →](../common-issues.md) — fixes for things teams hit in the field.
