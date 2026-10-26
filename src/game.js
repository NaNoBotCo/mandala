/* A town under two skies: eight years, ten baskets a year, two big kings who both want some. */
(() => {
'use strict';
const M = window.MANDALA; const root = document.getElementById('toy-game'); if (!root) return;
const G = M.T('game', {});
const KN = G.kings || ['River King', 'Hill King'];
const YEARS = 8, BASKETS = 10;
const el = s => root.querySelector(s);
const state = { y: 1, mood: [6, 6], give: [3, 3], demand: [3, 3], raid: [0, 0], titles: 0, hungry: 0, fed: 0, over: false, lost: 0 };
const svgBasket = c => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18l-2 10H5z" fill="${c}"/><path d="M7 10c0-4 10-4 10 0" fill="none" stroke="${c}" stroke-width="2"/><path d="M6 13h12M6.5 16h11" stroke="rgba(0,0,0,.25)"/></svg>`;
const ICON = {
  umbrella: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20" stroke="#f5b800" stroke-width="1.6"/><path d="M6 6h12l-1 2H7zM5 10h14l-1 2H6zM4 14h16l-1 2H5z" fill="#f5b800"/></svg>',
  elephant: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16v-5c0-4 3-6 7-6s8 2 8 6v1c1 0 2 1 2 3v3h-2v-2h-1v4h-2.5v-3h-5v3H8v-3.5c-1 0-2-.5-2-1.5v3H4z" fill="#b9b1d6"/><circle cx="15.5" cy="9.5" r=".9" fill="#1a1446"/></svg>',
  rice: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22V8M12 12c-3-1-5-4-5-7 3 1 5 3 5 7zm0 3c3-1 5-4 5-7-3 1-5 3-5 7z" fill="#9ad94b" stroke="#9ad94b"/></svg>'
};
const meter = v => Array.from({ length: 10 }, (_, i) => `<i class="${i < v ? 'on' : ''}"></i>`).join('');
const say = (s, cls = '') => { const p = document.createElement('p'); p.innerHTML = s; if (cls) p.className = cls; el('.log').prepend(p); while (el('.log').children.length > 4) el('.log').lastChild.remove(); };
const keep = () => BASKETS - state.give[0] - state.give[1] - state.lost;

const newDemand = () => {
  state.demand = [2 + Math.floor(Math.random() * 3), 2 + Math.floor(Math.random() * 3)];
  if (Math.random() < 0.3) { const i = Math.random() < 0.5 ? 0 : 1; state.demand[i] += 1; return M.fmt(G.special || '{k} has a new son. He wants a bit more this year.', { k: KN[i] }); }
  return '';
};
const render = () => {
  [0, 1].forEach(i => {
    const box = el(`.king[data-i="${i}"]`);
    box.querySelector('.meter').innerHTML = meter(state.mood[i]);
    box.querySelector('.meter').setAttribute('aria-label', `${state.mood[i]} / 10`);
    box.querySelector('.want').textContent = M.fmt(G.wants || 'wants {n}', { n: state.demand[i] });
    box.querySelector('.giv b').textContent = M.num(state.give[i]);
    box.style.setProperty('--glow', (state.mood[i] / 10).toFixed(2));
    box.classList.toggle('mad', state.mood[i] <= 2);
  });
  const k = keep();
  el('.baskets').innerHTML = Array.from({ length: BASKETS }, (_, i) => {
    let c = '#9ad94b'; if (i < state.give[0]) c = M.KCOL[0]; else if (i < state.give[0] + state.give[1]) c = M.KCOL[1]; else if (i >= BASKETS - state.lost) c = '#55507a';
    return svgBasket(c);
  }).join('');
  el('.keep b').textContent = M.num(Math.max(0, k));
  el('.year').textContent = M.fmt(G.year || 'Year {y} of {n}', { y: Math.min(state.y, YEARS), n: YEARS });
  el('.titles').innerHTML = ICON.umbrella.repeat(state.titles) || '';
  el('[data-k=send]').hidden = state.over; el('[data-k=again]').hidden = !state.over;
  root.querySelectorAll('.step').forEach(b => { b.disabled = state.over; });
};
root.querySelectorAll('.step').forEach(b => b.addEventListener('click', () => {
  const i = +b.dataset.i, d = +b.dataset.d;
  if (d > 0 && keep() <= 0) { M.bell(196, 0.4, 0.06); return; }
  state.give[i] = Math.max(0, state.give[i] + d); M.note(state.give[i]); render();
}));
el('[data-k=send]').addEventListener('click', () => {
  const g = state.give, dmd = state.demand; const k = keep();
  [0, 1].forEach(i => {
    const diff = g[i] - dmd[i];
    state.mood[i] = Math.max(0, Math.min(10, state.mood[i] + (diff >= 0 ? Math.min(2, diff + 1) : diff * 1.5)));
  });
  state.mood = state.mood.map(Math.round);
  const lines = [];
  if (k >= 4) { state.fed++; lines.push(`${ICON.rice} ${G.fed || 'Your folks ate good this year.'}`); }
  else { state.hungry++; lines.push(`<b>${G.hungry || 'Folks are hungry.'}</b>`); }
  state.lost = 0;
  [0, 1].forEach(i => {
    const other = 1 - i;
    if (state.mood[i] <= 2) {
      if (state.mood[other] >= 8 && Math.random() < 0.6) lines.push(`${ICON.umbrella} ${M.fmt(G.saved || 'The {k} got mad, but the {o} said: touch that town and you answer to me.', { k: KN[i], o: KN[other] })}`);
      else { state.lost += 3; lines.push(`${ICON.elephant} <b>${M.fmt(G.raid || 'The {k} sent elephants. You lose 3 baskets next year.', { k: KN[i] })}</b>`); state.mood[i] = 4; M.bell(110, 1.2, 0.14); }
    } else if (state.mood[i] >= 9 && Math.random() < 0.7) {
      state.titles++; lines.push(`${ICON.umbrella} ${M.fmt(G.gift || 'The {k} is tickled. He sends you a fancy umbrella and a title.', { k: KN[i] })}`); state.mood[i] = 7; M.bell(1046, 1.6, 0.08);
    }
  });
  lines.reverse().forEach(l => say(l));
  state.y++;
  if (state.y > YEARS) {
    state.over = true; const score = state.fed * 2 + state.titles * 2 - state.hungry * 2;
    const ends = G.ends || ['Rough years. But the town is still here, and that counts.', 'Not bad. You kept both kings off your back.', 'Folks will tell stories about you for a hundred years.'];
    say(`<b>${ends[score >= 14 ? 2 : score >= 8 ? 1 : 0]}</b>`, 'end'); M.gong();
  } else {
    const sp = newDemand(); if (sp) say(sp);
    state.give = [Math.min(state.give[0], BASKETS - state.lost), Math.min(state.give[1], BASKETS - state.lost - Math.min(state.give[0], BASKETS - state.lost))];
  }
  render();
});
el('[data-k=again]').addEventListener('click', () => {
  Object.assign(state, { y: 1, mood: [6, 6], give: [3, 3], titles: 0, hungry: 0, fed: 0, over: false, lost: 0 }); newDemand(); el('.log').innerHTML = ''; say(G.start || 'Ten baskets. Two kings. Go on.'); render();
});
newDemand(); say(G.start || 'Ten baskets. Two kings. Go on.'); render();
})();
