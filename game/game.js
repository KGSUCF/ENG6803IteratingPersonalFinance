// Ten Paydays in Pocketford — interface, animation, and saved-game handling.
import * as E from './engine.js';

// v2: Version 6 games shuffle events, so a Version 5 (v1) save cannot be resumed here; it is left untouched.
const KEY = 'money-moves:game:pocketford:v2';
const COURSES = { child: 'The Pocket-Money Club', teen: 'The Money Group Chat', college: 'Campus Cashflow', 'post-college': 'The Real-Life Money Manual', expert: 'The Assumption Lab' };
const NAMES = { paycheck: 'Pay', wallet: 'Wallet', savings: 'Savings jar', pot: 'Seed pot', debt: 'Debt meter', spent: 'Spent', stars: 'Good times' };
const CAST = {
  moxie: { name: 'Moxie', role: 'your roommate, a raccoon who loves a good time' },
  shelby: { name: 'Professor Shelby', role: 'a tortoise who has been patient since 1983' },
  juno: { name: 'Juno', role: 'a badger who runs the bike co-op' },
  narrator: { name: 'Pocketford News', role: 'what happens around town' }
};
const DEBT_SCALE = 100000, POT_SCALE = 40000;

const app = document.querySelector('#game');
const announcer = document.querySelector('#announcer');
const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
let state = null, prefs = { motion: true }, storageOK = true, shown = null, skipRequested = false, playing = false;
const from = new URLSearchParams(location.search).get('from');
const course = COURSES[from] ? from : null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = sel => app.querySelector(sel);
const money = E.money;
const motionOn = () => prefs.motion && !reduceQuery.matches;
const announce = text => { announcer.textContent = ''; setTimeout(() => { announcer.textContent = text; }, 30); };

// ---------- storage: one clearly named key, never touches course progress ----------
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.version === 1) {
      if (saved.prefs && typeof saved.prefs.motion === 'boolean') prefs.motion = saved.prefs.motion;
      const valid = saved.state && saved.state.version === 2 && Array.isArray(saved.state.schedule) && ['intro', 'decision', 'shortfall', 'result', 'recap'].includes(saved.state.phase);
      if (valid) state = saved.state;
    }
  } catch { storageOK = false; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), state, prefs })); } catch { storageOK = false; }
}
function clearSaved() { try { localStorage.removeItem(KEY); } catch { storageOK = false; } }

// ---------- artwork ----------
function portrait(who, size = 64) {
  const art = {
    moxie: `<circle cx="32" cy="34" r="22" fill="#8d8a86"/><path d="M14 18 18 4l10 12M50 18 46 4 36 16" fill="#8d8a86" stroke="#233d35" stroke-width="2"/><path d="M12 32c6-7 14-7 20-2 6-5 14-5 20 2-5 7-14 8-20 4-6 4-15 3-20-4z" fill="#233d35"/><circle cx="24" cy="32" r="4" fill="#fff"/><circle cx="40" cy="32" r="4" fill="#fff"/><circle cx="24.5" cy="32.5" r="2" fill="#233d35"/><circle cx="40.5" cy="32.5" r="2" fill="#233d35"/><ellipse cx="32" cy="45" rx="10" ry="7" fill="#e9e4dc"/><circle cx="32" cy="42" r="3" fill="#233d35"/><path d="M28 48q4 3 8 0" stroke="#233d35" stroke-width="2" fill="none"/><circle cx="32" cy="34" r="22" fill="none" stroke="#233d35" stroke-width="2"/>`,
    shelby: `<ellipse cx="32" cy="50" rx="24" ry="12" fill="#6f8f4e" stroke="#233d35" stroke-width="2"/><path d="M14 48h36M22 40l-4 10m24-10 4 10M32 38v12" stroke="#233d35" stroke-width="1.5"/><circle cx="32" cy="26" r="16" fill="#a9c47f" stroke="#233d35" stroke-width="2"/><circle cx="25" cy="25" r="5" fill="#fff" stroke="#233d35" stroke-width="2"/><circle cx="39" cy="25" r="5" fill="#fff" stroke="#233d35" stroke-width="2"/><path d="M30 25h4" stroke="#233d35" stroke-width="2"/><circle cx="25" cy="25" r="1.8" fill="#233d35"/><circle cx="39" cy="25" r="1.8" fill="#233d35"/><path d="M27 34q5 4 10 0" stroke="#233d35" stroke-width="2" fill="none"/>`,
    juno: `<circle cx="32" cy="34" r="22" fill="#3b3b3b" stroke="#233d35" stroke-width="2"/><path d="M32 12c-5 0-7 8-7 22s3 20 7 20 7-6 7-20-2-22-7-22z" fill="#f7f4e9"/><circle cx="16" cy="16" r="6" fill="#3b3b3b" stroke="#233d35" stroke-width="2"/><circle cx="48" cy="16" r="6" fill="#3b3b3b" stroke="#233d35" stroke-width="2"/><circle cx="21" cy="32" r="3.2" fill="#fff"/><circle cx="43" cy="32" r="3.2" fill="#fff"/><circle cx="21.4" cy="32.4" r="1.6" fill="#233d35"/><circle cx="43.4" cy="32.4" r="1.6" fill="#233d35"/><circle cx="32" cy="46" r="3.5" fill="#233d35"/><path d="M10 50h44" stroke="#eeb775" stroke-width="5" stroke-linecap="round"/>`,
    narrator: `<circle cx="32" cy="32" r="28" fill="#bfe0e8" stroke="#233d35" stroke-width="2"/><path d="M14 46V30l10-8 10 8v16zM34 46V24h16v22z" fill="#f7f4e9" stroke="#233d35" stroke-width="2"/><path d="M22 46v-8h5v8M38 30h3m3 0h3m-9 6h3m3 0h3" stroke="#233d35" stroke-width="2"/><circle cx="48" cy="14" r="5" fill="#eeb775"/>`
  }[who];
  return `<svg class="portrait" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${art}</svg>`;
}
// Version 7: illustrated icons for each emergency and luck event.
function eventIcon(id, size = 84) {
  const ink = '#233d35', art = {
    phone: `<rect x="22" y="6" width="36" height="62" rx="6" fill="#fffdf6" stroke="${ink}" stroke-width="3"/><path d="M30 18l10 12-6 6 12 14M44 22l-6 10 10 4" fill="none" stroke="${ink}" stroke-width="2"/><circle cx="40" cy="62" r="2.5" fill="${ink}"/>`,
    tooth: `<path d="M22 12Q32 4 40 10Q48 4 58 12Q66 22 58 40Q54 66 48 66Q44 66 42 50Q40 44 38 50Q36 66 32 66Q26 66 22 40Q14 22 22 12Z" fill="#fffdf6" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M8 20l6 2M10 34l6-2M64 18l8-3M66 30l7 1" stroke="#b5473a" stroke-width="3" stroke-linecap="round"/>`,
    shoes: `<path d="M8 50V32q0-6 8-6 4 10 18 10h10q14 0 20 8l6 6v8H8z" fill="#8f4a26" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M8 58h62" stroke="${ink}" stroke-width="3"/><path d="M34 36l4 6-4 4 4 6" fill="none" stroke="#fffdf6" stroke-width="3"/>`,
    bonus: `<rect x="14" y="40" width="52" height="26" rx="4" fill="#eeb775" stroke="${ink}" stroke-width="3"/><rect x="22" y="22" width="36" height="20" rx="4" fill="#fffdf6" stroke="${ink}" stroke-width="3"/><path d="M40 8v14" stroke="${ink}" stroke-width="3"/><path d="M40 2q4 4 0 7-4-3 0-7z" fill="#b5473a"/><path d="M14 52h52" stroke="#fffdf6" stroke-width="3"/>`,
    gift: `<rect x="8" y="18" width="64" height="44" rx="4" fill="#fffdf6" stroke="${ink}" stroke-width="3"/><path d="M8 20l32 24 32-24" fill="none" stroke="${ink}" stroke-width="3"/><path d="M40 52q-10-8-10-14a5 5 0 0 1 10-2 5 5 0 0 1 10 2q0 6-10 14z" fill="#b5473a"/>`,
    refund: `<circle cx="40" cy="36" r="26" fill="#d3e38b" stroke="${ink}" stroke-width="3"/><path d="M44 16 30 40h10l-4 18 14-26H40z" fill="#eeb775" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
    fridge: `<rect x="18" y="4" width="44" height="66" rx="6" fill="#fffdf6" stroke="${ink}" stroke-width="3"/><path d="M18 28h44M26 12v10M26 36v14" stroke="${ink}" stroke-width="3" stroke-linecap="round"/><path d="M66 10q6 4 0 8t0 8" fill="none" stroke="#b5473a" stroke-width="2.5"/>`,
    vet: `<path d="M18 30l4-18 10 10h16l10-10 4 18v8q0 26-22 26T18 38z" fill="#eeb775" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><circle cx="31" cy="38" r="3" fill="${ink}"/><circle cx="49" cy="38" r="3" fill="${ink}"/><path d="M36 48q4 4 8 0M14 46h12M54 46h12" stroke="${ink}" stroke-width="2.5" fill="none"/><path d="M58 60h14M65 53v14" stroke="#b5473a" stroke-width="4"/>`,
    bus: `<rect x="6" y="14" width="68" height="40" rx="8" fill="#d3e38b" stroke="${ink}" stroke-width="3"/><path d="M12 22h56v14H12z" fill="#bfe0e8" stroke="${ink}" stroke-width="2"/><circle cx="22" cy="58" r="6" fill="${ink}"/><circle cx="58" cy="58" r="6" fill="${ink}"/><path d="M60 4v8m-4-4h8" stroke="#b5473a" stroke-width="3"/>`,
    glue: `<path d="M12 44l30-30 12 12-30 30z" fill="#fffdf6" stroke="${ink}" stroke-width="3"/><path d="M42 14l6-6 12 12-6 6" fill="#eeb775" stroke="${ink}" stroke-width="3"/><path d="M14 58q4 8 0 12" stroke="#bfe0e8" stroke-width="5" stroke-linecap="round"/>`
  }[id];
  return art ? `<svg class="event-icon" width="${size}" height="${size * 0.9}" viewBox="0 0 80 72" aria-hidden="true" focusable="false">${art}</svg>` : '';
}

function goalIcon(id, size = 72) {
  const art = {
    bike: `<circle cx="20" cy="46" r="13" fill="none" stroke="#233d35" stroke-width="4"/><circle cx="60" cy="46" r="13" fill="none" stroke="#233d35" stroke-width="4"/><path d="M20 46 34 24h20l6 22M34 24l10 22h-24M30 18h10M54 24l-4-8h8" fill="none" stroke="#a65e35" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    trip: `<circle cx="62" cy="16" r="9" fill="#eeb775"/><path d="M0 50q20-8 40 0t40 0v14H0z" fill="#bfe0e8"/><path d="M0 58h80v6H0z" fill="#e8d3a3"/><path d="M30 56V20" stroke="#233d35" stroke-width="3"/><path d="M10 26q20-18 40 0z" fill="#a65e35" stroke="#233d35" stroke-width="2"/>`,
    keyboard: `<rect x="4" y="24" width="72" height="30" rx="4" fill="#233d35"/><rect x="8" y="34" width="64" height="16" fill="#fffdf6"/><path d="M16 34v16M24 34v16M32 34v16M40 34v16M48 34v16M56 34v16M64 34v16" stroke="#233d35" stroke-width="1.5"/><path d="M14 34h4v9h-4zM22 34h4v9h-4zM38 34h4v9h-4zM46 34h4v9h-4zM54 34h4v9h-4z" fill="#233d35"/><circle cx="16" cy="29" r="2" fill="#d3e38b"/><circle cx="24" cy="29" r="2" fill="#eeb775"/><path d="M58 10l8-4v12" stroke="#a65e35" stroke-width="3" fill="none"/><circle cx="56" cy="18" r="3.5" fill="#a65e35"/>`
  }[id];
  return `<svg class="goal-icon" width="${size}" height="${size * 0.8}" viewBox="0 0 80 64" aria-hidden="true" focusable="false">${art}</svg>`;
}

