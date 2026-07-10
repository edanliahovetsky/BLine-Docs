# Fields, Footprint & Protrusions

Open **Settings** to configure the editor's field and robot visualization. These settings help inspect clearance; BLine-Lib does not use them for collision avoidance.

## Field

BLine Web includes FRC fields from 2022 through the current season plus a blank meter grid. New projects default to the latest officially released season—currently **REBUILT 2026**.

Use the current field for general documentation, tutorials, and active-season paths. Select an older field only for a path that actually belongs to that season.

### Custom field image

The **Field** settings tab can upload a custom image and define its metric geometry. Confirm:

- field length and width;
- coordinate offset/margin;
- image orientation; and
- a known landmark coordinate after loading.

Filenames ending in a numeric suffix such as `_200` can be interpreted using PathPlanner-style pixels-per-meter metadata. Verify inferred values rather than relying on the filename alone.

Custom field assets and the selected field are editor data under `.bline-web`; they are not written into runtime `config.json`.

## Robot footprint

Under **Robot**, enter the full bumper-to-bumper length and width. The simulator draws this rectangle at the idealized robot pose.

The footprint helps identify obvious clearance problems, but it does not account for flex, pose error, wheel slip, or mechanism motion. Leave real safety margin around fixed field geometry.

## Protrusions

A protrusion represents a temporary extension such as an intake. Configure:

- enabled/disabled;
- extension distance;
- side: front, back, left, right, or none;
- default shown/hidden state;
- event keys that show it; and
- event keys that hide it.

The simulator derives a visual show/hide schedule from the geometric positions of matching event keys. This is an editor clearance preview, not execution of the robot event registry.

Example intent:

```text
default: hidden
show on: deployIntake
hide on: stowIntake
```

There is no independent saved visibility choice on every path element in current BLine Web. Visibility comes from the default plus the event-key schedule.

## Configure the matching robot events

The editor visual does not deploy a real mechanism. Register matching `lib_key` actions in robot code:

```java
FollowPath.registerEventTrigger("deployIntake", intake::deploy);
FollowPath.registerEventTrigger("stowIntake", intake::stow);
```

The editor may show the intended clearance even if robot code forgot to register the event or would process an unusual hand-authored event list differently. Keep same-segment runtime events in ascending `t_ratio`, then test the event logs and mechanism behavior separately.

## Validation checklist

- Current-season field selected for current paths and demos.
- Field coordinates match WPILib/BLine coordinates.
- Footprint includes bumpers, not only the frame.
- Protrusion distance and side match the real mechanism.
- Show/hide keys exactly match robot registrations.
- Timeline shows the expected state changes.
- Robot test leaves additional clearance beyond the idealized drawing.

See [Simulation](simulation.md) and [Events & Command Groups](../lib/event-triggers.md).
