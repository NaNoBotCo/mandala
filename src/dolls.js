/* Kings inside kings: tap a small mandala to fly into it. Same shape at every size, down to your house. */
(() => {
'use strict';
const M = window.MANDALA; const root = document.getElementById('toy-dolls'); if (!root) return;
const cv = root.querySelector('canvas'); const st = M.stage(cv, { animate: !M.RM });
const lvTitle = root.querySelector('.lv'); const out = root.querySelector('.out'); const back = root.querySelector('[data-k=back]');
const LV = M.T('dolls.levels', [
  { name: 'King of kings', line: 'The big one. Everybody sends him something.' },
  { name: 'Kingdom', line: 'A lord with his own little lords.' },
  { name: 'Town', line: 'A town and the villages round it.' },
  { name: 'Village', line: 'The head man and the houses.' },
  { name: 'Your house', line: 'That is you, in the middle of your own little circle.' }]);
const COUNT = [7, 6, 6, 8, 0];
let level = 0, path = [0], zoom = null, last = 0;
const seedOf = (lv, p) => p.reduce((a, b) => a * 31 + b + 7, lv * 101 + 3);
const C = () => ({ x: st.w / 2, y: st.h / 2, u: Math.min(st.w, st.h) });
const kids = (lv) => { const c = C(); const n = COUNT[lv]; return Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + i * M.TAU / n; return { i, x: c.x + Math.cos(a) * c.u * 0.33, y: c.y + Math.sin(a) * c.u * 0.33, r: c.u * 0.1 }; }); };

const house = (ctx, x, y, s, col, roof = '#e8344e') => {
  ctx.fillStyle = col; ctx.fillRect(x - s * 0.6, y - s * 0.1, s * 1.2, s * 0.8);
  ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - s * 0.85, y - s * 0.05); ctx.lineTo(x, y - s * 0.75); ctx.lineTo(x + s * 0.85, y - s * 0.05); ctx.closePath(); ctx.fill();
  // kalae, the crossed boards on a northern roof
  ctx.strokeStyle = roof; ctx.lineWidth = Math.max(1.5, s * 0.08); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - s * 0.08, y - s * 0.7); ctx.lineTo(x + s * 0.25, y - s * 1.05); ctx.moveTo(x + s * 0.08, y - s * 0.7); ctx.lineTo(x - s * 0.25, y - s * 1.05); ctx.stroke();
  ctx.fillStyle = '#3b2412'; ctx.fillRect(x - s * 0.15, y + s * 0.25, s * 0.3, s * 0.45);
  // stilts
  ctx.fillRect(x - s * 0.55, y + s * 0.7, s * 0.08, s * 0.25); ctx.fillRect(x + s * 0.47, y + s * 0.7, s * 0.08, s * 0.25);
};

const scene = (ctx, lv, p, t, alpha = 1, showKids = true) => {
  const c = C(); ctx.globalAlpha = alpha;
  if (lv < 4) {
    ctx.globalCompositeOperation = 'lighter'; M.glow(ctx, c.x, c.y, c.u * 0.5, M.KCOL[lv], 0.7); ctx.globalCompositeOperation = 'source-over';
    // spokes from lord to each little lord: gifts in, help out
    if (showKids) {
      ctx.strokeStyle = 'rgba(255,220,140,.22)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 6]); ctx.lineDashOffset = -t * 20;
      kids(lv).forEach(k => { ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(k.x, k.y); ctx.stroke(); });
      ctx.setLineDash([]);
    }
    if (lv === 3) house(ctx, c.x, c.y + c.u * 0.03, c.u * 0.1, '#fff3d6', '#f5b800');
    else M.drawMandala(ctx, c.x, c.y, c.u * 0.16, M.makeMandala(seedOf(lv, p), { n: 8 + lv * 2 }), t, { speed: 0.8 });
    if (showKids) kids(lv).forEach(k => {
      if (lv === 3) house(ctx, k.x, k.y + k.r * 0.2, k.r * 0.75, '#fff3d6');
      else M.drawSprite(ctx, M.sprite(seedOf(lv + 1, p.concat(k.i)), 40, { n: 10 + lv * 2 }), k.x, k.y, k.r, t * 0.2 * (k.i % 2 ? 1 : -1));
    });
  } else {
    ctx.globalCompositeOperation = 'lighter'; M.glow(ctx, c.x, c.y, c.u * 0.5, '#ffb52e', 0.8); ctx.globalCompositeOperation = 'source-over';
    // your own little mandala: the house in the middle, the yard, the rice, the chickens
    const rings = M.makeMandala(seedOf(lv, p), { n: 12, colors: ['#16b88a', '#f5b800', '#9ad94b', '#3fa9ff', '#fff3d6'] }).filter(g => g.r0 > 0.45);
    M.drawMandala(ctx, c.x, c.y, c.u * 0.42, rings, t, { speed: 0.4 });
    house(ctx, c.x, c.y + c.u * 0.04, c.u * 0.16, '#fff3d6');
    ctx.font = M.font(c.u * 0.06); ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(10,6,30,.8)'; ctx.lineWidth = 4;
    const you = M.T('dolls.you', 'YOU'); ctx.strokeText(you, c.x, c.y + c.u * 0.24); ctx.fillText(you, c.x, c.y + c.u * 0.24);
  }
  ctx.globalAlpha = 1;
};

