const WS = require('ws');
const U = 'http://localhost:4703/?k=dev';

(async () => {
  const tgt = await (await fetch('http://127.0.0.1:9222/json/new?' + encodeURIComponent(U), { method: 'PUT' })).json();
  const ws = new WS(tgt.webSocketDebuggerUrl);
  let id = 0; const pend = {};
  const send = (m, p = {}) => new Promise(r => { pend[++id] = r; ws.send(JSON.stringify({ id, method: m, params: p })); });
  ws.on('message', m => { const d = JSON.parse(m); if (d.id && pend[d.id]) pend[d.id](d.result); });
  await new Promise(r => ws.on('open', r));
  await send('Runtime.enable');
  const ev = async e => (await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result.value;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let fails = 0;
  const ok = (n, c, g) => { if (!c) fails++; console.log((c ? 'PASS' : 'FAIL') + ' — ' + n + (g !== undefined ? '  [' + g + ']' : '')); };

  await wait(2500);
  ok('7 bags load', (await ev('BAGS.length')) === 7, await ev('BAGS.length'));
  ok('key stripped from address bar', !(await ev('location.search')).includes('k='), JSON.stringify(await ev('location.search')));
  ok('key remembered in browser', (await ev("localStorage.getItem('shelfkey')")) === 'dev');

  // reload with NO key in the URL — must still work
  await ev("location.href='http://localhost:4703/'");
  await wait(2500);
  ok('works on reload with no key in URL', (await ev('BAGS.length')) === 7, await ev('BAGS.length'));
  ok('still edit role (brew buttons shown)', (await ev("document.querySelectorAll('[data-brew]').length")) > 0);

  // --- save failure: break the network, tap brew, expect rollback + red toast ---
  const idx = await ev("BAGS.findIndex(b=>b.name==='888')");
  const bid = await ev("BAGS[" + idx + "].id");
  const before = await ev("BAGS[" + idx + "].gramsLeft");
  await ev("window._f=window.fetch; window.fetch=(u,o)=>o&&o.method==='PUT'?Promise.reject(new Error('offline')):window._f(u,o)");
  await ev("document.querySelector('[data-brew=\"" + bid + "\"]').click()");
  await wait(4000);
  ok('failed save rolls the number back', (await ev("BAGS.find(b=>b.id==='" + bid + "').gramsLeft")) === before,
     before + ' -> ' + (await ev("BAGS.find(b=>b.id==='" + bid + "').gramsLeft")));
  ok('red NOT SAVED warning shown', (await ev("!!document.querySelector('.toast.bad')")),
     await ev("(document.querySelector('.toast')||{}).textContent"));
  ok('server still has the old number', (await (await fetch('http://localhost:4703/api/bags?k=dev')).json()).bags.find(b => b.id === bid).gramsLeft === before);

  // --- network back: a normal tap must still save ---
  await ev("window.fetch=window._f");
  await ev("document.querySelector('[data-brew=\"" + bid + "\"]').click()");
  await wait(1500);
  const srv = (await (await fetch('http://localhost:4703/api/bags?k=dev')).json()).bags;
  ok('good save reaches the server', srv.find(b => b.id === bid).gramsLeft === before - 18,
     before + ' -> ' + srv.find(b => b.id === bid).gramsLeft);
  ok('still 7 bags', srv.length === 7, srv.length);

  console.log(fails ? '\n' + fails + ' FAILURES' : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})();
