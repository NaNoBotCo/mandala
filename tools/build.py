"""Build the mandala site into docs/: one page per voice, same toys, same pictures.

    python3 tools/build.py            # writes docs/
    SITE_URL=... python3 tools/build.py

Copy lives in tools/voices/<voice>.py. In copy, [[word|meaning]] makes a word you can tap for its
meaning, **x** is bold, [text](url) is a link.
"""
import html, importlib.util, json, os, pathlib, re, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
SITE = os.environ.get("SITE_URL", "https://nanobotco.github.io/mandala").rstrip("/")
ORDER = ["us", "bogan", "lanna", "marathi", "genz"]
ART = os.environ.get("ARTIFACT") == "1"   # a private Artifact: every voice in its own folder, a front door at the root
if ART:
    DOCS = ROOT / "build" / "artifact"
LANGNAME = {"us": "American South", "bogan": "Australian", "lanna": "กำเมือง · Northern Thai", "marathi": "गावरान मराठी · Marathi", "genz": "Gen Z, 2026"}
JS = ["geo.js", "core.js", "page.js", "hero.js", "maker.js", "rings.js", "lights.js", "dolls.js", "game.js", "orbits.js", "years.js", "overlay.js"]


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / "voices" / f"{name}.py")
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m.V


def md(s):
    """Inline markup to HTML. Escapes first, then turns the three marks into tags."""
    s = html.escape(s, quote=False)
    s = re.sub(r"\[\[(.+?)\|(.+?)\]\]", lambda m: f'<span class="sl" tabindex="0" role="button" data-g="{html.escape(m.group(2), quote=True)}">{m.group(1)}</span>', s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(?<![\w*])\*([^*\s][^*]*?)\*(?![\w*])", r"<i>\1</i>", s)
    s = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+|#[\w-]+|\.\./[^)\s]*|/[^)\s]*)\)", r'<a href="\2">\1</a>', s)
    return s


def plain(s):
    s = re.sub(r"\[\[(.+?)\|(.+?)\]\]", r"\1", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = re.sub(r"(?<![\w*])\*([^*\s][^*]*?)\*(?![\w*])", r"\1", s)
    return re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)


DEVA = str.maketrans("0123456789", "०१२३४५६७८९")


def num(v, n):
    n = str(n)
    return n.translate(DEVA) if v.get("digits") == "deva" else n


def esc(s):
    return html.escape(str(s), quote=True)


PICS = json.loads((ROOT / "data" / "pictures.json").read_text()) if (ROOT / "data" / "pictures.json").exists() else {}


def credit(p):
    return f'{esc(p["author"])} · <a href="{esc(p["page"])}">{esc(p["licence"])}</a>, Wikimedia Commons'


def band(key, v, rel):
    p = PICS.get(key)
    b = v["bands"].get(key)
    if not p or not b:
        return ""
    return f'''<div class="band{' right' if b.get('right') else ''}" role="img" aria-label="{esc(plain(b['alt']))}">
 <div class="bgwrap"><img data-src="{rel}img/{p['file']}" alt=""{f' style="object-position:{p["pos"]}"' if p.get("pos") else ""}></div>
 <div class="in"><span class="kicker">{md(b['kicker'])}</span><p class="bh">{md(b['head'])}</p>{f"<p>{md(b['line'])}</p>" if b.get('line') else ''}</div>
 <span class="cred">{credit(p)}</span>
</div>'''


def talk(paras):
    return '<div class="talk">' + "".join(f"<p>{md(p)}</p>" for p in paras) + "</div>"


def head_block(sid, sec, v, seed):
    return f'''<header class="sh"><canvas class="mark" data-seed="{seed}" width="64" height="64" aria-hidden="true"></canvas>
 <div><span class="kicker">{md(sec.get('kicker', ''))}</span><h2>{md(sec['h'])}</h2></div>
 <button class="say" type="button" data-for="{sid}" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5c1.5 1 1.5 6 0 7M18.5 6c3 2.5 3 9.5 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span>{esc(v['t']['ui']['say'])}</span></button>
</header>'''


def toys(v):
    u = v["toy"]
    L = v["t"]["lights"]["kings"]
    return {
        "maker": f'''<div class="toy" id="toy-maker"><div class="stage sq"><canvas aria-label="{esc(u['maker_aria'])}"></canvas></div>
 <div class="ctl"><div class="swatches" role="group" aria-label="{esc(u['colors'])}"></div>
 <button class="btn coat" data-k="spokes" type="button">{esc(u['spokes'])} <b>8</b></button>
 <button class="btn coat" data-k="mirror" type="button" aria-pressed="true">{esc(u['mirror'])}</button>
 <button class="btn coat" data-k="size" type="button">{esc(u['size'])} <b>●</b></button>
 <button class="btn gold" data-k="fill" type="button">{esc(u['fill'])}</button>
 <button class="btn coat" data-k="spin" type="button" aria-pressed="false">{esc(u['spin'])}</button>
 <button class="btn" data-k="sweep" type="button">{esc(u['sweep'])}</button>
 <button class="btn ghost" data-k="clear" type="button">{esc(u['clear'])}</button></div>
 <p class="out" aria-live="polite"></p></div>''',
        "rings": f'''<div class="toy" id="toy-rings"><div class="stage hexs"><canvas aria-label="{esc(u['rings_aria'])}"></canvas></div>
 <div class="legend"></div><p class="out" aria-live="polite">{esc(u['rings_hint'])}</p></div>''',
        "lights": f'''<div class="toy" id="toy-lights"><div class="stage wide"><canvas aria-label="{esc(u['lights_aria'])}"></canvas></div>
 <div class="tally" aria-live="polite"></div>
 <div class="rngs">''' + "".join(f'<label class="rng" style="--c:{c}"><span>{esc(L[i])} · {esc(u["shine"])}</span><input type="range" min="1" max="10" value="{[6,5,4][i]}"></label>' for i, c in enumerate(["#ff5a3c", "#2fb0ff", "#ffc21a"])) + f'''</div>
 <p class="out" aria-live="polite">{esc(u['lights_hint'])}</p></div>''',
        "dolls": f'''<div class="toy" id="toy-dolls"><div class="stage sq"><canvas aria-label="{esc(u['dolls_aria'])}"></canvas><span class="lv"></span></div>
 <div class="ctl"><button class="btn ghost" data-k="back" type="button" hidden>{esc(u['back'])}</button></div>
 <p class="out" aria-live="polite"></p></div>''',
        "game": f'''<div class="toy game" id="toy-game"><div class="gboard">
''' + "".join(f'''<div class="king" data-i="{i}" style="--c:{c}"><div class="kname">{esc(v['t']['game']['kings'][i])}</div><div class="meter" role="img"></div><div class="want"></div>
 <div class="give"><button class="step" type="button" data-i="{i}" data-d="-1" aria-label="{esc(u['less'])}">−</button><span class="giv"><b>3</b></span><button class="step" type="button" data-i="{i}" data-d="1" aria-label="{esc(u['more'])}">+</button></div></div>''' for i, c in [(0, "#ff5a3c"), (1, "#2fb0ff")]).replace('<div class="king" data-i="1"', f'''<div class="town"><div class="year"></div><div class="baskets"></div><div class="keep">{esc(u['keep'])} <b></b></div><div class="titles"></div></div>
<div class="king" data-i="1"''') + f'''</div>
 <div class="gctl"><button class="btn gold" data-k="send" type="button">{esc(u['send'])}</button><button class="btn gold" data-k="again" type="button" hidden>{esc(u['again'])}</button></div>
 <div class="log" aria-live="polite"></div></div>''',
        "orbits": f'''<div class="toy" id="toy-orbits"><div class="stage wide"><canvas aria-label="{esc(u['orbits_aria'])}"></canvas></div>
 <div class="tally" aria-live="polite"></div>
 <div class="ctl"><button class="btn" data-k="die" type="button">{esc(u['die'])}</button><button class="btn gold" data-k="rise" type="button">{esc(u['rise'])}</button><button class="btn ghost" data-k="shake" type="button">{esc(u['shake'])}</button></div>
 <p class="out" aria-live="polite">{esc(u['orbits_hint'])}</p></div>''',
        "years": f'''<div class="toy" id="toy-years"><div class="stage tall"><canvas aria-label="{esc(u['years_aria'])}"></canvas><span class="yr">{num(v, 1300 + v.get("era", 0))}</span></div>
 <div class="ctl yrs"><button class="btn gold" data-k="play" type="button" aria-pressed="false">{esc(u['play'])}</button>
 <input type="range" min="600" max="2026" value="1300" aria-label="{esc(u['year'])}"></div>
 <div class="chips">''' + "".join(f'<button type="button" data-y="{y}">{num(v, y + v.get("era", 0))}</button>' for y in sorted(int(k) for k in v["t"]["years"]["notes"])) + f'''</div>
 <p class="out" aria-live="polite"></p></div>''',
        "overlay": f'''<div class="toy" id="toy-overlay"><div class="stage wide"><canvas aria-label="{esc(u['overlay_aria'])}"></canvas></div>
 <label class="rng mixr"><span>{esc(u['lines'])}</span><input type="range" min="0" max="100" value="50" aria-label="{esc(u['lines'])} / {esc(u['lights'])}"><span>{esc(u['lights'])}</span></label>
 <p class="key"><i class="g"></i>{esc(u['key_people'])} <i class="b"></i>{esc(u['key_paper'])}</p>
 <p class="out" aria-live="polite">{esc(u['overlay_hint'])}</p></div>''',
    }


SOURCES = json.loads((ROOT / "data" / "sources.json").read_text()) if (ROOT / "data" / "sources.json").exists() else []

SECTIONS = [("circle", "maker", "sand"), ("ring", "rings", None), ("light", "lights", "moat"), ("dolls", "dolls", None), ("gifts", "game", "bunga"), ("wobble", "orbits", "map"), ("maps", "years", "village"), ("today", "overlay", None)]


def voice_switch(v, all_v, cur):
    out = []
    for k in ORDER:
        o = all_v[k]
        href = o["href_from"][cur]
        a = ' aria-current="page"' if k == cur else ""
        out.append(f'<a href="{href}" lang="{o["lang"]}" hreflang="{o["lang"]}"{a}><b>{esc(o["who"])}</b><small>{esc(o["whosub"])}</small></a>')
    return "".join(out)


def page(key, v, all_v):
    rel = "" if (key == "us" and not ART) else "../"
    url = SITE + "/" + v["path"]
    T = toys(v)
    secs = []
    for i, (sid, toy, bk) in enumerate(SECTIONS):
        s = v["s"][sid]
        secs.append(f'<section id="{sid}" class="sec">{head_block(sid, s, v, 11 + i * 7)}{talk(s["p"])}{T[toy]}{talk(s["after"]) if s.get("after") else ""}</section>')
        if bk:
            secs.append(band(bk, v, rel))
    visit = "".join(f'''<figure class="card"><div class="ph"><img data-src="{rel}img/{PICS[c['pic']]['file']}" alt="{esc(plain(c['alt']))}" width="800" height="600"></div><figcaption><b>{md(c['h'])}</b><span>{md(c['p'])}</span><small>{credit(PICS[c['pic']])}</small></figcaption></figure>''' for c in v["visit"]["cards"] if c["pic"] in PICS)
    words = "".join(f'<div class="word"><dt>{md(w[0])}</dt><dd>{md(w[1])}</dd></div>' for w in v["words"]["list"])
    srcs = "".join(f"<li>{md(s)}</li>" for s in v["sources"]["list"])
    nav = "".join(f'<a href="#{sid}">{esc(v["nav"][sid])}</a>' for sid in [s[0] for s in SECTIONS] + ["visit", "words", "sources"])
    alts = "".join(f'<link rel="alternate" hreflang="{all_v[k]["lang"]}" href="{SITE}/{all_v[k]["path"]}">' for k in ORDER)
    Vjs = {"tts": v["tts"], "tts2": v.get("tts2"), "rate": v.get("rate", 0.92), "digits": v.get("digits"), "era": v.get("era", 0), "era_label": v.get("era_label", ""), "t": v["t"]}
    fonts = v["fonts"]
    return f'''<!doctype html>
<html lang="{v['lang']}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(v['title'])}</title>
<meta name="description" content="{esc(v['desc'])}">
<link rel="canonical" href="{url}">{alts}
<meta property="og:type" content="website"><meta property="og:url" content="{url}"><meta property="og:title" content="{esc(v['title'])}"><meta property="og:description" content="{esc(v['desc'])}">
<meta property="og:image" content="{SITE}/card-{key}.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="{esc(v['card_alt'])}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{SITE}/card-{key}.jpg"><meta name="twitter:title" content="{esc(v['title'])}"><meta name="twitter:description" content="{esc(v['desc'])}">
<meta name="theme-color" content="#120d33"><link rel="icon" href="{rel}icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{fonts}&display=swap">
<link rel="stylesheet" href="{rel}mandala.css">
<style>:root{{--display:{v['display']};--body:{v['body']};--canvas-font:{v['canvas']}}}</style>
</head><body class="v-{key}">
<a class="skip" href="#circle">{esc(v['skip'])}</a>
<header class="top"><a class="brand" href="#top" aria-label="{esc(v['brand'])}"><svg viewBox="0 0 40 40" aria-hidden="true"><use href="{rel}icon.svg#m"/></svg><span>{esc(v['brand'])}</span></a>
 <nav class="voices" aria-label="{esc(v['voices_label'])}">{voice_switch(v, all_v, key)}</nav>
 <button class="snd" type="button" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a2 2 0 0 1 2 2c3 1 4 4 4 7v3l2 2v1H4v-1l2-2v-3c0-3 1-6 4-7a2 2 0 0 1 2-2zm-2 16h4a2 2 0 0 1-4 0z" fill="currentColor"/></svg><span></span></button>
</header>
<main id="top">
<section class="hero"><canvas id="hero-cv" aria-label="{esc(v['hero_aria'])}"></canvas>
 <div class="hin"><span class="kicker">{md(v['kicker'])}</span><h1>{md(v['h1'])}</h1><p class="lede">{md(v['lede'])}</p><p class="hint">{md(v['hint'])}</p></div></section>
<div class="who"><div class="in"><p class="whoname">{md(v['who_line'])}</p><p class="tapnote">{md(v['tapnote'])}</p></div></div>
<nav class="sec" aria-label="{esc(v['nav_label'])}">{nav}</nav>
<div class="col">
{''.join(secs)}
<section id="visit" class="sec">{head_block('visit', v['visit'], v, 90)}{talk(v['visit']['p'])}<div class="cards">{visit}</div></section>
<section id="words" class="sec">{head_block('words', v['words'], v, 97)}<dl class="words">{words}</dl></section>
<section id="sources" class="sec">{head_block('sources', v['sources'], v, 104)}{talk(v['sources']['p'])}<ul class="src">{srcs}</ul></section>
</div></main>
<footer class="bot"><div class="in"><nav class="voices foot" aria-label="{esc(v['voices_label'])}">{voice_switch(v, all_v, key)}</nav><p>{md(v['foot'])}</p></div></footer>
<script>window.V={json.dumps(Vjs, ensure_ascii=False)};</script>
<script src="{rel}mandala.js" defer></script>
</body></html>
'''


def door(all_v):
    """The Artifact's front page: the galaxy and five doors, one per voice. No page skeleton: the host adds it."""
    cards = "".join(f'<a href="{k}/index.html" lang="{all_v[k]["lang"]}"><small>{esc(LANGNAME[k])}</small><b>{esc(all_v[k]["who"])}</b><span class="{"th" if k == "lanna" else "mr" if k == "marathi" else ""}">{esc(plain(all_v[k]["lede"]))}</span></a>' for k in ORDER)
    return f'''<title>The Circle Kings</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Mitr:wght@400;500;600&family=Mukta:wght@400;600;700&family=Noto+Sans+Thai+Looped:wght@400;600&display=swap">
<link rel="stylesheet" href="mandala.css">
<style>:root{{--display:"Baloo 2",system-ui,sans-serif;--body:"Avenir Next",Avenir,"Segoe UI",system-ui,sans-serif;--canvas-font:"Baloo 2",system-ui,sans-serif}}</style>
<main id="top">
<section class="hero"><canvas id="hero-cv" aria-label="A big mandala in the middle with smaller ones going round it. Tap them."></canvas>
 <div class="hin"><span class="kicker">Mandala · มณฑล · मंडल</span><h1>The Circle Kings</h1><p class="lede">Old Southeast Asian kings ran on circles of light, not fences. Five people tell it five ways.</p><p class="hint">Tap the kings. Then pick who tells it.</p></div></section>
<div class="door"><h2>Who's telling it?</h2><div class="doors">{cards}</div></div>
</main>
<footer class="bot"><div class="in"><p>Text CC BY 4.0, NaNoBotCo. Code MIT. Photographs keep their own licences, credited on each page.</p></div></footer>
<script>window.V={{t:{{}}}};</script><script src="mandala.js" defer></script>
'''


def main():
    all_v = {k: load(k) for k in ORDER}
    for k, v in all_v.items():
        v["path"] = f"{k}/" if ART else ("" if k == "us" else f"{k}/")
        if not v["t"]["years"].get("names"):
            v["t"]["years"]["names"] = all_v["us"]["t"]["years"]["names"]
        if not v["sources"]["list"]:
            v["sources"]["list"] = SOURCES
        v["llms"] = v.get("llms") or all_v["us"]["llms"]
    for k, v in all_v.items():
        v["href_from"] = {}
        for cur in ORDER:
            v["href_from"][cur] = f"../{k}/index.html" if ART else ((("" if cur == "us" else "../") + v["path"]) or "./")
    if DOCS.exists():
        keep = {"img", "card-us.jpg", "card-bogan.jpg", "card-lanna.jpg", "card-marathi.jpg", "card-genz.jpg"}
        for p in DOCS.iterdir():
            if p.name in keep:
                continue
            shutil.rmtree(p) if p.is_dir() else p.unlink()
    DOCS.mkdir(parents=True, exist_ok=True)
    for k, v in all_v.items():
        d = DOCS / v["path"]
        d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(page(k, v, all_v))
    if ART:
        (DOCS / "index.html").write_text(door(all_v))
        shutil.copytree(ROOT / "docs" / "img", DOCS / "img", dirs_exist_ok=True)
    (DOCS / "mandala.js").write_text("\n".join((ROOT / "src" / f).read_text() for f in JS))
    shutil.copy(ROOT / "src" / "mandala.css", DOCS / "mandala.css")
    shutil.copy(ROOT / "src" / "icon.svg", DOCS / "icon.svg")
    if ART:
        print("built artifact", ", ".join(ORDER), "→", DOCS)
        return
    (DOCS / ".nojekyll").write_text("")
    (DOCS / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
    (DOCS / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"<url><loc>{SITE}/{all_v[k]['path']}</loc></url>\n" for k in ORDER) + "</urlset>\n")
    us = all_v["us"]
    (DOCS / "llms.txt").write_text(f"# {us['title']}\n\n> {us['llms']}\n\n" + "".join(f"- [{all_v[k]['who']} · {all_v[k]['whosub']}]({SITE}/{all_v[k]['path']})\n" for k in ORDER) + f"- Sections: {' '.join('#' + s[0] for s in SECTIONS)} #visit #words #sources\n- Text CC BY 4.0, NaNoBotCo. Code MIT. Photographs from Wikimedia Commons keep their own licences, credited on each.\n")
    (DOCS / "404.html").write_text(f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(us["title"])}</title><style>body{{margin:0;min-height:100vh;display:grid;place-items:center;background:#120d33;color:#fff3d6;font:1.3rem system-ui;text-align:center}}a{{color:#f5b800}}</style><p>{esc(us["lost"])}<br><a href="{SITE}/">{esc(us["brand"])}</a></p></html>')
    print("built", ", ".join(ORDER), "→", DOCS)


if __name__ == "__main__":
    main()
