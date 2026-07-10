# Before You Begin

BLine supplies the path editor and path-following logic. Your robot code still owns localization and drivetrain control. Get those foundations working before trying to tune BLine.

## What BLine provides

BLine has two current components:

| Component | Job |
| --- | --- |
| **BLine Web** | Create, organize, simulate, and export paths in a browser or desktop app. |
| **BLine-Lib** | Load those paths on the robot and calculate robot-relative `ChassisSpeeds` from the robot's live pose. |

BLine-Lib follows geometric path progress rather than a precomputed clock. It does **not** estimate the robot pose, tune individual swerve modules, avoid obstacles, or prove that a path is physically achievable.

## Robot prerequisites

You should already have:

- a holonomic drivetrain, such as swerve or mecanum;
- a reliable `Supplier<Pose2d>`;
- a supplier for current **robot-relative** `ChassisSpeeds`;
- a consumer that accepts **robot-relative** `ChassisSpeeds`;
- working WPILib command-based code;
- stable steering and velocity control for the individual drivetrain modules; and
- drivetrain logging that lets you compare requested motion with measured motion.

A path follower cannot compensate for an incorrect wheel radius, gear ratio, coordinate frame, gyro sign, or unstable module controller. Verify those pieces with ordinary drivetrain commands first.

## Choose a localization starting point

Localization answers **where is the robot?** BLine answers **how should it move from that pose toward the path?** BLine can use a pose produced by wheel odometry alone or by a pose estimator that also accepts vision measurements.

| Robot capability | Practical guidance |
| --- | --- |
| **Wheel and gyro odometry only** | Reasonable for a short, simple autonomous routine when the robot starts accurately and wheel slip is limited. Begin with lower velocity and acceleration, verify straight paths first, and introduce faster, turn-heavy, or multi-segment motion incrementally. |
| **Vision-corrected localization** | Strongly recommended for longer routines, repeated direction changes, higher acceleration, recovery after contact, and other movement where odometry drift can accumulate. |
| **Vision still being developed** | Do not block the first BLine test on a camera pipeline. Prove a simple path with odometry, keep the motion envelope conservative, and add complexity only as the estimated pose proves repeatable. |

Vision improves the pose supplied to BLine; it does not repair poor module calibration or excessive wheel slip. Even a vision-equipped robot should validate its odometry and gyro first.

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

## Prepare a safe test area

FRC robots can change speed or direction suddenly while tuning autonomous code.

- Use a controlled test area with physical barriers and no people inside it.
- Keep a functioning Driver Station connected and be ready to disable.
- Announce before enabling and confirm the Robot Signal Light is visible.
- Begin with the slow straight path in the next tutorial.
- Verify pose, coordinate frames, direction, and stopping behavior before tuning at the robot's intended motion limits.
- Pre-orient swerve modules before each autonomous test, either in code or manually. This is especially important when a path starts aggressively.

## Recommended learning path

1. [Install the editor and library](installation.md).
2. [Create and run one simple path](quick-start.md).
3. [Learn the three controllers and tune the robot](tuning.md).
4. Learn [path elements](../concepts/path-elements.md) and [constraints](../concepts/constraints.md).
5. Add collections, linked elements, events, and advanced library features only after the basic path is repeatable.