// ---------- charts (fixed scales) ----------
function potChart(history, { width = 260, height = 90, labels = false, planted = 0 } = {}) {
  const L = labels ? 52 : 6, R = 8, T = 8, B = labels ? 26 : 8;
  const x = p => L + (p - 1) / 9 * (width - L - R), y = v => T + (1 - Math.min(v, POT_SCALE) / POT_SCALE) * (height - T - B);
  const pts = history.map(h => `${x(h.payday).toFixed(1)},${y(h.value).toFixed(1)}`).join(' ');
  const grid = labels ? [0, 10000, 20000, 30000, 40000].map(v => `<line x1="${L}" x2="${width - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="axis">${money(v)}</text>`).join('') + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => `<text x="${x(p)}" y="${height - 6}" text-anchor="middle" class="axis">P${p}</text>`).join('') : `<line x1="${L}" x2="${width - R}" y1="${y(0)}" y2="${y(0)}" class="grid"/>`;
  const plantLine = planted ? `<line x1="${L}" x2="${width - R}" y1="${y(planted)}" y2="${y(planted)}" class="planted"/>${labels ? `<text x="${width - R}" y="${y(planted) - 5}" text-anchor="end" class="axis strong">planted ${money(planted)}</text>` : ''}` : '';
  return `<svg class="pot-chart" viewBox="0 0 ${width} ${height}" width="100%" preserveAspectRatio="none" aria-hidden="true" focusable="false">${grid}${plantLine}${history.length > 1 ? `<polyline points="${pts}" class="pot-line"/>` : ''}${history.map(h => `<circle cx="${x(h.payday)}" cy="${y(h.value)}" r="${labels ? 4 : 3}" class="pot-dot"/>`).join('')}</svg>`;
}

