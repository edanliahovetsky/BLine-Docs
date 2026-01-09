# Sidebar

The sidebar provides detailed editing controls for path elements and constraints. It's divided into several panels for different functions.

## Path Elements Panel

The top section lists all elements in your path in order.

<!-- GIF: Path elements panel overview -->
![Elements Panel](../assets/gifs/sidebar-elements.gif)

### Element List

Each element shows:

- **Type icon** (colored indicator matching canvas colors)
- **Element type** (Waypoint, Translation, Rotation)
- **Key properties** (coordinates or rotation value)
- **✕ button** to delete the element

### Adding Elements

Click the **"Add element"** button to insert a new element after the currently selected one.

<!-- GIF: Adding a new element -->
![Add Element](../assets/gifs/add-element.gif)

If no element is selected, the new element is added at the end of the path.

### Reordering Elements

**Drag elements** in the list to reorder them. The path will update immediately on the canvas.

<!-- GIF: Dragging to reorder elements -->
![Reorder Elements](../assets/gifs/reorder-elements.gif)

!!! note
    Remember that RotationTargets are positioned relative to the segment they're on. Reordering may change which segment a RotationTarget belongs to.

### Removing Elements

Click the **✕ button** next to any element to remove it, or select it and press Delete/Backspace.

## Element Properties Panel

When an element is selected, its properties appear in this panel.

### Common Properties

| Property | Applies To | Description |
|----------|------------|-------------|
| **Type** | All | Dropdown to convert between element types |
| **Rotation (deg)** | Waypoint, RotationTarget | rotation in degrees |
| **Profiled Rotation** | Waypoint, RotationTarget | Checkbox for rotation interpolation mode |

### Translation Properties

For Waypoints and TranslationTargets:

| Property | Description |
|----------|-------------|
| **X (m)** | X coordinate in meters |
| **Y (m)** | Y coordinate in meters |
| **Handoff Radius (m)** | Distance at which path advances to next element |

<!-- GIF: Editing element properties -->
![Edit Properties](../assets/gifs/edit-properties.gif)

### RotationTarget Properties

For RotationTargets specifically:

| Property | Description |
|----------|-------------|
| **t_ratio** | Position along segment (0.0 to 1.0) |

!!! tip
    You can also adjust t_ratio by dragging the RotationTarget along its segment on the canvas.

### Converting Element Types

Use the **Type dropdown** to convert an element to a different type:

- **Waypoint ↔ TranslationTarget**: Removes or adds rotation data
- **Waypoint ↔ RotationTarget**: Removes or adds translation data
- **TranslationTarget ↔ RotationTarget**: Swaps translation for rotation

<!-- GIF: Converting element types -->
![Convert Type](../assets/gifs/convert-element.gif)

## Path Constraints Panel

Manage velocity and acceleration constraints for your path.

### Adding Constraints

Click **"Add constraint"** to create a new ranged constraint.

<!-- GIF: Adding a constraint -->
![Add Constraint](../assets/gifs/add-constraint.gif)

### Constraint Types

Available constraint types:

- Max Velocity (m/s)
- Max Acceleration (m/s²)
- Max Rotational Velocity (deg/s)
- Max Rotational Acceleration (deg/s²)

### Constraint Properties

Each constraint shows:

| Property | Description |
|----------|-------------|
| **Type** | Dropdown to select constraint type |
| **Value** | The limit value |
| **Range slider** | Start and end ordinals (1-based) |
| **✕ button** | Remove the constraint |

### Range Slider

The range slider lets you specify which elements the constraint applies to:

- **Left handle**: Start ordinal (first affected element)
- **Right handle**: End ordinal (last affected element)

<!-- GIF: Adjusting constraint range -->
![Constraint Range](../assets/gifs/constraint-range.gif)

!!! info "Visual Feedback"
    Click on the slider to see a **green overlay** on the canvas highlighting the affected path segments.

### Removing Constraints

Click the **✕ button** next to any constraint to remove it.

## Settings

Access global settings via the menu: **Settings → Robot Config**

### Robot Configuration

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

