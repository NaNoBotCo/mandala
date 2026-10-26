/* Slide the years: kingdoms as lights over Southeast Asia from 600 to today.
   Around 1885–1910 the lines of the modern map come in over the lights. Coastlines: Natural Earth. */
(() => {
'use strict';
const M = window.MANDALA; const root = document.getElementById('toy-years'); if (!root || !window.GEO) return;
const cv = root.querySelector('canvas'); const st = M.stage(cv, { animate: !M.RM });
const yr = root.querySelector('input[type=range]'); const yearOut = root.querySelector('.yr'); const note = root.querySelector('.out'); const play = root.querySelector('[data-k=play]');
const G = window.GEO;
const P = (lat, lon) => [(lon - G.W) * G.k * (G.w / ((G.E - G.W) * G.k)), (G.N - lat) * (G.w / ((G.E - G.W) * G.k))];
/* [id, lat, lon, colour, [[year, strength] ...]] — strength 0..1, straight lines between */
const K = [
  ['srivijaya', -2.99, 104.76, '#3fd18b', [[660, 0], [690, 0.8], [1000, 0.85], [1025, 0.55], [1200, 0.35], [1290, 0]]],
  ['dvaravati', 13.82, 100.06, '#c77dff', [[550, 0], [620, 0.45], [950, 0.4], [1050, 0]]],
  ['hariphunchai', 18.58, 99.01, '#ff9bd1', [[750, 0], [800, 0.3], [1250, 0.35], [1292, 0]]],
  ['angkor', 13.41, 103.87, '#ff5a3c', [[790, 0], [830, 0.7], [1000, 0.9], [1180, 1], [1250, 0.8], [1400, 0.45], [1431, 0]]],
  ['cambodia', 11.56, 104.92, '#ff8a6a', [[1431, 0], [1440, 0.35], [1600, 0.32], [1800, 0.25], [1863, 0.2], [1885, 0]]],
  ['champa', 13.9, 109.1, '#ffb070', [[600, 0.25], [900, 0.45], [1100, 0.45], [1471, 0.1], [1500, 0]]],
  ['pagan', 21.17, 94.86, '#ffc21a', [[1000, 0], [1044, 0.6], [1150, 0.95], [1250, 0.7], [1287, 0.15], [1300, 0]]],
  ['daiviet', 21.03, 105.85, '#e8344e', [[939, 0], [1010, 0.55], [1400, 0.7], [1500, 0.8], [1800, 0.8], [1802, 0]]],
  ['hue', 16.46, 107.58, '#e8344e', [[1802, 0], [1803, 0.85], [1858, 0.7], [1885, 0.2], [1900, 0]]],
  ['sukhothai', 17.02, 99.70, '#9ad94b', [[1230, 0], [1250, 0.5], [1290, 0.75], [1350, 0.45], [1438, 0]]],
  ['lanna', 18.79, 98.99, '#2fb0ff', [[1260, 0], [1296, 0.6], [1460, 0.8], [1540, 0.6], [1558, 0.3], [1726, 0.25], [1730, 0.5], [1755, 0.45], [1758, 0.25], [1774, 0.25], [1782, 0.45], [1870, 0.4], [1899, 0.12], [1939, 0.05], [1950, 0]]],
  ['nan', 18.78, 100.77, '#7fd6ff', [[1300, 0], [1320, 0.2], [1880, 0.2], [1931, 0]]],
  ['kengtung', 21.29, 99.6, '#9fe0ff', [[1250, 0], [1300, 0.18], [1880, 0.18], [1900, 0.05], [1959, 0]]],
  ['sipsong', 22.0, 100.8, '#b8f0ff', [[1180, 0], [1200, 0.22], [1850, 0.2], [1900, 0.05], [1953, 0]]],
  ['ayutthaya', 14.36, 100.57, '#f5b800', [[1340, 0], [1351, 0.6], [1450, 0.85], [1600, 1], [1700, 0.9], [1765, 0.7], [1767, 0]]],
  ['bangkok', 13.75, 100.5, '#ffd34d', [[1767, 0], [1768, 0.6], [1782, 0.8], [1830, 1], [1880, 1], [1910, 0.55], [2026, 0.4]]],
  ['lanxang', 19.89, 102.13, '#16b88a', [[1340, 0], [1353, 0.6], [1550, 0.8], [1650, 0.75], [1707, 0]]],
  ['vientiane', 17.97, 102.6, '#5fe0b0', [[1707, 0], [1708, 0.4], [1778, 0.3], [1828, 0]]],
  ['luangprabang', 19.89, 102.13, '#5fe0b0', [[1707, 0], [1708, 0.3], [1890, 0.25], [1893, 0.1], [1950, 0]]],
  ['pegu', 17.33, 96.48, '#ffa53d', [[1280, 0], [1287, 0.45], [1450, 0.6], [1539, 0.6], [1555, 1], [1581, 1], [1599, 0]]],
  ['ava', 21.86, 96.0, '#ffcf6b', [[1364, 0], [1365, 0.55], [1527, 0.5], [1555, 0], [1752, 0], [1753, 0.8], [1790, 1], [1824, 0.9], [1853, 0.6], [1885, 0]]],
  ['malacca', 2.19, 102.25, '#c77dff', [[1395, 0], [1405, 0.5], [1480, 0.65], [1511, 0]]],
  ['majapahit', -7.56, 112.38, '#ff6fb1', [[1290, 0], [1293, 0.5], [1350, 1], [1389, 0.9], [1450, 0.5], [1527, 0]]],
  ['patani', 6.87, 101.25, '#d9a3ff', [[1390, 0], [1400, 0.2], [1600, 0.3], [1786, 0.15], [1902, 0.05], [1910, 0]]],
  ['kedah', 6.12, 100.37, '#e6c2ff', [[1130, 0], [1150, 0.18], [1800, 0.18], [1909, 0.05], [1915, 0]]]
];
const NAMES = M.T('years.names', {});
const NOTES = M.T('years.notes', {});
const noteYears = Object.keys(NOTES).map(Number).sort((a, b) => a - b);
const strength = (keys, y) => { if (y <= keys[0][0] || y >= keys[keys.length - 1][0]) return 0; for (let i = 1; i < keys.length; i++) if (y < keys[i][0]) { const [y0, s0] = keys[i - 1], [y1, s1] = keys[i]; return s0 + (s1 - s0) * (y - y0) / (y1 - y0); } return 0; };
const pts = K.map(k => P(k[1], k[2]));
let year = +yr.value, playing = false, last = 0;
const landPath = new Path2D(); G.land.forEach(c => c.r.forEach(r => { landPath.moveTo(r[0], r[1]); for (let i = 2; i < r.length; i += 2) landPath.lineTo(r[i], r[i + 1]); landPath.closePath(); }));

const setYear = y => {
  year = Math.round(y); yr.value = year; yearOut.textContent = M.yearLabel(year);
  let ny = null; for (const n of noteYears) if (n <= year) ny = n; note.textContent = ny != null ? NOTES[ny] : '';
};
st.draw = (t = 0) => {
  const ctx = st.ctx, w = st.w, h = st.h; const dt = Math.min(0.05, t - last || 0.016); last = t;
  if (playing) { setYear(Math.min(2026, year + dt * 55)); if (year >= 2026) { playing = false; play.setAttribute('aria-pressed', false); } }
  ctx.fillStyle = '#081129'; ctx.fillRect(0, 0, w, h);
  const s = Math.min(w / G.w, h / G.h) * 1.0; const ox = (w - G.w * s) / 2, oy = (h - G.h * s) / 2;
  ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(120,160,255,.45)'; ctx.shadowBlur = 10;
  ctx.fillStyle = '#3a2f6e'; ctx.fill(landPath); ctx.shadowBlur = 0;
  ctx.restore();
  const live = K.map((k, i) => ({ k, i, v: strength(k[4], year) })).filter(o => o.v > 0.01);
  ctx.globalCompositeOperation = 'lighter';
  for (const o of live) { const [x, y] = pts[o.i]; M.glow(ctx, ox + x * s, oy + y * s, (60 + o.v * 300) * s, o.k[3], 0.4 + o.v * 0.7); }
  ctx.globalCompositeOperation = 'source-over';
  // the modern lines come in between 1885 and 1910
  const b = Math.max(0, Math.min(1, (year - 1885) / 25));
  if (b > 0) {
    ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s);
    ctx.strokeStyle = `rgba(255,255,255,${(0.85 * b).toFixed(2)})`; ctx.lineWidth = 2.2 / s; ctx.setLineDash([7 / s, 4 / s]);
    ctx.stroke(landPath); ctx.setLineDash([]); ctx.restore();
  }
  const u = Math.min(w, h);
  ctx.textAlign = 'center';
  const placed = [];
  for (const o of live.sort((a, b2) => b2.v - a.v)) {
    const [x, y] = pts[o.i]; const X = ox + x * s, Y = oy + y * s; const r = Math.max(5, (6 + o.v * 20) * s * 2.2);
    M.drawSprite(ctx, M.sprite(900 + o.i, 30, { n: 8 }), X, Y, r, t * 0.3);
    if (o.v > 0.12) {
      const name = NAMES[o.k[0]] || o.k[0]; const fs = Math.max(11, Math.min(17, u * 0.03)) * (0.85 + o.v * 0.3);
      const ly = Y - r - 5;
      if (placed.some(p => Math.abs(p[0] - X) < fs * 4 && Math.abs(p[1] - ly) < fs * 1.2)) continue;
      placed.push([X, ly]);
      ctx.font = M.font(fs); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(8,6,28,.9)'; ctx.strokeText(name, X, ly); ctx.fillStyle = '#fff'; ctx.fillText(name, X, ly);
    }
  }
};
yr.addEventListener('input', () => { playing = false; play.setAttribute('aria-pressed', false); setYear(+yr.value); st.kick(200); });
play.addEventListener('click', () => { playing = !playing; if (playing && year >= 2026) setYear(600); play.setAttribute('aria-pressed', playing); M.note(4); st.kick(30000); });
root.querySelectorAll('[data-y]').forEach(b => b.addEventListener('click', () => { playing = false; setYear(+b.dataset.y); M.note(noteYears.indexOf(+b.dataset.y)); st.kick(300); }));
cv.addEventListener('pointerdown', e => {
  const p = M.pt(st, e); const s = Math.min(st.w / G.w, st.h / G.h); const ox = (st.w - G.w * s) / 2, oy = (st.h - G.h * s) / 2;
  let best = null, bd = 1e9; K.forEach((k, i) => { const v = strength(k[4], year); if (v <= 0.01) return; const d = Math.hypot(p.x - (ox + pts[i][0] * s), p.y - (oy + pts[i][1] * s)); if (d < bd) { bd = d; best = i; } });
  if (best != null && bd < 50) { M.burst(ox + pts[best][0] * s, oy + pts[best][1] * s, K[best][3], 20); M.note(best); note.textContent = (NAMES[K[best][0]] || K[best][0]) + ' · ' + M.yearLabel(year); st.kick(1200); }
});
setYear(year);
})();
