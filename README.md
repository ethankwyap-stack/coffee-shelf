# Coffee Shelf

Track every bag of coffee you own — roaster, size, roast date, freshness, tasting
notes, price per gram, how much is left, and your rating.

Dark + amber design. Zero cost to run.

## How sharing works

Two secret keys, set as Vercel environment variables:

| Key | Env var | What it does |
|-----|---------|--------------|
| Owner key | `EDIT_KEY` | Read + add + edit + delete |
| Family key | `VIEW_KEY` | Read only |

Access is by URL: `https://your-site.vercel.app/?k=<key>`.
No key = no data. Random visitors see a locked page.

Each bag also has its own link: `?k=<key>#bag=<id>` — the "Copy link to this bag" button.

## Local development

```
node server.js
# http://localhost:4703/?k=dev
```

Local mode saves to `bags.json` on disk (gitignored). Add `?k=view` to preview
the read-only family view.

## Deploy

```
vercel --prod
```

Storage is Vercel Blob (`bags.json`), free tier.
