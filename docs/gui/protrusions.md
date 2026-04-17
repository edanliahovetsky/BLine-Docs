# Protrusions

**Protrusions** are a path-visualization feature added in BLine-GUI **v0.3.0**. They let you draw offsets around path elements to represent asymmetric robot geometry — an intake out front, a bumper on one side, an arm extension during scoring — without changing the underlying path.

Protrusions are **GUI-only**. They do not affect path following on the robot at all. Their purpose is to make it obvious at design time that the *extended* geometry of the robot will fit where you've placed the path.

## When to use them

Typical scenarios:

- Your intake hangs ~0.3 m in front of the bumper, and you want to see whether it'll clear a game-piece structure at a specific waypoint.
- Your robot has a side-mounted shooter; you want visual confirmation that the shooter muzzle isn't pointing into a wall.
- The robot grows visibly during scoring (elevator deployed, arm extended) and you want to see that in the simulation preview of the scoring pose.

If your robot has a symmetric footprint and nothing protruding, leave protrusions off — the baseline Robot Length / Robot Width rendering is sufficient.

## Enabling protrusions

Open **Settings → Edit Config…** and check **Enable Protrusions**. The following fields then become active:

| Field | Description |
|-------|-------------|
| **Protrusion Distance (m)** | How far the protrusion extends beyond the robot perimeter. |
| **Protrusion Side** | Which side the protrusion is on: `left`, `right`, `front`, `back`, or `none`. |
| **Default Protrusion State** | `shown` or `hidden` — the default visibility for new elements. |
| **Show On Event Keys** | Comma-separated event-trigger keys that flip the protrusion to **shown** when fired during simulation. |
| **Hide On Event Keys** | Comma-separated event-trigger keys that flip the protrusion to **hidden** when fired during simulation. |

These settings are project-wide and live in `config.json` alongside kinematic defaults.

## Visual behavior

Protrusions only render for **Waypoints** and **RotationTargets** — the elements that carry a rotation, and therefore a notion of "which side." They do not render for TranslationTargets or EventTriggers.

| Element | Protrusion appearance |
|---------|-----------------------|
| **Waypoint** | Dashed **orange** offset perimeter on the chosen side |
| **RotationTarget** | Dashed **green** offset perimeter on the chosen side |

Both use the same dashed-line family as rotation targets themselves, so it's clear at a glance that you're looking at a *visualization overlay* and not a second path element.

## Per-element visibility

Beyond the project-wide default visibility state, you can override visibility per-element:

- **Set the element's protrusion coverage** — each element remembers its own `shown` / `hidden` state.
- **Drive visibility with event keys.** Add a key to **Show On Event Keys** or **Hide On Event Keys** to make the simulation toggle protrusion visibility when that event fires.

When the simulation is **not** running, each element renders its own individual protrusion state. When the simulation **is** running, the footprint's protrusion follows the rules driven by the event keys — matching the state the robot would be in mid-path.

## Simulation interaction

During sim playback:

1. Start: the simulated footprint uses **Default Protrusion State**.
2. When a Show event fires (`lib_key` in **Show On Event Keys**), the footprint expands to include the protrusion.
3. When a Hide event fires (`lib_key` in **Hide On Event Keys**), the footprint retracts.
4. The simulated footprint renders with the currently active state — you can visually confirm that the intake is deployed exactly when you expected.

This lets you, for example, register a single event trigger `"deployIntake"` on the robot **and** wire it as a Show On Event Key for protrusions — and the GUI sim will then show the intake "deploying" at the same point in the path where the code would actually deploy it.

## Example config

```json
{
    "robot_length_meters": 0.78,
    "robot_width_meters": 0.85,

    "protrusion_enabled": true,
    "protrusion_distance_meters": 0.30,
    "protrusion_side": "front",
    "protrusion_default_state": "hidden",
    "protrusion_show_on_event_keys": ["deployIntake"],
    "protrusion_hide_on_event_keys": ["retractIntake"]
}
```

With this config, a front intake sits hidden by default. When an `EventTrigger` with `lib_key: "deployIntake"` fires, the simulated footprint grows forward by 0.30 m. When `"retractIntake"` fires, it retracts.

## Good practices

- **Keep protrusions honest.** If your measured intake sits 0.28 m out, don't round to 0.1 m to make paths "fit." Measure, enter, and redesign paths as needed.
- **Use the default state that matches match-start.** If the intake is retracted at match start, default state should be `hidden`. Deploy during the first relevant segment.
- **Name event keys by action, not by state.** `"deployIntake"` is self-documenting and works symmetrically with `"retractIntake"`.
- **Protrusions don't replace collision checking.** They're a visualization aid, not a physics engine. Confirm clearances on the actual robot before trusting a tight path.

## Related

- [Event Triggers](../concepts/event-triggers.md) — the mechanism that drives protrusion show/hide during sim.
- [Menu Bar → Settings](menu-bar.md#settings) — config dialog reference.
- [Simulation](simulation.md) — how the simulated footprint responds to protrusion state.
