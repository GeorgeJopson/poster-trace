# A poster's location is confirmed by the person registering it

A poster's location is where the person registering it says the poster is, not what their browser reported. Registering takes a fix from the browser as a starting point, shows it as a marker on a street-level map, and lets the person drag the marker to the poster's exact spot before submitting. So a location is just a latitude and longitude, and it has no accuracy.

Previously a location was the browser's fix as reported, with its accuracy in metres. Once the marker can be dragged, the browser's accuracy says nothing about the saved point: someone who drags a 50 m fix onto the right doorway has a better location than the fix, not a worse one. Nothing read the accuracy anyway. The analytics map draws posters as points, and the registration dialog was the only place that showed it. The `accuracy` column is dropped, along with its existing values.

## Considered Options

- **A nullable accuracy**, set only when the marker isn't moved. This keeps a number that's only sometimes there and means different things depending on how the registration was made, for no reader.
- **Keeping the original fix's accuracy** even after a drag. This describes a point that wasn't saved, so it would mislead anyone who later read it as the saved location's accuracy.

## Consequences

The dropped accuracy values can't be recovered. If accuracy is ever needed again, for example to flag posters placed far from where the browser put the person, it has to be recorded as a separate fact about how the location was taken, not as part of the location.
