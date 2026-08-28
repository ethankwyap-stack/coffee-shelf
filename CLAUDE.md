# Coffee Shelf

Live: https://coffee-shelf-smoky.vercel.app

Personal coffee-bag tracker. `~/coffee-shelf`. Zero cost.

## Stack
- `index.html` — the whole app. Vanilla JS, no build step, no framework.
- `api/bags.js` — Vercel serverless function. Vercel Blob stores `bags.json`.
- `server.js` — local dev on port 4703, saves to a local `bags.json`.

## Access model
Two env vars on Vercel: `EDIT_KEY` (Ethan, read+write) and `VIEW_KEY` (family, read-only).
The API returns `{role, bags}`; the UI hides Add/Edit when role is `view`.

## Deploy
`vercel --prod` from the project root.

## Gotchas
- Blob reads must bust the CDN cache with `?v=Date.now()` or you get stale data.
- Photos are stored as base64 inside `bags.json`, shrunk client-side to 700px JPEG.
  If the shelf grows past ~100 bags with photos, move photos to their own blobs.
- `bags.json` is gitignored and vercelignored — it is data, not source.
- Never assign `document.onkeydown = e => cond && fn()`. An arrow function returning
  `false` cancels the key event, which silently blocks ALL typing in every input.
  Use `addEventListener` with a braced body.
