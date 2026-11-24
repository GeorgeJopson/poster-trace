import { getDeployStore, getStore, type Store } from "@netlify/blobs";

// Where the copy of each poster's target is kept for the scan redirect
// (ADR-0020). Both sides open the store through this, so they can't drift:
// the app (NetlifyScanTargetCopy) and the redirect function
// (netlify/functions/redirect.mts). Keep it free of path aliases and of
// "server-only", so the redirect function can bundle it on its own.

/**
 * The closest Blobs region to the site's functions (London). A site-wide
 * store defaults to us-east-2 rather than following the functions region, so
 * it's named on every call, or that side silently sees an empty store.
 */
const PRODUCTION_REGION = "eu-central-1";

/**
 * The scan target store for a Netlify deploy context. Production's is
 * site-wide, so it survives deploys. Every other context (deploy previews,
 * branch deploys and `netlify dev`) has its own database branch, so it gets
 * a store of its own deploy, which starts empty and is filled by the
 * redirect's fallback. A shared store would leak posters and target changes
 * between them.
 */
export function scanTargetStore(netlifyContext: string | undefined): Store {
  if (netlifyContext === "production") {
    return getStore({
      name: "scan-targets-production",
      region: PRODUCTION_REGION,
    });
  }
  return getDeployStore({ name: "scan-targets" });
}
