# Poster design images: blob keys on the design row, deletes only in production and local dev

Partly superseded by ADR-0013: orphaned images are now deleted by a daily job, which is the only thing that deletes them, and `PosterDesignImageRef` is gone, so the domain never sees image keys.

Each poster design's image lives in Netlify Blobs, under a key that infrastructure generates and stores on the `poster_design` row. The domain only sees that key as an opaque `PosterDesignImageRef`, during account deletion. Blobs are deleted only in production and local dev (`NetlifyBlobStore.deletesAllowedIn`). Deploy previews and branch deploys get their own database branch but **share production's Blobs store**, so a delete there could destroy production images.

## Consequences

- Account deletion reads the user's image refs first (deleting the user cascades to the designs that hold the keys), then deletes the account, then the blobs. If the last step fails, the orphaned images are accepted for now; there's no clean-up job.
