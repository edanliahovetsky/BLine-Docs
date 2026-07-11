# Keyboard Shortcuts

Current BLine Web shortcuts for v0.1.0-alpha.11.

## Global

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + S` | Save workspace |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + Y` | Redo |
| `Escape` | Close the active menu/dialog or cancel curve drawing where supported |

Undo, redo, delete, reorder, and simulation shortcuts do not override typing inside an input field. `Ctrl/Cmd + S` is the exception: it saves the BLine workspace even while an input is focused.

## Selected path element

| Shortcut | Action |
| --- | --- |
| `Arrow Up` | Move selected element earlier in path order |
| `Arrow Down` | Move selected element later in path order |
| `Delete` / `Backspace` | Remove selected element |

After reordering, review segment-scoped rotation/events and constraint ordinals.

## Selected ranged constraint

| Shortcut | Action |
| --- | --- |
| `Delete` / `Backspace` | Delete the selected range |

Use the visible **Split**, add, and editor controls for range restructuring; older BLine-GUI segment-bar shortcuts do not describe the current Web editor.

## Simulation

When no dialog, menu, input, or other interactive control has keyboard focus:

| Shortcut | Action |
| --- | --- |
| `Space` / `K` | Play or pause |
| `Left Arrow` / `Home` | Reset to the beginning |
| `Right Arrow` / `End` | Jump to the end |

## Pointer interactions

| Interaction | Action |
| --- | --- |
| Wheel/trackpad scroll | Zoom around pointer |
| Drag empty canvas | Pan |
| Drag anchor | Change X/Y |
| Drag selected rotation handle | Change heading |
| Right-click empty field/anchor | Linked-element actions |

See [Draw & Edit Paths](../gui/canvas.md) and [Simulation](../gui/simulation.md).