function timeChart(amount, horizon) {
  const W = 640, H = 300, L = 70, R = 18, T = 14, B = 42, max = amount * 5, paths = E.timePaths(amount, 30, state?.longRun || null);
  const x = yr => L + yr / 30 * (W - L - R), y = v => T + (1 - v / max) * (H - T - B);
  const line = (arr, cls) => `<polyline class="${cls}" points="${arr.slice(0, horizon + 1).map((v, i) => `${x(i).toFixed(1)},${y(Math.min(v, max)).toFixed(1)}`).join(' ')}"/>`;
  const grid = [0, 1, 2, 3, 4, 5].map(m => `<line x1="${L}" x2="${W - R}" y1="${y(amount * m)}" y2="${y(amount * m)}" class="grid"/><text x="${L - 8}" y="${y(amount * m) + 5}" text-anchor="end" class="axis">${money(Math.round(amount * m / 100) * 100)}</text>`).join('');
  const xt = [0, 5, 10, 15, 20, 25, 30].map(v => `<text x="${x(v)}" y="${H - 14}" text-anchor="middle" class="axis">${v}y</text>`).join('');
  const s = paths.steady[horizon], r = paths.rough[horizon], g = paths.random ? paths.random[horizon] : null;
  const above = v => v > max ? ' (above the chart)' : '';
  const desc = `Fixed scale from $0 to ${money(max)} over 0 to 30 years. After ${horizon} years, ${money(amount)} would be ${money(Math.round(s))} on a steady 5% path, ${money(Math.round(r))} on a rough path, ${g === null ? '' : `${money(Math.round(g))} on this game’s random path, `}and ${money(amount)} as cash.`;
  return `<figure class="time-chart"><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(desc)}">${grid}${xt}<line x1="${x(horizon)}" x2="${x(horizon)}" y1="${T}" y2="${H - B}" class="horizon"/>${line(paths.cash, 'cash-line')}${line(paths.steady, 'steady-line')}${line(paths.rough, 'rough-line')}${g === null ? '' : line(paths.random, 'random-line')}<circle cx="${x(horizon)}" cy="${y(s)}" r="5" class="steady-dot"/><circle cx="${x(horizon)}" cy="${y(r)}" r="5" class="rough-dot"/>${g === null ? '' : `<circle cx="${x(horizon)}" cy="${y(Math.min(g, max))}" r="5" class="random-dot"/>`}</svg>
  <figcaption><dl class="chart-values"><div><dt><span class="key steady"></span>Steady 5% a year</dt><dd>${money(Math.round(s))}</dd></div><div><dt><span class="key rough"></span>Rough path (early drops)</dt><dd>${money(Math.round(r))}</dd></div>${g === null ? '' : `<div><dt><span class="key random"></span>This game’s random path</dt><dd>${money(Math.round(g))}${above(g)}</dd></div>`}<div><dt><span class="key cash"></span>Kept as cash</dt><dd>${money(amount)}</dd></div></dl><p class="chart-note">After <strong>${horizon} ${horizon === 1 ? 'year' : 'years'}</strong>. The scale stays fixed at $0–${money(max)} so a longer horizon never shrinks the starting amount. Hypothetical paths, not a forecast or a promise: real investments can end lower than they started.${g === null ? '' : ' The random path is drawn fresh for each game, so replaying shows a different one.'}</p></figcaption></figure>`;
}
function timeMachine(amount, title) {
  return `<section class="time-machine" data-amount="${amount}" aria-labelledby="tm-title"><h3 id="tm-title">${esc(title)}</h3><div class="horizon-buttons" role="group" aria-label="Choose how many years to show">${[1, 5, 10, 20, 30].map(h => `<button type="button" class="chip" data-horizon="${h}" aria-pressed="${h === 1}">${h} ${h === 1 ? 'year' : 'years'}</button>`).join('')}</div><div class="tm-chart">${timeChart(amount, 1)}</div></section>`;
}
function bindTimeMachine(root = app) {
  root.querySelectorAll('.time-machine').forEach(tm => {
    tm.querySelectorAll('[data-horizon]').forEach(btn => btn.addEventListener('click', () => {
      tm.querySelectorAll('[data-horizon]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      tm.querySelector('.tm-chart').innerHTML = timeChart(Number(tm.dataset.amount), Number(btn.dataset.horizon));
      if (motionOn()) tm.querySelectorAll('polyline').forEach(p => { const len = p.getTotalLength(); p.animate([{ strokeDasharray: `${len}`, strokeDashoffset: `${len}` }, { strokeDasharray: `${len}`, strokeDashoffset: '0' }], { duration: 900, easing: 'ease-out' }); });
    }));
  });
}

// ---------- dashboard ----------
function dashboardHTML() {
  const goal = E.goalOf(state);
  return `<section class="dashboard" aria-label="Your money dashboard">
   <div class="dash-top"><div class="flow-end" data-account="paycheck"><span aria-hidden="true">🧾</span> Pay comes in</div><ol class="paydays" aria-label="Payday progress">${Array.from({ length: 10 }, (_, i) => `<li data-p="${i + 1}"><span class="sr">Payday ${i + 1}</span></li>`).join('')}</ol><div class="flow-end spent" data-account="spent">Spent <span aria-hidden="true">🛒</span></div></div>
   <p class="payday-label" id="payday-label"></p>
   <div class="meters">
    <div class="meter wallet" data-account="wallet"><h3>Wallet</h3><p class="amount" data-show="wallet"></p><p class="hint">Ready to spend</p></div>
    <div class="meter jar" data-account="savings"><h3>Savings jar</h3><div class="jar-wrap"><svg viewBox="0 0 70 92" class="jar-svg" aria-hidden="true" focusable="false"><defs><clipPath id="jar-clip"><path d="M12 22h46v58q0 8-8 8H20q-8 0-8-8z"/></clipPath></defs><g clip-path="url(#jar-clip)"><rect class="jar-fill" x="0" y="24" width="70" height="64"/></g><path d="M12 22h46v58q0 8-8 8H20q-8 0-8-8zM9 12h52v10H9z" fill="none" stroke="#233d35" stroke-width="2.5"/><line x1="10" x2="60" y1="24" y2="24" class="goal-line"/></svg><div class="jar-scale"><span>Goal ${money(goal.cost)}</span><span>$0</span></div></div><p class="amount" data-show="savings"></p><p class="hint" data-show="goalpct"></p></div>
    <div class="meter pot" data-account="pot"><h3>Seed pot <span class="tag">can go up or down</span></h3><div class="pot-mini"></div><p class="amount" data-show="pot"></p><p class="hint" data-show="pothint"></p></div>
    <div class="meter debt" data-account="debt"><h3>Debt meter</h3><div class="debt-bar" aria-hidden="true"><span class="debt-fill"></span></div><div class="debt-scale" aria-hidden="true"><span>$0</span><span>$500</span><span>$1,000</span></div><p class="amount" data-show="debt"></p><p class="hint" data-show="debthint"></p></div>
    <div class="meter stars" data-account="stars"><h3>Good times</h3><p class="amount" data-show="stars"></p><p class="hint">Fun you chose</p></div>
   </div></section>`;
}
function updateDashboard(snap) {
  shown = snap;
  const goal = E.goalOf(state), d = app.querySelector('.dashboard');
  if (!d) return;
  const set = (k, v) => { const el = d.querySelector(`[data-show="${k}"]`); if (el) el.textContent = v; };
  set('wallet', money(snap.wallet)); set('savings', money(snap.savings)); set('pot', money(snap.pot)); set('debt', money(snap.debt)); set('stars', `${snap.stars} ★`);
  const pct = Math.round(snap.savings / goal.cost * 100);
  set('goalpct', `${pct}% of the ${money(goal.cost)} goal`);
  set('pothint', state.pot.contributed ? `Planted ${money(state.pot.contributed)}${state.pot.withdrawn ? `, sold ${money(state.pot.withdrawn)}` : ''}` : 'Nothing planted');
  const owed = snap.debt, debts = state.debts.filter(x => x.balance > 0);
  set('debthint', owed ? (owed > DEBT_SCALE ? 'Off the $1,000 scale ▶' : debts.map(x => x.name).join(' + ') || 'Owed') : 'Nothing owed');
  d.querySelector('.jar-fill').style.transform = `scaleY(${Math.min(1, snap.savings / goal.cost).toFixed(4)})`;
  d.querySelector('.jar').classList.toggle('full', snap.savings >= goal.cost);
  d.querySelector('.debt-fill').style.width = `${Math.min(100, owed / DEBT_SCALE * 100)}%`;
  d.querySelector('.pot-mini').innerHTML = potChart(state.pot.history, { planted: state.pot.contributed });
  d.querySelectorAll('.paydays li').forEach(li => { const p = Number(li.dataset.p); li.className = p < state.payday ? 'done' : p === state.payday ? 'now' : ''; });
  const label = d.querySelector('#payday-label');
  label.textContent = state.phase === 'recap' ? 'All ten paydays complete' : `Payday ${state.payday} of 10 · Goal: ${goal.name} (${money(goal.cost)})`;
}
const spokenSnapshot = s => `Wallet ${money(s.wallet)}. Savings jar ${money(s.savings)}. Seed pot ${money(s.pot)}. Debt ${money(s.debt)}. Good times ${s.stars}.`;

// ---------- money movement animation ----------
const wait = ms => new Promise(r => setTimeout(r, ms));
function flowText(f) {
  if (f.from === 'stars') return `${f.amount > 0 ? '+' : ''}${f.amount} ★`;
  if (f.from === f.to) return money(f.amount, { sign: true });
  return money(f.amount);
}
function flowRoute(f) {
  if (f.from === 'stars') return 'Good times';
  if (f.from === 'pot' && f.to === 'pot') return 'Seed pot value changes';
  if (f.from === 'debt' && f.to === 'debt') return 'Added to what you owe';
  if (f.from === 'debt' && f.to === 'wallet') return 'Borrowed: Debt meter rises → Wallet';
  if (f.to === 'debt') return 'Wallet → Debt meter falls';
  return `${NAMES[f.from]} → ${NAMES[f.to]}`;
}
function receiptHTML(flows, id) {
  if (!flows.length) return `<p class="no-moves">No money moved this time. Your balances stay as they were.</p>`;
  return `<ol class="receipt-lines" id="${id}">${flows.map((f, i) => `<li data-i="${i}" class="flow-${f.from === f.to ? 'inplace' : f.to}"><span class="r-label">${esc(f.label)}</span><span class="r-route">${esc(flowRoute(f))}</span><strong class="r-amount">${flowText(f)}</strong></li>`).join('')}</ol>`;
}
async function playFlows(flows, listId) {
  playing = true; skipRequested = false;
  const list = listId ? document.getElementById(listId) : null;
  const skip = app.querySelector('[data-skip]'); if (skip) skip.hidden = !motionOn();
  for (const [i, f] of flows.entries()) {
    const line = list?.querySelector(`[data-i="${i}"]`);
    line?.classList.add('active');
    if (motionOn() && !skipRequested) await flyChip(f);
    updateDashboard(f.after);
    line?.classList.remove('active'); line?.classList.add('shown');
  }
  list?.querySelectorAll('li').forEach(li => li.classList.add('shown'));
  if (skip) skip.hidden = true;
  playing = false;
}
async function flyChip(f) {
  const src = app.querySelector(`[data-account="${f.from}"]`), dst = app.querySelector(`[data-account="${f.to}"]`);
  if (!src || !dst) return;
  const a = src.getBoundingClientRect(), b = dst.getBoundingClientRect();
  const visible = r => r.bottom > 0 && r.top < innerHeight;
  if (!visible(a) && !visible(b)) return;
  const chip = document.createElement('div');
  const tone = f.from === 'stars' ? 'star' : f.to === 'debt' || f.from === 'debt' ? 'debt' : f.to === 'spent' ? 'spend' : f.to === 'savings' ? 'save' : f.to === 'pot' || f.from === 'pot' ? 'pot' : 'in';
  chip.className = `chip-fly ${tone}`; chip.textContent = flowText(f); chip.setAttribute('aria-hidden', 'true');
  document.body.append(chip);
  const cw = chip.offsetWidth, ch = chip.offsetHeight;
  const start = { x: a.left + a.width / 2 - cw / 2, y: a.top + a.height / 2 - ch / 2 }, end = { x: b.left + b.width / 2 - cw / 2, y: b.top + b.height / 2 - ch / 2 };
  const target = f.from === f.to ? dst : null;
  try {
    if (target) {
      target.classList.add('pulse');
      await chip.animate([{ transform: `translate(${start.x}px,${start.y}px) scale(.8)`, opacity: 0 }, { transform: `translate(${start.x}px,${start.y - 26}px) scale(1.1)`, opacity: 1, offset: .35 }, { transform: `translate(${start.x}px,${start.y - 40}px) scale(1)`, opacity: 1 }], { duration: 900, easing: 'ease-out', fill: 'forwards' }).finished;
      target.classList.remove('pulse');
    } else {
      const mid = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - 40 };
      await chip.animate([{ transform: `translate(${start.x}px,${start.y}px) scale(.7)`, opacity: 0 }, { transform: `translate(${start.x}px,${start.y}px) scale(1.05)`, opacity: 1, offset: .15 }, { transform: `translate(${mid.x}px,${mid.y}px) scale(1)`, opacity: 1, offset: .55 }, { transform: `translate(${end.x}px,${end.y}px) scale(.85)`, opacity: .9 }], { duration: 1000, easing: 'ease-in-out', fill: 'forwards' }).finished;
      dst.classList.add('pulse'); setTimeout(() => dst.classList.remove('pulse'), 450);
    }
  } catch { /* animation cancelled */ }
  chip.remove();
  if (!skipRequested) await wait(120);
}

