import type { Context } from "@netlify/edge-functions";
import redirect from "../edge-functions/redirect";

// Temporary: serves the scan redirect from a standard (Node, AWS Lambda)
// function as well as the edge function, so the two runtimes' cold starts
// can be compared from their [redirect-timing] logs. Its lines say
// "runtime": "function". It's the same handler, so a scan here is recorded
// like any other. Once one runtime wins, it serves /redirect/:posterId and
// this file goes, along with warm-redirect-fn.mts (see ADR-0014).

// The header warm-redirect-fn.mts sends to keep this function's Lambda warm.
// Keep in step with its copy there.
const WARM_UP_HEADER = "X-Warm-Up";

// How many warm-up pings this Lambda has handled, so a ping can tell whether
// it found the Lambda cold.
let warmUpPings = 0;

export default async function redirectFn(request: Request, context: Context) {
  // A warm-up ping only needs the Lambda to run: it skips the handler, so it
  // never queries the database, fetches the not found page or records a
  // scan. Loading this module still runs the handler module's own warm-up.
  if (request.headers.has(WARM_UP_HEADER)) {
    warmUpPings += 1;
    console.log(
      "[redirect-timing]",
      JSON.stringify({
        event: "warm-up-ping",
        runtime: "function",
        coldStart: warmUpPings === 1,
        warmUpPings,
      }),
    );
    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  }
  return redirect(request, context);
}

// It runs in the site's functions region (London, set in the Netlify UI),
// near the scanners and the database. A region here would override it.
export const config = { path: "/redirect-fn/:posterId" };
