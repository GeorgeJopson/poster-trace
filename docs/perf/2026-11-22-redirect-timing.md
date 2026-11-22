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

## Follow-up: function and database moved to the UK

The function and database regions were moved to the UK, and the script was
rerun three times against deploy preview 58 (`perf/redirect-timing`, so with
`Server-Timing`):
`https://deploy-preview-58--postertrace.netlify.app/redirect/03506187-82d5-4d1c-8138-d2039ba025ed`.
Same setup as above: 20 requests each, 0.5 s apart, MacBook on Wi-Fi. All
requests hit an instance that was already warm: no row was marked `cold`.

The first attempt got `401` on every request, because deploy previews are
behind Netlify's access protection, so the requests never reached the function.
Those runs only show that Netlify's edge answers in about **40 ms** of server~.

### Summary

| server~ (ms) | Prod 1 | Prod 2 | Prod 3 | UK preview 1 | UK preview 2 | UK preview 3 |
| ------------ | ------ | ------ | ------ | ------------ | ------------ | ------------ |
| First        | 10,031 | 2,361  | 547    | 568          | 263          | 269          |
| Min          | 166    | 171    | 167    | **80**       | **80**       | **83**       |
| Median       | 290    | 373    | 274    | 275          | 105          | 204          |
| p95          | 1,115  | 2,361  | 546    | 568          | 295          | 279          |
| Max          | 10,031 | 4,061  | 547    | 769          | 416          | 333          |

All responses were `307`. `lookup` and `handler` were about **5 ms** in almost
every row (78 ms on the first request of run 1, likely a new database
connection; otherwise 59 ms at most).

### What the region move fixed

