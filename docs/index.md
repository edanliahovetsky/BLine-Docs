# BLine

**BLine** is an open-source path generation and tracking suite for FRC **holonomic drivetrains** (swerve, mecanum, etc.), built by students for students. It prioritizes simplicity, easy tuning, and excellent real-time performance, trading theoretical optimality for practical tunability and iteration speed.

BLine was created by **FRC Team 2638 (Rebel Robotics)**.

![Robot Demo](assets/gifs/robot-demos/cone-demo.gif)

## The BLine Suite

BLine ships as two cooperating components:

| Component | Purpose | Repository |
|-----------|---------|------------|
| **BLine-GUI** | Visual path editor with live simulation preview. Paths are saved as JSON. | [edanliahovetsky/BLine-GUI](https://github.com/edanliahovetsky/BLine-GUI) |
| **BLine-Lib** | Java library for the robot. Loads paths (JSON or code), runs the path-following command. | [edanliahovetsky/BLine-Lib](https://github.com/edanliahovetsky/BLine-Lib) |

You can use both together, use the library with hand-written JSON, or build paths entirely in code. All three are first-class workflows — see [Quick Start](getting-started/quick-start.md).

## Key Features

- **Polyline paths.** Paths are sequences of connected straight-line segments instead of Bézier curves. Simple, visual, fast to edit.
- **Path elements.** Three types — `Waypoint` (position + rotation), `TranslationTarget` (position only), `RotationTarget` (rotation only). Plus `EventTrigger` for firing actions mid-path.
- **Handoff radii + velocity limiting.** Per-element handoff radii and ranged velocity/acceleration constraints control robot behavior through turns and intermediate elements.
- **Forgiving PID tuning.** The translation controller minimizes *remaining path distance*, not time. Optimally and sub-optimally tuned controllers differ only near the end of the path — about 5 minutes of tuning usually gets you there.
- **Real-time path creation.** No precomputation; paths are followed the instant they are constructed. Well-suited to on-the-fly teleop auto-align and dynamic autonomous.
- **Alliance flipping and mirroring.** Built-in helpers for the opposite-alliance side (rotational symmetry) and for the field-width centerline (horizontal mirror).
- **Event triggers.** Register a `Runnable` or WPILib `Command` against a key, then place `EventTrigger` elements in paths to fire at a specific t-ratio along a segment.
- **AdvantageKit-friendly logging.** The follower pushes a rich set of keys (target indices, remaining distance, controller outputs, handoff state, event-trigger progress) through pluggable consumers.

## Why Polylines?

A Bézier-based path follower must discretize the trajectory into timestamped setpoints and then chase the clock. Two things get hard:

1. **Tuning.** You are tuning *follow the clock*, not *reach the point*. Under-tuned gains fall behind and never recover; over-tuned gains jitter.
2. **Robustness.** If the robot is bumped or pushed off course, a time-parameterized follower keeps marching along its schedule. P2P-style followers work the position domain directly and tend to recover more gracefully.

BLine sets the translation controller's setpoint to the path endpoint (via remaining-distance error) and applies velocity/acceleration limits on the controller output. The robot hits max velocity irrespective of drivetrain tuning, and the only tuning that really matters is the deceleration near the end of the path.

For the full argument, see [Design Philosophy](concepts/design-philosophy.md).

## Performance

Monte-Carlo simulation validation (WPILib physics sim, Theta\* initial pathfinding, Artificial Bee Colony optimizer benchmarking against PathPlanner):

- **97% reduction** in path computation time
- **66% reduction** in cross-track error at waypoints
- **2.6% increase** in total path tracking time (negligible; measured with an idealized time-parameterized controller — likely flips sign in the real world where tuning is never ideal)

[Read the Full White Paper →](https://docs.google.com/document/d/1Tc87YKWHtsEMEvmVDBD1Ww4e7vIUO2FyK3lwwuf-ZL4/edit?usp=sharing)

## Quick Links

- [Installation](getting-started/installation.md) — Install the GUI and/or library
- [Quick Start](getting-started/quick-start.md) — Follow your first path end-to-end
- [Path Elements](concepts/path-elements.md) — Waypoints, translation targets, rotation targets, event triggers
- [Tuning & Usage Tips](usage-tips.md) — PID tuning order, tolerances, handoff radii, real-world tips
- [Common Issues](common-issues.md) — Field-tested fixes for the things that bite teams
- [API Reference](lib/api-reference.md) — Library surface at a glance

## External Resources

- **[BLine-Lib on GitHub](https://github.com/edanliahovetsky/BLine-Lib)** — Java library source
- **[BLine-GUI on GitHub](https://github.com/edanliahovetsky/BLine-GUI)** — GUI source and releases (incl. Windows/Linux/macOS binaries)
- **[Full Javadoc](https://edanliahovetsky.github.io/BLine-Lib/)** — Generated API reference
- **[Chief Delphi Thread](https://www.chiefdelphi.com/t/introducing-bline-a-new-rapid-polyline-autonomous-path-planning-suite/509778)** — Discussion, release notes, community tips

## License

BLine is released under the BSD 3-Clause License.
