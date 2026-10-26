/* Kautilya's circle of kings on a honeycomb: your neighbours are trouble, their neighbours are
   your friends, and so on out. Tap any kingdom to stand in the middle yourself. */
(() => {
'use strict';
const M = window.MANDALA; const root = document.getElementById('toy-rings'); if (!root) return;
const cv = root.querySelector('canvas'); const st = M.stage(cv, { animate: !M.RM });
const out = root.querySelector('.out');
const ROLES = M.T('rings.roles', ['You', 'Enemy', 'Friend', "Enemy's friend", "Friend's friend", "Enemy's friend's friend", 'Too far to care']);
const RC = ['#fff3c4', '#ff4d5e', '#2fd18b', '#ff9a5c', '#7fe0b8', '#ffb38a', '#8a86b8'];
const N = 3; const cells = [];
for (let q = -N; q <= N; q++) for (let r = Math.max(-N, -q - N); r <= Math.min(N, -q + N); r++) cells.push({ q, r, seed: 1200 + cells.length, d: 0, shown: 0, at: 0 });
const hd = (a, b) => (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
let hub = cells.find(c => c.q === 0 && c.r === 0), changed = 0, last = 0;
const relabel = () => { const now = performance.now(); cells.forEach(c => { c.d = Math.min(6, hd(c, hub)); c.at = now + c.d * 160; }); changed = now; };
relabel(); cells.forEach(c => { c.shown = c.d; });
const geom = () => { const s = Math.min(st.w / (Math.sqrt(3) * (2 * N + 1.2)), st.h / (1.5 * (2 * N) + 2.4)); return { s, cx: st.w / 2, cy: st.h / 2 }; };
const pos = (c, g) => ({ x: g.cx + g.s * Math.sqrt(3) * (c.q + c.r / 2), y: g.cy + g.s * 1.5 * c.r });
st.draw = (t = 0) => {
  const ctx = st.ctx, w = st.w, h = st.h; const dt = Math.min(0.05, t - last || 0.016); last = t; const now = performance.now();
  ctx.fillStyle = '#100c2e'; ctx.fillRect(0, 0, w, h);
  const g = geom();
  for (const c of cells) {
    if (now >= c.at && c.shown !== c.d) { c.shown = c.d; c.pop = 1; }
    c.pop = (c.pop || 0) * 0.92;
    const p = pos(c, g); const col = RC[c.shown];
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx.lineTo(p.x + Math.cos(a) * g.s * 0.96, p.y + Math.sin(a) * g.s * 0.96); } ctx.closePath();
    ctx.fillStyle = M.alpha(col, c.shown === 0 ? 0.35 : 0.2); ctx.fill(); ctx.strokeStyle = M.alpha(col, 0.8); ctx.lineWidth = 2; ctx.stroke();
    const rad = g.s * (0.5 + (c.shown === 0 ? 0.2 : 0)) * (1 + c.pop * 0.35);
    M.drawSprite(ctx, M.sprite(c.seed, 24, { n: 8, colors: [col, '#fff3d6', '#1a1446', col] , key: c.shown }), p.x, p.y, rad, t * 0.25 * (c.q % 2 ? 1 : -1));
  }
  // labels for the first three rings, on the cell itself, small
  ctx.textAlign = 'center';
  M.drawSparks(ctx, dt);
};
cv.addEventListener('pointerdown', e => {
  const p = M.pt(st, e); const g = geom(); let best = null, bd = 1e9;
  cells.forEach(c => { const q = pos(c, g); const d = Math.hypot(p.x - q.x, p.y - q.y); if (d < bd) { bd = d; best = c; } });
  if (!best || bd > g.s) return;
  if (best === hub) { M.gong(); M.burst(p.x, p.y, '#fff3c4', 26); out.textContent = ROLES[0]; st.kick(1500); return; }
  const was = Math.min(6, hd(best, hub));
  out.textContent = M.fmt(M.T('rings.was', 'That one was your {r}. Now it is the middle.'), { r: ROLES[was] });
  hub = best; relabel(); M.note(was); M.burst(p.x, p.y, RC[was], 20); st.kick(2000);
});
const legend = root.querySelector('.legend');
if (legend) legend.innerHTML = ROLES.map((r, i) => `<span style="--c:${RC[i]}"><i></i>${r}</span>`).join('');
})();
