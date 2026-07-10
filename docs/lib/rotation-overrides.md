# Rotation Overrides

Temporarily replace BLine's rotational output while keeping its translation path following. Common uses include vision aiming, pointing an intake, or handing heading control to another controller during part of a path.

## Start an override

The supplier returns angular velocity in **radians per second** and is sampled every follower cycle:

```java
FollowPath.overrideRotation(
    shooterAimController::getOmegaRadiansPerSecond
);
```

The one-argument overload uses `BYPASS_CONSTRAINTS`: the supplied omega replaces the final follower omega after BLine's normal rotational limiting.

To retain BLine's rotation velocity/acceleration limits:

```java
FollowPath.overrideRotation(
    shooterAimController::getOmegaRadiansPerSecond,
    FollowPath.RotationOverrideBehavior.RESPECT_CONSTRAINTS
);
```

## Clear it reliably

The override is static and affects every `FollowPath` command until cleared.

```java
Command aimedPath = Commands.sequence(
    Commands.runOnce(() -> FollowPath.overrideRotation(
        shooterAimController::getOmegaRadiansPerSecond,
        FollowPath.RotationOverrideBehavior.RESPECT_CONSTRAINTS
    )),
    pathBuilder.build(path)
).finallyDo(interrupted -> FollowPath.clearRotationOverride());
```

Attach cleanup to the whole wrapper, not only the path child: the routine could be canceled after setting the static override but before the path starts. Also clear it when leaving the robot mode if another owner can cancel or replace the wrapper.

## Choose the behavior

| Mode | Use when | Responsibility |
| --- | --- | --- |
| `RESPECT_CONSTRAINTS` | The external controller provides the target omega, but project/path limits should still apply | BLine limits rotational velocity/acceleration |
| `BYPASS_CONSTRAINTS` | Another subsystem fully owns the final rotational command | Your code must enforce safe rate/acceleration limits |

Translation remains rate-limited by BLine in both modes.

## Completion still uses the authored path rotation

An override changes output, not the path's finish test. `FollowPath` still checks the active authored rotation target and end rotation tolerance.

!!! warning "An incompatible override can prevent completion"
    If vision aiming holds a heading different from the final waypoint, the path may reach its final position but never finish rotation. Add an event that clears the override before the endpoint, author a compatible final heading, or compose an intentional timeout/fallback. Interruption cleanup alone cannot solve a finish predicate that is waiting on the override.

## Diagnose an override

Plot:

- `FollowPath/rotationOverrideActive`
- `FollowPath/rotationOverrideBypassesConstraints`
- `FollowPath/rotationOverrideOmegaRadPerSec`
- `FollowPath/outputOmegaRadPerSec`
- `FollowPath/targetRotationDeg`
- `FollowPath/rotationErrorDeg`
- `FollowPath/finishedRotationAtSetpoint`

If `outputOmegaRadPerSec` differs from the supplier in `RESPECT_CONSTRAINTS`, inspect the active rotation max and acceleration. In bypass mode, they should match except for your own upstream logic.

## Avoid global-state surprises

- Set one override owner at a time.
- Clear it in interruption cleanup.
- Do not let two subsystems repeatedly overwrite the static supplier.
- Test transition back to profiled path rotation.
- Verify the final heading and finish behavior at full path speed.

See [Logging & AdvantageScope](logging.md) and [Handoffs, t-ratio & Completion](../concepts/key-parameters.md#final-completion).
