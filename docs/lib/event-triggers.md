# Event Triggers (Library)

Event triggers let you fire an action when the robot passes a specific point along a path segment. The action is registered once in code by string key; the path references that key by placing an `EventTrigger` element. When the command runs, BLine fires the registered `Runnable` (or schedules the registered `Command`) as the robot's projection onto the segment crosses the trigger's `t_ratio`.

For the conceptual model (t_ratio semantics, projection-based firing, patterns) see [Concepts → Event Triggers](../concepts/event-triggers.md). This page focuses on the library API.

## Registering actions

`FollowPath.registerEventTrigger` is a static method. Register each key **once**, typically in `RobotContainer`:

```java
// Register a Runnable
FollowPath.registerEventTrigger("deployIntake", () -> intake.deploy());

// Register a Runnable that schedules a command
FollowPath.registerEventTrigger("shoot", new ShootCommand(shooter));

// Method reference also works
FollowPath.registerEventTrigger("stowElevator", elevator::stow);
```

The `Command` overload internally wraps the command as `CommandScheduler.getInstance().schedule(command)`, so the command runs in parallel with the path-following command.

!!! info "Registration is global and persistent"
    The registry is a static `Map<String, Runnable>` on `FollowPath`. It persists across command runs, across robot-mode changes, and across `pathBuilder.build(...)` calls. Registering the same key a second time **replaces** the previous action — useful for hot-reload in sim, but don't accidentally double-register.

## Placing triggers in a path

**In code:**

```java
Path path = new Path(
    new Path.Waypoint(startPose),
    new Path.EventTrigger(0.5, "deployIntake"),
    new Path.Waypoint(pickupPose)
);
```

**In JSON** (or from the GUI):

```json
{
    "type": "event_trigger",
    "t_ratio": 0.5,
    "lib_key": "deployIntake"
}
```

## Firing semantics

`FollowPath` processes triggers **in path order**, on every cycle, within `processEventTriggers()`:

1. For each `EventTrigger` element not yet fired and on the current or a past segment:
2. Check whether the robot's projection onto the trigger's segment has reached `t_ratio`.
3. If yes, look up the key in the registry and invoke the `Runnable`.
4. Mark it fired so it doesn't re-fire this command run.

Consequences:

- **Projection-based.** Triggers activate when the robot is *alongside* the trigger point on the segment, not when it reaches an (x, y) coordinate. Cross-track error doesn't prevent firing.
- **One-shot per run.** Each trigger fires at most once per command execution. Rescheduling the command starts fresh.
- **Degenerate segments fire immediately.** A trigger on a zero-length segment fires as soon as the segment becomes active.
- **Missing registrations log, don't crash.** Unregistered keys emit a warning and continue. A typo won't fail your auto.

## Common patterns

### Immediate subsystem call

```java
FollowPath.registerEventTrigger("deployIntake", intake::deploy);
```

Best for subsystems that latch their own state. The trigger fires, the subsystem starts acting, and the robot keeps following the path.

### Scheduled command group

```java
FollowPath.registerEventTrigger("shoot",
    Commands.sequence(
        new PrepareShotCommand(),
        new FireShotCommand()
    ));
```

Good for multi-step actions that deserve their own command structure.

### Toggle state, let a parallel command react

Event triggers are discrete, one-shot events. If you want continuous "while in region" behavior, flip a boolean and have a command observe it:

```java
FollowPath.registerEventTrigger("startShoot", () -> shouldShoot = true);
FollowPath.registerEventTrigger("stopShoot",  () -> shouldShoot = false);

Command runShotDuringRegion = Commands.waitUntil(() -> shouldShoot)
    .andThen(shooter.run().withDeadline(Commands.waitUntil(() -> !shouldShoot)));

return Commands.deadline(
    pathBuilder.build(path),
    runShotDuringRegion
);
```

This is the pattern teams have settled on for zones where behavior must *continue* over a range of the path (e.g. shoot-while-moving sweeps).

### Fire at path start

Place a trigger near the very beginning of the path, or assemble the first waypoint + trigger as:

```java
new Path(
    new Path.Waypoint(startPose),
    new Path.EventTrigger(0.0, "autoStarted"),
    // ...
);
```

For on-the-fly paths where you want the first trigger to fire *immediately* on path construction, prepend the robot's current pose as the first element:

```java
List<Path.PathElement> elements = new ArrayList<>(path.getPathElements());
elements.add(0, new Path.Waypoint(driveSubsystem.getPose()));
elements.add(1, new Path.EventTrigger(0.0, "firstAction"));
path.setPathElements(elements);
```

## Testing triggers

In a unit test or sim, you can register triggers and then drive the command manually:

```java
AtomicBoolean fired = new AtomicBoolean(false);
FollowPath.registerEventTrigger("testKey", () -> fired.set(true));

Path p = new Path(
    new Path.Waypoint(new Translation2d(0, 0), Rotation2d.kZero),
    new Path.EventTrigger(0.5, "testKey"),
    new Path.Waypoint(new Translation2d(2, 0), Rotation2d.kZero)
);
```

When the robot crosses projected `x=1.0` on that segment, `fired.get()` becomes `true`.

## Interaction with flip and mirror

Flipping or mirroring a path transforms positions and rotations; trigger `t_ratio` and `lib_key` are preserved unchanged. A trigger at `t_ratio=0.3` still fires at 30% along its (now transformed) segment, with the same registered action.

## Relevant Javadoc

- `FollowPath.registerEventTrigger(String, Runnable)`
- `FollowPath.registerEventTrigger(String, Command)`
- `Path.EventTrigger` (record: `t_ratio`, `libKey`)
