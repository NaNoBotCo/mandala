/* Backwards compatible: the same valley drawn two ways at once. Blue dashes are the offices on
   paper (village, subdistrict, district, province). Gold light is who people go and see.
   Tap a village to watch both roads to Bangkok light up. */
(() => {
'use strict';
const M = window.MANDALA; const root = document.getElementById('toy-overlay'); if (!root) return;
const cv = root.querySelector('canvas'); const st = M.stage(cv, { animate: !M.RM });
const mixIn = root.querySelector('input[type=range]'); const out = root.querySelector('.out');
const PEOPLE = M.T('overlay.people', ['You', 'Head man', 'Kamnan', 'Big house', 'Bangkok']);
const PAPER = M.T('overlay.paper', ['Village', 'Subdistrict office', 'District office', 'Province hall', 'Bangkok']);
const R = M.rng(2026);
const TB = [[0.16, 0.3], [0.4, 0.22], [0.66, 0.3], [0.86, 0.46], [0.22, 0.7], [0.5, 0.62], [0.74, 0.78]].map(([x, y]) => ({ x: x + (R() - 0.5) * 0.05, y: y + (R() - 0.5) * 0.05 }));
TB.forEach(t => { t.d = t.x < 0.55 ? 0 : 1; });
/* Voronoi cells by clipping the box with each half-plane; every edge remembers whose border it is. */
const cell = i => {
  let poly = [{ x: 0, y: 0, tag: -1 }, { x: 1, y: 0, tag: -1 }, { x: 1, y: 1, tag: -1 }, { x: 0, y: 1, tag: -1 }];
  TB.forEach((o, j) => {
    if (j === i) return; const a = TB[i];
    const nx = o.x - a.x, ny = o.y - a.y, c = (o.x * o.x + o.y * o.y - a.x * a.x - a.y * a.y) / 2;
    const inside = p => p.x * nx + p.y * ny <= c;
    const cut = (p, q) => { const t = (c - p.x * nx - p.y * ny) / ((q.x - p.x) * nx + (q.y - p.y) * ny); return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t }; };
    const res = [];
    for (let k = 0; k < poly.length; k++) {
      const p = poly[k], q = poly[(k + 1) % poly.length]; const pi = inside(p), qi = inside(q);
      if (pi && qi) res.push(p);
      else if (pi && !qi) { res.push(p); res.push({ ...cut(p, q), tag: j }); }
      else if (!pi && qi) res.push({ ...cut(p, q), tag: p.tag });
    }
    poly = res;
  });
  return poly;
};
const cells = TB.map((_, i) => cell(i));
const vil = [];
for (let tries = 0; vil.length < 30 && tries < 2000; tries++) {
  const v = { x: 0.05 + R() * 0.9, y: 0.12 + R() * 0.8 };
  if (vil.some(o => Math.hypot(o.x - v.x, o.y - v.y) < 0.085)) continue;
  vil.push(v);
}
vil.forEach(v => { let b = 0, bd = 9; TB.forEach((t, i) => { const d = Math.hypot(t.x - v.x, t.y - v.y); if (d < bd) { bd = d; b = i; } }); v.tb = b; });
// the kamnan lives in the village nearest the middle of each subdistrict
const kamnan = TB.map((t, i) => { let b = null, bd = 9; vil.forEach(v => { if (v.tb !== i) return; const d = Math.hypot(t.x - v.x, t.y - v.y); if (d < bd) { bd = d; b = v; } }); return b; });
const district = [0, 1].map(d => { const ts = TB.filter(t => t.d === d); const cx = ts.reduce((a, t) => a + t.x, 0) / ts.length, cy = ts.reduce((a, t) => a + t.y, 0) / ts.length; let b = null, bd = 9; vil.forEach(v => { if (TB[v.tb].d !== d) return; const dd = Math.hypot(cx - v.x, cy - v.y); if (dd < bd) { bd = dd; b = v; } }); return b; });
const province = { x: 0.08, y: 0.07 }; const bangkok = { x: 0.93, y: 0.06 };
// three big houses; one sits near the district line so its light spills over it
const houses = [vil.reduce((a, v) => Math.abs(v.x - 0.55) < Math.abs(a.x - 0.55) && v.y > 0.3 && v.y < 0.7 ? v : a, vil[0]), vil.reduce((a, v) => v.x + v.y * 0.3 < a.x + a.y * 0.3 ? v : a, vil[0]), vil.reduce((a, v) => v.x - v.y * 0.2 > a.x - a.y * 0.2 ? v : a, vil[0])];
const HC = ['#ffc21a', '#ff8a3d', '#ffd97a'];
const light = (h, v, i) => (1 - i * 0.12) / (1 + ((v.x - h.x) ** 2 + (v.y - h.y) ** 2) / 0.05);
vil.forEach(v => { let b = 0, bl = 0; houses.forEach((h, i) => { const l = light(h, v, i); if (l > bl) { bl = l; b = i; } }); v.pat = b; });
const fields = Array.from({ length: 70 }, () => ({ x: R(), y: 0.1 + R() * 0.9, w: 0.03 + R() * 0.07, h: 0.015 + R() * 0.03, g: R() }));
let mix = +mixIn.value / 100, run = null, last = 0;

const drawEdges = (ctx, W, H, a) => {
  cells.forEach((poly, i) => {
    for (let k = 0; k < poly.length; k++) {
      const p = poly[k], q = poly[(k + 1) % poly.length]; if (p.tag < 0) continue;
      if (p.tag < i) continue; // each shared border once
      const between = TB[i].d !== TB[p.tag].d;
      ctx.strokeStyle = `rgba(120,190,255,${(a * (between ? 0.95 : 0.6)).toFixed(2)})`; ctx.lineWidth = between ? 3 : 1.5; ctx.setLineDash(between ? [10, 5] : [4, 5]);
      ctx.beginPath(); ctx.moveTo(p.x * W, p.y * H); ctx.lineTo(q.x * W, q.y * H); ctx.stroke();
    }
  });
  ctx.setLineDash([]);
};
const label = (ctx, txt, x, y, col, u) => { ctx.font = M.font(Math.max(12, u * 0.034)); ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(8,6,28,.9)'; ctx.strokeText(txt, x, y); ctx.fillStyle = col; ctx.fillText(txt, x, y); };
const office = (ctx, x, y, s, col) => { ctx.fillStyle = col; ctx.fillRect(x - s, y - s * 0.6, s * 2, s * 1.2); ctx.beginPath(); ctx.moveTo(x - s * 1.2, y - s * 0.6); ctx.lineTo(x, y - s * 1.3); ctx.lineTo(x + s * 1.2, y - s * 0.6); ctx.fill(); };
const star = (ctx, x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };

st.draw = (t = st.t) => {
  const ctx = st.ctx, W = st.w, H = st.h, u = Math.min(W, H); const dt = Math.max(0, Math.min(0.05, t - last || 0.016)); last = t;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d1a2a'); g.addColorStop(1, '#13261d'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  fields.forEach(f => { ctx.fillStyle = `rgba(${90 + f.g * 60},${150 + f.g * 60},70,.13)`; ctx.fillRect(f.x * W, f.y * H, f.w * W, f.h * H); });
  // hills along the top
  ctx.fillStyle = '#0a1220'; ctx.beginPath(); ctx.moveTo(0, 0); for (let x = 0; x <= 1.0001; x += 0.05) ctx.lineTo(x * W, (0.06 + 0.04 * Math.sin(x * 9) + 0.02 * Math.sin(x * 23)) * H); ctx.lineTo(W, 0); ctx.fill();
  ctx.strokeStyle = 'rgba(110,180,255,.4)'; ctx.lineWidth = Math.max(3, u * 0.014); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-5, H * 0.45); ctx.bezierCurveTo(W * 0.3, H * 0.35, W * 0.45, H * 0.6, W * 0.62, H * 0.5); ctx.bezierCurveTo(W * 0.8, H * 0.4, W * 0.9, H * 0.7, W + 5, H * 0.95); ctx.stroke();

  const lineA = 1 - mix * 0.88, lightA = 0.12 + mix * 0.88;
  ctx.globalCompositeOperation = 'lighter';
  houses.forEach((h, i) => M.glow(ctx, h.x * W, h.y * H, u * (0.42 - i * 0.04), HC[i], lightA * (0.9 + 0.1 * Math.sin(t * 1.3 + i))));
  ctx.globalCompositeOperation = 'source-over';
  drawEdges(ctx, W, H, lineA);
  // offices on paper
  ctx.globalAlpha = Math.max(0.15, lineA);
  district.forEach(v => v && office(ctx, v.x * W, v.y * H - u * 0.045, u * 0.016, '#7cc4ff'));
  office(ctx, province.x * W, province.y * H, u * 0.022, '#7cc4ff');
  ctx.globalAlpha = 1;
  star(ctx, bangkok.x * W, bangkok.y * H, u * 0.03, '#fff3c4');
  label(ctx, PEOPLE[4], bangkok.x * W - u * 0.02, bangkok.y * H + u * 0.07, '#fff3c4', u);
  // villages
  vil.forEach(v => {
    const x = v.x * W, y = v.y * H, r = Math.max(4, u * 0.013);
    if (mix > 0.4) { ctx.strokeStyle = M.alpha(HC[v.pat], lightA * 0.5); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(houses[v.pat].x * W, houses[v.pat].y * H); ctx.stroke(); }
    ctx.fillStyle = '#fff3d6'; ctx.beginPath(); ctx.moveTo(x, y - r * 1.4); ctx.lineTo(x + r, y - r * 0.3); ctx.lineTo(x + r, y + r * 0.8); ctx.lineTo(x - r, y + r * 0.8); ctx.lineTo(x - r, y - r * 0.3); ctx.closePath(); ctx.fill();
    if (kamnan.includes(v)) { ctx.strokeStyle = '#9ad94b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * 2, 0, M.TAU); ctx.stroke(); }
  });
  houses.forEach((h, i) => { M.drawSprite(ctx, M.sprite(700 + i, 26, { n: 12 }), h.x * W, h.y * H, u * 0.04, t * 0.3); });
  if (run) drawRun(ctx, W, H, u, t);
  M.drawSparks(ctx, dt);
};
const drawRun = (ctx, W, H, u, t) => {
  const k = (performance.now() - run.t0) / 1000;
  const roads = [[run.people, '#ffd34d', PEOPLE, false], [run.paper, '#7cc4ff', PAPER, true]];
  roads.forEach(([nodes, col, names, dashed], ri) => {
    ctx.strokeStyle = col; ctx.lineWidth = dashed ? 3 : 4; ctx.setLineDash(dashed ? [8, 6] : []);
    if (!dashed) { ctx.shadowColor = col; ctx.shadowBlur = 14; }
    for (let i = 0; i < nodes.length - 1; i++) {
      const f = Math.max(0, Math.min(1, k * 1.1 - i * 0.9 - ri * 0.25)); if (f <= 0) break;
      const a = nodes[i], b = nodes[i + 1]; const ax = a.x * W, ay = a.y * H, bx = b.x * W, by = b.y * H;
      const mx = (ax + bx) / 2 + (dashed ? 0 : (by - ay) * 0.25), my = (ay + by) / 2 + (dashed ? 0 : (ax - bx) * 0.25);
      ctx.beginPath(); ctx.moveTo(ax, ay);
      for (let s = 1; s <= 24; s++) { const q = s / 24 * f; ctx.lineTo((1 - q) * (1 - q) * ax + 2 * (1 - q) * q * mx + q * q * bx, (1 - q) * (1 - q) * ay + 2 * (1 - q) * q * my + q * q * by); }
      ctx.stroke();
    }
    ctx.setLineDash([]); ctx.shadowBlur = 0;
    nodes.forEach((n, i) => {
      const f = k * 1.1 - (i - 1) * 0.9 - ri * 0.25; if (i > 0 && f < 1) return;
      if (i === 4) return; // Bangkok has its own label
      if (ri === 0 && i === 0) return;
      const txt = ri === 0 && i === 1 ? names[0] + ' · ' + names[1] : names[i];
      const same = ri === 1 && run.people.some(p => p === n);
      const dy = (ri === 0 ? -1 : 1) * (same ? u * 0.075 : u * 0.045);
      label(ctx, txt, n.x * W, n.y * H + dy + (ri === 0 ? 0 : u * 0.02), col, u);
    });
  });
  if (k > 6.5) { run = null; }
};
cv.addEventListener('pointerdown', e => {
  const p = M.pt(st, e); let best = null, bd = 1e9; vil.forEach(v => { const d = Math.hypot(p.x - v.x * st.w, p.y - v.y * st.h); if (d < bd) { bd = d; best = v; } });
  if (!best || bd > 40) return;
  const kv = kamnan[best.tb], h = houses[best.pat], dv = district[TB[best.tb].d];
  run = { t0: performance.now(), people: [best, best, kv, h, bangkok], paper: [best, kv, dv, province, bangkok] };
  M.burst(best.x * st.w, best.y * st.h, '#ffd34d', 16); [0, 2, 4, 5, 7].forEach((n, i) => setTimeout(() => M.note(n), i * 800));
  out.textContent = M.T('overlay.tapped', 'Two roads, same Bangkok. Gold is who folks go see. Blue is the paperwork.');
  st.kick(7000);
});
mixIn.addEventListener('input', () => { mix = +mixIn.value / 100; st.kick(200); });
})();
