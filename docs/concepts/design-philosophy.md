# How BLine Works

BLine is a geometric, state-based path follower. A path describes **where** the robot should travel and the limits to respect; the follower calculates the next chassis-speed request from the robot's current pose each loop.

## The control loop

When `FollowPath` initializes, it applies configured transforms, optionally resets pose, reads the live starting pose, and samples robot-relative speed once to seed its rate limiter. Each execute cycle then:

1. Reads the live field pose.
2. Determines the active translation, rotation, and event elements.
3. Calculates remaining polyline distance.
4. Uses the translation PID to request a speed magnitude toward the current target.
5. Adds cross-track correction toward the active segment line.
6. Resolves the active rotation target or rotation override.
7. Applies active minimum/maximum velocity and acceleration constraints against the prior commanded speeds.
8. Converts the result to robot-relative `ChassisSpeeds` and calls the drivetrain consumer.

The command finishes only after it reaches the final translation and rotation elements and both errors are inside their end tolerances. BLine-Lib v0.9.1 does not add a final measured-velocity requirement.

## A polyline, not a spline

A BLine path connects translation elements with straight segments. Additional translation targets approximate a curve where needed. Rotation targets and events are positioned independently along those segments with `t_ratio`.

This representation makes the important decisions visible:

- **elements** define the geometry;
- **handoff radii** define when the follower may advance to the next translation target;
- **ranged constraints** define where the robot must slow down or may speed up; and
- **end tolerances** define when the command is allowed to finish.

The editor's curve tool can turn a drawn stroke into a simplified series of translation targets, but the exported runtime path is still a polyline.

## Geometric and time-parameterized tracking

Neither model is universally better. They optimize different assumptions.

| | Geometric/state-based following (BLine) | Time-parameterized trajectory following |
| --- | --- | --- |
| Desired state | Progress and targets derived from current pose | Pose/velocity state indexed by elapsed time |
| After a delay or collision | Continues from current geometric progress | May chase a desired state that has moved ahead unless the implementation pauses or replans |
| Dynamic feasibility | User and editor constraints guide behavior; not proven by the follower | A dynamics-aware generator can produce a feasible trajectory when its model and constraints are accurate |
| Sharp turns | Need deliberate geometry, velocity limits, and achievable handoffs | Generator can plan deceleration before the turn |
| Completion | Actual target/tolerance state | Often tied to trajectory or command time, depending on implementation |
| Runtime-created move | Lightweight, including a one-waypoint drive-to-pose | May require generation or pathfinding before following |

### Where BLine is useful

- Rapid empirical iteration when the team wants direct control over points and local limits.
- Paths that should wait for physical progress rather than a clock.
- Disturbance-prone movement where returning to the intended geometry matters.
- Runtime drive-to-pose or short generated paths.
- Teams that prefer a small set of inspectable controller and constraint concepts.

### Where its tradeoffs matter

- A sharp corner is not automatically slowed just because it is sharp. Add an appropriate range or review the optimizer output.
- A physically blocked robot may keep trying forever unless the command composition adds a timeout or fallback.
- The drawn polyline is not proof that the chassis can follow it at the requested acceleration.
- A large handoff radius can cut geometry; a small one can be impossible to enter at speed.
- The idealized editor simulation cannot predict wheel slip, battery voltage, module response, or localization error.
- End velocity is not a path constraint in v0.9.1.

!!! info "Hybrid routines are valid"
    A team can use BLine for disturbance-tolerant or precise geometric moves and another tool for a dynamics-optimized open-field trajectory. Choose per task rather than forcing one follower to solve every motion problem.

For the current workflows and guarantees of those alternatives, use the projects' own [PathPlanner documentation](https://pathplanner.dev/home.html) and [Choreo documentation](https://choreo.autos/). Do not assume one tool's terms or constraints map directly onto another's.

## The three controllers

| Controller | Error | Output role |
| --- | --- | --- |
| **Translation** | Remaining polyline distance | Translational speed magnitude toward the active target |
| **Rotation** | Heading error | Angular velocity |
| **Cross-track (CTE)** | Signed perpendicular distance from the active segment | Lateral correction added to the translation vector |

The translation output commonly saturates at the active maximum velocity for most of a long path. Its gain becomes most visible near the endpoint. This is why the recommended tuning order is translation, rotation, then CTE.

See [Tune Your Robot](../getting-started/tuning.md) for a measured workflow and plot interpretation.

## Localization is a separate layer

BLine accepts a `Pose2d` supplier and trusts it. It does not know whether the pose came from wheel odometry, AprilTags, a Limelight, PhotonVision, QuestNav, or another estimator.

- Bad scale or coordinate frames produce bad path tracking.
- Wheel slip changes odometry unless vision or another absolute measurement corrects it.
- A vision jump changes the pose seen by the follower; constraints limit how abruptly commanded speeds can react.
- Better localization improves both geometric and time-parameterized followers.

## Path following is not pathfinding

BLine follows the elements it receives. It does not currently choose a collision-free route around a new obstacle. An external pathfinder can generate translation points for BLine, but that planner owns obstacle geometry and route selection.

## Read the broader discussion

The FRC community has documented useful evidence and counterexamples for both approaches:

- [BLine announcement and field feedback](https://www.chiefdelphi.com/t/introducing-bline-a-new-rapid-polyline-autonomous-path-planning-suite/509778)
- [Time-parameterized path-following tradeoffs](https://www.chiefdelphi.com/t/time-parameterized-auto-path-following-has-huge-tradeoffs/518444)
- [Reflection on Choreo](https://www.chiefdelphi.com/t/reflection-on-choreo/464205)

Treat team reports as field experience, not controlled universal proof. Your robot, localization, game geometry, and available test time determine which tradeoffs matter most.

## Next

- [Path Elements](path-elements.md) explains the geometry.
- [Constraints & Ordinals](constraints.md) explains local motion limits.
- [Handoffs, t-ratio & Completion](key-parameters.md) explains progress transitions.
