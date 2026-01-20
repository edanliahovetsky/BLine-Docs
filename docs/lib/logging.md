# Logging

`FollowPath` exposes optional static logging hooks so you can stream internal state to your logger (for example, **AdvantageKit**). Each hook receives a `Pair<String, T>` where the key identifies the metric and the value carries the data.

## Consumer-Based Logging

Register any combination of the logging consumers before running commands:

```java
FollowPath.setDoubleLoggingConsumer(pair -> {
    Logger.recordOutput(pair.getFirst(), pair.getSecond());
});

FollowPath.setBooleanLoggingConsumer(pair -> {
    Logger.recordOutput(pair.getFirst(), pair.getSecond());
});

FollowPath.setPoseLoggingConsumer(pair -> {
    Logger.recordOutput(pair.getFirst(), pair.getSecond());
});

FollowPath.setTranslationListLoggingConsumer(pair -> {
    Logger.recordOutput(pair.getFirst(), pair.getSecond());
});
```

Common keys include:

- `FollowPath/pathTranslations`
- `FollowPath/robotTranslations`
- `FollowPath/crossTrackError`
- `FollowPath/targetRotation`
