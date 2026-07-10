# BLine

Build, test, and tune geometric autonomous paths for FRC holonomic drivetrains.

[Start with your first path](getting-started/prerequisites.md){ .md-button .md-button--primary }
[Open BLine Web](https://bline-web.pages.dev/){ .md-button }

![BLine Web editing a path on the current FRC field](assets/images/editor-overview.png)

## A path workflow from editor to robot

| Component | What you do there |
| --- | --- |
| **BLine Web** | Draw and organize paths, apply constraints, preview idealized motion, and export robot-ready JSON. |
| **BLine-Lib** | Load paths in Java, follow them from the live robot pose, run events, transform for alliance/side, and publish diagnostics. |

The current documentation is verified against **BLine Web v0.1.0-alpha.10** and **BLine-Lib v0.9.1**. See [Versions & Support](reference/versions.md).

## Choose your route

| Goal | Start here |
| --- | --- |
| Get one path running | [First Path Tutorial](getting-started/quick-start.md) |
| Understand the approach | [How BLine Works](concepts/design-philosophy.md) |
| Tune a real robot | [Tune Your Robot](getting-started/tuning.md) |
| Learn the current editor | [BLine Web Overview](gui/index.md) |
| Integrate the Java library | [BLine-Lib Overview](lib/index.md) |
| Diagnose a failure | [Common Issues](common-issues.md) |

## What makes BLine different

BLine follows current geometric progress rather than asking the robot to match a timestamped trajectory state. Every control loop uses the live pose, remaining polyline distance, active target, constraints, and cross-track error.

That makes physical progress—not a clock—the source of truth. It can be easier to tune and more tolerant of delays or disturbances, but it does not prove that every drawn turn is dynamically feasible. Teams still need accurate localization, sensible velocity/acceleration limits, achievable handoff radii, and an intentional timeout or fallback policy for a physically blocked robot.

Read [Geometric and time-parameterized tracking](concepts/design-philosophy.md#geometric-and-time-parameterized-tracking) for a balanced explanation of when each approach fits.

## Learn by building

The recommended progression is:

1. Verify pose and drivetrain frames.
2. Create one straight path on the latest FRC field.
3. Export and load it on the robot.
4. Wire logs before changing controller gains.
5. Tune translation, rotation, then cross-track control.
6. Shape competition paths with constraints and handoff radii.
7. Add collections, linked elements, events, overrides, and other advanced features.

## Project links

- [BLine Web](https://github.com/edanliahovetsky/BLine-Web) — current browser and desktop editor
- [BLine-Lib](https://github.com/edanliahovetsky/BLine-Lib) — Java robot library and Javadocs
- [Chief Delphi discussion](https://www.chiefdelphi.com/t/introducing-bline-a-new-rapid-polyline-autonomous-path-planning-suite/509778) — questions, field experience, releases, and community feedback
- [Full Javadocs](https://edanliahovetsky.github.io/BLine-Lib/) — generated API detail

BLine is open source under the BSD 3-Clause License.
