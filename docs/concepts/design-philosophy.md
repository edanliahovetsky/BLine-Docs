# Design Philosophy

BLine takes a fundamentally different approach to path tracking compared to traditional Bézier-based solutions like PathPlanner and Choreo. This page explains the rationale behind BLine's polyline architecture and when it excels.

## Why Polylines?

### Computational Efficiency

A direct improvement over PathPlanner and Choreo is computational efficiency and simplicity when creating simple paths.

BLine does **not** need to precompute or discretize a Bézier trajectory into finite timestamps before the controller can follow the path. The path gets passed to the tracking controller immediately after creation, which provides loop cycle time gains for **real-time teleop applications**.

This means you don't have to do any pre-computing as you might with Bézier trajectories. Of course, for pre-baked paths there's no difference—the majority of computation happens during path creation regardless of the tool.

!!! info "Performance Results"
    Validation testing demonstrated a **97% reduction** in path computation time compared to PathPlanner.

### Ease of Controller Tuning

The BLine tracking controller achieves good (if not better) results with **less hassle**. Tuning a time-parameterized PID controller to follow curved paths (Bézier or otherwise) can be difficult, especially for newer teams.

**Common issues with time-parameterized tracking:**

- Over-tuned gains easily cause erratic behavior and jittering
- Under-tuned gains cause the robot to fall behind during acceleration
- Problems are exacerbated when the drivetrain isn't perfectly tuned
- Makes it harder to push a chassis to its true max acceleration and velocity limits
- Teams historically run a second profiled PID alignment routine after paths end to overcome tracking and early finish challenges

**BLine avoids these issues** simply by the nature of its PID controller setpoint: the path's endpoint. By having the translation controller minimize total path distance remaining:

- Controller output is high at the start and properly tapers off at the end
- User-defined acceleration and velocity limits ensure the robot properly utilizes chassis acceleration
- The robot hits max velocity irrespective of drivetrain or tracking controller tuning

!!! tip "Quick Tuning"
    The tuning of BLine's translation PID controller is only critical at the very end of path tracking, where the robot must decelerate and stop. This domain is far more manageable compared to the time-parameterized approach.
    
    In testing, a good translational controller config was achieved in **around 5 minutes of tuning**.

### Forgiving Performance

There's **no large performance penalty for under-tuning**—the difference between optimally and sub-optimally tuned controllers is only noticeable at the very end of the robot's motion, making the tracking controller very forgiving.

In contrast, a time-parameterized controller's response is apparent along the entire path, and poorly tuned chassis or gains are noticeable across the robot's entire motion, making sub-optimal tuning less forgiving.

### Path Simplicity

BLine paths are simple and relatively quick to create.

Consider a **straight-line path** with no intermediary elements, simply going between two points where the robot is at rest at both. Both Choreo and PathPlanner would essentially create a trapezoidal motion profile, introducing the aforementioned time-parameterized controller pains for a very simple path. This takes more computational resources, adds hassle (control points, anchors, Choreo optimizer), and results in a nearly identically performing path compared to BLine.

BLine can also function with **only one path element** (waypoint), useful for aligning to the Reefscape Reef or Crescendo Amp in teleop or auto. This essentially turns BLine into a bare-bones drive-to-point PID command without the hassle of a separate solution.

## Control Architecture

### The Three PID Controllers

The BLine tracking control loop runs three separate PID controllers that work together:

| Controller | Purpose | Input | Output |
|------------|---------|-------|--------|
| **Translation** | Minimizes total remaining path distance | Distance to path end (m) | Desired velocity (m/s) |
| **Rotation** | Follows profiled rotation or snaps to target | Rotation error (rad) | Angular velocity (rad/s) |
| **Cross-Track Error (CTE)** | Minimizes deviation from path line | Perpendicular distance (m) | Correction velocity (m/s) |

The **translation controller** drives the robot to the final path element. The **rotation controller** either follows the profiled rotation or snaps directly to the target if no profile is specified. The **CTE controller** minimizes deviation from the line between the current and previous path segments, helping reduce post-handoff CTE.

### Algorithm Robustness

The BLine path tracking algorithm is **robust in its response to sharp changes in positional data**.

**Why it's stable:**

- Initial computation for translational speed magnitude depends on distance to the path's end
- Velocity direction depends on the next available waypoint
- These values are **acceleration-limited in 2D** to provide smooth robot motion toward the target
- Chassis output remains relatively stable even during erroneous odometry jitter

**Non-time-parameterized advantage:**

BLine is **not time-parameterized** like PathPlanner. The control cycle acts in a **greedy fashion**, which makes the response uniform regardless of path completion or "lag" behind the idealized path.

!!! warning "Edge Cases"
    Collisions and jitter can be problematic if they are significant enough relative to the handoff radii of the elements—particularly when the target is about to switch at high velocities relative to the max acceleration.
    
    Future improvements may include dynamic handoff radii that scale based on cross-track error and segment completion.

## Intermediary Elements & Constraints

For paths with intermediary elements, BLine retains its ease of controller tuning and computational simplicity. Just as Bézier paths have control points and anchors, BLine paths use:

- **Path elements** — Define where the robot should go
- **Handoff radii** — Control when targets switch
- **Translational velocity limiting** — Primary means of motion control

**Ranged constraints** ensure the robot doesn't overshoot intermediary elements due to high velocities. To create more complex BLine paths, users manually define these constraints. After creating one or two paths, users quickly build intuition for appropriate constraints. The GUI simulation also aids in understanding robot behavior.

Through this system of constraints, handoff radii, and path elements:

- The forgivingness and performance of the translational PID controller is maintained
- Computational simplicity is preserved
- Users gain fine control over exact robot behavior at individual path elements (velocity and precision)
- This opens the door for **rapid and effective empirical tuning, testing, and validation**

BLine provides as much intermediary control as the user wants (within polyline reason) and can create complex autonomous routines.

## Comparison to Other Solutions

| Feature | BLine | PathPlanner / Choreo | AutoPilot |
|---------|-------|---------------------|-----------|
| **Path type** | Polyline | Bézier curves | Drive-to-point |
| **Time-parameterized** | No | Yes | No |
| **Precomputation required** | No | Yes | No |
| **Tuning difficulty** | Low | Medium-High | Low |
| **Intermediary control** | Full | Full | Limited |
| **Real-time path creation** | Excellent | Limited | Excellent |
| **Complex paths** | Yes | Yes | Limited |
| **Single-point moves** | Yes | Overkill | Yes |

**Compared to AutoPilot:**

The ease of tuning should be similar, as AutoPilot also circumvents time-parameterized tracking issues via its own approach. However, AutoPilot performs best in simpler cases and isn't designed for paths requiring intermediary element control (3+ translation elements). BLine handles both simple and complex paths well.

## Current Limitations

### Event Triggers

Currently, BLine does not support event triggers built into paths. This is a planned feature (likely before kickoff or shortly after).

**Current workaround:** Users can replicate trigger-like functionality via a `WaitUntil` command checking the path follower's current tracked rotation or translation:

```java
// Example: Wait until robot is past a certain point
Commands.sequence(
    pathBuilder.build(myPath),
    // Event triggers would go here - currently use WaitUntil with custom conditions
);
```

### Sharp Corner Edge Cases

At very high velocities with small handoff radii, corner overshoot can occur. Solutions include:

- Using ranged velocity constraints before sharp turns
- Increasing handoff radii where precision isn't critical
- Adding intermediate path elements for smoother curves

!!! tip "Best Practice"
    The **max translational velocity constraint** is the most effective method for counteracting overshoot at sharp turns—more so than increasing handoff radius, which reduces path precision.
