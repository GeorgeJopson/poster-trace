# Poster designs must be one-page, portrait A4 PDFs

A poster design can only be a one-page PDF whose page (its CropBox, the part that's shown) is portrait A4: 210 x 297 mm, give or take 1 mm on each side for rounding. The page mustn't have a /Rotate, so a landscape page turned to look portrait is rejected. PNGs and JPEGs are no longer accepted. This supersedes the formats in ADR-0010; its handling of PDFs (vector embedding, pdf.js previews, the sandboxed design-image route) still stands.

Posters are printed on A4. A raster image had no physical size, so its print quality depended on its pixel count, and a design that wasn't A4-shaped was printed with blank margins. An A4 PDF prints at exactly the size and quality it was made at, and the QR code lands where it was placed in the preview.

Because every design is an upright A4 page, poster PDFs draw it to fill the page as stored, with no fitting, centring or turning, and the QR placement maps straight onto the page.

The rule lives in the domain (`PosterDesignImageRules`), which is given the page count and the first page's size and /Rotate that the application layer reads with pdf-lib. The form checks the same thing before uploading.

## Considered Options

- **Accepting A4 landscape too.** Rejected for now: posters are generated on portrait pages, so a landscape design would be shrunk to fit with large margins.
- **Accepting any page size and scaling it to A4.** Rejected: that's what images did, and it hides a design made for the wrong paper.

## Consequences

- Designs uploaded earlier as PNGs or JPEGs show "Preview unavailable" and can't generate posters; they'd need re-uploading as A4 PDFs.
- The seed images are A4 PDFs, and the seed script checks them as uploads are checked.
- Previews always render with pdf.js, and poster PDFs only embed unrotated PDF pages, so the JPEG EXIF orientation and PDF /Rotate handling are gone.