// ---------- screens ----------
function header(extra = '') {
  return `<div class="game-bar"><p class="game-title-small">TEN PAYDAYS IN POCKETFORD</p><div class="bar-controls">${extra}<button type="button" class="text-button" id="motion" aria-pressed="${prefs.motion}">Animations: ${prefs.motion ? 'on' : 'off'}</button><button type="button" class="text-button" id="restart">Start over</button></div></div><div id="restart-confirm" class="confirm" hidden><p><strong>Start a new game?</strong> This clears only your saved Ten Paydays game in this browser. Course progress and learning notes are not affected.</p><button type="button" class="button primary" id="confirm-restart">Yes, start over</button> <button type="button" class="text-button" id="cancel-restart">Keep playing</button></div>`;
}
function bindHeader() {
  const motion = $('#motion');
  motion?.addEventListener('click', () => { prefs.motion = !prefs.motion; motion.setAttribute('aria-pressed', String(prefs.motion)); motion.textContent = `Animations: ${prefs.motion ? 'on' : 'off'}`; save(); announce(prefs.motion ? 'Animations on.' : 'Animations off. Amounts update without moving pieces.'); });
  $('#restart')?.addEventListener('click', () => { $('#restart-confirm').hidden = false; $('#confirm-restart').focus(); });
  $('#cancel-restart')?.addEventListener('click', () => { $('#restart-confirm').hidden = true; $('#restart').focus(); });
  $('#confirm-restart')?.addEventListener('click', () => { clearSaved(); state = null; renderTitle(); announce('Saved game cleared. You are back at the start.'); });
}
function focusTitle() {
  const h = app.querySelector('h1, h2');
  if (!h) return;
  h.setAttribute('tabindex', '-1');
  h.focus({ preventScroll: true });
  const top = app.querySelector('.dashboard') || h;
  top.scrollIntoView({ behavior: motionOn() ? 'smooth' : 'auto', block: 'start' });
}

