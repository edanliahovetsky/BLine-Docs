# BLine

**BLine** is an open-source path generation and tracking suite designed for **holonomic drivetrains** (swerve, mecanum, etc.) made by students for students. It's built around simplicity and performance in time-constrained environments where quick iteration and rapid empirical testing prove advantageous.

BLine offers the advantages of simplicity, easy tunability, and excellent real time performance while performing at a the same (or potentially better) level as other autonomous solutions. 

![Robot Demo](assets/gifs/robot-demos/cone-demo.gif)

## The BLine Suite

BLine consists of two main components that work together:

### GUI - Visual Path Planning

**BLine-GUI** is a visual path planning interface for designing and editing autonomous paths with real-time simulation preview.

[Go to GUI Documentation →](gui/index.md)

### Library - Path Following

**BLine-Lib** is a Java library for FRC robots that loads paths and provides the path-following algorithm for your drivetrain.

[Go to Library Documentation →](lib/index.md)

## Quick Links

- [Installation](getting-started/installation.md) — Get BLine set up on your system
- [Quick Start](getting-started/quick-start.md) — Create and follow your first path
- [Core Concepts](concepts/path-elements.md) — Understand path elements, constraints, and parameters
- [API Reference](lib/api-reference.md) — Full Java API documentation

## External Resources

- [BLine-Lib on GitHub](https://github.com/edanliahovetsky/BLine-Lib)
- [BLine-GUI on GitHub](https://github.com/edanliahovetsky/BLine-GUI)
- [Full Javadoc](https://edanliahovetsky.github.io/BLine-Lib/)
- [Chief Delphi Discussion Thread](https://www.chiefdelphi.com/t/introducing-bline-a-new-rapid-polyline-autonomous-path-planning-suite/509778)

## Performance

BLine has been validated through extensive testing with a WPILib physics simulation, utilizing Theta* for initial pathfinding and an Artificial Bee Colony (ABC) optimizer to benchmark the system against PathPlanner.

**Quantitative Results** from randomized Monte Carlo trials:

- **97% reduction** in path computation time
- **66% reduction** in cross-track error at waypoints
- Negligible **2.6% decrease** in total path tracking time compared to PathPlanner

[Read the Full White Paper](https://docs.google.com/document/d/1Tc87YKWHtsEMEvmVDBD1Ww4e7vIUO2FyK3lwwuf-ZL4/edit?usp=sharing)

## License

BLine is released under the BSD 3-Clause License.

