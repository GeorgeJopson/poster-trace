import redirect from "../edge-functions/redirect";

// Temporary: serves the scan redirect from a standard (Node, AWS Lambda)
// function as well as the edge function, so the two runtimes' cold starts
// can be compared from their [redirect-timing] logs. Its lines say
// "runtime": "function". It's the same handler, so a scan here is recorded
// like any other. Once one runtime wins, it serves /redirect/:posterId and
// this file goes (see ADR-0014).
export default redirect;

export const config = {
  path: "/redirect-fn/:posterId",
  // Next to the database, which looks to be in or near Frankfurt
  // (aws-eu-central-1), so the comparison isn't skewed by distance.
  region: "fra",
};
