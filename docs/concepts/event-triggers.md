# Event Triggers

`EventTrigger` elements fire a user-registered action when the robot's projection onto the current segment reaches a configured `t_ratio`. They let you run intake, shooting, elevator, or any other subsystem action *during* a path — no need to split the path into separate sub-commands.

Event triggers were added to BLine-Lib in v0.4.x and have been first-class since; the GUI shows them as a **yellow line** along the segment.

## How they work

```text
[ translation A ] ──── event trigger (t_ratio=0.5) ──── [ translation B ]
                               ▲
                               └ fires when robot's projection on segment ≥ 0.5
```

1. Register a keyed action once at robot init: `FollowPath.registerEventTrigger(key, runnable)` (or with a `Command`).
2. Place an `EventTrigger` element in the path with the same key and a `t_ratio`.
3. When `FollowPath` starts, it processes triggers in path order. A trigger fires when the robot's projection onto the enclosing segment first passes its `t_ratio`.
4. Each trigger fires **at most once per command run**. Triggers don't re-fire if the robot retreats past the point.

!!! info "Projection-based, not coordinate-based"
    Triggers fire based on **where the robot is along the segment**, not on raw coordinates. If the robot is bumped sideways off the line, the trigger still fires at the right moment — it activates when the projection of the robot's position onto the segment crosses the t_ratio threshold. This is robust to cross-track error, vision jumps, and collisions.

## Registering an action

Call `FollowPath.registerEventTrigger` once (usually in `RobotContainer`) for each key you plan to reference in a path:

```java
// Register a Runnable
FollowPath.registerEventTrigger("deployIntake", () -> intake.deploy());

// Register a Command (scheduled when the trigger fires)
FollowPath.registerEventTrigger("shoot", new ShootCommand(shooter));

// AdvantageKit-friendly logging hook
FollowPath.registerEventTrigger("markCheckpoint",
    () -> Logger.recordOutput("Auto/checkpoint", true));
```

The registry is a static `Map<String, Runnable>` on `FollowPath`. When registered with a `Command`, BLine wraps it in a `Runnable` that schedules the command onto the command scheduler; the command then runs in parallel with the path-following command.

!!! warning "Side-effect constraints"
    A trigger's `Runnable` runs on the main robot thread during `FollowPath.execute()`. Keep it fast — start subsystems, flip state, or schedule commands. Don't do blocking work inside a trigger.

## Placing a trigger in a path

=== "In code"

    ```java
    Path path = new Path(
        new Path.Waypoint(startPose),
        new Path.EventTrigger(0.5, "deployIntake"),
        new Path.Waypoint(pickupPose),
        new Path.EventTrigger(0.7, "shoot"),
        new Path.Waypoint(scoringPose)
    );
    ```

=== "In JSON"

    ```json
    {
        "path_elements": [
            { "type": "waypoint", "translation_target": { "x_meters": 1, "y_meters": 1 },
              "rotation_target": { "rotation_radians": 0, "profiled_rotation": true } },
            { "type": "event_trigger", "t_ratio": 0.5, "lib_key": "deployIntake" },
            { "type": "waypoint", "translation_target": { "x_meters": 3, "y_meters": 1 },
              "rotation_target": { "rotation_radians": 0, "profiled_rotation": true } }
        ]
    }
    ```

=== "In the GUI"

    Add an element, set its type to **event_trigger** in the sidebar, then set:

    - **Event Pos (0–1)** — the `t_ratio` along the segment.
    - **Lib Key** — the string your code registered the action under.

    The trigger renders as a short yellow line perpendicular to the segment at its t_ratio.

## Common patterns

### Toggle state, let a wait-until drive behavior

This is the pattern most of the thread converged on for "do X while the robot is in region Y":

```java
// Register triggers to flip boolean state
FollowPath.registerEventTrigger("start_shoot", () -> shouldShoot = true);
FollowPath.registerEventTrigger("stop_shoot",  () -> shouldShoot = false);

// Then structure the auto around the state
return Commands.deadline(
    pathBuilder.build(path),
    Commands.waitUntil(() -> shouldShoot)
        .andThen(shootCommand.withDeadline(Commands.waitUntil(() -> !shouldShoot)))
);
```

Triggers are discrete events — they fire once, not continuously — so a `whileTrue`-style pattern isn't a natural fit. Flipping state that other commands observe is the cleanest idiom.

### Fire-and-forget subsystem call

```java
FollowPath.registerEventTrigger("deployIntake", intake::deploy);

new Path(
    new Path.Waypoint(startPose),
    new Path.EventTrigger(0.3, "deployIntake"),
    new Path.Waypoint(pickupPose)
);
```

Good for subsystems that latch state themselves (intake deployed, elevator commanded to preset, etc.).

### Schedule a full command

```java
FollowPath.registerEventTrigger("shoot", new ShootCommand(shooter));

new Path(
    new Path.Waypoint(startPose),
    new Path.EventTrigger(0.8, "shoot"),
    new Path.Waypoint(endPose)
);
```

Works well when the action is a multi-step command group. BLine schedules it onto the command scheduler — it runs in parallel with the rest of the path.

### Trigger at path start

Place an `EventTrigger` with `t_ratio` near `0` at the beginning of the path (or simply as the second element, after the first waypoint):

```java
new Path(
    new Path.Waypoint(startPose),
    new Path.EventTrigger(0.0, "startOfAuto"),
    // ...
);
```

For **on-the-fly paths** where you want a trigger to fire immediately on path construction, the cleanest approach is to set the first path element to the robot's current pose and place the trigger right after.

## Edge cases and gotchas

**Segment order matters.** Triggers are processed in path order. If you drop multiple triggers onto the same segment, they all fire as their `t_ratio` thresholds are crossed, in path-order sequence.

**Zero-length segments.** A trigger on a degenerate (zero-length) segment fires immediately when its segment becomes active.

**Unregistered keys.** If a path contains an `EventTrigger` whose `lib_key` was never registered, BLine logs a warning and moves on — the path still completes, no action fires. This is deliberate: a typo shouldn't break your auto.

**Restarting the path.** Each call to `pathBuilder.build(path).schedule()` produces a fresh command with its own fired-trigger state. Triggers will fire again on the next run, as expected.

**Mirrored/flipped paths.** Flipping or mirroring transforms positions and rotations; `t_ratio` values on triggers are unchanged. A trigger at `t_ratio=0.3` still fires at 30% along the (now-mirrored) segment.

## Related

- [Library: Event Triggers](../lib/event-triggers.md) — Registering actions, API shape, testing tips.
- [Path Elements](path-elements.md) — Element types overview.
- [Key Parameters](key-parameters.md#t_ratio-rotation-targets-and-event-triggers) — t_ratio mechanics.
