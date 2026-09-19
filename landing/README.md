# CSQ landing page

Static marketing site for Cargo Service Quality. No build step: `index.html` plus
`assets/` is the whole deployable artifact.

## Deploying to dev.csq.aero

Point the host at this directory as the site root.

- **Cloudflare Pages / Netlify** — build command: none. Output directory: `landing`.
  `_headers` is picked up automatically.
- **Vercel** — root directory: `landing`. `vercel.json` sets the cache headers.
- **S3 + CloudFront / nginx** — sync the directory and apply the two cache rules
  in `_headers`: immutable one-year caching on `/assets/*`, no caching on `index.html`.
  Asset filenames carry their width, so bump the width or add a hash if you replace
  an image in place.

Serve over HTTPS and enable brotli. Nothing else is required.

## Performance budget

Measured, not estimated. Critical path is roughly **150 KB**:

| Resource | Transfer |
|---|---|
| `index.html` (gzip) | 12.0 KB |
| Hero image, AVIF 1440w | 38.4 KB |
| GSAP + ScrollTrigger (cdnjs, compressed) | ~45 KB |
| Archivo + IBM Plex Mono woff2 | ~55 KB |

Only the hero plate is on the critical path. The montage's other three images load
after the `load` event, and chapter images load one viewport ahead of arrival.

Rules worth keeping if you edit this:

- The hero image is `<link rel=preload>`ed at two breakpoints. If you change which
  image opens the page, change the preload too or you lose the LCP win.
- GSAP is `defer`red in `<head>`, so every inline script is wrapped in
  `DOMContentLoaded`. Deferred scripts execute *after* inline ones, so unwrapped
  inline code would see `gsap` as undefined and silently skip all animation.
- Images are served via `image-set()` as AVIF, then WebP, then JPEG. The JPEG is
  the floor for old Safari.

## Regenerating assets

Sources are the four full-resolution originals. For each of `nose apron ulds load`:

```sh
magick SOURCE.jpg -resize 1440x -strip -quality 42 assets/NAME-1440.avif
magick SOURCE.jpg -resize  900x -strip -quality 42 assets/NAME-900.avif
magick SOURCE.jpg -resize 1440x -strip -quality 62 assets/NAME-1440.webp
magick SOURCE.jpg -resize  900x -strip -quality 62 assets/NAME-900.webp
magick SOURCE.jpg -resize 1440x -strip -quality 68 -interlace Plane assets/NAME-1440.jpg
```

Quality can go this low because every plate sits at 78% brightness under a heavy
gradient. Check them in place, not in a viewer.

## Before this goes public

- **Image licensing is unresolved.** The photographs came from Canva Pro. Confirm
  the licence covers a commercial marketing site on a public domain before launch.
  Commissioned photography inside a real terminal would be better regardless.
- **All figures on the page are illustrative** and labelled as such. The gap chart
  and the score band are not real measurements, and no real operator is named or
  scored anywhere.
- Fonts load from Google Fonts and GSAP from cdnjs. Self-hosting both removes two
  third-party origins from the critical path and is worth doing before launch.
