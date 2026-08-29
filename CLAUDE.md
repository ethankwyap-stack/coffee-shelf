# Coffee Shelf

Live: https://coffee-shelf-smoky.vercel.app

Personal coffee-bag tracker. `~/coffee-shelf`. Zero cost.

## Layout
- `index.html` — the whole app (vanilla JS, no build step)
- `api/bags.js` — Vercel serverless fn: key check, blob read/write, backups, wipe guard
- `server.js` — local dev on :4703 against a local `bags.json`
- `backup.sh` — pull live data into `backups/` (run before any risky change)
- `tests/run.sh` — starts local server + headless Chrome, seeds from newest backup, runs a test
- `tests/test-save-safety.js` — key handling, URL stripping, offline rollback
- `tests/test-brew-tracking.js` — brew button, dose math, undo, persistence
- `docs/` — stage screenshots

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
- The blob is **private** (`access:'private'`). Read it with `get(BLOB,{access:'private',useCache:false})`
  — `useCache:false` is what makes a save visible on the next read. Do NOT add `?v=Date.now()`
  cache-busting; that was the old public-blob pattern and does not apply here.
- Never assign `document.onkeydown = e => cond && fn()`. An arrow function returning
  `false` cancels the key event, which silently blocks ALL typing in every input.
  Use `addEventListener` with a braced body.
- The edit key is stored in `localStorage.shelfkey` and stripped from the URL after load.
  A test that opens the page twice will still be authenticated — clear localStorage to
  test the locked state.
- Every PUT writes a dated copy to `backups/` in the blob store (last 10 kept) and
  **refuses an empty array** when bags exist. Use `?force=1` to clear the shelf on purpose.
- `save()` rolls the UI back and shows a red toast if the write fails. Any new code that
  changes `BAGS` must go through `save()`, never fetch the API directly.
- Photos are stored as base64 inside `bags.json`, shrunk client-side to 700px JPEG.
  If the shelf grows past ~100 bags with photos, move photos to their own blobs.
- `bags.json` is gitignored and vercelignored — it is data, not source.
- Never assign `document.onkeydown = e => cond && fn()`. An arrow function returning
  `false` cancels the key event, which silently blocks ALL typing in every input.
  Use `addEventListener` with a braced body.
- Tests need `ws` (devDependency) and Google Chrome at the standard /Applications path.
  They seed `bags.json` from the newest file in `backups/`, so run `./backup.sh` first
  if you want them exercising current data.
