# Installation

BLine consists of two components: the **GUI** for visual path planning, and the **Library** for path following on your robot. Install whichever components fit your workflow.

## BLine-GUI Installation

### Prebuilt Binaries (Recommended)

Download the latest release for your platform from the [**Releases page**](https://github.com/edanliahovetsky/BLine-GUI/releases/latest).

=== "Windows"

    **Installer (Recommended)**
    
    1. Download `BLine-{version}-Setup.exe`
    2. Run the installer and follow the wizard
    3. Launch BLine from the Start Menu
    
    **Portable (No Installation)**
    
    1. Download `BLine-{version}-Windows-Portable.zip`
    2. Extract anywhere
    3. Run `BLine.exe`
    
    No Python installation required—everything is bundled!

=== "Linux"

    **AppImage (All Distributions)**
    
    1. Download `BLine-x86_64.AppImage`
    2. Make it executable:
       ```bash
       chmod +x BLine-x86_64.AppImage
       ```
    3. Run it:
       ```bash
       ./BLine-x86_64.AppImage
       ```
    
    No installation or dependencies required!

=== "macOS"

    macOS builds are not currently available as prebuilt binaries. See **Install from Source** below.

### Install from Source

If you prefer to install via Python package or need the latest development version:

**Quick Install (all platforms):**

```bash
pipx install git+https://github.com/edanliahovetsky/BLine-GUI.git
```

Then run `bline` from anywhere.

??? info "Don't have pipx? Platform-specific instructions"

    === "Windows"
    
        ```powershell
        # Install pipx (one-time setup)
        pip install pipx
        pipx ensurepath
        
        # Restart your terminal, then install BLine
        pipx install git+https://github.com/edanliahovetsky/BLine-GUI.git
        ```
        
        **Troubleshooting:** If you get a PySide6 build error, install Python 3.11 or 3.12 from [python.org](https://www.python.org/downloads/windows/) and specify it:
        
        ```powershell
        py -3.12 -m pip install --upgrade pip pipx
        py -3.12 -m pipx ensurepath
        py -3.12 -m pipx install git+https://github.com/edanliahovetsky/BLine-GUI.git
        ```
    
    === "macOS"
    
        ```bash
        # Install Homebrew if needed
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Install pipx and BLine
        brew install pipx
        pipx ensurepath
        pipx install git+https://github.com/edanliahovetsky/BLine-GUI.git
        ```
    
    === "Linux"
    
        ```bash
        # Install pipx
        # Debian/Ubuntu:
        sudo apt install pipx
        
        # Fedora:
        sudo dnf install pipx
        
        # Arch:
        sudo pacman -S python-pipx
        
        # Install BLine
        pipx ensurepath
        pipx install git+https://github.com/edanliahovetsky/BLine-GUI.git
        ```
        
        **Troubleshooting:** If you get a PySide6 build error, specify Python 3.11 or 3.12:
        
        ```bash
        pipx install --python python3.12 git+https://github.com/edanliahovetsky/BLine-GUI.git
        ```

### Updating the GUI

```bash
# If you used pipx:
pipx upgrade bline

# If you used pip (with venv activated):
pip install --upgrade git+https://github.com/edanliahovetsky/BLine-GUI.git
```

??? warning "If `pipx upgrade bline` fails on Windows"
    This can happen if pipx is pointing at a moved/updated Python install. Try:
    
    ```powershell
    # Recreate the pipx venv for bline
    pipx reinstall bline
    
    # Or remove + install fresh
    pipx uninstall bline
    pipx install git+https://github.com/edanliahovetsky/BLine-GUI.git
    ```

### Uninstalling the GUI

```bash
# If you used pipx:
pipx uninstall bline

# If you used pip:
# Just delete the BLine folder you created
```

---

## BLine-Lib Installation

### Using Vendor JSON (Recommended)

1. Open VS Code with your FRC project
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type **"WPILib: Manage Vendor Libraries"**
4. Select **"Install new libraries (online)"**
5. Paste this URL:

```
https://raw.githubusercontent.com/edanliahovetsky/BLine-Lib/main/BLine-Lib.json
```

### Using Gradle (Alternative)

Add JitPack repository to your `build.gradle`:

```gradle
repositories {
    maven { url 'https://jitpack.io' }
}
```

Add the dependency:

```gradle
dependencies {
    implementation 'com.github.edanliahovetsky:BLine-Lib:0.4.0'
}
```

---

## Recommended Usage Modes

There are three recommended ways to use BLine, depending on your team's workflow:

| Mode | Description | Components Needed |
|------|-------------|-------------------|
| **Full Stack** | Visual path planning with JSON export | GUI + Lib |
| **JSON Primary** | Define paths directly in JSON files | Lib only |
| **Code Only** | Define all paths programmatically in Java | Lib only |

Choose the approach that best fits your team's preferences and workflow!

