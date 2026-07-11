# Versions & Support

Last source verification: **July 11, 2026**.

| Component | Documented baseline | Source |
| --- | --- | --- |
| BLine Web | `v0.1.0-alpha.11` (`d9ba47b`) | BLine Web release source |
| BLine-Lib | `v0.9.1` (`fbdc7bf` source; tagged release content) | `BLine-Lib.json` and Gradle project |
| WPILib | `2026.1.1` dependency baseline | BLine-Lib build configuration |
| Java | 17 | BLine-Lib build configuration |
| Current demo field | **REBUILT 2026** | BLine Web default field |

UI screenshots and GIFs in the current tutorial set were captured from BLine Web `d4bbe76` using the REBUILT 2026 field.

## Supported workflow

- Holonomic FRC drivetrains such as swerve and mecanum
- Java robot projects
- WPILib command-based integration
- Browser editor on a desktop-class browser
- BLine Web desktop prerelease builds for supported Windows, macOS, and Linux architectures

Mobile editing is currently marked as limited/buggy by BLine Web. Use a laptop or desktop for competition path authoring.

## Current limitations

- BLine-Lib does not provide C++ or Python robot libraries.
- BLine follows supplied geometry; it does not currently pathfind around obstacles.
- End constraints do not include nonzero desired end velocity or a final measured-velocity finish check.
- The editor simulator is idealized kinematics, not drivetrain physics or controller simulation.
- Collections, linked-element identities, custom fields, and optimizer metadata are editor-only; BLine-Lib loads individual runtime path/config JSON.
- BLine Web remains an alpha release. Keep exports under version control and retain project archives.

## Legacy editor

`BLine-GUI` is the previous PySide editor. Current BLine Web can import and migrate legacy path/autos data; re-export and verify it before deployment. Current UI documentation and media cover BLine Web, so legacy instructions are intentionally not mixed into task pages.

## Release verification checklist

When a BLine-Web or BLine-Lib version changes:

1. Review source-visible behavior and public APIs.
2. Update the baseline table and installation pins.
3. Re-test the First Path Tutorial.
4. Review every affected screenshot/GIF against the current public editor and latest FRC field.
5. Recheck JSON examples with Web-to-Lib IO/parity tests.
6. Update the logging-key reference from source.
7. Build the docs and PDF output.

Do not update a version number alone when the workflow or API changed with it.

## Authoritative links

- [BLine Web source and releases](https://github.com/edanliahovetsky/BLine-Web)
- [BLine-Lib source and releases](https://github.com/edanliahovetsky/BLine-Lib)
- [Generated BLine-Lib Javadocs](https://edanliahovetsky.github.io/BLine-Lib/)
- [BLine Chief Delphi discussion](https://www.chiefdelphi.com/t/introducing-bline-a-new-rapid-polyline-autonomous-path-planning-suite/509778)
