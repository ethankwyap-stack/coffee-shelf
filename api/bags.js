const { put, get } = require('@vercel/blob');

const BLOB = 'bags.json';

// Two keys. EDIT_KEY = Ethan (read + write). VIEW_KEY = family (read only).
function role(k) {
  if (process.env.EDIT_KEY && k === process.env.EDIT_KEY) return 'edit';
  if (process.env.VIEW_KEY && k === process.env.VIEW_KEY) return 'view';
  return null;
}

module.exports = async (req, res) => {
  const r = role(req.query.k);
  if (!r) return res.status(401).json({ error: 'bad key' });

  if (req.method === 'GET') {
    // Private blob: only reachable with the store token, never by URL.
    // useCache:false so a save is visible on the very next read.
    let bags = [];
    try {
      const b = await get(BLOB, { access: 'private', useCache: false });
      if (b && b.statusCode === 200) bags = JSON.parse(await new Response(b.stream).text());
    } catch (e) {
      if (e.name !== 'BlobNotFoundError') throw e;
    }
    return res.json({ role: r, bags });
  }

  if (req.method === 'PUT') {
    if (r !== 'edit') return res.status(403).json({ error: 'read only' });
    if (!Array.isArray(req.body)) return res.status(400).json({ error: 'bad body' });
    await put(BLOB, JSON.stringify(req.body, null, 2), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return res.json({ ok: true });
  }

  res.status(405).end();
};