const ASSUMPTIONS = `<details class="assumptions"><summary>Game assumptions (look closer)</summary><ul>
<li>All people, places, prices, and businesses are fictional. Amounts are U.S. dollars to match the courses. Nothing here recommends a real product.</li>
<li>Payday comes once a month: ${money(E.RULES.income)} after taxes. Needs cost ${money(E.RULES.needs)} each payday (rent share ${money(20000)}, groceries ${money(8000)}, bus pass and phone ${money(4000)}), unless a price rise adds to them.</li>
<li>Required payments come first each payday: needs, subscriptions, then loan payments. Your automatic saving happens next, only from what is left. If the wallet cannot cover required payments, the game stops and shows the shortfall and your choices.</li>
<li>Lending Kiosk loan: 24% APR, which the game applies as 2% of the balance each payday, with a fixed ${money(4500)} payment. Sparrow Store Card: 30% APR (2.5% each payday), ${money(2000)} minimum payment, ${money(E.RULES.cardLimit)} limit. Dental clinic payment plan: no interest, ${money(7000)} each payday. Interest is added at the start of each payday, before the payment. A late payment adds a ${money(E.RULES.lateFee)} fee. Amounts round to the nearest cent.</li>
<li>The savings jar never gains or loses value in this game. Real savings accounts may pay a little interest; that is left out to keep the jar simple.</li>
<li>Each game shuffles the order of the middle decisions and draws its surprises: one emergency (a broken phone, a toothache, or split work shoes) on a random payday from 3 to 9, and two different luck events (a bonus, a gift, a refund, a fridge bill, a vet bill, or a bus-pass price rise) on two other random paydays.</li><li>The seed pot is an imaginary investment. Each game draws its own month-by-month changes, each equally likely to be −12%, −6%, −3%, −1%, 0%, +1%, +2%, +2%, +3%, +4%, +5%, or +7%. Money in the pot moves with those changes from the payday after it is planted, so it can end higher or lower than you put in. The long-run chart compares a steady 5% a year, a rough path with early drops, a fresh random path for each game, and cash. These are illustrations, not forecasts; real investments can lose money and growth is never guaranteed.</li>
<li>Taxes on gains, investment fees, inflation, and credit scores are not modeled. The game is practice for thinking, not a financial plan.</li></ul></details>`;

function renderTitle() {
  const saved = state && state.phase !== 'intro' ? state : null;
  const back = course ? `<a class="button secondary" href="../${from}/">← Back to ${esc(COURSES[course])}</a>` : '';
  app.innerHTML = `<section class="title-screen">
   <div class="title-copy"><p class="eyebrow">A MONEY MOVES GAME · FOR ALL FIVE LEVELS</p><h1>Ten Paydays in <em>Pocketford</em></h1>
   <p class="lead">You have just moved to the little town of Pocketford and started a job at the corner bakery. Over ten monthly paydays, make choices, handle surprises, and work toward a goal you pick. The surprises, their timing, and the seed pot’s ups and downs change every time you play.</p>
   <div class="title-actions">${saved ? `<button type="button" class="button primary" id="continue">Continue ${saved.phase === 'recap' ? 'to my recap' : `from payday ${saved.payday}`} <span aria-hidden="true">→</span></button><button type="button" class="button secondary" id="new">Start a new game</button>` : `<button type="button" class="button primary" id="start">Start the game <span aria-hidden="true">→</span></button>`}${back}</div>
   <p class="small">About 5–10 minutes · Ten decisions · No sign-in · Fictional money only</p></div>
   <figure class="title-art"><img src="pocketford.svg" width="640" height="420" alt="The town of Pocketford: a bakery, an apartment building, a bike co-op, and a park bench where a tortoise sits beside a raccoon and a badger."></figure>
  </section>
  <section class="how" aria-labelledby="how-title"><h2 id="how-title">How to play</h2><ol class="how-steps">
   <li><strong>Pick a goal.</strong> A bike, a beach weekend, or a keyboard. Each has a price.</li>
   <li><strong>Get paid, pay needs.</strong> Each payday brings ${money(E.RULES.income)}. Needs take ${money(E.RULES.needs)}. Watch the money move on your dashboard.</li>
   <li><strong>Make a choice.</strong> Tap one option. Some cost money now; some change future paydays. Choices you cannot afford show exactly how much you are short.</li>
   <li><strong>Expect the unexpected.</strong> An emergency and two strokes of luck, good or bad, turn up on paydays you cannot see coming. They are different every game.</li>
   <li><strong>See what changed.</strong> Read why it matters and what you traded. Open “Look closer” for more depth. Move on when you are ready; nothing disappears on a timer.</li></ol>
   <div class="resources"><h3>Your dashboard</h3><ul><li><strong>Wallet:</strong> cash ready to spend. You start with ${money(E.RULES.startWallet)}.</li><li><strong>Savings jar:</strong> money set aside. Steady and easy to reach; it never loses value here.</li><li><strong>Seed pot:</strong> a pretend investment that can rise or fall.</li><li><strong>Debt meter:</strong> anything you owe, including interest.</li><li><strong>Good times:</strong> stars for the fun you chose. Enjoyment counts too.</li></ul></div>
  </section>
  <section class="cast" aria-labelledby="cast-title"><h2 id="cast-title">Who you will meet</h2><ul class="cast-list">${['moxie', 'shelby', 'juno'].map(w => `<li>${portrait(w, 72)}<div><strong>${CAST[w].name}</strong><span>${CAST[w].role}</span></div></li>`).join('')}</ul>
   <p class="cast-note"><em>Nobody in Pocketford is judged for what they earn, owe, or choose. The town’s only firm rule concerns where the shopping carts go.</em></p></section>
  <section class="saved-note" aria-labelledby="saved-title"><h2 id="saved-title">What gets saved</h2><p>${storageOK ? 'Your place in the game, your choices, and the animation setting are saved in this browser only, under their own game key. Course progress and learning notes are kept separately and are never changed by the game. Use “Start over” at any time to clear the saved game.' : 'This browser is blocking saved data. You can still play; your game will reset if you leave the page.'}</p>${ASSUMPTIONS}</section>`;
  $('#start')?.addEventListener('click', () => { state = E.newGame(); save(); renderGoal(); });
  $('#new')?.addEventListener('click', () => { clearSaved(); state = E.newGame(); save(); renderGoal(); });
  $('#continue')?.addEventListener('click', () => resume());
  document.title = 'Ten Paydays in Pocketford · Money Moves';
}

function renderGoal() {
  app.innerHTML = `${header()}<section class="goal-screen"><p class="eyebrow">BEFORE PAYDAY 1</p><h2>What are you saving for?</h2><p class="lead">Pick the goal that sounds most fun to you. Prices differ, and so does how long each one takes.</p><div class="goal-grid">${Object.values(E.GOALS).map(goal => `<button type="button" class="goal-card" data-goal="${goal.id}">${goalIcon(goal.id)}<span class="goal-name">${esc(goal.name)}</span><span class="goal-price">${money(goal.cost)}</span><span class="goal-why">${esc(goal.why)}</span></button>`).join('')}</div><p class="small">Luck will also play a part, as it does in life. Your surprises and the seed pot’s monthly changes are drawn at random for this game and revealed as you play.</p></section>`;
  bindHeader();
  app.querySelectorAll('[data-goal]').forEach(btn => btn.addEventListener('click', () => {
    state = E.chooseGoal(state, btn.dataset.goal);
    shown = E.snapshot(state);
    state = E.startPayday(state); save();
    renderPlay(true);
  }));
  focusTitle();
}

