import type { Context } from "@netlify/edge-functions";
import redirect, { countRequest } from "../edge-functions/redirect";

// Temporary: serves the scan redirect from a standard (Node, AWS Lambda)
// function as well as the edge function, so the two runtimes' cold starts
// can be compared from their [redirect-timing] logs. Its lines say
// "runtime": "function". It's the same handler, so a scan here is recorded
// like any other. Once one runtime wins, it serves /redirect/:posterId and
// this file goes, along with warm-redirect-fn.mts (see ADR-0014).

// The header warm-redirect-fn.mts sends to keep this function's Lambda warm.
// Keep in step with its copy there.
const WARM_UP_HEADER = "X-Warm-Up";

export default async function redirectFn(request: Request, context: Context) {
  // A warm-up ping only needs the Lambda to run: it skips the handler, so it
  // never queries the database, fetches the not found page or records a
  // scan. Loading this module still runs the handler module's own warm-up.
  // It counts as a request, so a scan after it isn't logged as a cold start,
  // and its line carries the Lambda's instance, like the scans' lines.
  if (request.headers.has(WARM_UP_HEADER)) {
    console.log(
      "[redirect-timing]",
      JSON.stringify({
        event: "warm-up-ping",
        runtime: "function",
        requestId: context.requestId,
        ...countRequest(),
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
