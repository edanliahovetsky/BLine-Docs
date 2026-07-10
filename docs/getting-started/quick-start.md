# First Path Tutorial

This tutorial creates one short path in BLine Web, exports it into a robot project, and follows it with BLine-Lib. Keep the first run deliberately simple; the goal is to verify the complete data and control path before tuning for speed.

Use a **Blue alliance** Driver Station selection for this first run so the authored coordinates, physical placement, and simple Field2d preview all match directly. Test the automatic red-side transform after the blue-origin path works.

## What you will build

A two-waypoint path named `first-straight` on the current FRC field:

```text
start waypoint ─────────────── end waypoint
     0°                              0°
```

Expected files:

```text
src/main/deploy/autos/
├── config.json
└── paths/
    └── first-straight.json
```

## 1. Create a project

Open [BLine Web](https://bline-web.pages.dev/).

- **Browser:** choose **Project → Workspace → New Project**.
- **Desktop:** choose **Project → Folder → Create Project Folder…**, then select the robot repository or `src/main/deploy/autos`.

Open **Settings** and make these changes:

1. Under **Field**, confirm the latest FRC field is selected. For the current docs, that is **REBUILT 2026**.
2. Under **Robot**, enter the bumper-to-bumper length and width.
3. Under **Path Defaults**, begin with conservative test limits such as `2 m/s` velocity and `2 m/s²` acceleration.
4. Use a translation tolerance around `0.05 m` and a rotation tolerance around `3°` for this first test.
5. Save the settings.

!!! note "Tutorial values are not universal robot constants"
    They are intentionally conservative. Measure and tune your own drivetrain before raising them.

## 2. Create the path

Choose **Path → Manage Paths → Create New Path**, name it `first-straight`, and create it outside a collection for now.

Add two **Waypoint** elements from the **Path Elements** panel:

| Element | X | Y | Rotation |
| --- | ---: | ---: | ---: |
| Start | `1.5 m` | `4.0 m` | `0°` |
| End | `3.0 m` | `4.0 m` | `0°` |

You can type the values in **Element Properties** or drag the waypoint on the field. This short blue-side corridor is clear on the bundled 2026 REBUILT field for an ordinary bumper footprint; still confirm clearance with your configured robot dimensions and the official field setup.

!!! info "Why both elements are waypoints"
    A waypoint contains translation and rotation. The first one gives the path an unambiguous start pose; the final one gives the follower a final heading to satisfy before finishing.

## 3. Preview the structure

Press **Play** in the transport controls beneath the field. Confirm that:

- the footprint starts at the first waypoint;
- it travels along the line to the second waypoint;
- the heading stays at `0°`; and
- the simulation reaches the end without reversing.

The editor preview is idealized kinematics, not drivetrain physics. It can catch element ordering and constraint mistakes, but it cannot validate wheel slip, controller gains, voltage limits, or localization. See [Simulation](../gui/simulation.md).

## 4. Save and export

Wait for the lower-right status to show **Saved**.

=== "Browser"

    Choose **Project → Import / Export → Export Autos Folder…**. Extract the downloaded archive and copy its `autos` tree into `src/main/deploy/`.

=== "Desktop"

    If the project is already open from the robot repository or `autos` folder, saving writes the runtime files there directly.

Confirm that `config.json` and `paths/first-straight.json` exist in the robot project before deploying.

## 5. Wire the drivetrain

Create one reusable builder, usually in `RobotContainer`. The speed supplier and consumer must both use the **robot-relative** frame.

```java
import edu.wpi.first.math.controller.PIDController;
import frc.robot.lib.BLine.FollowPath;

FollowPath.Builder pathBuilder = new FollowPath.Builder(
    driveSubsystem,
    driveSubsystem::getPose,
    driveSubsystem::getRobotRelativeSpeeds,
    driveSubsystem::driveRobotRelative,
    new PIDController(5.0, 0.0, 0.0),
    new PIDController(3.0, 0.0, 0.0),
    new PIDController(2.0, 0.0, 0.0)
).withDefaultShouldFlip();
```

The gains above are starting examples, not finished tuning. Their order is translation, rotation, then cross-track.

!!! warning "Do not pass field-relative speeds"
    BLine converts its field-relative command into robot-relative `ChassisSpeeds` before calling the consumer. Driver-perspective or alliance-dependent joystick transforms also belong outside this consumer.

## 6. Load the path and reset once { #one-time-pose-reset }

Fixed paths can be loaded when `RobotContainer` is created:

```java
import edu.wpi.first.wpilibj2.command.Command;
import frc.robot.lib.BLine.Path;

Path firstStraight = new Path("first-straight");

Command firstAuto = pathBuilder
    .withPoseReset(driveSubsystem::resetPose)
    .build(firstStraight);

// Builder options persist. Clear this before building any later path command.
pathBuilder.withPoseReset(ignored -> {});
```

`FollowPath` applies the selected alliance flip and mirror to its private path copy, then passes that **transformed** start pose to the reset consumer. Reset once at the beginning of the autonomous routine, not before every path in a multi-path sequence.

!!! warning "`withPoseReset(...)` is a persistent builder option"
    Every command built while this option is set captures the reset consumer. Clear it immediately after building the first command or later paths can teleport odometry to their own starts. Do not replace this with `resetPose(firstStraight.getStartPose())` when automatic flip/mirror is enabled; that untransformed pose is on the authored side of the field.

Return `firstAuto` from the robot's autonomous selection code.

## 7. Check the planned path on the dashboard

Publish the polyline to a WPILib `Field2d` before enabling:

```java
BLineField.drawPath(field, "FirstStraight", firstStraight);
```

The object appears as `FirstStraightTrajectory` in Field2d-compatible dashboards such as Elastic or Glass. This confirms that the deployed JSON loaded and contains the expected authored translation points. For this Blue-alliance first run, that is also the route the command follows. A red-side operator preview needs a transformed copy; see [Field2d Preview](../lib/field-visualization.md#when-to-draw-transformed-paths).

## 8. Run safely

1. Select **Blue alliance** and put the robot at the authored start pose.
2. Confirm the dashboard path, robot pose, and field coordinates agree.
3. Pre-orient the swerve modules if your drivetrain supports it.
4. Clear the test area and announce before enabling.
5. Run once at the conservative limits.
6. Disable immediately if the robot moves in an unexpected direction.

## Expected result

The robot should accelerate along the straight line, decelerate near the endpoint, enter both tolerances, and receive zero chassis speeds when the command ends.

If it does not:

| Symptom | Check first |
| --- | --- |
| Drives in the wrong direction | Robot-relative speed frame and joystick/alliance transforms |
| Jumps to an unexpected pose | Pose reset and field coordinate origin |
| Stops short or chatters | Translation gain, tolerance, measured pose, and drivetrain deadband |
| Never finishes | `remainingPathDistanceMeters`, `rotationErrorDeg`, and final tolerances |
| Editor preview works but robot does not | Localization, module control, and real drivetrain limits |

Continue with [Tune Your Robot](tuning.md) before building a competition path.
