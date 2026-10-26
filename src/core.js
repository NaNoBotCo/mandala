/* Mandala, drawn — shared pieces: strings, stage, sound, seeded random, the mandala painter. */
(() => {
'use strict';
const M = window.MANDALA = {};
const V = window.V || {};
M.T = (k, d) => {
  const parts = k.split('.'); let o = V.t || {};
  for (const p of parts) { if (o == null) break; o = o[p]; }
  return o == null ? d : o;
};
const DEVA = '०१२३४५६७८९';
M.num = n => V.digits === 'deva' ? String(n).replace(/[0-9]/g, d => DEVA[d]) : String(n);
M.yearLabel = y => (V.era_label ? V.era_label + ' ' : '') + M.num(y + (V.era || 0));
M.fmt = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] == null ? '' : typeof o[k] === 'number' ? M.num(o[k]) : o[k]));
M.RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
M.TAU = Math.PI * 2;
M.PAL = { gold: '#f5b800', saffron: '#ff7a1a', red: '#e8344e', jade: '#16b88a', sky: '#3fa9ff', violet: '#9d6bff', pink: '#ff5c9a', cream: '#fff3d6', white: '#fffaf0', indigo: '#1a1446', night: '#0d0a26' };
M.KCOL = ['#ff5a3c', '#2fb0ff', '#ffc21a', '#3fd18b', '#c77dff', '#ff6fb1'];

M.FAM = (getComputedStyle(document.documentElement).getPropertyValue('--canvas-font') || 'system-ui, sans-serif').trim();
M.font = (px, w = 800) => `${w} ${Math.round(px)}px ${M.FAM}`;
M.rng = seed => { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

/* A canvas that knows its size, its pixel ratio and whether anyone can see it. */
M.stage = (canvas, o = {}) => {
  const ctx = canvas.getContext('2d');
  const st = { canvas, ctx, w: 1, h: 1, t: 0, visible: false, running: false, animate: o.animate !== false && !M.RM, draw: null, onresize: null };
  const t0 = performance.now();
  const size = () => {
    const r = canvas.getBoundingClientRect(); const d = Math.min(2, window.devicePixelRatio || 1);
    if (r.width < 2) return;
    st.w = r.width; st.h = r.height; st.dpr = d;
    canvas.width = Math.round(r.width * d); canvas.height = Math.round(r.height * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    st.onresize && st.onresize();
    st.draw && st.draw(st.t);
  };
  const frame = now => {
    st.t = (now - t0) / 1000;
    st.draw && st.draw(st.t);
    if (st.visible && (st.animate || st.busy > performance.now())) requestAnimationFrame(frame); else st.running = false;
  };
  st.kick = (ms = 0) => {
    if (ms) st.busy = Math.max(st.busy || 0, performance.now() + ms);
    if (!st.running && st.visible) { st.running = true; requestAnimationFrame(frame); }
  };
  new ResizeObserver(size).observe(canvas);
  new IntersectionObserver(es => { st.visible = es[es.length - 1].isIntersecting; if (st.visible) st.kick(60); }, { rootMargin: '120px' }).observe(canvas);
  size();
  (M.all = M.all || []).push(st);
  return st;
};
M.pt = (st, e) => { const r = st.canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

/* Sound: a small bell, a gong, a whisper of sand. Off until someone taps, and a mute in the bar. */
let AC = null; let muted = false;
try { muted = localStorage.getItem('mandala-mute') === '1'; } catch (e) {}
M.muted = () => muted;
M.setMuted = v => { muted = v; try { localStorage.setItem('mandala-mute', v ? '1' : '0'); } catch (e) {} };
const ac = () => { if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); } if (AC.state === 'suspended') AC.resume(); return AC; };
M.bell = (f = 660, dur = 1.4, vol = 0.1) => {
  if (muted) return; const a = ac(); if (!a) return; const t = a.currentTime;
  [[1, vol], [2.76, vol * 0.3], [5.4, vol * 0.12]].forEach(([m, v], i) => {
    const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = f * m;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur / (1 + i));
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur);
  });
};
M.SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
M.note = i => M.bell(M.SCALE[((i % M.SCALE.length) + M.SCALE.length) % M.SCALE.length]);
M.gong = () => { M.bell(98, 3.6, 0.22); M.bell(147, 2.4, 0.06); };
M.sand = (dur = 1.6) => {
  if (muted) return; const a = ac(); if (!a) return; const t = a.currentTime;
  const b = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate); const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / d.length);
  const s = a.createBufferSource(); s.buffer = b; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 0.6;
  const g = a.createGain(); g.gain.value = 0.07; s.connect(f).connect(g).connect(a.destination); s.start(t);
};

