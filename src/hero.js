/* The hero: a galaxy of kingdoms. One big mandala in the middle, smaller ones going round it,
   each with its own little ones going round. Gold motes travel in (gifts), rings of light travel out. */
(() => {
'use strict';
const M = window.MANDALA; const cv = document.getElementById('hero-cv'); if (!cv) return;
const st = M.stage(cv);
const big = M.makeMandala(29, { n: 12, gate: true });
const R = M.rng(5);
const sats = [];
for (let i = 0; i < 7; i++) {
  const s = { seed: 100 + i, orbit: 0.42 + i * 0.075 + R() * 0.03, ang: R() * M.TAU, sp: (0.05 + R() * 0.05) * (i % 2 ? 1 : 0.8), size: 0.085 - i * 0.004 + R() * 0.012, spin: 0, kids: [], col: M.KCOL[i % M.KCOL.length], lit: 0 };
  const nk = 2 + Math.floor(R() * 3);
  for (let k = 0; k < nk; k++) s.kids.push({ seed: 300 + i * 10 + k, orbit: 1.9 + k * 0.7, ang: R() * M.TAU, sp: 0.3 + R() * 0.4 });
  sats.push(s);
}
const stars = Array.from({ length: 220 }, () => ({ x: R(), y: R(), r: R() * 1.3 + 0.2, p: R() * M.TAU, f: 0.5 + R() * 2 }));
const motes = []; const waves = []; let bigSpin = 0, bigLit = 0, last = 0, nextMote = 0, nextWave = 1.5;
let C = { x: 0, y: 0, u: 1, tilt: 0.55 };

const layout = () => {
  const wide = st.w > st.h * 1.15;
  C.x = wide ? st.w * 0.64 : st.w * 0.5;
  C.y = wide ? st.h * 0.52 : st.h * 0.56;
  C.u = Math.min(wide ? st.h * 0.95 : st.w * 1.1, wide ? st.w * 0.55 : st.h * 0.62);
  C.tilt = wide ? 0.5 : 0.62;
};
st.onresize = layout;
const satPos = (s, t) => { const a = s.ang + t * s.sp; return { x: C.x + Math.cos(a) * s.orbit * C.u * 0.78, y: C.y + Math.sin(a) * s.orbit * C.u * 0.78 * C.tilt, z: Math.sin(a), a }; };

st.draw = t => {
  const ctx = st.ctx, w = st.w, h = st.h; const dt = Math.min(0.05, t - last || 0.016); last = t;
  if (!C.u || C.u < 2) layout();
  const bg = ctx.createRadialGradient(C.x, C.y, 0, C.x, C.y, Math.max(w, h) * 0.9);
  bg.addColorStop(0, '#2a1d5c'); bg.addColorStop(0.45, '#151036'); bg.addColorStop(1, '#07051a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  for (const s of stars) { const a = 0.35 + 0.65 * Math.abs(Math.sin(s.p + t * s.f * 0.6)); ctx.fillStyle = `rgba(255,244,214,${(a * 0.8).toFixed(2)})`; ctx.fillRect(s.x * w, s.y * h, s.r, s.r); }

  // orbits, faint
  ctx.strokeStyle = 'rgba(255,214,120,.09)'; ctx.lineWidth = 1;
  for (const s of sats) { ctx.beginPath(); ctx.ellipse(C.x, C.y, s.orbit * C.u * 0.78, s.orbit * C.u * 0.78 * C.tilt, 0, 0, M.TAU); ctx.stroke(); }

  // the king's light breathes
  const breathe = 1 + 0.06 * Math.sin(t * 0.9) + bigLit * 0.25;
  ctx.globalCompositeOperation = 'lighter';
  M.glow(ctx, C.x, C.y, C.u * 0.62 * breathe, '#ffb52e', 0.8);
  M.glow(ctx, C.x, C.y, C.u * 0.2 * breathe, '#fff1b8', 0.9);
  ctx.globalCompositeOperation = 'source-over';

  // waves of light going out
  if (t > nextWave) { waves.push({ t0: t, x: C.x, y: C.y, big: true }); nextWave = t + 5 + Math.random() * 2; }
  for (let i = waves.length - 1; i >= 0; i--) {
    const wv = waves[i]; const age = t - wv.t0; const r = age * C.u * (wv.big ? 0.32 : 0.25); const a = 1 - age / (wv.big ? 3.2 : 1.6);
    if (a <= 0) { waves.splice(i, 1); continue; }
    ctx.strokeStyle = `rgba(255,226,140,${(a * 0.5).toFixed(2)})`; ctx.lineWidth = 2 + 4 * a;
    ctx.beginPath(); ctx.ellipse(wv.x, wv.y, r, wv.big ? r * C.tilt : r, 0, 0, M.TAU); ctx.stroke();
    if (wv.big) for (const s of sats) { const p = satPos(s, t); const d = Math.hypot((p.x - C.x), (p.y - C.y) / C.tilt); if (Math.abs(d - r) < 12) s.lit = 1; }
  }

  // satellites behind the middle first, then the middle, then the ones in front
  const order = sats.map(s => ({ s, p: satPos(s, t) })).sort((a, b) => a.p.z - b.p.z);
  const drawSat = ({ s, p }) => {
    const depth = 0.75 + 0.25 * (p.z + 1) / 2; const rad = s.size * C.u * depth;
    const dist = s.orbit; const shine = Math.max(0.35, 1.25 - dist) + s.lit * 0.6;
    ctx.globalCompositeOperation = 'lighter'; M.glow(ctx, p.x, p.y, rad * 3.2, s.col, 0.55 * shine); ctx.globalCompositeOperation = 'source-over';
    for (const k of s.kids) {
      const a = k.ang + t * k.sp; const kx = p.x + Math.cos(a) * rad * k.orbit, ky = p.y + Math.sin(a) * rad * k.orbit * 0.8;
      M.drawSprite(ctx, M.sprite(k.seed, 14), kx, ky, rad * 0.34, -t * 0.6, 0.55 + 0.4 * depth);
    }
    s.spin *= 0.97; s.lit *= 0.96;
    M.drawSprite(ctx, M.sprite(s.seed, 44), p.x, p.y, rad, t * 0.25 * (s.seed % 2 ? 1 : -1) + s.spin * 0, 0.5 + 0.5 * depth * Math.min(1, shine));
    s._x = p.x; s._y = p.y; s._r = rad;
  };
  order.filter(o => o.p.z < 0).forEach(drawSat);

  bigLit *= 0.96; bigSpin *= 0.98;
  M.drawMandala(ctx, C.x, C.y, C.u * 0.23, big, t + bigSpin, { speed: 1 + bigSpin * 0.2 });

  // gifts going in
  if (t > nextMote) { const s = sats[Math.floor(Math.random() * sats.length)]; if (s._x) motes.push({ s, x: s._x, y: s._y, k: 0, c: Math.random() < 0.6 ? '#ffd34d' : '#fff' }); nextMote = t + 0.25 + Math.random() * 0.35; }
  for (let i = motes.length - 1; i >= 0; i--) {
    const m = motes[i]; m.k += dt * 0.45; if (m.k >= 1) { motes.splice(i, 1); bigLit = Math.min(1, bigLit + 0.05); continue; }
    const e = M.ease(m.k); const cx = (m.x + C.x) / 2 + (m.y - C.y) * 0.3, cy = (m.y + C.y) / 2 - (m.x - C.x) * 0.15;
    const x = (1 - e) * (1 - e) * m.x + 2 * (1 - e) * e * cx + e * e * C.x, y = (1 - e) * (1 - e) * m.y + 2 * (1 - e) * e * cy + e * e * C.y;
    ctx.fillStyle = m.c; ctx.globalAlpha = 0.9 * Math.sin(Math.PI * m.k); ctx.beginPath(); ctx.arc(x, y, 1.8, 0, M.TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
  order.filter(o => o.p.z >= 0).forEach(drawSat);
  M.drawSparks(ctx, dt);
};

cv.addEventListener('pointerdown', e => {
  const p = M.pt(st, e);
  const hit = sats.find(s => s._r && Math.hypot(p.x - s._x, p.y - s._y) < s._r * 1.4);
  if (hit) { hit.lit = 1.5; hit.ang += 0.25; M.note(sats.indexOf(hit)); M.burst(hit._x, hit._y, hit.col); waves.push({ t0: st.t, x: hit._x, y: hit._y }); }
  else if (Math.hypot(p.x - C.x, p.y - C.y) < C.u * 0.25) { bigLit = 1; bigSpin = 6; M.gong(); M.burst(C.x, C.y, '#ffd34d', 40); waves.push({ t0: st.t, x: C.x, y: C.y, big: true }); }
  else { waves.push({ t0: st.t, x: p.x, y: p.y }); M.bell(1318 + Math.random() * 400, 0.8, 0.05); }
  st.kick(3000);
});
})();
