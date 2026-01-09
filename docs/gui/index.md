# GUI Overview

BLine-GUI is a visual path planning interface for designing and editing autonomous paths. It provides real-time simulation preview and exports paths as JSON files that BLine-Lib can load.

<!-- GIF: Overall GUI demo showing path creation -->
![BLine GUI Demo](../assets/gifs/robot-demos/gui-demo.gif)

## Getting Started

**Binary installation:** Launch BLine from your Start Menu (Windows), Applications folder, or run the executable directly.

**Python package installation:** Run `bline` from any terminal. To create a desktop shortcut with the BLine icon, run `bline --create-shortcut`.

## Interface Layout

The BLine GUI consists of three main areas:

```
┌─────────────────────────────────────────────────────────────┐
│                        Menu Bar                              │
├─────────────────────────────────┬───────────────────────────┤
│                                 │                           │
│                                 │                           │
│           Canvas                │        Sidebar            │
│      (Field + Path)             │   (Elements + Properties) │
│                                 │                           │
│                                 │                           │
├─────────────────────────────────┴───────────────────────────┤
│              Transport Controls (Simulation)                 │
└─────────────────────────────────────────────────────────────┘
```

| Area | Purpose |
|------|---------|
| **Canvas** | Visual field display with interactive path editing |
| **Sidebar** | Element list, properties panel, and constraint editor |
| **Transport Controls** | Simulation playback controls |

## Key Features

### Visual Path Editing

- Drag elements to reposition on the field
- Rotate rotations with visual handles
- Add, remove, and reorder elements
- Real-time path visualization

### Constraint Management

- Set global constraints in Robot Config
- Add ranged constraints with visual feedback
- See constraint coverage on the path

### Simulation Preview

- Play/pause path simulation
- Scrub through timeline
- View robot trajectory
- Estimate path duration

## Element Colors

On the canvas, elements are color-coded:

| Color | Element Type |
|-------|--------------|
| 🟠 **Orange** | Waypoint (position + rotation) |
| 🔵 **Blue** | TranslationTarget (position only) |
| 🟢 **Green dashed** | RotationTarget (rotation only) |
| 🟣 **Magenta dashed circle** | Handoff radius |

## Workflow

A typical path creation workflow:

1. **Create a new project** or open an existing one
2. **Configure Robot Settings** (Settings → Robot Config)
3. **Add path elements** by clicking on the canvas or using the sidebar
4. **Position elements** by dragging them on the field
5. **Set rotations** using the rotation handles
6. **Add constraints** for velocity limits on specific segments
7. **Preview** using the simulation controls
8. **Save** the path (automatically exports JSON)

## Project Structure

BLine projects organize paths in a `paths/` directory:

```
my_project/
├── config.json          # Global constraints and robot config
└── paths/
    ├── score_first.json
    ├── intake.json
    └── ...
```

The `paths/` folder corresponds to `deploy/autos/paths/` in your robot code.

## Learn More

- [Canvas](canvas.md) — Detailed canvas interactions and controls
- [Sidebar](sidebar.md) — Element editing and constraint management
- [Simulation](simulation.md) — Using the simulation preview

