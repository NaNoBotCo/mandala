# Mandala · The Circle Kings

The old Southeast Asian mandala system: kingdoms as circles of light, not borders. Five dialects (English, Australian, คำเมือง, मराठी, Gen Z), same toys on every page. English is the default; a reader whose time zone or browser language points to Australia, Thailand or Marathi lands on that dialect, and the switch at top right remembers a choice.

**Live:** https://nanobotco.github.io/mandala/

- `tools/voices/<dialect>.py` — every word on a page, one file per dialect.
- `src/*.js` — the mandala painter and the toys.
- `tools/geo.py` — Natural Earth outlines cut to Southeast Asia (`src/geo.js`).
- `tools/build.py` — the pages (`ARTIFACT=1` for the private Artifact layout) · `tools/card.py` — share cards · `tools/serve.py` — preview on :9113.
- `./publish.sh` — style check, build, cards.

Text and pictures CC BY 4.0; code MIT; photographs keep their own licences. See NOTICE.txt.
