/* The page around the toys: the dialect switch, read-aloud, the sound switch, pictures that load as they come near. */
(() => {
'use strict';
const M = window.MANDALA; const V = window.V || {};

// dialect switch: remember the choice, go to that page
const dial = document.getElementById('dialect');
if (dial) {
  const start = dial.value; let byKey = false, pending = false;
  const go = () => { if (dial.value === start) return; const o = dial.selectedOptions[0]; try { localStorage.setItem('mandala-voice', o.dataset.v); } catch (e) {} location.href = o.value + location.hash; };
  dial.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } else if (/^(Arrow|Home|End|Page)/.test(e.key)) byKey = true; });
  dial.addEventListener('change', () => { if (byKey) { pending = true; byKey = false; } else go(); });
  dial.addEventListener('blur', () => { if (pending) go(); });
}

// read aloud, in the page's own language where the device has a voice for it
const synth = window.speechSynthesis;
let speaking = null;
const pickVoice = () => {
  if (!synth) return null; const vs = synth.getVoices(); const want = (V.tts || 'en-US').toLowerCase(); const base = want.split('-')[0];
  return vs.find(v => v.lang.toLowerCase().replace('_', '-') === want) || vs.find(v => v.lang.toLowerCase().startsWith(base)) || (V.tts2 && vs.find(v => v.lang.toLowerCase().startsWith(V.tts2))) || null;
};
const stopTalk = () => { if (synth) synth.cancel(); if (speaking) { speaking.setAttribute('aria-pressed', 'false'); speaking.setAttribute('aria-label', M.T('ui.say', 'Read aloud')); } speaking = null; };
document.querySelectorAll('.say').forEach(b => {
  if (!synth) { b.hidden = true; return; }
  b.addEventListener('click', () => {
    if (speaking === b) { stopTalk(); return; } stopTalk();
    const sec = document.getElementById(b.dataset.for); if (!sec) return;
    const text = [...sec.querySelectorAll('h2, .talk p')].map(n => { const x = n.textContent.trim(); return /[.!?।]$/.test(x) ? x : x + '.'; }).join(' ');
    const u = new SpeechSynthesisUtterance(text); const v = pickVoice(); if (v) u.voice = v; u.lang = v ? v.lang : (V.tts || 'en-US');
    u.rate = V.rate || 0.92; u.onend = u.onerror = () => { if (speaking === b) stopTalk(); };
    speaking = b; b.setAttribute('aria-pressed', 'true'); b.setAttribute('aria-label', M.T('ui.stop', 'Stop'));
    synth.speak(u);
  });
});
window.addEventListener('pagehide', () => { if (synth) synth.cancel(); });

// sound switch
const snd = document.querySelector('.snd');
if (snd) {
  const show = () => { snd.setAttribute('aria-pressed', String(!M.muted())); snd.setAttribute('aria-label', M.muted() ? M.T('ui.soundOff', 'Sound off') : M.T('ui.soundOn', 'Sound on')); };
  snd.addEventListener('click', () => { M.setMuted(!M.muted()); show(); if (!M.muted()) M.bell(784); });
  show();
}

// pictures load as they come near; a tap makes them glow
const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const img = e.target; if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); } io.unobserve(img); }), { rootMargin: '600px 0px' });
document.querySelectorAll('img[data-src]').forEach(i => io.observe(i));
document.querySelectorAll('.card, .band').forEach(f => f.addEventListener('click', e => { if (e.target.closest('a')) return; f.classList.remove('wink'); void f.offsetWidth; f.classList.add('wink'); M.bell(988, 0.9, 0.06); }));

// fonts arrive late; redraw the canvases that have words on them
if (document.fonts) document.fonts.ready.then(() => (M.all || []).forEach(s => s.draw && s.draw(s.t)));
})();
