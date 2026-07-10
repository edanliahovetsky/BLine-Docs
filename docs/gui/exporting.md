# Import, Export & Backups

Choose the transfer format by what needs to move: one runtime path, runtime defaults, the robot-ready autos tree, or the complete editor project.

## Which action should I use?

| Goal | Action | Contains |
| --- | --- | --- |
| Put all current paths into the robot project | Browser: **Export Autos Folder…**; desktop: Save the open project folder | `autos/config.json`, `autos/paths/*.json`, and editor sidecar data |
| Back up or move the complete editor workspace | **Export Project Archive…** | Project, paths, collections, linked/editor metadata, and configuration |
| Share one robot path | **Path → Import / Export → Export Path…** | One runtime path JSON |
| Move only robot defaults | **Export Config…** | Runtime kinematic defaults |
| Continue editing a legacy/current autos tree | Browser: **Import Autos Folder…**; desktop: **Open Project Folder…** | Reads and migrates the folder/project data |

## Export an autos folder

### Browser

Choose **Project → Import / Export → Export Autos Folder…**. The browser downloads one archive preserving the `autos/` directory tree. Extract or copy that tree to:

```text
<robot-project>/src/main/deploy/autos/
```

### Desktop

When the desktop app is using the robot repository or `autos` directory, Save/autosave writes that tree directly. Desktop does not show the browser-only autos-folder export action; use a project archive for a portable editor backup or copy the saved folder through your normal version-control/file-transfer workflow.

## Verify before deploying

At minimum, confirm:

```text
src/main/deploy/autos/config.json
src/main/deploy/autos/paths/<your-path>.json
```

Then load the path by its filename without `.json`:

```java
Path path = new Path("your-path");
```

Use `BLineField.drawPath(...)` to verify the deployed polyline in Field2d-compatible dashboards.

## Runtime and editor files

| Location | Purpose |
| --- | --- |
| `config.json` | Seven runtime kinematic/default values read by BLine-Lib |
| `paths/*.json` | Individual runtime paths read by BLine-Lib |
| `.bline-web/state.json` | Collections and other editor state; browser exports include linked identities, while current desktop reopen behavior for links must be verified |
| `.bline-web/assets/fields/` | Custom field assets |

Do not delete `.bline-web` merely because the robot ignores it; that directory preserves authoring features. Do not make robot code depend on it.

## Project archive

Use a project archive for:

- moving a browser project to another machine;
- taking a checkpoint before major collection/link changes;
- sharing an editable project with another programmer; or
- recovering editor organization that is not present in runtime path JSON.

Keep the robot-ready autos tree in Git even if you also store project archives. Runtime diffs should remain reviewable.

## Path import/export

A path JSON contains one element list and path constraints. It does not include collections, linked-element identities, project defaults, or custom field configuration.

Importing a path adds it to the current project. Check its name, first/final elements, constraint ordinals, and compatibility with the current project defaults.

## Config import/export

Runtime `config.json` contains:

- default max translation velocity/acceleration;
- default handoff radius;
- default max rotation velocity/acceleration; and
- default end translation/rotation tolerances.

Robot footprint, protrusion rendering, field selection, custom fields, and optimizer factors are editor state, not BLine-Lib runtime config.

## Keep transfers reviewable

1. Save and wait for **Saved**.
2. Export the appropriate format.
3. Inspect the destination filenames and Git diff.
4. Build/deploy the robot project.
5. Load and draw the path on `Field2d`.
6. Keep a project archive before large editor-only changes.

BLine Web normalizes non-integer runtime numeric values to at most five decimal places when writing JSON, while schema versions and ordinals remain integers.

Related: [Projects, Paths & Collections](menu-bar.md), [Construct Paths & JSON](../lib/path-construction.md), and [Field2d Preview](../lib/field-visualization.md).
