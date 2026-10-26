# Mandala · The Circle Kings

The old Southeast Asian mandala system, kingdoms as circles of light with no fences, told five ways: Uncle Jimmy (American South), Uncle Dazza (Australian), แม่อุ๊ยบัว (Kham Mueang, northern Thai), आबा (rural Marathi), and your cousin (Gen Z, 2026). Same toys on every page.

**Live:** https://nanobotco.github.io/mandala/ · /bogan/ · /lanna/ · /marathi/ · /genz/

- `tools/voices/<voice>.py` — every word on a page, one file per voice. `[[word|meaning]]` makes a word you can tap for its meaning.
- `src/*.js` — the mandala painter and the nine toys: hero galaxy, mandala maker with sand sweep, Kautilya's circle on a honeycomb, porch-light kings, kings inside kings, a town under two skies (tribute game), orbits that wobble when a king dies, kingdoms as lights over the map 600–2026, and a valley drawn as offices and as people.
- `tools/geo.py` — cuts Natural Earth country outlines down to Southeast Asia (`src/geo.js`).
- `tools/build.py` — the pages · `tools/card.py` — a share card per voice · `tools/serve.py` — local preview on :9113.
- `./publish.sh` — style check, build, cards, copy-ready `docs/` (GitHub Pages serves `main` `/docs`).

Text and pictures CC BY 4.0; code MIT; photographs keep their own licences. See NOTICE.txt.

Contact: Nan · nan@motdang.net
