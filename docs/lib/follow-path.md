# FollowPath Builder

The `FollowPath.Builder` creates commands that execute path following. It's designed to be configured once and reused for all paths.

## Basic Setup

```java
import frc.robot.lib.BLine.*;
import edu.wpi.first.math.controller.PIDController;

FollowPath.Builder pathBuilder = new FollowPath.Builder(
    driveSubsystem,                      // Subsystem requirement
    driveSubsystem::getPose,             // Current pose supplier
    driveSubsystem::getChassisSpeeds,    // Current speeds supplier
    driveSubsystem::drive,               // Drive consumer
    new PIDController(5.0, 0.0, 0.0),    // Translation controller
    new PIDController(3.0, 0.0, 0.0),    // Rotation controller
    new PIDController(2.0, 0.0, 0.0)     // Cross-track controller
);
```

## Constructor Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `driveSubsystem` | `SubsystemBase` | The drive subsystem to require |
| `poseSupplier` | `Supplier<Pose2d>` | Returns current robot pose |
| `speedsSupplier` | `Supplier<ChassisSpeeds>` | Returns current robot-relative speeds |
| `speedsConsumer` | `Consumer<ChassisSpeeds>` | Accepts robot-relative speeds to drive |
| `translationController` | `PIDController` | Controls speed based on distance remaining |
| `rotationController` | `PIDController` | Controls holonomic rotation toward targets |
| `crossTrackController` | `PIDController` | Minimizes deviation from path line |

## PID Controllers

### Translation Controller

Controls the robot's speed based on **remaining distance to the path end**.

- **Input**: Distance remaining (meters)
- **Output**: Desired velocity (m/s)
- **Tuning**: Higher P = faster acceleration, but may overshoot

```java
new PIDController(5.0, 0.0, 0.0)  // Typical starting point
```

### Rotation Controller

Controls the robot's **holonomic rotation** toward rotation targets.

- **Input**: Heading error (radians)
- **Output**: Desired angular velocity (rad/s)
- **Tuning**: Higher P = faster rotation response

```java
new PIDController(3.0, 0.0, 0.0)  // Typical starting point
```

### Cross-Track Controller

Minimizes **deviation from the line** between waypoints.

- **Input**: Perpendicular distance from path line (meters)
- **Output**: Correction velocity (m/s)
- **Tuning**: Higher P = stronger path adherence

```java
new PIDController(2.0, 0.0, 0.0)  // Typical starting point
```

## Builder Methods

### withPoseReset

Resets odometry to the path's starting pose when the command begins:

```java
pathBuilder.withPoseReset(driveSubsystem::resetPose);
```

This is useful for the first path in autonomous to ensure odometry starts correctly.

### withDefaultShouldFlip

Automatically flip paths for the red alliance based on `DriverStation.getAlliance()`:

```java
pathBuilder.withDefaultShouldFlip();
```

### withShouldFlip

Custom flip logic:

```java
pathBuilder.withShouldFlip(() -> {
    // Return true to flip the path
    return DriverStation.getAlliance() == Alliance.Red;
});
```

## Building Commands

Use `build()` to create a command for a specific path:

```java
Path myPath = new Path("myPathFile");
Command followCommand = pathBuilder.build(myPath);
```

The returned command:

- Requires the drive subsystem
- Runs until the robot reaches the end tolerances
- Stops the drivetrain when finished

## Complete Example

```java
public class RobotContainer {
    private final DriveSubsystem driveSubsystem = new DriveSubsystem();
    private final FollowPath.Builder pathBuilder;
    
    public RobotContainer() {
        // Set global constraints
        Path.setDefaultGlobalConstraints(new Path.DefaultGlobalConstraints(
            4.0, 3.0, 360.0, 720.0, 0.05, 2.0, 0.3
        ));
        
        // Create path builder
        pathBuilder = new FollowPath.Builder(
            driveSubsystem,
            driveSubsystem::getPose,
            driveSubsystem::getChassisSpeeds,
            driveSubsystem::drive,
            new PIDController(5.0, 0.0, 0.0),
            new PIDController(3.0, 0.0, 0.0),
            new PIDController(2.0, 0.0, 0.0)
        ).withDefaultShouldFlip()
         .withPoseReset(driveSubsystem::resetPose);
    }
    
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
}
```

## Tuning Tips

!!! warning "Tune at Maximum Velocities"
    When tuning PID controllers, **stress-test your gains at maximum robot velocity and acceleration**. If you limit max acceleration *after* tuning, or increase max velocity beyond what was used during tuning, you will likely experience:
    
    - Overshoot when reaching the path endpoint
    - Unexpected behavior during path following
    
    Always tune within the full operating range of velocities and accelerations.

### Translation Controller

1. Start with P = 5.0, I = 0, D = 0
2. Increase P until the robot accelerates aggressively toward targets
3. If you see oscillation near endpoints, add small D (0.1-0.5)
4. I is rarely needed for path following

### Rotation Controller

1. Start with P = 3.0, I = 0, D = 0
2. Increase P until rotation is responsive but not oscillating
3. Add D if you see overshoot on rotation targets

### Cross-Track Controller

1. Start with P = 2.0, I = 0, D = 0
2. Lower P if the robot fights itself on curved sections
3. Higher P keeps the robot closer to the line but may cause jitter

## Pre-Match Module Orientation

For optimal autonomous start, pre-orient swerve modules:

```java
// During robot setup or auto init
Path firstPath = new Path("firstAutoPath");
Rotation2d initialDirection = firstPath.getInitialModuleDirection();

// Orient modules before match starts
driveSubsystem.setModuleOrientations(initialDirection);
```

This prevents micro-deviations at auto start caused by modules rotating while driving.

