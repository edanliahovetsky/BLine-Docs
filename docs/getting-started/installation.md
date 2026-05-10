# Installation

BLine has two pieces: the **editor** for designing paths on a desktop or in the browser, and the **Java library** that runs path-following on your robot. They are independent — install whichever pieces your workflow needs.

!!! tip "Which do I install?"
    - **Visual workflow** → use BLine Web or install the desktop editor, plus the library.
    - **JSON-only workflow** → install only the library and hand-author JSON in `deploy/autos/paths/`.
    - **Code-only workflow** → install only the library and build `Path` objects in Java.

---

## BLine Web Editor

### Option 1: Prebuilt Binaries (recommended)

Use the [hosted browser editor](https://bline-web.pages.dev/) or download the desktop build for your platform. Current public desktop builds are pre-release; stable channel links will resolve once the first stable BLine Web release is published.

=== "Windows"

    Download [Windows x64](https://bline-metrics.edan-liahovetsky.workers.dev/d/web/prerelease/windows-x64?source=docs-prerelease).

    1. Run the downloaded installer or bundle.
    2. Follow the wizard.
    3. Launch BLine from the Start Menu.

    The bundles are fully self-contained — no Python install required.

    !!! note "Windows Defender / antivirus"
        The current Windows binaries are unsigned. On a clean Defender install they have not been flagged in testing, but third-party AV may occasionally false-positive. If that happens, either whitelist BLine or use the hosted browser editor instead.

=== "macOS"

    Download one of:

    - [macOS Apple Silicon](https://bline-metrics.edan-liahovetsky.workers.dev/d/web/prerelease/macos-aarch64?source=docs-prerelease)
    - [macOS Intel](https://bline-metrics.edan-liahovetsky.workers.dev/d/web/prerelease/macos-x64?source=docs-prerelease)

    Open the downloaded app bundle or DMG and move BLine to your Applications folder if prompted.

=== "Linux"

    Download [Linux x64](https://bline-metrics.edan-liahovetsky.workers.dev/d/web/prerelease/linux-x64?source=docs-prerelease).

    1. Save the downloaded file.
    2. Make it executable and run it:
       ```bash
       chmod +x BLine-*.AppImage
       ./BLine-*.AppImage
       ```

    No system dependencies required.

If a platform link is temporarily unavailable, use the [BLine Web GitHub Releases page](https://github.com/edanliahovetsky/BLine-Web/releases/latest) as the direct fallback.

### Option 2: Legacy BLine-GUI from Source (Python package)

Use this if you specifically need the legacy PySide6 GUI from `BLine-GUI`.

**Quick install (any platform with `pipx`):**

```bash
pipx install git+https://github.com/edanliahovetsky/BLine-GUI.git
bline
```

To create a desktop shortcut with the BLine icon after installation:

```bash
bline --create-shortcut
```

??? info "Don't have pipx yet? Platform-specific setup"

    === "Windows"

        ```powershell
        pip install pipx
        pipx ensurepath
        # restart your terminal
        pipx install git+https://github.com/edanliahovetsky/BLine-GUI.git
        ```

        **PySide6 build error?** Install Python 3.11 or 3.12 from [python.org](https://www.python.org/downloads/windows/) and specify it:

        ```powershell
        py -3.12 -m pip install --upgrade pip pipx
        py -3.12 -m pipx ensurepath
        py -3.12 -m pipx install git+https://github.com/edanliahovetsky/BLine-GUI.git
        ```

    === "macOS"

        ```bash
        brew install pipx
        pipx ensurepath
        pipx install git+https://github.com/edanliahovetsky/BLine-GUI.git
        ```

    === "Linux"

        ```bash
        # Debian/Ubuntu
        sudo apt install pipx
        # Fedora
        sudo dnf install pipx
        # Arch
        sudo pacman -S python-pipx

        pipx ensurepath
        pipx install git+https://github.com/edanliahovetsky/BLine-GUI.git
        ```

        **PySide6 build error?** Pin Python 3.11 or 3.12:

        ```bash
        pipx install --python python3.12 git+https://github.com/edanliahovetsky/BLine-GUI.git
        ```

### Updating the Editor

```bash
# If you installed via a prebuilt BLine Web binary:
# download the desired desktop channel build and reinstall.

# If you installed via pipx:
pipx upgrade bline

# If you installed via pip in a venv:
pip install --upgrade git+https://github.com/edanliahovetsky/BLine-GUI.git
```

??? warning "`pipx upgrade bline` fails on Windows"
    This happens when pipx is pointing at a moved/updated Python install. Recreate the venv:

    ```powershell
    pipx reinstall bline
    # or
    pipx uninstall bline
    pipx install git+https://github.com/edanliahovetsky/BLine-GUI.git
    ```

### Uninstalling the Legacy GUI

```bash
# pipx
pipx uninstall bline

# pip: just delete the venv / folder you created
```

---

## BLine-Lib

BLine-Lib is distributed as a WPILib vendor library via JitPack. The current release is **v0.8.4**.

### Option 1: Vendor JSON (recommended)

BLine-Lib's recommended WPILib vendor URL is the BLine Metrics Worker endpoint.
It serves the current vendor JSON and lets the project count aggregate install
interest without public-user cookies.

1. Open VS Code with your FRC robot project.
2. Press `Ctrl+Shift+P` (`Cmd+Shift+P` on macOS).
3. Run **WPILib: Manage Vendor Libraries**.
4. Select **Install new libraries (online)**.
5. Paste the recommended vendor URL:

    ```
    https://bline-metrics.edan-liahovetsky.workers.dev/vendor/BLine-Lib.json
    ```

WPILib will download the vendor JSON and pin it to your project. To update to a newer version later, re-run the command and paste the same URL.

If the Worker URL is temporarily unavailable, use the direct GitHub vendor JSON
as the fallback:

```text
https://raw.githubusercontent.com/edanliahovetsky/BLine-Lib/main/BLine-Lib.json
```

### Option 2: Gradle (JitPack)

If you prefer explicit Gradle configuration, add JitPack and pin the version in `build.gradle`:

```gradle
repositories {
    maven { url 'https://jitpack.io' }
}

dependencies {
    implementation 'com.github.edanliahovetsky:BLine-Lib:v0.8.4'
}
```

Pin an exact version tag in a season. Using `main-SNAPSHOT` is only appropriate during off-season experimentation.

### Verifying the install

After the vendor JSON is picked up (it can take a Gradle sync), the following import should resolve:

```java
import frc.robot.lib.BLine.*;
```

If you see `Unresolved dependency: com.github.edanliahovetsky:BLine-Lib:…`, refresh Gradle. If it still fails, double-check the version tag exists on the [releases page](https://github.com/edanliahovetsky/BLine-Lib/releases).

### Requirements

- Java 17 (the current WPILib toolchain)
- WPILib 2026.x
- A holonomic drivetrain (swerve, mecanum, etc.). BLine expects robot-relative `ChassisSpeeds` in and out; any holonomic chassis exposing those primitives will work.

---

## Next Steps

- [Quick Start](quick-start.md) — build your first path and wire up `FollowPath`.
- [GUI Overview](../gui/index.md) — tour the visual editor.
- [Path Elements](../concepts/path-elements.md) — the language of BLine paths.
