# Menu Bar

The menu bar is the entry point for project management, path operations, undo/redo, and robot configuration.

## Project

| Action | Description |
|--------|-------------|
| **Open Project…** | Select a BLine project directory (any directory with `config.json` + a `paths/` subfolder). Typically your robot project's `src/main/deploy/autos`. |
| **Recent Projects** | Quick access to recently opened project directories. |

!!! tip "Always point BLine at your robot project's `autos/` directory"
    The GUI reads and writes the same JSON files BLine-Lib loads at runtime. There's no "export to robot" step — saving is the export.

## Path

| Action | Description |
|--------|-------------|
| **Current: [name]** | Shows the currently loaded path (read-only label). |
| **Load Path ▸** | Submenu listing every `.json` file under `paths/`. Click to load. |
| **Create New Path** | Starts a fresh path with zero elements. Save As… when ready. |
| **Save Path As…** | Write the current path to a new `.json` file under `paths/`. |
| **Rename Path…** | Rename the current path's `.json` file. |
| **Delete Paths…** | Multi-select delete dialog across the project's paths. |

## Edit

| Action | Shortcut | Description |
|--------|----------|-------------|
| **Undo** | `Ctrl/Cmd + Z` | Undo the last action. |
| **Redo** | `Ctrl/Cmd + Y` / `Ctrl/Cmd + Shift + Z` | Redo the last undone action. |

The undo stack covers element moves, rotations, additions, deletions, reorders, constraint edits, and type conversions. Trivial actions like simple element selections are coalesced so a plain click doesn't create a spurious undo entry (v0.4.0+).

## Settings

**Settings → Edit Config…** opens the project configuration dialog. Values are saved to `config.json` as you edit them — click **OK** to accept or **Cancel** to revert.

The dialog is organized into two groups:

### GUI

These fields affect only the GUI's visual rendering. BLine-Lib ignores them.

| Field | Units | Description |
|-------|-------|-------------|
| **Robot Length (m)** | meters | Length used to draw the simulated robot footprint. |
| **Robot Width (m)** | meters | Width used to draw the simulated robot footprint. |
| **Enable Protrusions** | bool | Turn the protrusion rendering system on. See [Protrusions](protrusions.md). |
| **Protrusion Distance (m)** | meters | How far the protrusion extends from the robot perimeter. |
| **Protrusion Side** | enum | `none` / `left` / `right` / `front` / `back`. |
| **Default Protrusion State** | enum | `shown` / `hidden` — the state each element uses unless overridden by event keys. |
| **Show On Event Keys** | csv | Event-trigger keys that flip protrusions to **shown** during sim. |
| **Hide On Event Keys** | csv | Event-trigger keys that flip protrusions to **hidden** during sim. |

!!! info "Why robot size/protrusions are GUI-only"
    BLine-Lib does its own tracking math — it doesn't need to know the robot's bumper perimeter. The dialog fields only control what the canvas draws. That means the size and protrusion configuration cost nothing at runtime, so use them liberally for visualization.

### Kinematic Constraints

These fields are written to `config.json` and **are** read by BLine-Lib. They form the global defaults every `Path` falls back to when the path itself doesn't override them.

| Field | Units | Description |
|-------|-------|-------------|
| **Default Max Velocity** | m/s | Default translational velocity cap. |
| **Default Max Accel** | m/s² | Default translational acceleration cap. |
| **Default Handoff Radius** | meters | Default radius at which the follower advances to the next translation target. |
| **Default Max Rot Vel** | deg/s | Default holonomic rotational velocity cap. |
| **Default Max Rot Accel** | deg/s² | Default holonomic rotational acceleration cap. |
| **End Translation Tolerance** | meters | Global position tolerance for declaring a path complete. |
| **End Rotation Tolerance** | degrees | Global rotation tolerance for declaring a path complete. |

See [Constraints](../concepts/constraints.md) for how these values interact with path-specific constraints, and [Key Parameters](../concepts/key-parameters.md) for guidance on picking good values.

!!! warning "Set constraints before designing paths"
    Robot configuration is global state for the project. If you design paths first and then change global defaults, the velocity profile of every path changes. Configure once, then design.

## Config file schema

For reference, the dialog persists values like this:

```json
{
    "robot_length_meters": 0.78,
    "robot_width_meters": 0.85,
    "protrusion_enabled": true,
    "protrusion_distance_meters": 0.30,
    "protrusion_side": "front",
    "protrusion_default_state": "hidden",
    "protrusion_show_on_event_keys": ["deploy"],
    "protrusion_hide_on_event_keys": ["retract"],

    "default_max_velocity_meters_per_sec": 4.5,
    "default_max_acceleration_meters_per_sec2": 10.0,
    "default_intermediate_handoff_radius_meters": 0.25,
    "default_max_velocity_deg_per_sec": 600,
    "default_max_acceleration_deg_per_sec2": 2000,
    "default_end_translation_tolerance_meters": 0.03,
    "default_end_rotation_tolerance_deg": 2.0
}
```

Older config files produced by earlier GUI releases are migrated automatically when opened. You can also hand-author this file if you prefer — BLine-Lib accepts both the flat layout and the nested `kinematic_constraints` shape the newer GUI uses.
