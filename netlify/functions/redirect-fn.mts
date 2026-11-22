import redirect from "../edge-functions/redirect";

// Temporary: serves the scan redirect from a standard (Node, AWS Lambda)
// function as well as the edge function, so the two runtimes' cold starts
// can be compared from their [redirect-timing] logs. Its lines say
// "runtime": "function". It's the same handler, so a scan here is recorded
// like any other. Once one runtime wins, it serves /redirect/:posterId and
// this file goes (see ADR-0014).
export default redirect;

// It runs in the site's functions region (London, set in the Netlify UI),
// near the scanners and the database. A region here would override it.
export const config = { path: "/redirect-fn/:posterId" };
