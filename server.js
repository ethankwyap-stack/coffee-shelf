// Local dev only. Saves to bags.json on disk instead of Vercel Blob.
const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, 'bags.json');
const HTML = path.join(__dirname, 'index.html');
const PORT = 4703;
if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, '[]');

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/bags') {
    const role = url.searchParams.get('k') === 'view' ? 'view' : 'edit';
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ role, bags: JSON.parse(fs.readFileSync(DATA)) }));
    }
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', c => (body += c));
      req.on('end', () => {
        try {
          const bags = JSON.parse(body);
          if (!Array.isArray(bags)) throw new Error('not an array');
          fs.writeFileSync(DATA, JSON.stringify(bags, null, 2));
          res.writeHead(200, { 'Content-Type': 'application/json' }).end('{"ok":true}');
        } catch { res.writeHead(400).end('bad json'); }
      });
      return;
    }
  }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(fs.readFileSync(HTML));
}).listen(PORT, '0.0.0.0', () => console.log('http://localhost:' + PORT + '/?k=dev'));
