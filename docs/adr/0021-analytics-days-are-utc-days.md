# Analytics days are UTC days

A campaign's scans over time count scans by day, and a day is a calendar day in UTC, whoever is viewing. A campaign begins on the UTC day it was created. The chart says so in a note under it: "Days are in UTC."

Previously, days were the viewer's own. The database counted scans in 15-minute slots on the quarter hour in UTC, and the browser grouped them into days in the viewer's time zone, filled in days without scans, and worked out today. As the server didn't know the viewer's time zone, the chart could only be drawn in the browser, with a placeholder until then. Poster Trace is aimed at British users, so that machinery bought little.

## Decisions

- **The database counts scans by UTC day.** `PosterAnalyticsLookup.countDailyScans` groups a campaign's scans by design and day. Times are stored in UTC, so a scan's day is the date of its stored time. Scan slots are gone.
- **The application layer gives the full run of days.** `AnalyticsService` gives each day from the one the campaign began through today, with every design's scans on each, 0 on days without scans. It takes the current time as a `now` function, as `RegistrationService` does. A day after today, from a clock running ahead, is left out.
- **The browser only draws.** It labels each design's series and combines the designs past the chart's colours into one. The chart is drawn on the first render, with no placeholder.

## Considered Options

- **The viewer's time zone**, as before. It was rejected because it needs the 15-minute slots, the re-grouping in the browser and a chart that can't render on the server, for users who are almost all in one time zone.
- **UK time (`Europe/London`).** It would be no more work on the server, and during British Summer Time it would put a scan between midnight and 01:00 on the day a British user lived it, rather than the day before. It was rejected in favour of a fixed rule with no daylight saving changes, which doesn't assume where the user is; the note under the chart makes it clear.

## Consequences

Going back to the viewer's time zone means counting in slots smaller than any time zone offset again, and moving the grouping into days back to the browser.
