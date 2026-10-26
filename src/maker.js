/* Make a mandala: draw once, it copies itself round the circle. Sweep it away like the sand ones. */
(() => {
'use strict';
const M = window.MANDALA; const root = document.getElementById('toy-maker'); if (!root) return;
const cv = root.querySelector('canvas'); const st = M.stage(cv, { animate: false });
const out = root.querySelector('.out');
const SAND = ['#e8344e', '#ff7a1a', '#f5b800', '#16b88a', '#3fa9ff', '#1a1446', '#fffaf0', '#ff5c9a'];
let col = SAND[0], spokes = 8, mirror = true, size = 1, strokes = [], cur = null, base = null, baseT = 0, rot = 0, spinning = false, grains = null, last = 0;

const sw = root.querySelector('.swatches');
SAND.forEach((c, i) => {
  const b = document.createElement('button'); b.className = 'sw'; b.style.background = c; b.type = 'button';
  b.setAttribute('aria-label', (M.T('maker.colors', []) || [])[i] || c); b.setAttribute('aria-pressed', i === 0);
  b.onclick = () => { col = c; sw.querySelectorAll('.sw').forEach(x => x.setAttribute('aria-pressed', x === b)); M.note(i); };
  sw.appendChild(b);
});
const sel = root.querySelector('[data-k=spokes]');
sel.onclick = () => { const opts = [4, 6, 8, 12, 16]; spokes = opts[(opts.indexOf(spokes) + 1) % opts.length]; sel.querySelector('b').textContent = spokes; M.note(opts.indexOf(spokes)); st.draw(); };
const mir = root.querySelector('[data-k=mirror]');
mir.onclick = () => { mirror = !mirror; mir.setAttribute('aria-pressed', mirror); st.draw(); };
root.querySelector('[data-k=fill]').onclick = () => { base = M.makeMandala(Math.floor(Math.random() * 1e6), { n: spokes }); baseT = Math.random() * 10; M.burst(st.w / 2, st.h / 2, col, 30); M.bell(880); st.draw(); st.kick(800); };
const spinB = root.querySelector('[data-k=spin]');
spinB.onclick = () => { spinning = !spinning; spinB.setAttribute('aria-pressed', spinning); st.animate = spinning && !M.RM; st.kick(spinning ? 100 : 0); };
root.querySelector('[data-k=sweep]').onclick = sweep;
root.querySelector('[data-k=clear]').onclick = () => { strokes = []; base = null; grains = null; out.textContent = ''; st.draw(); };

const R = () => Math.max(2, Math.min(st.w, st.h) / 2 - 4);
const toLocal = p => { const r = R(); const x = (p.x - st.w / 2) / r, y = (p.y - st.h / 2) / r; const c = Math.cos(-rot), s = Math.sin(-rot); return [x * c - y * s, x * s + y * c]; };

const paintStroke = (ctx, sk) => {
  const r = R(); if (sk.pts.length < 1) return;
  ctx.strokeStyle = sk.c; ctx.fillStyle = sk.c; ctx.lineWidth = sk.w * r; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let k = 0; k < sk.n; k++) {
    for (const m of sk.m ? [1, -1] : [1]) {
      ctx.save(); ctx.rotate(k * M.TAU / sk.n); ctx.scale(1, m);
      ctx.beginPath(); ctx.moveTo(sk.pts[0][0] * r, sk.pts[0][1] * r);
      if (sk.pts.length === 1) { ctx.arc(sk.pts[0][0] * r, sk.pts[0][1] * r, sk.w * r / 2, 0, M.TAU); ctx.fill(); }
      else { for (let i = 1; i < sk.pts.length; i++) ctx.lineTo(sk.pts[i][0] * r, sk.pts[i][1] * r); ctx.stroke(); }
      ctx.restore();
    }
  }
};

st.draw = (t = 0) => {
  const ctx = st.ctx, w = st.w, h = st.h; const dt = Math.min(0.05, t - last || 0.016); last = t;
  if (spinning && !M.RM) rot += dt * 0.35;
  const dark = matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.dataset.theme !== 'light' || document.documentElement.dataset.theme === 'dark';
  ctx.fillStyle = dark ? '#18123a' : '#fdf3df'; ctx.fillRect(0, 0, w, h);
  const r = R(); ctx.save(); ctx.translate(w / 2, h / 2);
  ctx.fillStyle = dark ? '#211a4a' : '#fff9ec'; ctx.beginPath(); ctx.arc(0, 0, r, 0, M.TAU); ctx.fill();
  ctx.rotate(rot);
  if (grains) { ctx.restore(); drawGrains(ctx, dt); return; }
  ctx.strokeStyle = dark ? 'rgba(255,220,150,.10)' : 'rgba(120,60,0,.10)'; ctx.lineWidth = 1;
  for (let k = 0; k < spokes; k++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(k * M.TAU / spokes) * r, Math.sin(k * M.TAU / spokes) * r); ctx.stroke(); }
  [0.33, 0.66].forEach(f => { ctx.beginPath(); ctx.arc(0, 0, r * f, 0, M.TAU); ctx.stroke(); });
  if (base) M.drawMandala(ctx, 0, 0, r * 0.98, base, baseT, { speed: 0 });
  for (const sk of strokes) paintStroke(ctx, sk);
  ctx.restore();
  M.drawSparks(ctx, dt);
};

