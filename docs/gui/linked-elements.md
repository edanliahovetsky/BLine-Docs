# Linked Elements

Linked elements keep a shared translation or waypoint synchronized across multiple paths. Use them for scoring poses, common start/end points, and handoffs that must stay identical when the field strategy changes.

## What is shared

| Linked type | Shared values | Compatible path elements |
| --- | --- | --- |
| **Translation** | X and Y | Translation targets and waypoints |
| **Waypoint** | X, Y, and heading | Waypoints only |

Handoff radius, profiled-rotation choice, constraints, and neighboring elements remain local to each path.

## Create and link

Choose one workflow:

### From an existing anchor

1. Select a waypoint or translation target.
2. Open its **Link** menu in Element Properties.
3. Choose **New Linked Translation…**, **New Linked Waypoint…**, or **Choose Existing…**.
4. Give it a descriptive project-wide name.

### From the field

Right-click empty field space to create a linked translation, or right-click an anchor to create/link/unlink from its context menu.

### From the manager

Open **Path → Linked Elements…**. Create a translation or waypoint, edit it in the field preview/details panel, then link compatible elements from their path properties.

## Edit once, update every use

The manager shows each linked element's type, lock state, and use count. Moving or editing an unlocked linked element synchronizes every linked use across project paths.

Use collection overlays to inspect the result in context. A shared coordinate can still produce different motion because each path has its own surrounding geometry, handoff radii, and constraint ranges.

## Lock stable targets

Lock a linked element after its position has been measured or strategy-approved. Locked elements cannot be moved in the manager or an individual path until unlocked.

The lock protects editor changes; it is not a runtime safety mechanism and does not prevent code from constructing a different path.

## Unlink versus delete

- **Unlink Element** removes the relationship from one path element and preserves its current values as ordinary local data.
- **Delete Linked Element** removes the shared identity and unlinks all of its uses. Their last synchronized coordinates remain in their individual paths.

After either action, verify every affected path and its ranged-constraint ordinals.

## Export behavior

BLine-Lib does not load linked-element identities. Exported `paths/*.json` contain ordinary coordinates for each path. The identities and relationships are editor metadata used to keep those files aligned while authoring.

!!! warning "Back up alpha editor metadata"
    Export a project archive before restructuring linked elements. After reopening a folder-backed project, verify shared links and use counts before making broad edits; current BLine Web releases are still alpha.

## Good naming

Prefer names that describe field intent rather than one auto:

- `center-start`
- `source-handoff`
- `left-score-pose`
- `trench-entry`

Avoid `Waypoint 1` or `Auto A End`; the same shared target may later serve several routines.

## When not to link

Do not link two points merely because they are currently close. Keep them independent when:

- one path needs a different final heading;
- calibration offsets are intentionally different;
- one point may move without the other; or
- a shared target would hide an important strategy choice.

Related: [Projects, Paths & Collections](menu-bar.md) and [Draw & Edit Paths](canvas.md).
