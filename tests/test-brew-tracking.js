const WS = require('ws');
const URL_ = 'http://localhost:4703/?k=dev';

(async () => {
  const tgt = await (await fetch('http://127.0.0.1:9222/json/new?' + encodeURIComponent(URL_), { method: 'PUT' })).json();
  const ws = new WS(tgt.webSocketDebuggerUrl);
  let id = 0; const pend = {};
  const send = (m, p = {}) => new Promise(r => { pend[++id] = r; ws.send(JSON.stringify({ id, method: m, params: p })); });
  ws.on('message', m => { const d = JSON.parse(m); if (d.id && pend[d.id]) pend[d.id](d.result); });
  await new Promise(r => ws.on('open', r));
  await send('Runtime.enable');
  const ev = async e => (await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result.value;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const ok = (name, cond, got) => console.log((cond ? 'PASS' : 'FAIL') + ' — ' + name + (got !== undefined ? '  [' + got + ']' : ''));

  await wait(2500);
  ok('7 bags load', (await ev('BAGS.length')) === 7, await ev('BAGS.length'));

  // Find the "888" bag (250g, 214 left) by its card.
  const idx = await ev("BAGS.findIndex(b=>b.name==='888')");
  const bid = await ev("BAGS[" + idx + "].id");
  const before = await ev("BAGS[" + idx + "].gramsLeft");
  console.log('   target: Coffee Wallas 888, left =', before);

  const label = await ev("document.querySelector('[data-brew=\"" + bid + "\"]').textContent.trim()");
  ok('brew button shows dose', label.includes('18g'), label);

  // one tap
  await ev("document.querySelector('[data-brew=\"" + bid + "\"]').click()");
  await wait(1200);
  const after = await ev("BAGS.find(b=>b.id==='" + bid + "').gramsLeft");
  ok('one tap removes 18g', after === before - 18, before + ' -> ' + after);

  // clicking brew must NOT open the detail card
  ok('brew tap does not open the card', (await ev("!document.querySelector('#scrim')")));

  // toast offers undo
  ok('undo offered', (await ev("!!document.querySelector('.toast button')")));
  await ev("document.querySelector('.toast button').click()");
  await wait(1200);
  ok('undo restores grams', (await ev("BAGS.find(b=>b.id==='" + bid + "').gramsLeft")) === before,
     await ev("BAGS.find(b=>b.id==='" + bid + "').gramsLeft"));

  // persistence: tap, then reload from the server
  await ev("document.querySelector('[data-brew=\"" + bid + "\"]').click()");
  await wait(1500);
  await ev("location.reload()");
  await wait(3000);
  ok('grams persisted after reload', (await ev("BAGS.find(b=>b.id==='" + bid + "').gramsLeft")) === before - 18,
     await ev("BAGS.find(b=>b.id==='" + bid + "').gramsLeft"));
  ok('still 7 bags after reload', (await ev('BAGS.length')) === 7, await ev('BAGS.length'));

  // detail card quick buttons
  await ev("view(BAGS.find(b=>b.id==='" + bid + "'))");
  await wait(400);
  ok('detail has quick controls', (await ev("document.querySelectorAll('.doseset button').length")) === 5,
     await ev("document.querySelectorAll('.doseset button').length"));
  await ev("quick('" + bid + "','full')");
  await wait(1200);
  ok('Refill sets it back to full size', (await ev("BAGS.find(b=>b.id==='" + bid + "').gramsLeft")) === 250,
     await ev("BAGS.find(b=>b.id==='" + bid + "').gramsLeft"));
  await ev("quick('" + bid + "','empty')");
  await wait(1200);
  ok('Empty marks it finished', (await ev("BAGS.find(b=>b.id==='" + bid + "').status")) === 'finished',
     await ev("BAGS.find(b=>b.id==='" + bid + "').status"));

  // nothing else was damaged
  const names = await ev("BAGS.map(b=>b.brand+'/'+b.name).sort().join(' ; ')");
  console.log('   all bags still present:', names);
  process.exit(0);
})();
