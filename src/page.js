/* The page around the toys: tap-a-word meanings, read-aloud, sound switch, little mandalas that answer a tap,
   pictures that load as they come near. */
(() => {
'use strict';
const M = window.MANDALA; const V = window.V || {};
// words with a meaning tucked in
let tip = null;
const hideTip = () => { if (tip) { tip.remove(); tip = null; } };
document.addEventListener('click', e => {
  const w = e.target.closest('.sl');
  if (!w) { if (!e.target.closest('.tip')) hideTip(); return; }
  e.preventDefault(); const same = tip && tip._for === w; hideTip(); if (same) return;
  tip = document.createElement('span'); tip.className = 'tip'; tip.setAttribute('role', 'status'); tip.textContent = w.dataset.g; tip._for = w;
  document.body.appendChild(tip);
  const r = w.getBoundingClientRect(); const tw = Math.min(280, window.innerWidth - 24);
  tip.style.maxWidth = tw + 'px';
  const tr = tip.getBoundingClientRect();
  let x = r.left + r.width / 2 - tr.width / 2; x = Math.max(12, Math.min(window.innerWidth - tr.width - 12, x));
  let y = r.top - tr.height - 10; if (y < 60) y = r.bottom + 10;
  tip.style.left = x + 'px'; tip.style.top = (y + window.scrollY) + 'px';
  M.bell(1568, 0.35, 0.03);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') hideTip(); if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('sl')) { e.preventDefault(); e.target.click(); } });
window.addEventListener('scroll', hideTip, { passive: true });

// read it out loud: the way grandma would, if grandma were a phone
const synth = window.speechSynthesis;
let speaking = null;
const pickVoice = () => {
  if (!synth) return null; const vs = synth.getVoices(); const want = (V.tts || 'en-US').toLowerCase(); const base = want.split('-')[0];
  return vs.find(v => v.lang.toLowerCase() === want) || vs.find(v => v.lang.toLowerCase().replace('_', '-') === want) || vs.find(v => v.lang.toLowerCase().startsWith(base)) || (V.tts2 && vs.find(v => v.lang.toLowerCase().startsWith(V.tts2))) || null;
};
const stopTalk = () => { if (synth) synth.cancel(); if (speaking) { speaking.setAttribute('aria-pressed', 'false'); speaking.querySelector('span').textContent = M.T('ui.say', 'Say it'); } speaking = null; };
document.querySelectorAll('.say').forEach(b => {
  if (!synth) { b.hidden = true; return; }
  b.addEventListener('click', () => {
    if (speaking === b) { stopTalk(); return; } stopTalk();
    const sec = document.getElementById(b.dataset.for); if (!sec) return;
    const text = [...sec.querySelectorAll('h2, .talk p')].map(n => { const x = n.textContent.trim(); return /[.!?।]$/.test(x) ? x : x + '.'; }).join(' ');
    const u = new SpeechSynthesisUtterance(text); const v = pickVoice(); if (v) u.voice = v; u.lang = v ? v.lang : (V.tts || 'en-US');
    u.rate = V.rate || 0.92; u.onend = u.onerror = () => { if (speaking === b) stopTalk(); };
    speaking = b; b.setAttribute('aria-pressed', 'true'); b.querySelector('span').textContent = M.T('ui.stop', 'Stop');
    synth.speak(u);
  });
});
window.addEventListener('pagehide', () => { if (synth) synth.cancel(); });

// the voice switch shows the voice you are reading
document.querySelectorAll('nav.voices').forEach(n => { const a = n.querySelector('[aria-current]'); if (a && n.scrollWidth > n.clientWidth) n.scrollLeft = a.offsetLeft - n.clientWidth / 2 + a.clientWidth / 2; });

// sound switch
const snd = document.querySelector('.snd');
if (snd) {
  const show = () => { snd.setAttribute('aria-pressed', String(!M.muted())); snd.querySelector('span').textContent = M.muted() ? M.T('ui.soundOff', 'Sound off') : M.T('ui.soundOn', 'Sound on'); };
  snd.addEventListener('click', () => { M.setMuted(!M.muted()); show(); if (!M.muted()) M.bell(784); });
  show();
}

// little mandalas by the headings: tap and they spin and ring
document.querySelectorAll('canvas.mark').forEach((c, i) => {
  const st = M.stage(c, { animate: !M.RM }); const rings = M.makeMandala(+c.dataset.seed || i + 3, { n: 8 + (i % 3) * 2 }); let boost = 0, ang = 0, last = 0;
  st.draw = (t = 0) => { const dt = Math.min(0.05, t - last || 0.016); last = t; boost *= 0.95; ang += dt * boost; st.ctx.clearRect(0, 0, st.w, st.h); M.drawMandala(st.ctx, st.w / 2, st.h / 2, Math.min(st.w, st.h) / 2 - 1, rings, t * 0.5, { rot: ang }); };
  c.addEventListener('click', () => { boost = 14; M.note(i); st.kick(2500); });
});

// pictures: load as they come near; the band picture holds still while the page goes past
const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const img = e.target; if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); } io.unobserve(img); }), { rootMargin: '600px 0px' });
document.querySelectorAll('img[data-src]').forEach(i => io.observe(i));
document.querySelectorAll('.card img, .band img').forEach(img => img.addEventListener('click', () => { const f = img.closest('figure, .band'); f.classList.remove('wink'); void f.offsetWidth; f.classList.add('wink'); M.bell(988, 0.9, 0.06); }));

// fonts arrive late; redraw the canvases that have words on them
if (document.fonts) document.fonts.ready.then(() => (M.all || []).forEach(s => s.draw && s.draw(s.t)));

// the nav marks where you are
const links = [...document.querySelectorAll('nav.sec a')]; const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
const nio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { links.forEach(a => a.removeAttribute('aria-current')); const a = map.get(e.target.id); if (a) { a.setAttribute('aria-current', 'true'); const nav = a.parentElement; nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.clientWidth / 2, behavior: M.RM ? 'auto' : 'smooth' }); } } }), { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('section[id]').forEach(s => nio.observe(s));
})();
