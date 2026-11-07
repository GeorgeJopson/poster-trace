# Orphaned design images are deleted by a daily job

This supersedes ADR-0008's consequence that orphaned images are accepted with no clean-up job, and ADR-0012's decisions that new blobs are written before the transaction and deleted if it fails. A Netlify scheduled function (`netlify/functions/delete-orphaned-design-images.mts`) runs `OrphanedDesignImageCleanup` once a day. It deletes every blob in the poster design store that no `poster_design` row points to, and it's the only thing that deletes images. Deleting an account, and later a campaign or a design, only deletes rows. Nothing has to collect image keys first, so the domain never sees them.

## Decisions

- **Orphans are only deleted once they're a day old.** `save` uploads a new design's image inside the transaction, before the row commits. A job that ran in between would otherwise delete an image that's about to be used. Each blob's metadata records when it was uploaded. Blobs stored before that was recorded count as old.
- **`save` uploads only for designs whose row it inserted.** It tries to insert every design with a new key, and if the insert succeeds it uploads the design's in-memory `image` under that key. Images never change, so a stored design never uploads again. If the commit then fails, the uploaded blob is an orphan, and the job removes it.
- **`PosterDesign` carries its image.** A new design holds the image it was created with. A restored design gets a loader from the repository and fetches its image on the first `loadImage()`, so loading a campaign doesn't read every PDF. The key stays inside the loader. Serving an image still streams it through `findDesignImageForOwner`.
- **Deploy previews lose their own uploads.** The job runs only on production, against production's database. Previews share production's Blobs store (ADR-0008), so production sees an image uploaded from a preview as an orphan and deletes it within a day or two. A preview's database branch can also point to an image that production has since deleted. Previews are throwaway, so broken images there are accepted. Previews still never delete (`NetlifyBlobStore.deletesAllowedIn`).

- **The function wires its own objects.** `di/container.ts` is `server-only` and only Next can import it, so the scheduled function builds the job itself, using the same `NetlifyBlobStore.forPosterDesigns()` as the container.
- **The seed script is the one exception.** It still deletes the images of the campaigns it clears, because the job doesn't run locally.

## Considered Options

- **Deleting images as part of each delete**, as account deletion did. It was rejected because every new way of deleting rows (campaigns, designs) would need its own image clean-up, ordered carefully around the row delete. Failures still left orphans anyway.
- **A separate Blobs store per deploy context.** It was rejected because a preview's database branch is a copy of production's and points to production's images, which a separate store wouldn't have.