function resume() {
  if (!state || state.phase === 'intro') { renderGoal(); return; }
  shown = state.phase === 'result' ? state.result.after : E.snapshot(state);
  renderPlay(false);
}

function renderPlay(animate) {
  if (state.phase === 'recap') { renderRecap(); return; }
  const before = shown || E.snapshot(state);
  app.innerHTML = `${header()}<div class="play">${dashboardHTML()}<div class="stage" id="stage"></div></div>`;
  bindHeader();
  if (state.phase === 'result') renderResult(before, animate);
  else renderStep(before, animate);
}

function turnPanel() {
  const t = state.turn, notes = t.notes.map(n => `<div class="callout ${n.type}${n.type === 'luck' ? (n.good ? ' good' : ' bad') : ''}" role="note">${n.type === 'luck' ? `<span class="callout-art">${eventIcon(n.id, 56)}</span>` : ''}${n.type === 'luck' ? `<span class="callout-tag">${n.good ? 'LUCKY BREAK' : 'SURPRISE COST'}</span>` : ''}<strong>${esc(n.title)}</strong><p>${esc(n.text)}</p></div>`).join('');
  return `<section class="turn" aria-labelledby="turn-title"><div class="turn-head"><h3 id="turn-title">Payday ${t.payday}: money in and out</h3><div class="turn-buttons"><button type="button" class="text-button" data-skip hidden>Skip animation</button><button type="button" class="text-button" data-replay="turn">Replay</button></div></div>${receiptHTML(t.flows, 'turn-lines')}${notes}</section>`;
}

function optionHTML(o, i) {
  const terms = o.terms ? termsHTML(o.terms) : '';
  return `<li class="option ${o.disabled ? 'unavailable' : ''}"><button type="button" class="choice" data-choice="${esc(o.id)}" aria-describedby="opt-${i}-d${o.disabled ? ` opt-${i}-r` : ''}" ${o.disabled ? 'aria-disabled="true"' : ''}><span class="choice-label">${esc(o.label)}</span>${o.cost ? `<span class="cost">${money(o.cost)}</span>` : ''}</button><p class="detail" id="opt-${i}-d">${esc(o.detail)}</p>${o.disabled ? `<p class="reason" id="opt-${i}-r"><strong>Not affordable right now.</strong> ${esc(o.reason)}</p>` : ''}${terms}</li>`;
}
function termsHTML(t) {
  const within = Math.min(t.paydaysLeft, t.months);
  return `<details class="terms"><summary>Check the terms before borrowing</summary><dl>
  <div><dt>Borrowing</dt><dd>${money(t.amount)}${t.existing ? ` (added to the ${money(t.existing)} you already owe here: ${money(t.balance)})` : ''}</dd></div>
  <div><dt>Interest rate</dt><dd>${t.apr}% APR, added as ${t.monthlyRate}% of what you owe each payday</dd></div>
  <div><dt>${t.kind === 'card' ? 'Minimum payment' : 'Payment'}</dt><dd>${money(t.payment)} each payday, taken out before saving or spending</dd></div>
  <div><dt>Time to repay</dt><dd>${t.months} paydays${t.existing ? ' for the whole balance' : ''}${t.kind === 'card' ? ' if you pay only the minimum' : ''}</dd></div>
  <div><dt>Interest in total</dt><dd>${money(t.interest)}${t.existing ? ' on the whole balance' : ''}</dd></div>${t.existing ? `
  <div><dt>Interest added by this borrowing</dt><dd>${money(t.extraInterest)}</dd></div>` : ''}
  <div><dt>Total repaid</dt><dd>${money(t.total)}${t.existing ? ' for the whole balance' : ''}</dd></div></dl>
  <p>${t.paydaysLeft > 0 ? `${within} of those payments fall within this game’s ${t.paydaysLeft} remaining ${t.paydaysLeft === 1 ? 'payday' : 'paydays'}.${t.months > t.paydaysLeft ? ' The rest continue after the game ends and appear in your recap.' : ''}` : 'Every payment falls after the game ends; your recap shows them.'} Paying more than the ${t.kind === 'card' ? 'minimum' : 'payment'} would cost less interest.</p></details>`;
}

function renderStep(before, animate) {
  const stage = $('#stage');
  updateDashboard(before);
  if (state.phase === 'shortfall') {
    const opts = E.shortfallOptions(state);
    stage.innerHTML = `${turnPanel()}<article class="card event shortfall"><div class="speaker">${portrait('narrator')}<div><p class="kicker">Payday ${state.payday} · Shortfall</p><p class="who">The bills are bigger than the wallet</p></div></div>
     <h2>You are ${money(state.shortfall)} short.</h2>
     <p class="lead">This payday’s required payments total ${money(state.turn.required)}, but your wallet holds ${money(state.wallet)}. The game will not invent money, so choose how to cover the gap.</p>
     <p class="aside"><em>This happens to careful people too. Pocketford’s bills do not check anyone’s intentions first.</em></p>
     <ul class="options">${opts.map((o, i) => optionHTML({ ...o, cost: 0 }, i)).join('')}</ul></article>`;
    stage.querySelectorAll('[data-choice]').forEach(btn => btn.addEventListener('click', () => {
      const o = opts.find(x => x.id === btn.dataset.choice);
      if (o.disabled) { announce(`Not available. ${o.reason}`); return; }
      const prev = E.snapshot(state);
      state = E.resolveShortfall(state, o.id); save();
      shown = prev; renderPlay(true);
    }));
  } else {
    const d = E.currentDecision(state);
    const chart = d.chart ? (state.pot.contributed && d.id === 'checkin' ? `<section class="pot-history" aria-label="Seed pot value by payday, fixed scale from $0 to $400">${potChart(state.pot.history, { width: 560, height: 220, labels: true, planted: state.pot.contributed })}<p class="chart-note">Monthly changes since you planted: ${esc(state.pot.moves.map(r => `${r > 0 ? '+' : ''}${r}%`).join(', ') || 'none yet')}. Fixed $0–$400 scale; the dashed line is what you put in.</p></section>` : '') + `<details class="look-closer"><summary>Look closer: what can time do to ${money(Math.max(10000, state.pot.contributed || 10000))}?</summary>${timeMachine(Math.max(10000, state.pot.contributed || 10000), 'A long-run view (hypothetical)')}</details>` : '';
    stage.innerHTML = `${turnPanel()}<article class="card ${d.event ? 'event' : ''}" data-decision="${d.id}">${d.id === 'emergency' ? `<div class="event-art">${eventIcon(state.emergency, 96)}</div>` : ''}<div class="speaker">${portrait(d.speaker)}<div><p class="kicker">${esc(d.kicker)}</p><p class="who">${esc(CAST[d.speaker].name)}${d.event ? ' · <span class="event-tag">Unexpected event</span>' : ''}</p></div></div>
     <h2>${esc(d.title)}</h2><p class="lead">${esc(d.text)}</p><p class="aside"><em>${esc(d.aside)}</em></p>${chart}
     <ul class="options" aria-label="Your choices">${d.options.map(optionHTML).join('')}</ul>
     <p class="concepts" aria-label="Ideas in this decision">${d.concepts.map(c => `<span>${esc(E.CONCEPTS[c])}</span>`).join('')}</p></article>`;
    bindTimeMachine(stage);
    stage.querySelectorAll('[data-choice]').forEach(btn => btn.addEventListener('click', () => {
      const o = d.options.find(x => String(x.id) === btn.dataset.choice);
      if (o.disabled) { announce(`Not affordable right now. ${o.reason}`); btn.closest('.option').querySelector('.reason')?.classList.add('flash'); return; }
      const prev = E.snapshot(state);
      state = E.choose(state, o.id); save();
      shown = prev; renderPlay(true);
    }));
    if (d.event && motionOn() && animate) stage.querySelector('.card.event')?.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-1.2deg)' }, { transform: 'rotate(1.2deg)' }, { transform: 'rotate(0)' }], { duration: 420, iterations: 2 });
  }
  bindReplay('turn', state.turn.flows, 'turn-lines', before);
  stage.querySelector('[data-skip]')?.addEventListener('click', () => { skipRequested = true; });
  focusTitle();
  const run = animate ? playFlows(state.turn.flows, 'turn-lines') : Promise.resolve(updateDashboard(E.snapshot(state)));
  if (!animate) stage.querySelectorAll('#turn-lines li').forEach(li => li.classList.add('shown'));
  run.then(() => announce(`Payday ${state.payday}. ${spokenSnapshot(E.snapshot(state))}${state.phase === 'shortfall' ? ` You are ${money(state.shortfall)} short.` : ''}`));
}

