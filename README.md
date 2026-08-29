# Coffee Shelf

Tracks every bag of coffee Ethan owns — brand, size, roast date, how much is left.

**Live:** https://coffee-shelf-smoky.vercel.app
**Folder:** `~/coffee-shelf` — `cd ~/coffee-shelf`

---

## What is in this folder

| Path | What it is |
|---|---|
| `index.html` | The whole app. Vanilla JS, no build step. Edit this to change anything you see. |
| `api/bags.js` | The server. Checks your key, reads and writes the data, makes backups. |
| `server.js` | Local practice version. Runs on your Mac, uses a local file. |
| `backup.sh` | **Run this before any risky change.** Saves the live data into `backups/`. |
| `backups/` | Dated copies of your data. Not in git — they stay on this Mac only. |
| `tests/` | Browser tests. See below. |
| `docs/` | Screenshots of how the site looked at each stage. |
| `CLAUDE.md` | Notes for Claude. The **Gotchas** section is the important part. |
| `.app-secret` | Your two keys. Not in git. Never share this file. |

## Open the site

Once per device, open the link with your key:

```
https://coffee-shelf-smoky.vercel.app/?k=<your EDIT_KEY from .app-secret>
```

After that, plain `coffee-shelf-smoky.vercel.app` works. The key is saved in that
browser and wiped from the address bar so screenshots do not leak it.

## Run it on your Mac

```bash
cd ~/coffee-shelf
node server.js
```

Then open http://localhost:4703/?k=dev — this uses a local `bags.json`, not your real data.

## Run the tests

```bash
cd ~/coffee-shelf
bash tests/run.sh test-save-safety.js     # saving, key handling, offline rollback
bash tests/run.sh test-brew-tracking.js   # the brew button and grams math
```

They start a local server and a headless Chrome, seed it from your newest backup, and
clean up after themselves. **They never touch the live site.**

## Deploy a change

```bash
cd ~/coffee-shelf
./backup.sh                  # 1. save the live data first
bash tests/run.sh            # 2. make sure nothing broke
git add -A && git commit -m "what changed" && git push
vercel deploy --prod --yes   # 3. ship it
```

## Who can see it

Two keys live as env vars on Vercel and in `.app-secret`:

- `EDIT_KEY` — you. Read and write.
- `VIEW_KEY` — family. Read only. The Add and Edit buttons are hidden, and the server
  refuses their writes with a 403.

No key, or a wrong key, gets a 401 and sees nothing.
