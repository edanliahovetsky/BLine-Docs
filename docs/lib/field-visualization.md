# Field2d Preview

Draw a loaded BLine polyline on WPILib `Field2d` so drive-team members can verify the selected path in Elastic, Glass, or another compatible dashboard.

## Publish the field

```java
import edu.wpi.first.wpilibj.smartdashboard.Field2d;
import edu.wpi.first.wpilibj.smartdashboard.SmartDashboard;
import frc.robot.lib.BLine.BLineField;
import frc.robot.lib.BLine.Path;

Field2d field = new Field2d();
SmartDashboard.putData("Field", field);

Path scoreTwo = new Path("score-two");
BLineField.drawPath(field, "ScoreTwo", scoreTwo);
```

The explicit name is normalized to `ScoreTwoTrajectory`. If it already ends in `Trajectory`, BLine leaves it unchanged.

## Use stable display slots

Reusing an explicit name updates the same Field2d object:

```java
BLineField.drawPath(field, "SelectedAuto", selectedPath);
```

This is useful when an autonomous chooser changes. The dashboard keeps one predictable display slot.

The unnamed overload returns an automatically assigned stable name for the same `Field2d` and `Path` instance:

```java
String objectName = BLineField.drawPath(field, scoreTwo);
```

Prefer explicit names for operator-facing displays.

## What is drawn

`Path.getTranslations()` returns waypoint and translation-target positions in path order. It ignores rotation targets and event triggers. `BLineField` publishes those points as a connected polyline.

```java
List<Translation2d> anchors = scoreTwo.getTranslations();
```

This is the authored geometry—not an animated prediction, time-parameterized trajectory, or simulated robot path.

## Show the live robot too

Update the standard robot pose separately:

```java
field.setRobotPose(driveSubsystem.getPose());
```

With the planned polyline and live pose visible together, operators can catch:

- the wrong path selected;
- a stale/missing deploy file;
- a coordinate-origin or alliance-transform mistake; and
- a robot pose that does not match its field placement.

## When to draw transformed paths

`BLineField.drawPath` displays the `Path` object you pass. If the command builder will flip/mirror only its internal copy at initialization, drawing the original object still shows the authored blue-origin path.

For an operator preview of the actual alliance-side route, make a copy and apply the same intended transform before drawing it. Keep that preview policy in one place so the display and command cannot be double-transformed independently.

## Match-day check

Before enabling autonomous:

1. Confirm chooser name and displayed path agree.
2. Confirm the first point matches the robot's physical start.
3. Confirm the live pose is on the same field side.
4. Confirm the planned route clears field geometry.
5. Confirm alliance flip/mirror policy exactly once.

Field2d catches selection and coordinate mistakes; it does not validate constraints, events, heading targets, or physical feasibility.
