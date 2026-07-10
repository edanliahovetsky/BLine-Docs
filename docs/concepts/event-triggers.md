# Events

An event trigger connects geometric path progress to robot behavior. The path stores a `lib_key`; robot code registers the action for that key.

```text
anchor A ───────── event at t_ratio 0.65 ───────── anchor B
                              │
                              └─ fire when projected progress passes 65%
```

## What an event means

- It is one point on one translation segment.
- It fires from projected geometric progress, not elapsed time.
- It fires at most once during one `FollowPath` command run.
- It can call a short `Runnable` inline or schedule a WPILib `Command`.
- Its key and `t_ratio` survive flip and mirror transformations.

An event is not a continuous zone. For “run while between A and B,” use a start event and stop event to change state, then let a parallel command observe that state.

## Author events in path order

Keep multiple events on the same segment in ascending `t_ratio` order. BLine processes the list in path order and stops when it reaches the first event whose geometric position has not yet been passed. An out-of-order list can delay a lower-ratio event.

Keep every `t_ratio` inside `[0, 1]`. BLine-Lib v0.9.1 does not clamp event ratios.

## Decide between an event and another path

Use an event when an action should begin without stopping drivetrain motion:

- deploy an intake;
- spin up a shooter;
- start moving an elevator; or
- record a checkpoint.

Split the routine into separate paths when the drivetrain must wait for a mechanism, when a pose must be revalidated before continuing, or when the next motion depends on success/failure.

## Command scheduling matters

A triggered command is scheduled normally by WPILib. It can interrupt another command with the same subsystem requirement. It is not automatically canceled when the path ends.

`BLineCommands` helps prevent the *outer autonomous group* from holding every child requirement for its whole lifetime, but it cannot make two commands use the same subsystem simultaneously. A triggered command that requires the drivetrain will still conflict with `FollowPath`.

See [Events & Command Groups](../lib/event-triggers.md) for safe composition patterns.

## Verify events

During simulation or a low-speed robot test:

1. Register a visible or action-specific logged test behavior for every key.
2. Plot `FollowPath/eventTriggerElementIndex` and `FollowPath/eventTriggersFiredCount`, and review runtime warnings.
3. Confirm each registered action runs once and in the expected order. The fired-count key also increments for a reached element whose key is unregistered, so it is not proof that mechanism code ran.
4. Interrupt the path and verify any independently scheduled command has the desired cleanup behavior.

## Related

- [Path Elements](path-elements.md)
- [Handoffs, t-ratio & Completion](key-parameters.md)
- [BLine Web Draw & Edit Paths](../gui/canvas.md)
