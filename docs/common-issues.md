# Common Issues

Common issues and solutions when working with BLine paths. This guide covers the most frequently encountered problems and provides actionable steps to resolve them.

## Robot Overshoots at Turns

**Causes:**

- Velocity too high for handoff radius
- Handoff radius too small

**Solutions:**

1. Add velocity constraint before the turn
2. Increase handoff radius at that element
3. Add an intermediate TranslationTarget to break up the path

## Robot Hesitates at Waypoints

**Causes:**

- Handoff radius too small
- Velocity constraint too aggressive

**Solutions:**

1. Increase handoff radius
2. Review velocity constraints

## Path Takes Longer Than Expected

**Causes:**

- Constraints too conservative
- Too many elements
- End tolerances too tight

**Solutions:**

1. Review constraint values
2. Simplify path with fewer elements
3. Loosen end tolerances if precision isn't critical

## Robot Doesn't Face Correct Rotation

**Causes:**

- Missing rotation target
- Profiled rotation causing slow transition
- Rotation controller P too low

**Solutions:**

1. Add RotationTarget or Waypoint with desired rotation
2. Try non-profiled rotation for immediate rotation change
3. Tune rotation controller gains