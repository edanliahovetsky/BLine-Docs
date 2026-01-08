# Quick Start

This guide walks you through creating and following your first BLine path.

## Prerequisites

- [BLine-Lib installed](installation.md#bline-lib-installation) in your FRC project
- A holonomic drivetrain (swerve, mecanum, etc.)
- Basic familiarity with WPILib command-based programming

## Step 1: Set Global Constraints

Global constraints define default velocity/acceleration limits and tolerances for all paths. Choose one approach:

=== "Using config.json"

    Create a `config.json` file in `src/main/deploy/autos/`:
    
    ```json
    {
        "default_max_velocity_meters_per_sec": 4.5,
        "default_max_acceleration_meters_per_sec2": 11.0,
        "default_max_velocity_deg_per_sec": 600.0,
        "default_max_acceleration_deg_per_sec2": 1500.0,
        "default_end_translation_tolerance_meters": 0.05,
        "default_end_rotation_tolerance_deg": 2.0,
        "default_intermediate_handoff_radius_meters": 0.2
    }
    ```

=== "In Code"

    Set global constraints programmatically in your robot initialization:
    
    ```java
    // Set global constraints before creating any paths
    Path.setDefaultGlobalConstraints(new Path.DefaultGlobalConstraints(
        4.5,    // maxVelocityMetersPerSec
        11.0,   // maxAccelerationMetersPerSec2
        600.0,  // maxVelocityDegPerSec
        1500.0, // maxAccelerationDegPerSec2
        0.05,   // endTranslationToleranceMeters
        2.0,    // endRotationToleranceDeg
        0.2     // intermediateHandoffRadiusMeters
    ));
    ```

## Step 2: Create a FollowPath Builder

Create a reusable `FollowPath.Builder` in your drive subsystem or `RobotContainer`:

```java
import frc.robot.lib.BLine.*;
import edu.wpi.first.math.controller.PIDController;

// Create a reusable builder with your robot's configuration
FollowPath.Builder pathBuilder = new FollowPath.Builder(
    driveSubsystem,                      // The drive subsystem to require
    driveSubsystem::getPose,             // Supplier for current robot pose
    driveSubsystem::getChassisSpeeds,    // Supplier for current speeds
    driveSubsystem::drive,               // Consumer to drive the robot
    new PIDController(5.0, 0.0, 0.0),    // Translation PID
    new PIDController(5.0, 0.0, 0.0),    // Rotation PID
    new PIDController(2.0, 0.0, 0.0)     // Cross-track PID
).withDefaultShouldFlip()                // Auto-flip for red alliance
 .withPoseReset(driveSubsystem::resetPose);  // Reset odometry at path start
```

!!! info "PID Controllers"
    - **Translation Controller**: Controls speed based on distance remaining to path end
    - **Rotation Controller**: Controls holonomic rotation toward rotation targets
    - **Cross-Track Controller**: Minimizes deviation from the path line

## Step 3: Create and Follow Paths

=== "From JSON File"

    Place your path JSON in `deploy/autos/paths/`, then load it:
    
    ```java
    // Loads deploy/autos/paths/myPathFile.json
    // Note: .json extension is added automatically
    Path myPath = new Path("myPathFile");
    
    Command followCommand = pathBuilder.build(myPath);
    ```

=== "Programmatically"

    Create paths directly in code:
    
    ```java
    Path myPath = new Path(
        new Path.Waypoint(new Translation2d(1.0, 1.0), new Rotation2d(0)),
        new Path.TranslationTarget(new Translation2d(2.0, 2.0)),
        new Path.Waypoint(new Translation2d(3.0, 1.0), new Rotation2d(Math.PI))
    );
    
    Command followCommand = pathBuilder.build(myPath);
    ```

## Step 4: Use in Autonomous

Add the follow command to your autonomous routine:

```java
public Command getAutonomousCommand() {
    Path scorePath = new Path("scoreFirst");
    Path pickupPath = new Path("intake");
    
    return Commands.sequence(
        pathBuilder.build(scorePath),
        // Add scoring action here
        pathBuilder.build(pickupPath)
        // Continue with more actions...
    );
}
```

## Step 5: Pre-Orient Modules (Recommended)

For optimal autonomous performance, pre-orient your swerve modules toward the initial path direction before the match begins. This prevents micro-deviations at the start caused by modules needing to rotate during driving.

```java
// In your autonomous initialization or pre-match routine
Path autoPath = new Path("myAutoPath");
Rotation2d initialDirection = autoPath.getInitialModuleDirection();

driveSubsystem.setModuleOrientations(initialDirection);
```

## Adding Path-Specific Constraints (Optional)

Override global constraints for individual paths:

```java
Path.PathConstraints slowConstraints = new Path.PathConstraints()
    .setMaxVelocityMetersPerSec(2.0)
    .setMaxAccelerationMetersPerSec2(11)
    .setMaxVelocityDegPerSec(180.0)
    .setMaxAccelerationDegPerSec2(360.0)
    .setEndTranslationToleranceMeters(0.02)
    .setEndRotationToleranceDeg(1.0);

// Create path with custom constraints
Path slowPath = new Path(
    slowConstraints,
    new Path.Waypoint(new Translation2d(1.0, 1.0), new Rotation2d(0)),
    new Path.TranslationTarget(new Translation2d(2.0, 2.0)),
    new Path.Waypoint(new Translation2d(3.0, 1.0), new Rotation2d(Math.PI))
);
```

You can also use **ranged constraints** to vary limits across different path segments:

```java
Path.PathConstraints rangedConstraints = new Path.PathConstraints()
    .setMaxVelocityMetersPerSec(
        new Path.RangedConstraint(4.0, 0, 2),  // Fast for elements 0-2
        new Path.RangedConstraint(1.5, 3, 5)   // Slow for elements 3-5
    );
```

See [Constraints](../concepts/constraints.md) for more details on the constraint system.

## Next Steps

- [Core Concepts](../concepts/path-elements.md) — Understand path elements in depth
- [GUI Overview](../gui/index.md) — Learn to use the visual path editor
- [Path Construction](../lib/path-construction.md) — Detailed path creation guide
- [Usage Tips](../usage-tips.md) — Best practices for tuning and optimization