const setText = () => {
  lvTitle.textContent = M.num(level + 1) + ' · ' + LV[level].name; out.textContent = LV[level].line;
  back.hidden = level === 0;
};
st.draw = (t = st.t) => {
  const ctx = st.ctx, w = st.w, h = st.h; const dt = Math.max(0, Math.min(0.05, t - last || 0.016)); last = t;
  ctx.fillStyle = '#0f0b2c'; ctx.fillRect(0, 0, w, h);
  if (zoom) {
    const k = Math.min(1, (performance.now() - zoom.t0) / (M.RM ? 1 : 950)); const c = C();
    const e = M.ease(zoom.dir > 0 ? k : 1 - k);
    const S = c.u * 0.5 / zoom.kid.r, s = Math.pow(S, e);
    const F = { x: c.x + (zoom.kid.x - c.x) * e, y: c.y + (zoom.kid.y - c.y) * e };
    ctx.save(); ctx.translate(c.x, c.y); ctx.scale(s, s); ctx.translate(-F.x, -F.y);
    scene(ctx, zoom.pLv, zoom.pPath, t, Math.max(0, 1 - e * 1.1));
    ctx.restore();
    const a2 = Math.max(0, Math.min(1, (e - 0.25) / 0.55));
    if (a2 > 0) {
      ctx.save(); ctx.translate(c.x + s * (zoom.kid.x - F.x), c.y + s * (zoom.kid.y - F.y)); ctx.scale(s / S, s / S); ctx.translate(-c.x, -c.y);
      scene(ctx, zoom.cLv, zoom.cPath, t, a2);
      ctx.restore();
    }
    if (k >= 1) { if (zoom.dir > 0) { level = zoom.cLv; path = zoom.cPath; } else { level = zoom.pLv; path = zoom.pPath; } zoom = null; setText(); }
  } else scene(ctx, level, path, t);
  M.drawSparks(ctx, dt);
};
cv.addEventListener('pointerdown', e => {
  if (zoom) return; const p = M.pt(st, e);
  if (level >= 4) { M.burst(p.x, p.y, '#f5b800', 20); M.note(Math.floor(Math.random() * 8)); st.kick(1200); return; }
  const k = kids(level).find(k => Math.hypot(p.x - k.x, p.y - k.y) < k.r * 1.3);
  if (!k) { const c = C(); if (Math.hypot(p.x - c.x, p.y - c.y) < c.u * 0.17) { M.gong(); M.burst(c.x, c.y, M.KCOL[level], 30); st.kick(1500); } return; }
  M.note(level * 2 + 1); zoom = { dir: 1, kid: k, pLv: level, pPath: path, cLv: level + 1, cPath: path.concat(k.i), t0: performance.now() }; st.kick(1100);
});
back.addEventListener('click', () => {
  if (zoom || level === 0) return; const i = path[path.length - 1];
  const k = kids(level - 1)[i % COUNT[level - 1]];
  M.note(level); zoom = { dir: -1, kid: k, pLv: level - 1, pPath: path.slice(0, -1), cLv: level, cPath: path, t0: performance.now() }; st.kick(1100);
});
setText();
})();
