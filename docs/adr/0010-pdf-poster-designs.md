# Poster designs accept one-page PDFs; WebP and GIF are dropped

A poster design's image can be a PNG, a JPEG or a one-page PDF. Posters are generated as a PDF in the browser with pdf-lib, which can only embed PNG, JPEG and PDF pages. That's why WebP and GIF are no longer accepted. A PDF design is embedded as a vector page (`embedPage`), so it keeps its print quality, and the QR code is drawn on top of it as vector shapes too.

Browsers can't draw a PDF onto a canvas, so previews, including the QR placement editor, render page 1 with `pdfjs-dist`. It's loaded lazily, only when a design is a PDF. The one-page rule lives in the domain (`PosterDesignImageRules`), which is given a page count that the application layer reads with pdf-lib. The form also checks it before uploading.

PDFs can contain scripts, and design images are served from the app's own origin. The design-image route therefore responds with `Content-Security-Policy: sandbox`, `X-Content-Type-Options: nosniff` and, for PDFs, `Content-Disposition: attachment`. The app only ever fetches these files and never opens them as documents.

## Considered Options

- **Building poster PDFs on the server, converting WebP/GIF with `sharp`.** Rejected: it adds a native dependency, and a multi-page PDF could exceed a Netlify Function's response size limit.
- **Rendering a PNG preview of each PDF on the server at upload time.** Rejected: it needs a native PDF renderer on Netlify Functions, and the preview blob would have to be stored and deleted alongside the PDF.

## Consequences

- `QrPlacement.size` is a percentage of the design's width for every format, as a PDF has no pixels.
