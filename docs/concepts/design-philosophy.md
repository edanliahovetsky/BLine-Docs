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
7. Applies active velocity floors and ceilings, then limits the change from the prior commanded speeds with the active acceleration constraints.
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

For most intermediate targets that only shape a pass-through route, enable projection-based translation handoff and validate it on the robot. It keeps the handoff radius as one valid condition and adds a progress-based condition, which avoids forcing a robot that has passed a target to reverse toward a missed circle. BLine-Lib leaves the option off by default, so teams must enable it explicitly on the builder. Radius-only behavior remains useful for a deliberate must-enter gate, and neither policy replaces final-target tolerances.

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

- A sharp corner is not automatically slowed just because it is sharp. Add an appropriate maximum-velocity ranged constraint or review the optimizer output.
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

On a sufficiently long path with a well-tuned controller, the translation request commonly reaches the active maximum velocity before tapering near the endpoint. A low gain, a short path, or a drivetrain that cannot realize the request may never reach that ceiling. This is why tuning must compare remaining distance, requested speed, and measured drivetrain speed rather than assuming saturation.

Tune translation first, rotation second, and CTE last so each plot has one main unknown.

### Controller gains and constraints have different jobs

- **Controller gains** turn geometric error into a requested speed.
- **Maximum velocity** clips that request to an upper magnitude.
- **Maximum acceleration** limits the change from BLine's previous commanded velocity; it does not measure or close the loop on actual chassis acceleration.
- **Minimum velocity** can raise a small request to a configured floor while outside tolerance. It is an advanced controller-domain shaping tool for a demonstrated edge case, not a normal path default or a replacement for controller tuning, maximum-velocity planning, or deliberate command composition.
- **End tolerances** decide when positional and rotational error are acceptable. v0.9.1 does not also require low measured velocity before finishing.

The rate limiter makes the request consistent with configured command limits. Real acceleration and top speed still depend on battery voltage, motor control, gearing, mass, traction, mechanism motion, and contact with the field.

### Low velocity does not require low acceleration

Maximum velocity limits how fast the follower may command the robot. Maximum acceleration limits how quickly that command may change; it does not force the robot to accelerate at that rate on every loop. A slow first test can therefore use a low maximum velocity while retaining a high acceleration ceiling so the commanded speed can respond promptly when the PID asks it to brake near the endpoint.

Reducing maximum acceleration changes the controller's effective behavior because the final command can lag behind the PID request in both directions. Tune at the velocity and acceleration envelope you intend to deploy. If a path needs a lower acceleration to control slip or protect a mechanism, validate that complete path again rather than assuming the original endpoint response is preserved.

See [Tune Your Robot](../getting-started/tuning.md) for a measured workflow and plot interpretation.

## Localization is a separate layer

BLine accepts a `Pose2d` supplier and trusts it. It does not know whether the pose came from wheel odometry, AprilTags, a Limelight, PhotonVision, QuestNav, or another estimator.

- Bad scale or coordinate frames produce bad path tracking.
- Wheel slip changes odometry unless vision or another absolute measurement corrects it.
- Cameras are not required by BLine. Well-calibrated wheel odometry and a gyro may be sufficient for a short, controlled routine. Odometry-only teams should begin with lower velocity and acceleration and add faster, turn-heavy, or multi-segment motion incrementally so slip and drift remain observable.
- Vision-corrected localization is strongly recommended for longer routines, repeated direction changes, aggressive movement, teleoperated alignment, and recovery after contact. It is not a substitute for correct module calibration or odometry.
- A delayed or rejected vision measurement should be handled by the robot's pose estimator. BLine consumes the estimator's result; it does not fuse, gate, or assign uncertainty to measurements itself.
- A pose jump changes the progress seen by translation handoffs, rotation targets, and events. Constraints limit how abruptly commanded speeds can react, but they cannot undo an incorrect progress transition.
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
