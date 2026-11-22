# Scan redirect timing — 2026-11-22

Three runs of `npm run time:redirect` (`scripts/time-redirect.sh`) against
production, `https://www.postertrace.app/redirect/f1aa7b57-ae06-4931-ba0a-c300c75e269d`,
20 requests each, 0.5 s apart, from a MacBook on Wi-Fi.

All times are in ms. `server~` = TTFB − TLS (cumulative), i.e. roughly the time
from the handshake finishing to the first byte: platform + function + database.

## Summary

| Run | First request (server~) | Min | Median | p95   | Max    | Notable spikes            |
| --- | ----------------------- | --- | ------ | ----- | ------ | ------------------------- |
| 1   | **10,031**              | 166 | 290    | 1,115 | 10,031 | #12: 1,115                |
| 2   | **2,361**               | 171 | 373    | 2,361 | 4,061  | #4: **4,061**, #10: 1,357 |
| 3   | 547 (already warm)      | 167 | 274    | 546   | 547    | none                      |

Network legs were stable throughout: DNS ≈ 4 ms, TCP round trip ≈ 45 ms.
All responses were `307`.

## Findings

### 1. No Server-Timing data, because production doesn't have it yet

The `lookup` and `handler` columns are `-` in every row. The commit that adds
the `Server-Timing` header (`a59a0bd`) is only on `perf/redirect-timing`, and
production runs `main`. So these runs can't separate database time from
platform time.

### 2. Cold starts are the real problem

- Run 1's first request took **10 s**. A function cold start alone is usually
  a few hundred ms, so most of this is probably Netlify Database waking from
  scale-to-zero (and maybe the connection pool too).
- Run 2 had a **4 s** spike on request #4, halfway through a run with requests
  0.5 s apart, so the function was already warm. Something probably cycled: a
  new instance, a dropped DB connection, or a different region. The `cold`
  marker in `Server-Timing` will show whether it was a new instance.
- For someone scanning a poster, one wait of 2 to 10 s matters more than the
  median. A poster that hasn't been scanned for a while will hit this every time.

### 3. A warm request is acceptable but not fast

- Warm server~ has a median of about 275 to 370 ms and a floor of about 170 ms.
- The round trip is about 45 ms, so even at best there's roughly 120 ms or more
  of server work for one lookup and a 307.
- Warm end-to-end TTFB is about 270 to 500 ms.

### 4. The times jump in steps of about 100 ms, which may partly be the client's Wi-Fi

Warm server~ values cluster at about 170, 280, 380, 490 and 600 ms. TLS shows
the same split (cumulative TLS is either about 95 or about 205). Steps of about
100 ms in both the handshake and the server time point to one of two causes:

- **Wi-Fi power-saving on the Mac.** The radio sleeps and the router holds
  packets until its next beacon, which comes every 102.4 ms. That fits the step
  size almost exactly.
- **Several sequential database calls of about 100 ms each.** This would mean
  the function and the database are in different regions.

## Next steps

1. Deploy `perf/redirect-timing` (or use its deploy preview) and rerun, so the
   `lookup`, `handler` and `cold` columns fill in:
   `npm run time:redirect -- <preview-url>/redirect/<id>`. The preview has its
   own database branch, so the poster ID may be different there.
2. If `lookup` makes up most of the cold time, look at the database's
   scale-to-zero timeout and its region compared with the function's region.
3. Rule out Wi-Fi: rerun with `ping -i 0.05 1.1.1.1` going in another terminal
   (this keeps the radio awake), or over Ethernet or from a cloud VM. If the
   100 ms steps go away, the slow tail is client-side.

Note: each run recorded 20 scans, so the test poster has 60 extra scans from
these runs.

## Raw output

### Run 1

```
   #     dns     tcp     tls    ttfb   server~   total   lookup  handler  status
   1     140     184     350   10380     10031   10380        -        -     307
   2       4      48     206     699       493     700        -        -     307
   3       4      47     205     506       301     506        -        -     307
   4       3      46     195     478       283     478        -        -     307
   5       3      37     197     482       285     482        -        -     307
   6       5      53     209     484       275     484        -        -     307
   7       4      50     204     494       290     494        -        -     307
   8       5      51     205     492       288     492        -        -     307
   9       4      41     199     633       434     633        -        -     307
  10       5      48     205     913       708     914        -        -     307
  11       5      42     195     474       278     474        -        -     307
  12       5      51     203    1318      1115    1318        -        -     307
  13       3      45      93     258       166     259        -        -     307
  14       5      51     102     474       372     474        -        -     307
  15       5      45     103     282       180     282        -        -     307
  16       4      45     202     487       285     487        -        -     307
  17       4      54     208     481       272     481        -        -     307
  18       4      50     215     630       415     630        -        -     307
  19       5      47     205     530       325     530        -        -     307
  20       5      51     214     817       603     817        -        -     307
server~  first 10031  min 166  median 290  p95 1115  max 10031
```

### Run 2

```
   #     dns     tcp     tls    ttfb   server~   total   lookup  handler  status
   1       3      50     200    2560      2361    2560        -        -     307
   2       4      51     213     817       604     817        -        -     307
   3       4      43      96     468       373     468        -        -     307
   4       4      41      90    4151      4061    4152        -        -     307
   5       4      42     199     496       297     496        -        -     307
   6       4      45     208     498       290     498        -        -     307
   7       4      42      93     281       188     281        -        -     307
   8       5      58     110     300       190     300        -        -     307
   9       3      42     201     820       619     820        -        -     307
  10       5      49     103    1461      1357    1461        -        -     307
  11       5      43      93     383       290     383        -        -     307
  12       5      45      96     457       361     457        -        -     307
  13       4      46     215     511       296     512        -        -     307
  14       4      44     201     638       437     638        -        -     307
  15       5      45      95     266       171     266        -        -     307
  16       4      43      94     653       559     653        -        -     307
  17       4      43      94     635       541     635        -        -     307
  18      25      72     127     615       488     615        -        -     307
  19       5      47     207     937       730     938        -        -     307
  20       5      48     101     275       174     275        -        -     307
server~  first 2361  min 171  median 373  p95 2361  max 4061
```

### Run 3

```
   #     dns     tcp     tls    ttfb   server~   total   lookup  handler  status
   1       2      45      94     641       547     641        -        -     307
   2       4      45      93     272       179     272        -        -     307
   3       4      44     100     393       293     393        -        -     307
   4       4      48     101     269       169     269        -        -     307
   5       4      45      95     379       284     379        -        -     307
   6       5      48     106     375       269     375        -        -     307
   7       4      52     102     274       173     274        -        -     307
   8       5      49     207     477       270     477        -        -     307
   9       4      48     102     276       173     276        -        -     307
  10       4      50     103     276       172     276        -        -     307
  11       4      47     100     394       294     394        -        -     307
  12       5      44     100     645       546     645        -        -     307
  13       4      45      98     478       381     478        -        -     307
  14       4      43     200     706       507     706        -        -     307
  15       3      57     104     593       489     593        -        -     307
  16       4      46      97     371       274     371        -        -     307
  17       6      42      99     394       294     394        -        -     307
  18       5      47      99     377       277     377        -        -     307
  19       5      52     106     273       167     274        -        -     307
  20       4      44      98     273       175     273        -        -     307
server~  first 547  min 167  median 274  p95 546  max 547
```
