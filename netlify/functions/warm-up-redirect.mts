// A Netlify scheduled function: it runs every five minutes, and only on the
// published production deploy, so previews aren't pinged. It pings the scan
// redirect (redirect.mts) so its Lambda stays warm, as AWS reclaims an idle
// one after somewhere around 5 to 15 minutes (ADR-0020). The redirect
// answers without touching the database, so the database can still scale to
// zero.
//
// It keeps one Lambda warm. Scans that arrive together can still start a
// second, cold one, which pays for the Lambda starting but not the
// database, as the target comes from Netlify Blobs. If that becomes a
// problem, send several pings at once.

// Keep in step with WARM_UP_HEADER in redirect.mts. It isn't imported,
// because that would bundle the whole redirect into this function.
const WARM_UP_HEADER = "X-Warm-Up";

export default async function warmUpRedirect() {
  const site = process.env.URL;
  if (!site) throw new Error("URL isn't set");
  const response = await fetch(new URL("/redirect/warm-up", site), {
    headers: { [WARM_UP_HEADER]: "1" },
  });
  if (response.status !== 204) {
    throw new Error(`The redirect's warm-up ping returned ${response.status}`);
  }
}

export const config = { schedule: "*/5 * * * *" };