- **The floor halved, from about 166 ms to about 80 ms.** The drop of about
  85 ms is roughly one transatlantic round trip. Requests enter Netlify's edge
  in the UK, and before the move the edge had to call a function in the US
  (Netlify's default region) and wait for it.
- **The warm tail got shorter.** Max was 333 to 769 ms, against up to 4 s for
  warm requests in production.
- **The database is not the bottleneck when warm.** `lookup` takes nearly all
  of `handler`, and both are about 5 ms.

### What it didn't fix

- **The median.** Run 1's median (275 ms) matches production run 3's (274 ms).
  server~ still clusters at about 80–105, 200–230, 260–300 and 330–420 ms.
  `handler` stays at about 5 ms throughout, so the steps don't come from the
  code or the database. That rules out the "sequential database calls"
  explanation in finding 4. What's left is the platform or the client's Wi-Fi.
  TLS held steady at about 90 ms while server~ stepped, which fits a radio that
  dozes while it waits for the server and wakes on the next beacon.
- **Cold starts haven't been measured.** None of the 60 requests was cold, so
  it's still unknown how much of production's 2 to 10 s first request the move
  removes.

Caveat: this compares production (old region, no `Server-Timing`) with a
preview (UK, with `Server-Timing`). Adding the header costs almost nothing, so
the region is the likely cause, but rerunning against production after the
deploy would confirm it.

### Next steps

1. Rule out Wi-Fi: rerun with `ping -i 0.05 1.1.1.1` going in another terminal,
   or over Ethernet or from a cloud VM. If server~ settles at about 80–100 ms,
   the warm tail is client-side.
2. Measure a cold start: leave the preview idle for 10+ minutes, then run the
   script. If `lookup` is most of the first request, it's the database waking
   from scale-to-zero; if `cold` appears and `handler` stays small, it's the
   function and platform.
3. After deploying to production, rerun against production to confirm the
   numbers match the preview.

The preview's test poster has 60 extra scans from these runs (80 including the cold run below).

## Where the time goes on a warm request

Putting the UK preview runs together with the `401` runs:

| Part                                                | ms     | Source                                                  |
| --------------------------------------------------- | ------ | ------------------------------------------------------- |
| Connection setup (DNS + TCP + TLS)                  | ~90–95 | `tls` column                                            |
| Request round trip, client to Netlify's edge        | ~40–45 | `401` runs answered from the edge in ~40 ms; TCP ~45 ms |
| Netlify invoking the function, Next.js              | ~30–35 | server~ floor (80) − round trip − handler               |
| Handler, almost all of it the lookup                | ~5     | `handler`                                               |
| Steps of ~100 ms on top of the floor (0 to 3 steps) | 0–300  | Present in the `401` runs too, so not the function      |

The warm bottleneck is not the code or the database. The floor is mostly round
trips and function invocation. The variable part sits between the edge and the
client and is most likely Wi-Fi power-saving; the `ping` test above would
confirm it.

## Cold start after the region move

One run against the UK preview after it had been idle, on 2026-11-22. The first
request was marked `cold`.

| Part                                                     | ms         | Source               |
| -------------------------------------------------------- | ---------- | -------------------- |
| Round trip, client to Netlify                            | ~45        | Same as warm         |
| Lookup: opening the DB connection, waking the DB if idle | **812**    | `lookup`             |
| Rest of the handler                                      | ~2         | `handler` − `lookup` |
| Netlify starting an instance, loading Next.js, routing   | **~3,350** | 4,203 − 814 − 45     |
| **Total server~**                                        | **4,203**  |                      |

Request #2 was back to normal (lookup 17 ms, server~ 291 ms). The rest of the
run matched the warm runs: floor about 85 ms, median 219 ms, handler about
5 ms.

Compared with production's 10 s cold request, this is about 4.2 s, and about
80% of it is the platform rather than the database. It's one cold request
against one, possibly after different idle times, so the improvement isn't
firmly measured yet. Repeat it a few times after the same idle time to confirm.

### What to do about it

The ~3.4 s of platform time is the main target. Every redirect currently goes
through the whole Next.js server function, which has to load before the 5 ms of
redirect code can run. Options, most effective first:

1. **Move `/redirect/[id]` into a Netlify Edge Function.** Edge functions start
   in tens of ms, run close to the scanner, and can use `@netlify/database`. A
   cold start would then be roughly the database part alone. The cost is a
   second copy of the redirect and scan-recording logic outside Next.js.
2. **Move it into a small standalone Netlify Function.** One that bundles only
   the database client typically starts in a few hundred ms rather than
   seconds. Same cost as option 1, but on the Node runtime already in use.
3. **Keep the function warm with a scheduled ping.** Cheap, but doesn't help
   when Netlify starts an extra instance. The ping must not record a scan, and
   it would stop the database from scaling to zero, which may cost more.

The ~0.8 s of database time comes second. Timing the connection separately from
the query inside `lookup` would show whether it's opening the connection or the
database waking up.

Recommended next step: prototype option 1 and rerun this cold test against it.

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

### UK preview run 1

```
   #     dns     tcp     tls    ttfb   server~   total   lookup  handler  status
   1       2      48      96     664       568     664       78       78     307
   2       3      44     100     376       275     376        5        5     307
   3       4      49      95     864       769     864        5        5     307
   4       5      49     100     391       291     391        5        5     307
   5       4      55     106     385       279     385        5        5     307
   6       4      44      96     375       279     375        5        5     307
   7       4      44      92     366       274     366        9        9     307
   8       4      56     104     465       361     465        5        5     307
   9       4      46      95     346       250     346        5        5     307
  10       4      48      97     395       298     395        5        5     307
  11       4      47      97     366       269     366        6        6     307
  12       4      46      94     489       395     489        5        5     307
  13       4      45      95     175        80     175        5        5     307
  14       4      45      96     353       257     353        5        5     307
  15       4      44      93     402       308     402        5        5     307
  16       4      47      96     188        92     188        5        5     307
  17       4      48      95     194        99     194        5        5     307
  18       3      42      90     397       307     397       12       12     307
  19       4      51      95     362       267     362        5        5     307
  20       4      50     100     366       266     366        5        5     307
server~  first 568  min 80  median 275  p95 568  max 769
```

### UK preview run 2

```
   #     dns     tcp     tls    ttfb   server~   total   lookup  handler  status
   1       2      46      91     354       263     354        5        5     307
   2       4      60     109     192        83     192        5        5     307
   3       4      45      96     185        88     185        5        5     307
   4       4      44      92     179        87     179        8        8     307
   5       2      42      90     386       295     386        5        5     307
   6       5      44      90     351       261     352        5        5     307
   7       4      43      89     175        87     176        5        5     307
   8       4      45      95     182        88     183        5        5     307
   9       4      48      92     173        80     173        5        5     307
  10       4      48      97     363       267     363        5        5     307
  11       4      43      91     507       416     507        5        5     307
  12       4      43      89     365       275     365        5        5     307
  13       4      48      96     366       270     366        5        5     307
  14       4      45      93     174        82     174        5        5     307
  15       3      42      87     215       128     215       16       16     307
  16       4      44      95     326       231     326       59       59     307
  17       4      47      91     364       273     365        5        5     307
  18       3      46      96     186        90     186        5        5     307
  19       4      50     104     204       100     204        5        5     307
  20       4      44      92     197       105     197        5        5     307
server~  first 263  min 80  median 105  p95 295  max 416
```

### UK preview run 3

```
   #     dns     tcp     tls    ttfb   server~   total   lookup  handler  status
   1       2      42      88     356       269     357        5        5     307
   2       4      42      85     364       279     364        5        5     307
   3       2      42      90     190       100     190        5        5     307
   4       2      42      89     175        86     175        5        5     307
   5       4      45      95     300       204     300        5        5     307
   6       4      44      91     317       226     317        5        5     307
   7       3      43      94     366       272     366        5        5     307
   8       4      47      99     181        83     181        5        5     307
   9       4      42      90     304       214     304        5        5     307
  10       4      47      91     289       198     289        5        5     307
  11       3      43      89     182        92     182        5        5     307
  12       4      45      95     299       204     299        5        5     307
  13       4      44      91     425       333     425        4        4     307
  14       4      43      92     307       215     307        4        5     307
  15       4      44      92     296       204     296        5        5     307
  16       4      53     103     192        89     192        5        5     307
  17       4      42      92     283       191     283        5        5     307
  18       4      46      96     364       268     364        5        5     307
  19       4      46      96     306       211     306        5        5     307
  20       4      44      95     365       270     365        5        5     307
server~  first 269  min 83  median 204  p95 279  max 333
```

### UK preview cold run

```
   #     dns     tcp     tls    ttfb   server~   total   lookup  handler  status
   1      18      57     101    4304      4203    4304      812      814     307  cold
   2       4      49      99     389       291     389       17       17     307
   3       4      42      89     288       199     288        5        5     307
   4       4      43      91     359       267     359        5        5     307
   5       4      46      94     314       219     314        5        5     307
   6       4      44      92     488       396     488        5        5     307
   7       4      50      98     184        86     184        6        6     307
   8       4      46      94     184        91     184        5        5     307
   9       4      47      98     532       434     532       17       17     307
  10       4      45      92     297       205     297        5        5     307
  11       4      44      93     344       251     344        5        5     307
  12       3      41      82     768       685     768        5        5     307
  13       4      46      97     303       206     303        5        5     307
  14       4      43      90     371       281     371        5        5     307
  15       4      46      94     524       430     524       43       43     307
  16       4      47      97     185        88     185        5        5     307
  17       4      47      95     186        92     186        4        4     307
  18       3      49      99     184        85     184        6        6     307
  19       2      46      91     399       308     399        4        4     307
  20       4      45      92     290       197     290        6        6     307
server~  first 4203  min 85  median 219  p95 685  max 4203
```
