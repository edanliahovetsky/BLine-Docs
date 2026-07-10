# Before You Begin

BLine can decide how a holonomic robot should move along a path, but it depends on the rest of the robot stack for localization and drivetrain control. Check these pieces before tuning BLine.

## What BLine provides

BLine has two current components:

| Component | Job |
| --- | --- |
| **BLine Web** | Create, organize, simulate, and export paths in a browser or desktop app. |
| **BLine-Lib** | Load those paths on the robot and calculate robot-relative `ChassisSpeeds` from the robot's live pose. |

BLine-Lib follows geometric path progress rather than a precomputed clock. It does **not** estimate robot pose, tune individual swerve modules, avoid obstacles, or guarantee that an aggressive path is physically achievable.

## Robot prerequisites

You should already have:

- a holonomic drivetrain, such as swerve or mecanum;
- a reliable `Supplier<Pose2d>`;
- a supplier for current **robot-relative** `ChassisSpeeds`;
- a consumer that accepts **robot-relative** `ChassisSpeeds`;
- working WPILib command-based code;
- drivetrain velocity control that can follow ordinary chassis-speed requests; and
- enough logging to compare requested behavior with the robot's response.

!!! warning "Localization and path following are different problems"
    Localization answers **where is the robot?** BLine answers **how should it move from that pose toward the path?** Cameras are not required by BLine itself, but inaccurate pose data limits every path follower. Wheel odometry can be enough for a short autonomous routine when slip is controlled; vision-corrected pose estimation is strongly recommended for longer routines, teleoperated alignment, and recovery after contact.

## Vocabulary used in this guide

| Term | Meaning |
| --- | --- |
| **Pose** | Field position `(x, y)` plus robot heading. |
| **Localization** | Producing the live pose supplied to BLine. This may combine wheel odometry, a gyro, and vision. |
| **Path** | The geometric elements, constraints, rotations, and events BLine should follow. |
| **Path following** | Calculating drivetrain commands from the live pose and path state. |
| **Trajectory** | A path with desired states assigned to time. BLine does not follow a time-indexed trajectory. |
| **Pathfinding** | Choosing a route around obstacles. BLine can follow a route, but does not currently find one for you. |

Read [How BLine Works](../concepts/design-philosophy.md) for a fuller comparison of geometric and time-parameterized tracking.

## Choose an editor

| Use | Best choice |
| --- | --- |
| Try BLine or edit from any laptop | [Hosted BLine Web](https://bline-web.pages.dev/) |
| Work directly in a robot repository | BLine Web desktop app |
| Generate a dynamic path entirely in Java | BLine-Lib without the editor |

Browser workspaces are stored by the browser. Pressing **Save** does not write into your robot repository; export the autos folder when you are ready. The desktop app can work directly in an `autos` folder.

## Test safely

FRC robots can accelerate suddenly while tuning autonomous code.

- Use a controlled test area with physical barriers and no people inside it.
- Keep a functioning Driver Station connected and be ready to disable.
- Announce before enabling and confirm the Robot Signal Light is visible.
- Begin with a simple straight path and conservative constraints.
- Increase speed only after pose, frames, direction, and stopping behavior are correct.

## Recommended learning path

1. [Install the editor and library](installation.md).
2. [Create and run one simple path](quick-start.md).
3. [Tune translation, rotation, and cross-track control](tuning.md).
4. Learn [path elements](../concepts/path-elements.md) and [constraints](../concepts/constraints.md).
5. Add collections, linked elements, events, and advanced library features only after the basic path is repeatable.
