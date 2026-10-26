/* Porch lights: three kings, a valley of villages. Each village goes with whichever king shines
   brightest where it sits. When two shine about the same, the village sits under two skies. */
(() => {
'use strict';
const M = window.MANDALA; const root = document.getElementById('toy-lights'); if (!root) return;
const cv = root.querySelector('canvas'); const st = M.stage(cv, { animate: false });
const out = root.querySelector('.out'); const tally = root.querySelector('.tally');
const names = M.T('lights.kings', ['Red King', 'Blue King', 'Gold King']);
const COL = ['#ff5a3c', '#2fb0ff', '#ffc21a'];
const kings = [{ x: 0.24, y: 0.3, b: 6 }, { x: 0.74, y: 0.36, b: 5 }, { x: 0.5, y: 0.78, b: 4 }];
kings.forEach((k, i) => { k.c = COL[i]; k.rings = M.makeMandala(40 + i, { n: 8, colors: [COL[i], '#fff3d6', '#1a1446', COL[i], '#f5b800'] }); });
const R = M.rng(77); const vil = [];
const G = 9; for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) { if (R() < 0.12) continue; vil.push({ x: (gx + 0.5 + (R() - 0.5) * 0.8) / G, y: (gy + 0.5 + (R() - 0.5) * 0.8) / G, ph: R() * 6 }); }
const field = document.createElement('canvas'); let dirty = true, drag = null, picked = null, last = 0;

const light = (k, x, y) => { const s = 0.13 + k.b * 0.022; const d2 = ((x - k.x) ** 2 + (y - k.y) ** 2) / (s * s); return k.b / (1 + d2 * d2 * 0.5 + d2); };
const judge = v => {
  const L = kings.map(k => light(k, v.x, v.y)); const ord = L.map((l, i) => [l, i]).sort((a, b) => b[0] - a[0]);
  v.own = ord[0][1]; v.two = ord[1][0] > ord[0][0] * 0.8 ? ord[1][1] : -1; v.L = ord[0][0];
};
const renderField = () => {
  const fw = Math.max(40, Math.round(st.w / 5)), fh = Math.max(30, Math.round(st.h / 5));
  field.width = fw; field.height = fh; const fx = field.getContext('2d'); const im = fx.createImageData(fw, fh); const d = im.data;
  const rgb = kings.map(k => M.rgb(k.c));
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const nx = (x + 0.5) / fw, ny = (y + 0.5) / fh; let r = 0, g = 0, b = 0, tot = 0, mx = 0;
    kings.forEach((k, i) => { const l = light(k, nx, ny); const w = l * l * l; r += rgb[i][0] * w; g += rgb[i][1] * w; b += rgb[i][2] * w; tot += w; mx = Math.max(mx, l); });
    const p = (y * fw + x) * 4; d[p] = r / tot; d[p + 1] = g / tot; d[p + 2] = b / tot; d[p + 3] = Math.min(235, mx * 70);
  }
  fx.putImageData(im, 0, 0); dirty = false;
  vil.forEach(judge);
  const n = [0, 0, 0]; let two = 0; vil.forEach(v => { n[v.own]++; if (v.two >= 0) two++; });
  tally.innerHTML = kings.map((k, i) => `<span style="--c:${k.c}"><i></i>${names[i]} <b>${M.num(n[i])}</b></span>`).join('') + `<span class="two"><i></i>${M.T('lights.two', 'Two skies')} <b>${M.num(two)}</b></span>`;
};
st.onresize = () => { dirty = true; };
st.draw = (t = st.t) => {
  const ctx = st.ctx, w = st.w, h = st.h; const dt = Math.max(0, Math.min(0.05, t - last || 0.016)); last = t;
  if (dirty) renderField();
  ctx.fillStyle = '#0f0b2c'; ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(field, 0, 0, w, h);
  // a river, so it reads as country
  ctx.strokeStyle = 'rgba(120,190,255,.35)'; ctx.lineWidth = Math.max(3, w * 0.012); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(w * 0.05, -5); ctx.bezierCurveTo(w * 0.35, h * 0.35, w * 0.2, h * 0.6, w * 0.62, h * 0.62); ctx.bezierCurveTo(w * 0.85, h * 0.63, w * 0.9, h * 0.85, w * 1.02, h * 1.02); ctx.stroke();
  const u = Math.min(w, h);
  for (const v of vil) {
    const x = v.x * w, y = v.y * h, r = Math.max(3.5, u * 0.012);
    if (v.two >= 0) {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = kings[v.own].c; ctx.beginPath(); ctx.arc(x, y, r + 4, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.strokeStyle = kings[v.two].c; ctx.beginPath(); ctx.arc(x, y, r + 4, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    }
    ctx.fillStyle = '#fff6df'; ctx.beginPath(); ctx.moveTo(x, y - r * 1.5); ctx.lineTo(x + r, y - r * 0.4); ctx.lineTo(x + r, y + r * 0.8); ctx.lineTo(x - r, y + r * 0.8); ctx.lineTo(x - r, y - r * 0.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = kings[v.own].c; ctx.fillRect(x - r * 0.35, y + r * 0.05, r * 0.7, r * 0.75);
    if (v === picked) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 8 + Math.sin(t * 5) * 2, 0, M.TAU); ctx.stroke(); }
  }
  kings.forEach((k, i) => {
    const x = k.x * w, y = k.y * h, r = u * (0.045 + k.b * 0.004);
    ctx.globalCompositeOperation = 'lighter'; M.glow(ctx, x, y, r * 2.6, k.c, 0.9); ctx.globalCompositeOperation = 'source-over';
    M.drawMandala(ctx, x, y, r, k.rings, t, { speed: drag === k ? 4 : 0.6 });
    ctx.font = M.font(Math.max(11, u * 0.028)); ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,6,30,.85)'; ctx.strokeText(names[i], x, y + r + 16); ctx.fillStyle = '#fff'; ctx.fillText(names[i], x, y + r + 16);
  });
  M.drawSparks(ctx, dt);
};
const hitKing = p => kings.find(k => Math.hypot(p.x - k.x * st.w, p.y - k.y * st.h) < Math.min(st.w, st.h) * 0.08);
cv.addEventListener('pointerdown', e => {
  const p = M.pt(st, e); const k = hitKing(p);
  if (k) { drag = k; drag.moved = 0; drag.sx = p.x; drag.sy = p.y; cv.setPointerCapture(e.pointerId); M.note(kings.indexOf(k) * 2); st.animate = !M.RM; st.kick(200); return; }
  let best = null, bd = 1e9; vil.forEach(v => { const d = Math.hypot(p.x - v.x * st.w, p.y - v.y * st.h); if (d < bd) { bd = d; best = v; } });
  if (best && bd < 30) {
    picked = best; M.burst(best.x * st.w, best.y * st.h, kings[best.own].c, 12); M.note(best.own + 3);
    out.textContent = best.two >= 0 ? M.fmt(M.T('lights.both', 'This village pays the {a} and the {b}.'), { a: names[best.own], b: names[best.two] }) : M.fmt(M.T('lights.one', 'This village pays the {k}.'), { k: names[best.own] });
    st.kick(1500);
  }
});
cv.addEventListener('pointermove', e => {
  if (!drag) return; const p = M.pt(st, e); drag.moved = Math.max(drag.moved, Math.hypot(p.x - drag.sx, p.y - drag.sy));
  if (drag.moved < 6) return;
  drag.x = Math.max(0.05, Math.min(0.95, p.x / st.w)); drag.y = Math.max(0.06, Math.min(0.92, p.y / st.h)); dirty = true; st.kick(100);
});
const end = () => { if (drag) { if (drag.moved < 6) { drag.b = drag.b >= 10 ? 3 : drag.b + 2; dirty = true; M.burst(drag.x * st.w, drag.y * st.h, drag.c, 24); M.note(drag.b); } drag = null; st.animate = false; st.kick(400); } };
cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
root.querySelectorAll('input[type=range]').forEach((inp, i) => {
  inp.addEventListener('input', () => { kings[i].b = +inp.value; dirty = true; st.kick(200); });
  inp.addEventListener('change', () => M.note(+inp.value));
});
})();
