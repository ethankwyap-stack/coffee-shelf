const { put, get, list, del } = require('@vercel/blob');

const BLOB = 'bags.json';
const KEEP = 10;              // how many dated backups to hold

// Two keys. EDIT_KEY = Ethan (read + write). VIEW_KEY = family (read only).
function role(k) {
  if (process.env.EDIT_KEY && k === process.env.EDIT_KEY) return 'edit';
  if (process.env.VIEW_KEY && k === process.env.VIEW_KEY) return 'view';
  return null;
}

// Private blob: only reachable with the store token, never by URL.
// useCache:false so a save is visible on the very next read.
async function readBags() {
  try {
    const b = await get(BLOB, { access: 'private', useCache: false });
    if (b && b.statusCode === 200) return JSON.parse(await new Response(b.stream).text());
  } catch (e) {
    if (e.name !== 'BlobNotFoundError') throw e;
  }
  return [];
}

// Copy the version we are about to replace, then drop the oldest copies.
// A backup failure must never stop a save, so everything here is swallowed.
async function backup(bags) {
  try {
    if (!bags.length) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await put(`backups/${stamp}.json`, JSON.stringify(bags), {
      access: 'private', addRandomSuffix: false, contentType: 'application/json',
    });
    const { blobs } = await list({ prefix: 'backups/' });
    const old = blobs.sort((a, b) => a.pathname < b.pathname ? 1 : -1).slice(KEEP);
    if (old.length) await del(old.map(b => b.url));
  } catch (e) {
    console.error('backup failed (save continues):', e.message);
  }
}

module.exports = async (req, res) => {
  const r = role(req.query.k);
  if (!r) return res.status(401).json({ error: 'bad key' });

  if (req.method === 'GET') {
    return res.json({ role: r, bags: await readBags() });
  }

  if (req.method === 'PUT') {
    if (r !== 'edit') return res.status(403).json({ error: 'read only' });
    if (!Array.isArray(req.body)) return res.status(400).json({ error: 'bad body' });

    const current = await readBags();
    // Wipe guard: a bug that sends an empty list must not erase a full shelf.
    // ?force=1 is the deliberate way to clear it.
    if (current.length && !req.body.length && req.query.force !== '1') {
      return res.status(409).json({ error: 'refused: that would erase all bags' });
    }
    await backup(current);

    await put(BLOB, JSON.stringify(req.body, null, 2), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return res.json({ ok: true, backedUp: current.length });
  }

  res.status(405).end();
};
