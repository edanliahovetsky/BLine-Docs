# Installation

BLine has two pieces: the **GUI** for designing paths on a desktop, and the **Java library** that runs path-following on your robot. They are independent — install whichever pieces your workflow needs.

!!! tip "Which do I install?"
    - **Visual workflow** → install both the GUI and the library.
    - **JSON-only workflow** → install only the library and hand-author JSON in `deploy/autos/paths/`.
    - **Code-only workflow** → install only the library and build `Path` objects in Java.

---

## BLine-GUI

### Option 1: Prebuilt Binaries (recommended)

Download the latest release for your platform from the [**BLine-GUI Releases page**](https://github.com/edanliahovetsky/BLine-GUI/releases/latest).

=== "Windows"

    BLine-GUI publishes both an installer and a portable ZIP.

    **Installer**

    1. Download `BLine-{version}-Setup.exe`.
    2. Run it and follow the wizard.
    3. Launch BLine from the Start Menu.

    **Portable**

    1. Download `BLine-{version}-Windows-Portable.zip`.
    2. Extract anywhere.
    3. Run `BLine.exe`.

    The bundles are fully self-contained — no Python install required.

    !!! note "Windows Defender / antivirus"
        The current Windows binaries are unsigned. On a clean Defender install they have not been flagged in testing, but third-party AV may occasionally false-positive. If that happens, either whitelist BLine or install from source instead (see Option 2).

=== "macOS"

    **DMG (Apple Silicon)**

    1. Download `BLine-{version}-macOS-arm64.dmg`.
    2. Open the DMG and drag BLine to your Applications folder.
    3. Launch BLine from Applications.

    macOS builds were added in **BLine-GUI v0.5.0**. If you are on older Intel Macs or want the very latest `main`, install from source (Option 2) instead.

=== "Linux"

    **AppImage (all distributions)**

    1. Download `BLine-x86_64.AppImage`.
    2. Make it executable and run it:
       ```bash
       chmod +x BLine-x86_64.AppImage
       ./BLine-x86_64.AppImage
       ```

    No system dependencies required.

### Option 2: Install from Source (Python package)

Use this if you want the latest `main`, need an unsupported platform/architecture, or prefer a pip-managed install.

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

### Updating the GUI

```bash
# If you installed via a prebuilt binary:
# download the latest release and reinstall.

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

### Uninstalling the GUI

```bash
# pipx
pipx uninstall bline

# pip: just delete the venv / folder you created
```

---

## BLine-Lib

BLine-Lib is distributed as a WPILib vendor library via JitPack. The current release is **v0.8.4**.

### Option 1: Vendor JSON (recommended)

1. Open VS Code with your FRC robot project.
2. Press `Ctrl+Shift+P` (`Cmd+Shift+P` on macOS).
3. Run **WPILib: Manage Vendor Libraries**.
4. Select **Install new libraries (online)**.
5. Paste:

    ```
    https://raw.githubusercontent.com/edanliahovetsky/BLine-Lib/main/BLine-Lib.json
    ```

WPILib will download the vendor JSON and pin it to your project. To update to a newer version later, re-run the command and paste the same URL.

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
