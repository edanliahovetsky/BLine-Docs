# Menu Bar

The menu bar provides access to all major application functions for project management, path editing, and configuration.

=== "Project Menu"

    | Action | Shortcut | Description |
    |--------|----------|-------------|
    | **Open Project…** | - | Select and open a BLine project directory containing `paths/` and `config.json` |
    | **Recent Projects** | - | Quick access to recently opened project directories |

=== "Path Menu"

    | Action | Shortcut | Description |
    |--------|----------|-------------|
    | **Current: [Path Name]** | - | Shows the currently loaded path file (read-only display) |
    | **Load Path** | - | Submenu showing all available `.json` path files in the project |
    | **Create New Path** | - | Start a fresh path with no elements |
    | **Save Path As…** | - | Save the current path to a new `.json` file in the project |
    | **Rename Path…** | - | Rename the current path file |
    | **Delete Paths…** | - | Select and delete one or more path files from the project |

=== "Edit Menu"

    | Action | Shortcut | Description |
    |--------|----------|-------------|
    | **Undo** | `Ctrl+Z` | Undo the last action |
    | **Redo** | `Ctrl+Y` / `Ctrl+Shift+Z` | Redo the previously undone action |

=== "Settings Menu"

    | Action | Shortcut | Description |
    |--------|----------|-------------|
    | **Edit Config…** | - | Open the robot configuration editor |

    | Setting | Description |
    |---------|-------------|
    | **Default Max Velocity** | Global velocity limit (m/s) |
    | **Default Max Acceleration** | Global acceleration limit (m/s²) |
    | **Default Max Rotational Velocity** | Global angular velocity limit (deg/s) |
    | **Default Max Rotational Acceleration** | Global angular acceleration limit (deg/s²) |
    | **Default Handoff Radius** | Default radius for new elements (m) |
    | **End Translation Tolerance** | Path completion position tolerance (m) |
    | **End Rotation Tolerance** | Path completion rotation tolerance (deg) |

    These settings are saved to `config.json` in your project and used by BLine-Lib when loading paths.

!!! warning "Robot Config Workflow"
    **Always configure your robot settings before creating paths.**

    Robot configuration changes are saved directly to `config.json` in your project's `/deploy/autos` directory. Make sure your robot parameters are correct before designing any paths.