/* ---------- the mandala painter ----------
   A mandala is a list of rings. Each ring has a motif repeated n times round the circle,
   and its own slow turn. Same seed, same mandala. */
const MOTIFS = ['petal', 'lotus', 'dots', 'zig', 'ray', 'scallop', 'petal', 'lotus', 'leaf', 'gate'];
M.makeMandala = (seed, o = {}) => {
  const R = M.rng(seed * 7919 + 13);
  const pick = a => a[Math.floor(R() * a.length)];
  const base = o.colors || [M.PAL.gold, M.PAL.saffron, M.PAL.red, M.PAL.jade, M.PAL.sky, M.PAL.violet, M.PAL.pink, M.PAL.cream];
  const cols = base.slice().sort(() => R() - 0.5);
  const n0 = o.n || pick([6, 8, 8, 10, 12, 12, 16]);
  const rings = [{ type: 'core', r0: 0, r1: 0.13 + R() * 0.05, n: n0, c: cols[0], c2: cols[1], spin: 0.3, off: 0 }];
  let r = rings[0].r1; let i = 1;
  const maxR = o.gate ? 0.8 : 1;
  while (r < maxR - 0.06) {
    const w = Math.min(maxR - r, 0.08 + R() * 0.13);
    let type = pick(MOTIFS); if (type === 'gate') type = 'petal';
    const n = type === 'dots' || type === 'zig' || type === 'ray' ? n0 * 2 : pick([n0, n0, n0 * 2]);
    rings.push({ type, r0: r, r1: r + w, n, c: cols[i % cols.length], c2: cols[(i + 3) % cols.length], spin: (i % 2 ? -1 : 1) * (0.04 + R() * 0.12), off: R() * M.TAU });
    r += w; i++;
  }
  if (o.gate) rings.push({ type: 'gate', r0: 0.82, r1: 1, n: 4, c: cols[2], c2: cols[5], spin: 0, off: Math.PI / 4 });
  return rings;
};

const motif = (ctx, g, r0, r1, n) => {
  const mid = (r0 + r1) / 2, wid = (M.TAU * mid / n) * 0.42;
  ctx.beginPath();
  switch (g.type) {
    case 'petal':
      ctx.moveTo(r0, 0); ctx.quadraticCurveTo(mid, wid, r1, 0); ctx.quadraticCurveTo(mid, -wid, r0, 0); break;
    case 'lotus':
      ctx.moveTo(r0, 0); ctx.bezierCurveTo(r0 + (r1 - r0) * 0.2, wid * 1.25, r0 + (r1 - r0) * 0.75, wid * 0.9, r1, 0);
      ctx.bezierCurveTo(r0 + (r1 - r0) * 0.75, -wid * 0.9, r0 + (r1 - r0) * 0.2, -wid * 1.25, r0, 0); break;
    case 'leaf':
      ctx.moveTo(r0, 0); ctx.quadraticCurveTo(r0 + (r1 - r0) * 0.3, wid * 1.1, r1, wid * 0.15); ctx.quadraticCurveTo(r0 + (r1 - r0) * 0.6, -wid * 0.6, r0, 0); break;
    case 'dots':
      ctx.arc(mid, 0, Math.max(0.6, Math.min(wid * 0.8, (r1 - r0) * 0.38)), 0, M.TAU); break;
    case 'zig':
      ctx.moveTo(r0, -wid); ctx.lineTo(r1, 0); ctx.lineTo(r0, wid); ctx.closePath(); break;
    case 'ray':
      ctx.moveTo(r0, -wid * 0.18); ctx.lineTo(r1, 0); ctx.lineTo(r0, wid * 0.18); ctx.closePath(); break;
    case 'scallop':
      ctx.moveTo(r0, -wid * 1.05); ctx.lineTo(mid, -wid * 1.05); ctx.arc(mid, 0, wid * 1.05, -Math.PI / 2, Math.PI / 2); ctx.lineTo(r0, wid * 1.05); ctx.closePath(); break;
  }
};

