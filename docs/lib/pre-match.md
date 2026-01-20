# Pre-Match Module Orientation

For optimal autonomous start, pre-orient swerve modules:

```java
// During robot setup or auto init
Path firstPath = new Path("firstAutoPath");
Rotation2d initialDirection = firstPath.getInitialModuleDirection();

// Orient modules before match starts
driveSubsystem.setModuleOrientations(initialDirection);
```

This prevents micro-deviations at auto start caused by modules rotating while driving.
