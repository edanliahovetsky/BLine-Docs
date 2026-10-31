# Versions & Support

Editor tutorial source verification: **July 24, 2026**. Editor release check: **October 31, 2026**. Library source verification: **September 28, 2026**. Preview revisions are identified separately below.

| Component | Documented baseline | Source |
| --- | --- | --- |
| BLine Web | Current release `v1.0.0` (`6351d6b`); tutorials and visuals `v0.1.0-alpha.12` (`5089393`) | BLine Web release source |
| BLine-Lib | `v0.9.2` (`c88adfd`) | `BLine-Lib.json` and Gradle project |
| WPILib | `2026.1.1` dependency baseline | BLine-Lib build configuration |
| Java | 17 | BLine-Lib build configuration |
| Current demo field | **REBUILT 2026** | BLine Web default field |

UI screenshots and GIFs in the current tutorial set were captured from BLine Web `d4bbe76` using the REBUILT 2026 field.

## Separate 2027 previews

### Robot library

BLine-Lib **`v2027.0.0-beta.3`** (source `4402250`) targets **WPILib `2027.0.0-alpha-7` and Java 25**. Use its [separate installation instructions](../getting-started/installation.md#wpilib-2027-beta) and [versioned setup and migration guide](https://github.com/edanliahovetsky/BLine-Lib/blob/v2027.0.0-beta.3/WPILIB_2027.md). The library tutorials and API reference elsewhere on this site describe the stable 2026 line. The beta guide and its packaged Javadoc describe the 2027 API; the hosted Javadoc remains stable-only.

## BLine Web 1.0

BLine Web **v1.0.0** is the 2027 editor. It is hosted at [bline.run](https://bline.run/), and upcoming versions are previewed at [beta.bline.run](https://beta.bline.run/). The former `bline-web.pages.dev` and `web-beta.bline-web.pages.dev` addresses move a browser's saved projects to bline.run once and then redirect; see [Installation](../getting-started/installation.md#browser).

The tutorials and existing editor visuals on this site still describe alpha.12. The [2027 Beta 2](../beta/2027-beta-2.md) (`v1.0.0-beta.2`, source revision `b12be8e`) and [Beta 1](../beta/2027-beta-1.md) (`v1.0.0-beta.1`) guides describe the 2027 changes, including project event keys, Settings lessons, filenames, save recovery, and storage boundaries.

BLine-Lib v0.9.2 loads paths exported by v1.0.0. Settings added in the 2027 editor, tank drive direction and **Progress** handoffs, take effect only with the 2027 robot library above.

## Supported workflow

- Holonomic FRC drivetrains such as swerve and mecanum
- Java robot projects
- WPILib command-based integration
- Browser editor on a desktop-class browser
- BLine Web desktop builds for supported Windows, macOS, and Linux architectures

Mobile editing is currently marked as limited/buggy by BLine Web. Use a laptop or desktop for competition path authoring.

## Current stable limitations

- BLine-Lib does not provide C++ or Python robot libraries.
- BLine follows supplied geometry; it does not currently pathfind around obstacles.
- End constraints do not include nonzero desired end velocity or a final measured-velocity finish check.
- The editor simulator is idealized kinematics, not drivetrain physics or controller simulation.
- Collections, linked-element identities, custom fields, and optimizer metadata are editor-only; BLine-Lib loads individual runtime path/config JSON.
- Keep editor exports under version control and retain project archives.

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
