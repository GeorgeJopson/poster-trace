// Temporary, like redirect-fn.mts, and deleted with it. A Netlify scheduled
// function: it runs every five minutes, and only on the published production
// deploy. It pings the comparison redirect function so its Lambda stays warm,
// to see how much of that function's scan latency is cold starts. AWS
// reclaims an idle Lambda after somewhere around 5 to 15 minutes. It doesn't
// keep the database awake, which would cost too much.
//
// A ping keeps one Lambda instance warm. Scans that arrive together can
// still start a second, cold instance.

// Keep in step with WARM_UP_HEADER in redirect-fn.mts. It isn't imported,
// because that would bundle the redirect handler, which queries the database
// when it loads.
const WARM_UP_HEADER = "X-Warm-Up";

export default async function warmRedirectFn() {
  const site = process.env.URL;
  if (!site) throw new Error("URL isn't set");
  const start = performance.now();
  const response = await fetch(new URL("/redirect-fn/warm-up", site), {
    headers: { [WARM_UP_HEADER]: "1" },
  });
  const ms = Math.round(performance.now() - start);
  if (response.status !== 204) {
    throw new Error(`The warm-up ping returned ${response.status} in ${ms}ms`);
  }
  console.log(`Warmed the redirect function in ${ms}ms`);
}

export const config = { schedule: "*/5 * * * *" };
