# Events & Command Groups

Register event actions once, compose the surrounding autonomous routine with deliberate WPILib requirement behavior, and keep drivetrain conflicts explicit.

## Register actions

Call one overload for each key, normally in `RobotContainer`:

```java
FollowPath.registerEventTrigger("deployIntake", intake::deploy);
FollowPath.registerEventTrigger("shoot", shooter.shootCommand());
```

- The `Runnable` overload runs inline from `FollowPath.execute()`. Keep it fast and non-blocking.
- The `Command` overload schedules the command through `CommandScheduler`.
- Registrations are static and persist across path runs. Registering the same key replaces the prior action.
- A scheduled command continues under normal WPILib rules even after the path ends.

## Place the path element

```java
Path path = new Path(
    new Path.Waypoint(startPose),
    new Path.EventTrigger(0.35, "deployIntake"),
    new Path.EventTrigger(0.80, "shoot"),
    new Path.Waypoint(endPose)
);
```

JSON form:

```json
{
  "type": "event_trigger",
  "t_ratio": 0.35,
  "lib_key": "deployIntake"
}
```

If hand-authored JSON omits `lib_key`, the parser skips that event. Validate exported files and registered keys before competition.

## Why raw `Commands.sequence` can cancel an auto

WPILib command groups normally aggregate the requirements of all child commands. Suppose an event schedules a shooter command during the path, while another shooter command exists later in the outer sequence. The outer group may already own the shooter requirement, so scheduling the event command interrupts the entire group.

`BLineCommands` mirrors the WPILib composition methods that accept child commands, but proxies those children before creating the group:

```java
import static frc.robot.lib.BLine.BLineCommands.sequence;

Command auto = sequence(
    shooter.prepareCommand(),
    pathBuilder.build(pathWithShootEvent),
    shooter.finishCommand()
);
```

Available helpers:

- `sequence`
- `repeatingSequence`
- `parallel`
- `race`
- `deadline`
- `either`
- `select`
- `defer`
- `deferredProxy`

Use ordinary WPILib composition when no event-scheduled command can conflict with requirements held by the surrounding group.

!!! warning "`BLineCommands` does not erase real conflicts"
    `FollowPath` requires the drivetrain. If an event command also requires the drivetrain, normal WPILib scheduling still interrupts one of them. Refactor the event so it does not own the drivetrain, or split the motion into separate commands.

## Run behavior over a region

Use events to toggle state and a separately composed command to observe it:

```java
AtomicBoolean shouldIntake = new AtomicBoolean(false);

FollowPath.registerEventTrigger("intakeOn", () -> shouldIntake.set(true));
FollowPath.registerEventTrigger("intakeOff", () -> shouldIntake.set(false));

Command intakeRegion = Commands.waitUntil(shouldIntake::get)
    .andThen(
        intake.runCommand()
            .until(() -> !shouldIntake.get())
    );

Command auto = BLineCommands.sequence(
    Commands.runOnce(() -> shouldIntake.set(false)),
    BLineCommands.deadline(
        pathBuilder.build(path),
        intakeRegion
    )
).finallyDo(interrupted -> shouldIntake.set(false));
```

Reset state at both routine start and cleanup so an interruption between the on/off markers cannot leak into the next run. Choose the exact `deadline`, cancellation, and subsystem ownership semantics for your mechanism. The example demonstrates the event-to-state pattern, not a universal auto structure.

## Test failure paths

Verify all of these before relying on an event:

- the key matches exactly;
- same-segment events are ordered by increasing `t_ratio`;
- a missing registration produces the expected warning;
- an event command does not unintentionally require the drivetrain;
- interruption leaves the mechanism safe; and
- a command that outlives the path has an intentional termination condition.

See [Events](../concepts/event-triggers.md) for geometric firing semantics.
