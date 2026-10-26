/* When the king dies, the circle wobbles. Towns go round whoever pulls hardest;
   when a king's light goes dim, his towns drift off to the neighbours. */
(() => {
'use strict';
const M = window.MANDALA; const root = document.getElementById('toy-orbits'); if (!root) return;
const cv = root.querySelector('canvas'); const st = M.stage(cv);
const out = root.querySelector('.out'); const tally = root.querySelector('.tally');
const names = M.T('orbits.kings', M.T('lights.kings', ['Red King', 'Blue King', 'Gold King']));
const COL = ['#ff5a3c', '#2fb0ff', '#ffc21a'];
const kings = [{ hx: 0.26, hy: 0.36, m: 1 }, { hx: 0.74, hy: 0.32, m: 1 }, { hx: 0.5, hy: 0.74, m: 1 }];
kings.forEach((k, i) => { k.c = COL[i]; k.target = 1; k.rings = M.makeMandala(60 + i, { n: 10, colors: [COL[i], '#fff3d6', '#1a1446', COL[i], '#f5b800'] }); k.ph = i * 2; });
const R = M.rng(11); const towns = [];
for (let i = 0; i < 39; i++) { const k = i % 3; towns.push({ k, orb: 0.07 + R() * 0.12, a: R() * M.TAU, sp: 0.25 + R() * 0.35, x: kings[k].hx, y: kings[k].hy, seed: 500 + i, flash: 0 }); }
let last = 0, lastJudge = 0;

const kpos = (k, t) => ({ x: k.hx + Math.cos(t * 0.13 + k.ph) * 0.02, y: k.hy + Math.sin(t * 0.11 + k.ph) * 0.02 });
st.draw = (t = st.t) => {
  const ctx = st.ctx, w = st.w, h = st.h, u = Math.min(w, h); const dt = Math.max(0, Math.min(0.05, t - last || 0.016)); last = t;
  ctx.fillStyle = '#0d0a26'; ctx.fillRect(0, 0, w, h);
  kings.forEach(k => { k.m += (k.target - k.m) * Math.min(1, dt * (k.target > k.m ? 0.35 : 1.5)); k.p = kpos(k, t); });
  // who pulls hardest? asked a few times a second, with a little stubbornness
  if (t - lastJudge > 0.25) {
    lastJudge = t;
    for (const tw of towns) {
      const pull = kings.map(k => k.m / (0.02 + (tw.x - k.p.x) ** 2 + ((tw.y - k.p.y) * h / w) ** 2));
      let best = tw.k; pull.forEach((p, i) => { if (p > pull[best] * 1.25) best = i; });
      if (best !== tw.k && Math.random() < 0.5) { tw.k = best; tw.flash = 1; tw.orb = 0.07 + Math.random() * 0.12 * Math.sqrt(kings[best].m); }
    }
    const n = [0, 0, 0]; towns.forEach(tw => n[tw.k]++);
    tally.innerHTML = kings.map((k, i) => `<span style="--c:${k.c}"><i></i>${names[i]} <b>${M.num(n[i])}</b></span>`).join('');
  }
  ctx.globalCompositeOperation = 'lighter';
  kings.forEach(k => M.glow(ctx, k.p.x * w, k.p.y * h, u * 0.32 * (0.25 + k.m * 0.75), k.c, 0.25 + 0.6 * Math.min(1, k.m)));
  ctx.globalCompositeOperation = 'source-over';
  for (const tw of towns) {
    const k = kings[tw.k]; tw.a += dt * tw.sp * (0.6 + k.m * 0.6);
    const orb = tw.orb * (0.7 + 0.5 * Math.min(1.4, k.m));
    const tx = k.p.x + Math.cos(tw.a) * orb * u / w, ty = k.p.y + Math.sin(tw.a) * orb * u / h * 0.8;
    const f = Math.min(1, dt * (0.9 + 0.6 * k.m)); tw.x += (tx - tw.x) * f; tw.y += (ty - tw.y) * f;
    tw.flash *= 0.96;
    const r = u * 0.022 * (1 + tw.flash * 0.6);
    M.glow(ctx, tw.x * w, tw.y * h, r * 2.4, k.c, 0.5 + tw.flash);
    M.drawSprite(ctx, M.sprite(tw.seed, 16, { n: 8 }), tw.x * w, tw.y * h, r, -t * 0.5);
  }
  kings.forEach((k, i) => {
    const r = u * 0.06 * (0.45 + 0.55 * Math.min(1.3, k.m));
    M.drawMandala(ctx, k.p.x * w, k.p.y * h, r, k.rings, t, { speed: k.m });
    ctx.font = M.font(Math.max(11, u * 0.03)); ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,6,30,.85)';
    ctx.globalAlpha = 0.4 + 0.6 * Math.min(1, k.m); ctx.strokeText(names[i], k.p.x * w, k.p.y * h + r + 16); ctx.fillStyle = '#fff'; ctx.fillText(names[i], k.p.x * w, k.p.y * h + r + 16); ctx.globalAlpha = 1;
  });
  M.drawSparks(ctx, dt);
};
const strongest = () => { const n = [0, 0, 0]; towns.forEach(tw => n[tw.k]++); return n.indexOf(Math.max(...n)); };
root.querySelector('[data-k=die]').onclick = () => {
  const i = kings.findIndex(k => k.target >= 1 && kings.indexOf(k) === strongest()) >= 0 ? strongest() : kings.findIndex(k => k.target >= 1);
  if (i < 0) return; kings[i].target = 0.12; M.gong(); st.kick(4000); out.textContent = M.fmt(M.T('orbits.dieMsg', "The {k}'s light goes dim. His towns start looking around."), { k: names[i] }); st.kick();
};
root.querySelector('[data-k=rise]').onclick = () => {
  const i = kings.findIndex(k => k.target < 1); if (i < 0) { out.textContent = M.T('orbits.allStrong', 'Everybody is strong right now.'); return; }
  kings[i].target = 1.5; st.kick(4000); M.bell(784, 1.8, 0.1); M.burst(kings[i].p.x * st.w, kings[i].p.y * st.h, kings[i].c, 30);
  out.textContent = M.fmt(M.T('orbits.riseMsg', 'A new {k} shows what he has. Towns come back round.'), { k: names[i] });
  setTimeout(() => { if (kings[i].target === 1.5) kings[i].target = 1; }, 9000);
};
const shake = root.querySelector('[data-k=shake]');
if (shake) shake.onclick = () => { kings.forEach(k => { k.target = 0.3 + Math.random() * 1.4; }); M.note(Math.floor(Math.random() * 8)); out.textContent = M.T('orbits.shakeMsg', 'Wars, weddings, bad harvests. Watch them shuffle.'); };
cv.addEventListener('pointerdown', e => {
  const p = M.pt(st, e); const k = kings.find(k => Math.hypot(p.x - k.p.x * st.w, p.y - k.p.y * st.h) < Math.min(st.w, st.h) * 0.08);
  if (k) { k.target = Math.min(1.8, k.target + 0.3); M.note(kings.indexOf(k) + 2); M.burst(k.p.x * st.w, k.p.y * st.h, k.c); out.textContent = M.fmt(M.T('orbits.meritMsg', 'The {k} makes merit. His light grows.'), { k: names[kings.indexOf(k)] }); }
});
})();
