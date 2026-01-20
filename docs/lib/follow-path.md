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

- **Input**: rotation error (radians)
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

### How the Controllers Work Together

The tracking control loop runs all three PID controllers each cycle:

1. **Translation controller** — Minimizes total remaining path distance and drives the robot to the final path element
2. **Rotation controller** — Either follows the profiled rotation setpoint or snaps directly to the target if no profile is specified
3. **Cross-Track Error (CTE) controller** — Minimizes deviation from the line between current and previous path segments, helping reduce post-handoff cross-track error

The translation controller's speed magnitude depends on distance to the path's end, while direction depends on the next available waypoint. These values are **acceleration-limited in 2D** to provide smooth robot motion toward the target, making chassis output relatively stable even during erroneous odometry jitter.

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

!!! warning "No Mid-Path Stopping"
    BLine does not support stopping the robot midway through a path. If you need the robot to stop partway through, create separate Path objects and chain them together:

    ```java
    Commands.sequence(
        pathBuilder.build(firstSegment),    // Drive to first location
        new ScoreCommand(),                 // Stop and score
        pathBuilder.build(secondSegment)    // Continue to next location
    );
    ```

## Complete Example

```java
public class RobotContainer {
    private final DriveSubsystem driveSubsystem = new DriveSubsystem();
    private final FollowPath.Builder pathBuilder;
    
    public RobotContainer() {
        // Set global constraints
        Path.setDefaultGlobalConstraints(new Path.DefaultGlobalConstraints(
            4.5, 12.0, 540, 860, 0.03, 2.0, 0.2
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

### Tuning Order

The PID controllers should be tuned in the following order: translation, rotation, and finally cross-track.

### Translation Controller

The translation controller minimizes total path distance remaining.

!!! warning "Controller Instability"
    Avoid using the PID integral term for the translation controller. Using the integral term will cause translation controller instability. Integral term use in other controllers (Rotation and Cross-Track) is fine.

**Starting gains:** P = 5.0, I = 0.0, D = 0.0

### Rotation Controller

Minimizes error in holonomic heading (rotation).

**Starting gains:** P = 3.0, I = 0.0, D = 0.0

### Cross-Track Controller

Keeps the robot on the line between waypoints or translation targets. It should be used to reduce path deviation in longer path segments over time, rather than on sharp turns.

!!! warning "Controller Instability"
    Be wary of cross-track controller over-tuning (where the controller overpowers the translation controller). An over-tuned cross-track controller will cause undesirable behavior around turns, especially during high velocities.

**Starting gains:** P = 2.0, I = 0.0, D = 0.0