cv.addEventListener('pointerdown', e => {
  if (grains) return; cv.setPointerCapture(e.pointerId);
  cur = { pts: [toLocal(M.pt(st, e))], c: col, w: [0.012, 0.024, 0.045][size], n: spokes, m: mirror };
  strokes.push(cur); st.draw();
});
cv.addEventListener('pointermove', e => {
  if (!cur) return; const p = toLocal(M.pt(st, e)); const q = cur.pts[cur.pts.length - 1];
  if (Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.006) { cur.pts.push(p); st.draw(); }
});
const up = () => { if (cur && cur.pts.length) M.note(Math.floor(Math.hypot(...cur.pts[0]) * 7)); cur = null; };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
const sizeB = root.querySelector('[data-k=size]');
sizeB.onclick = () => { size = (size + 1) % 3; sizeB.querySelector('b').textContent = ['•', '●', '⬤'][size]; };

/* sweeping: every coloured pixel becomes a grain of sand that spirals into the middle */
function sweep() {
  if (grains || (!strokes.length && !base)) return;
  const ctx = st.ctx; const d = st.dpr; const img = ctx.getImageData(0, 0, st.canvas.width, st.canvas.height).data;
  const bgc = ctx.getImageData(2, 2, 1, 1).data; const disc = ctx.getImageData(Math.floor(st.canvas.width / 2), 4 * d, 1, 1).data;
  grains = []; const step = Math.max(3, Math.round(Math.sqrt(st.w * st.h / 5200)));
  for (let y = 0; y < st.h; y += step) for (let x = 0; x < st.w; x += step) {
    const i = (Math.floor(y * d) * st.canvas.width + Math.floor(x * d)) * 4;
    const r = img[i], g = img[i + 1], b = img[i + 2];
    const same = (c) => Math.abs(r - c[0]) + Math.abs(g - c[1]) + Math.abs(b - c[2]) < 40;
    if (same(bgc) || same(disc)) continue;
    const a = Math.atan2(y - st.h / 2, x - st.w / 2), dist = Math.hypot(x - st.w / 2, y - st.h / 2);
    grains.push({ a, dist, c: `rgb(${r},${g},${b})`, delay: (1 - dist / R()) * 0.6 + Math.random() * 0.5, s: step * 0.9 });
  }
  strokes = []; base = null; grains.t0 = null; M.sand(2.2); st.animate = !M.RM; st.kick(4000);
  if (M.RM) { grains = null; out.textContent = M.T('maker.swept', 'All gone.'); st.draw(); }
}
function drawGrains(ctx, dt) {
  if (grains.t0 == null) grains.t0 = st.t; const age = st.t - grains.t0; let alive = 0;
  const cx = st.w / 2, cy = st.h / 2;
  for (const g of grains) {
    const k = Math.max(0, Math.min(1, (age - g.delay) / 1.6)); if (k >= 1) continue; alive++;
    const e = M.ease(k); const dist = g.dist * (1 - e); const a = g.a + e * 2.2;
    ctx.fillStyle = g.c; ctx.globalAlpha = 1 - e * 0.6; ctx.fillRect(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, g.s * (1 - e * 0.7), g.s * (1 - e * 0.7));
  }
  ctx.globalAlpha = 1;
  if (!alive) { grains = null; st.animate = spinning && !M.RM; out.textContent = M.T('maker.swept', 'All gone.'); M.bell(523, 2.4, 0.08); st.draw(); }
}
// a first mandala so nobody starts with a blank page
base = M.makeMandala(8, { n: 8 }); baseT = 2;
})();