function bindReplay(name, flows, listId, before) {
  app.querySelector(`[data-replay="${name}"]`)?.addEventListener('click', async () => {
    if (playing) return;
    updateDashboard(before);
    app.querySelectorAll(`#${listId} li`).forEach(li => li.classList.remove('shown'));
    await playFlows(flows, listId);
    updateDashboard(state.phase === 'result' ? state.result.after : E.snapshot(state));
  });
}

function changeTable(before, after) {
  const rows = [['wallet', 'Wallet'], ['savings', 'Savings jar'], ['pot', 'Seed pot'], ['debt', 'Debt'], ['stars', 'Good times']].filter(([k]) => before[k] !== after[k]);
  if (!rows.length) return '';
  return `<table class="before-after"><caption>Before and after this choice</caption><thead><tr><th scope="col">Account</th><th scope="col">Before</th><th scope="col">After</th></tr></thead><tbody>${rows.map(([k, label]) => `<tr><th scope="row">${label}</th><td>${k === 'stars' ? before[k] + ' ★' : money(before[k])}</td><td>${k === 'stars' ? after[k] + ' ★' : money(after[k])}</td></tr>`).join('')}</tbody></table>`;
}

function renderResult(before, animate) {
  const r = state.result, stage = $('#stage'), last = state.payday >= E.RULES.paydays;
  const d = state.log.at(-1);
  updateDashboard(before);
  stage.innerHTML = `<article class="card result"><p class="kicker">Payday ${state.payday} · You chose</p><h2>${esc(r.label)}</h2>
   <section class="changes" aria-labelledby="changes-title"><div class="turn-head"><h3 id="changes-title">What changed</h3><div class="turn-buttons"><button type="button" class="text-button" data-skip hidden>Skip animation</button>${r.flows.length ? '<button type="button" class="text-button" data-replay="result">Replay</button>' : ''}</div></div>${receiptHTML(r.flows, 'result-lines')}${changeTable(before, r.after)}</section>
   <div class="explain-grid"><section><h3>Why it matters</h3><p>${esc(r.why)}</p></section><section><h3>The tradeoff</h3><p>${esc(r.tradeoff)}</p></section></div>
   <details class="look-closer"><summary>Look closer</summary><p>${esc(r.closer)}</p><p class="concepts">${d.concepts.map(c => `<span>${esc(E.CONCEPTS[c])}</span>`).join('')}</p></details>
   <div class="next-row"><button type="button" class="button primary" id="next">${last ? 'See my recap' : `On to payday ${state.payday + 1}`} <span aria-hidden="true">→</span></button></div></article>`;
  bindReplay('result', r.flows, 'result-lines', before);
  stage.querySelector('[data-skip]')?.addEventListener('click', () => { skipRequested = true; });
  $('#next').addEventListener('click', () => {
    skipRequested = true;
    const prev = state.result.after;
    state = E.advance(state); save();
    shown = prev;
    if (state.phase === 'recap') renderRecap(); else renderPlay(true);
  });
  focusTitle();
  if (animate) playFlows(r.flows, 'result-lines').then(() => announce(`${spokenSnapshot(r.after)} ${r.why}`));
  else { updateDashboard(r.after); stage.querySelectorAll('#result-lines li').forEach(li => li.classList.add('shown')); }
}

function postcard(sum) {
  const goal = E.goalOf(state), fill = Math.min(1, sum.cushion.amount / Math.max(goal.cost, 1)), got = ['bought', 'smaller', 'borrowed'].includes(sum.goal.outcome);
  const debtW = Math.min(1, sum.debt.owed / DEBT_SCALE) * 160;
  const stars = Array.from({ length: Math.min(sum.stars, 14) }, (_, i) => `<text x="${330 + (i % 7) * 26}" y="${70 + Math.floor(i / 7) * 28}" class="pc-star">★</text>`).join('');
  return `<svg class="postcard" viewBox="0 0 640 300" role="img" aria-label="${esc(`Postcard from Pocketford. Goal: ${got ? 'reached' : 'still saving'}. Cushion left ${money(sum.cushion.amount)}. Debt ${money(sum.debt.owed)}. ${sum.stars} good times.`)}">
   <rect width="640" height="300" rx="16" fill="#bfe0e8"/><circle cx="560" cy="60" r="30" fill="#eeb775"/><path d="M0 220q160-60 320-10t320-20v110H0z" fill="#b9cd71"/><path d="M0 250q200-30 400 0t240-10v60H0z" fill="#8fb069"/>
   <g transform="translate(40 120)"><rect width="70" height="90" fill="#f7f4e9" stroke="#233d35" stroke-width="2"/><path d="M-6 0 35-30 76 0z" fill="#a65e35" stroke="#233d35" stroke-width="2"/><rect x="26" y="55" width="18" height="35" fill="#233d35"/><text x="35" y="30" text-anchor="middle" class="pc-small">BAKERY</text></g>
   <g transform="translate(140 70)">${goalIcon(goal.id, 130).replace('<svg', '<svg x="0" y="0"')}${got ? '<circle cx="118" cy="14" r="16" fill="#233d35"/><path d="M110 14l6 6 10-12" stroke="#d3e38b" stroke-width="4" fill="none"/>' : '<text x="65" y="128" text-anchor="middle" class="pc-small">STILL SAVING</text>'}</g>
   <g transform="translate(330 120)"><text class="pc-label" y="-6">Cushion left</text><rect width="160" height="22" rx="11" fill="#fffdf6" stroke="#233d35"/><rect width="${(fill * 160).toFixed(1)}" height="22" rx="11" fill="#2f7d6b"/><text class="pc-label" y="44">Debt</text><rect y="50" width="160" height="22" rx="11" fill="#fffdf6" stroke="#233d35"/><rect y="50" width="${debtW.toFixed(1)}" height="22" rx="11" fill="#b5473a"/><text class="pc-small" x="164" y="16">${money(sum.cushion.amount)}</text><text class="pc-small" x="164" y="66">${money(sum.debt.owed)}</text></g>
   ${stars}<text x="24" y="40" class="pc-title">Greetings from Pocketford</text><text x="24" y="282" class="pc-small">Cushion bar: $0 to ${money(goal.cost)} · Debt bar: $0 to $1,000</text></svg>`;
}

