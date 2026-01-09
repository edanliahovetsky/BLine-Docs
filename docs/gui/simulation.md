# Simulation

BLine-GUI includes a built-in simulation that previews how your robot will follow the path. This helps validate paths before deploying to hardware.

<!-- GIF: Full simulation playback -->
![Simulation Demo](../assets/gifs/robot-demos/simulation-demo.gif)

## Transport Controls

The simulation controls appear at the bottom-left of the canvas:

| Control | Function |
|---------|----------|
| **▶ / ⏸** | Play/pause simulation |
| **Timeline slider** | Scrub through the path |
| **Time display** | Current time / total duration |

### Play/Pause

Click the **▶ button** or press **Space** to start the simulation. The robot icon will move along the path following the defined constraints.

Click **⏸** or press **Space** again to pause.

### Timeline Scrubbing

Drag the **timeline slider** to jump to any point in the path. This lets you inspect specific moments without watching the entire simulation.

### Time Display

The time display shows `current / total` in seconds, giving you the estimated path duration.

## Visual Feedback

During simulation, the canvas shows additional information:

### Robot Position

A robot icon shows the current simulated position and rotation. The icon rotates to match the robot's orientation.

### Trajectory Trail

An **orange trail** shows the path the robot has traveled during the simulation. This helps visualize the actual trajectory versus the intended path.

### Velocity Indication

The robot icon's movement speed reflects the simulated velocity, giving you a sense of how constraints affect the robot's speed at different parts of the path.

## Understanding Simulation Results

### What the Simulation Shows

- **Path timing**: Estimated duration for the entire path
- **Velocity profile**: How fast the robot moves at each segment
- **Trajectory shape**: The actual path the robot follows
- **Rotation behavior**: How the robot rotates along the path

### What the Simulation Doesn't Show

!!! warning "Simulation Limitations"
    The simulation uses idealistic kinematics and assumes the drivetrain responds instantly to commanded velocities. Key limitations:
    
    - **No PID simulation**: Uses a simplified `v = √(2ad)` formula instead of actual PID control
    - **No wheel slip**: Assumes perfect traction
    - **No disturbances**: No external forces or field interactions
    - **Instant acceleration**: Doesn't model motor response time

### Real-World Testing

The simulation provides an **initial visualization** of your path, but for accurate results:

1. Use a physics simulation framework like **WPILib's simulation**
2. Test on actual hardware
3. Iterate based on empirical results

!!! tip "Rapid Iteration"
    BLine is designed for rapid iteration. Use the GUI simulation for quick checks, then test on hardware. The fast path computation time means you can quickly adjust and re-test.

## Tips for Using Simulation

### Check Constraint Effects

Play the simulation while adjusting constraints to see how they affect:

- Overall path time
- Speed through different segments
- Smooth transitions between elements

### Identify Problem Areas

Watch for:

- **Overshoot on corners**: May indicate overly aggressive constraints or insufficient deceleration
- **Sharp slowdowns**: May indicate overly aggressive constraints
- **Corner cutting**: Handoff radius might be too large
- **Hesitation**: Handoff radius might be too small
- **Unusual rotations**: Check profiled rotation settings

### Validate Path Order

The simulation helps verify that elements are in the correct order and that the path flows as intended.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Play/pause simulation |