M.drawMandala = (ctx, x, y, rad, rings, t = 0, o = {}) => {
  if (rad < 0.5) return;
  ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot);
  const sp = o.speed == null ? 1 : o.speed;
  const lw = Math.max(0.5, rad * 0.012);
  for (const g of rings) {
    const r0 = g.r0 * rad, r1 = g.r1 * rad, a0 = g.off + t * g.spin * sp;
    if (g.type === 'core') {
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r1);
      gr.addColorStop(0, '#fffbe8'); gr.addColorStop(0.45, g.c); gr.addColorStop(1, g.c2);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r1, 0, M.TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.save(); ctx.rotate(a0);
      for (let k = 0; k < g.n; k++) { ctx.rotate(M.TAU / g.n); ctx.beginPath(); ctx.moveTo(r1 * 0.15, 0); ctx.quadraticCurveTo(r1 * 0.5, r1 * 0.16, r1 * 0.85, 0); ctx.quadraticCurveTo(r1 * 0.5, -r1 * 0.16, r1 * 0.15, 0); ctx.fill(); }
      ctx.restore();
      continue;
    }
    if (g.type === 'gate') {
      // the square wall with a gate on each side, like a city plan or a temple yard
      const s = r1 * 0.72, gw = s * 0.22;
      ctx.save(); ctx.rotate(a0 - Math.PI / 4);
      ctx.fillStyle = 'rgba(63,169,255,.16)'; ctx.fillRect(-s * 1.08, -s * 1.08, s * 2.16, s * 2.16);
      ctx.strokeStyle = '#f5b800'; ctx.lineWidth = Math.max(1, rad * 0.022); ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        ctx.save(); ctx.rotate(k * Math.PI / 2);
        ctx.moveTo(-s, -s); ctx.lineTo(-gw, -s); ctx.lineTo(-gw, -s - gw * 0.55); ctx.moveTo(gw, -s - gw * 0.55); ctx.lineTo(gw, -s); ctx.lineTo(s, -s);
        ctx.restore();
      }
      ctx.stroke();
      ctx.fillStyle = '#f5b800';
      [[-s, -s], [s, -s], [s, s], [-s, s]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, rad * 0.03), 0, M.TAU); ctx.fill(); });
      ctx.restore();
      continue;
    }
    ctx.fillStyle = g.c;
    ctx.save(); ctx.rotate(a0);
    for (let k = 0; k < g.n; k++) {
      motif(ctx, g, r0, r1, g.n); ctx.fill();
      ctx.rotate(M.TAU / g.n);
    }
    ctx.restore();
    if (rad > 18) {
      ctx.strokeStyle = g.c2; ctx.globalAlpha = 0.55; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.arc(0, 0, r1, 0, M.TAU); ctx.stroke(); ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
};

/* Small mandalas are painted once into a picture and turned as a whole. */
const sprites = new Map();
M.sprite = (seed, px, o = {}) => {
  const d = Math.min(2, window.devicePixelRatio || 1); const key = seed + ':' + Math.round(px * d) + ':' + (o.key || '');
  if (sprites.has(key)) return sprites.get(key);
  const c = document.createElement('canvas'); const s = Math.ceil(px * 2 * d) + 2; c.width = c.height = s;
  const x = c.getContext('2d'); x.scale(d, d);
  M.drawMandala(x, px + 1 / d, px + 1 / d, px, o.rings || M.makeMandala(seed, o), 0, { speed: 0 });
  const sp = { c, px, d };
  if (sprites.size > 400) sprites.clear();
  sprites.set(key, sp); return sp;
};
M.drawSprite = (ctx, sp, x, y, rad, rot = 0, alpha = 1) => {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot);
  const k = rad / sp.px; ctx.drawImage(sp.c, -rad - k / sp.d, -rad - k / sp.d, sp.c.width / sp.d * k, sp.c.height / sp.d * k);
  ctx.restore();
};

M.glow = (ctx, x, y, r, col, a = 1) => {
  if (r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, M.alpha(col, 0.55 * a)); g.addColorStop(0.35, M.alpha(col, 0.22 * a)); g.addColorStop(1, M.alpha(col, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fill();
};
M.alpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
};
M.rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
M.ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

/* Sparkles: a little burst wherever something was tapped. */
M.sparks = [];
M.burst = (x, y, col = M.PAL.gold, n = 18) => {
  for (let i = 0; i < n; i++) { const a = Math.random() * M.TAU, v = 40 + Math.random() * 120; M.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, col }); }
};
M.drawSparks = (ctx, dt, list = M.sparks) => {
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i]; s.life -= dt * 1.4; if (s.life <= 0) { list.splice(i, 1); continue; }
    s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.96; s.vy *= 0.96;
    ctx.fillStyle = M.alpha(s.col, s.life); const r = 1 + 2.4 * s.life;
    ctx.beginPath(); ctx.moveTo(s.x, s.y - r * 2); ctx.lineTo(s.x + r * 0.6, s.y); ctx.lineTo(s.x, s.y + r * 2); ctx.lineTo(s.x - r * 0.6, s.y); ctx.closePath(); ctx.fill();
  }
};
})();