function renderRecap() {
  const sum = E.summarize(state), goal = E.goalOf(state);
  const outcomeText = { bought: `You bought ${goal.name.toLowerCase()} with money you had.`, smaller: `You chose ${goal.smaller.name} and kept more of a cushion.`, borrowed: `You bought ${goal.name.toLowerCase()} now and borrowed part of the price.`, waiting: sum.goal.progress >= 1 ? 'You have enough for it and chose to keep your full cushion for now.' : `You are still saving: ${Math.round(sum.goal.progress * 100)}% of the way there.` }[sum.goal.outcome];
  const months = sum.cushion.months;
  const debtLines = sum.debt.accounts.map(a => `<li>${esc(a.name)}: ${money(a.balance)} at ${a.apr}% APR. At ${money(a.payment)} a payday: ${Number.isFinite(a.months) ? `${a.months} more ${a.months === 1 ? 'payment' : 'payments'}, about ${money(a.futureInterest)} more interest.` : 'the payment does not cover the interest.'}</li>`).join('');
  const amount = Math.max(10000, state.pot.contributed);
  const back = course ? `<a class="button secondary" href="../${from}/">Back to ${esc(COURSES[course])}</a>` : `<a class="button secondary" href="../#levels">Explore the five courses</a>`;
  app.innerHTML = `${header()}<section class="recap"><p class="eyebrow">YOUR TEN PAYDAYS · RECAP</p><h2>Your year in Pocketford, in more than one number.</h2>
   <p class="lead">There is no high score. A bigger balance is one good outcome; so are a calm cushion, low debt, and good times you planned for. Here is how your choices, and your luck, added up.</p>
   ${postcard(sum)}
   <div class="cast-wave" aria-label="The Pocketford crew says goodbye">${[['moxie', 'Same time next year? I’ll bring snacks.'], ['shelby', 'Slow, steady, and still going. Well played.'], ['juno', 'Whatever you chose, you chose it on purpose. Ride on.']].map(([w, line]) => `<figure>${portrait(w, 64)}<figcaption><strong>${CAST[w].name}</strong> ${esc(line)}</figcaption></figure>`).join('')}</div>
   ${['bought', 'smaller', 'borrowed'].includes(sum.goal.outcome) ? `<div class="confetti" aria-hidden="true">${Array.from({ length: 24 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 8) * 0.18}s;background:${['#eeb775', '#d3e38b', '#bfe0e8', '#b5473a'][i % 4]}"></i>`).join('')}</div>` : ''}
   <div class="measures">
    <article class="measure"><h3>Your goal</h3><p class="big">${sum.goal.outcome === 'waiting' ? `${Math.round(sum.goal.progress * 100)}%` : '✓'}</p><p>${esc(outcomeText)}</p><div class="bar" aria-hidden="true"><span style="width:${Math.round(sum.goal.progress * 100)}%"></span></div><p class="scale">Scale: $0 to ${money(goal.cost)}</p></article>
    <article class="measure"><h3>Breathing room</h3><p class="big">${money(sum.cushion.amount)}</p><p>In your jar and wallet: about <strong>${months.toFixed(1)} ${months.toFixed(1) === '1.0' ? 'month' : 'months'}</strong> of needs (${money(sum.cushion.needs)} a month). This is what absorbs the next surprise.</p></article>
    <article class="measure"><h3>What you owe</h3><p class="big">${money(sum.debt.owed)}</p><p>Interest and fees added during the game: ${money(sum.debt.interestPaid)}.</p>${debtLines ? `<ul>${debtLines}</ul>` : '<p>Nothing owed. Every future payday is fully yours.</p>'}</article>
    <article class="measure"><h3>Seed pot</h3><p class="big">${money(sum.pot.value)}</p><p>${sum.pot.contributed ? `You planted ${money(sum.pot.contributed)}${sum.pot.withdrawn ? ` and sold ${money(sum.pot.withdrawn)}` : ''}: ${sum.pot.change >= 0 ? 'a gain' : 'a loss'} of ${money(Math.abs(sum.pot.change))}.` : 'You kept your money in cash. No growth, no drops.'} ${sum.pot.moves.length ? `While it was planted, your best month was <strong>${sum.pot.best > 0 ? '+' : ''}${sum.pot.best}%</strong> and your worst was <strong>${sum.pot.worst}%</strong>. A replay draws new months.` : ''}</p></article>
    <article class="measure"><h3>Good times</h3><p class="big">${sum.stars} ★</p><p>Stars came from fun and rest you chose. They are not points for spending; they are a reminder that money is for living, too.</p></article>
    <article class="measure"><h3>Next month’s commitments</h3><p class="big">${money(sum.commitments)}</p><p>Subscriptions, price rises, and loan payments already promised from each future payday, before any new choices.</p></article>
    <article class="measure luck"><h3>Luck you did not choose</h3><ul>${[{ payday: state.schedule.indexOf('emergency') + 1, name: sum.emergency.name, kind: 'emergency' }, ...sum.events.map(e => ({ ...e, kind: e.good ? 'lucky break' : 'surprise cost' }))].sort((a, b) => a.payday - b.payday).map(e => `<li>Payday ${e.payday}: <strong>${esc(e.name)}</strong> (${e.kind})</li>`).join('')}</ul><p>Another game will draw different surprises at different times. Outcomes come from choices <em>and</em> circumstances.</p></article>
   </div>
   <section class="path" aria-labelledby="path-title"><h3 id="path-title">Your path, choice by choice</h3><ol class="path-list">${sum.decisions.map(l => `<li><span class="path-day">Payday ${l.payday}</span><span class="path-choice">${esc(l.choice)}</span><span class="concepts">${l.concepts.map(c => `<span>${esc(E.CONCEPTS[c])}</span>`).join('')}</span></li>`).join('')}</ol>
    <p>Ideas you used: ${sum.concepts.map(c => esc(E.CONCEPTS[c])).join(', ')}.</p></section>
   <details class="look-closer" open><summary>Look closer: the long view of ${money(amount)}</summary>${timeMachine(amount, state.pot.contributed ? `If ${money(amount)} stayed planted for years (hypothetical)` : `If ${money(amount)} had been planted for years (hypothetical)`)}<p class="chart-note">Your ten paydays covered less than one year. Over decades, compounding can matter more than any single month; so can a rough start. The savings jar stays useful for near-term goals and surprises.</p></details>
   <div class="recap-actions"><button type="button" class="button primary" id="again">Play again and try another path <span aria-hidden="true">↻</span></button>${back}</div>
   ${ASSUMPTIONS}</section>`;
  bindHeader(); bindTimeMachine();
  $('#again').addEventListener('click', () => { clearSaved(); state = E.newGame(); save(); renderGoal(); announce('New game started. Luck has been drawn again.'); });
  focusTitle();
  announce(`Recap. ${outcomeText} Breathing room ${money(sum.cushion.amount)}. Debt ${money(sum.debt.owed)}. ${sum.stars} good times.`);
}

load();
renderTitle();
if (!storageOK) announce('This browser is blocking saved data. You can still play.');
