# Installation

For the usual visual workflow, open BLine Web and install BLine-Lib in the robot project. The editor and robot library are separate: editing a path does not require robot code, and code-generated paths do not require the editor.

## 1. Open BLine Web

### Browser

Open [bline-web.pages.dev](https://bline-web.pages.dev/) in a desktop-class browser. No installation is required.

The browser editor stores projects in browser-local persistent storage. Use **Project → Import / Export → Export Autos Folder…** to produce robot-ready files and **Export Project Archive…** for a portable editor backup.

!!! warning "Do not rely on browser storage as your only copy"
    Browser data belongs to that browser profile and site origin. Export the project into version control regularly.

### Desktop

The desktop build can edit an FRC repository or `autos` folder directly. These downloads are pinned to the current editor, **v0.1.0-alpha.12**, which matches this tutorial. For the separate 2027 preview, see the [Beta 2 guide](../beta/2027-beta-2.md).

=== "Windows"

    [Download Windows x64](https://bline-metrics.edan-liahovetsky.workers.dev/d/web/v0.1.0-alpha.12/windows-x64?source=docs-current)

=== "macOS"

    - [Apple Silicon](https://bline-metrics.edan-liahovetsky.workers.dev/d/web/v0.1.0-alpha.12/macos-aarch64?source=docs-current)
    - [Intel](https://bline-metrics.edan-liahovetsky.workers.dev/d/web/v0.1.0-alpha.12/macos-x64?source=docs-current)

=== "Linux"

    [Download Linux x64](https://bline-metrics.edan-liahovetsky.workers.dev/d/web/v0.1.0-alpha.12/linux-x64?source=docs-current)

Use the [v0.1.0-alpha.12 release assets](https://github.com/edanliahovetsky/BLine-Web/releases/tag/v0.1.0-alpha.12) if a download link is unavailable. BLine Web currently warns that mobile support is limited; use a laptop or desktop for path authoring.

When the desktop app asks for a folder, choose either:

- the robot repository root, if it contains `src/main/deploy`; or
- `src/main/deploy/autos` directly.

The app resolves a selected robot repository to `src/main/deploy/autos` and creates missing `config.json`, `paths/`, and editor metadata as needed.

## 2. Install BLine-Lib

The current robot-library release is **v0.9.1** for WPILib 2026 and Java 17.

### Vendor JSON

1. Open the FRC robot project in WPILib VS Code.
2. Open the Command Palette with `Ctrl+Shift+P` or `Cmd+Shift+P`.
3. Run **WPILib: Manage Vendor Libraries**.
4. Choose **Install new libraries (online)**.
5. Paste:

```text
https://bline-metrics.edan-liahovetsky.workers.dev/vendor/BLine-Lib.json
```

If that endpoint is unavailable, use the direct source file:

```text
https://raw.githubusercontent.com/edanliahovetsky/BLine-Lib/main/BLine-Lib.json
```

Both URLs describe the same current release. Reinstall from the same URL when upgrading the pinned vendor dependency.

### Gradle alternative

Add JitPack and pin the release tag:

```gradle
repositories {
    maven { url 'https://jitpack.io' }
}

dependencies {
    implementation 'com.github.edanliahovetsky:BLine-Lib:v0.9.1'
}
```

Use an exact tag in a competition project. A snapshot of `main` can change without warning.

## 3. Verify the library

This import should resolve after Gradle refreshes:

```java
import frc.robot.lib.BLine.*;
```

Build the robot project before proceeding. If the dependency does not resolve, see [Common Issues](../common-issues.md#the-bline-lib-dependency-does-not-resolve).

## Legacy BLine-GUI

??? info "Maintaining an older PySide project"
    `BLine-GUI` is the legacy editor. Current BLine Web can import and migrate legacy path/autos data; re-export and verify the result before deploying it. New tutorials and visuals document BLine Web. See the [legacy repository](https://github.com/edanliahovetsky/BLine-GUI) only when maintaining that older workflow.

## Next

Continue with [First Path Tutorial](quick-start.md) to configure the editor, export a path, wire the drivetrain, and run it safely.
