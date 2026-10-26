"""Build the mandala site: one page per dialect, same toys, same pictures.

    python3 tools/build.py              # GitHub Pages layout in docs/
    ARTIFACT=1 python3 tools/build.py   # private Artifact layout in build/artifact/

Copy lives in tools/voices/<dialect>.py. In copy, **x** is bold, *x* is italic, [text](url) is a link.
English is the default. A reader whose time zone or browser language points to Australia,
Thailand or Marathi lands on that dialect; the switch at top right remembers a choice.
"""
import html, importlib.util, json, os, pathlib, re, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = os.environ.get("SITE_URL", "https://nanobotco.github.io/mandala").rstrip("/")
ORDER = ["us", "bogan", "lanna", "marathi", "genz"]
ART = os.environ.get("ARTIFACT") == "1"
OUT = ROOT / ("build/artifact" if ART else "docs")
JS = ["geo.js", "core.js", "page.js", "hero.js", "maker.js", "rings.js", "lights.js", "dolls.js", "game.js", "orbits.js", "years.js", "overlay.js"]
PICS = json.loads((ROOT / "data/pictures.json").read_text())
SOURCES = json.loads((ROOT / "data/sources.json").read_text())
SECTIONS = [("circle", "maker", "sand"), ("ring", "rings", None), ("light", "lights", "moat"), ("dolls", "dolls", None),
            ("gifts", "game", "bunga"), ("wobble", "orbits", "map"), ("maps", "years", "village"), ("today", "overlay", None)]
DEVA = str.maketrans("0123456789", "०१२३४५६७८९")

# The dialect a reader lands on: a remembered choice, else time zone and browser language.
# Nothing is looked up over the network for it.
PICKV = """function(){var v=null;try{v=localStorage.getItem('mandala-voice')}catch(e){}
if(v&&/^(us|bogan|lanna|marathi|genz)$/.test(v))return v;var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
var L=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'']).map(function(x){return String(x).toLowerCase()});
var has=function(p){return L.some(function(x){return x.indexOf(p)===0})};
if(/^australia\\//i.test(tz)||L[0]==='en-au')return 'bogan';if(has('mr'))return 'marathi';
if(/^asia\\/bangkok$/i.test(tz)&&(has('th')||has('nod')))return 'lanna';return 'us'}"""


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / "voices" / f"{name}.py")
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m.V


def md(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(?<![\w*])\*([^*\s][^*]*?)\*(?![\w*])", r"<i>\1</i>", s)
    return re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", r'<a href="\2">\1</a>', s)


def esc(s):
    return html.escape(str(s), quote=True)


def num(v, n):
    return str(n).translate(DEVA) if v.get("digits") == "deva" else str(n)


def credit(p):
    return f'{esc(p["author"])} · <a href="{esc(p["page"])}">{esc(p["licence"])}</a>'


def band(key, v, rel):
    p, b = PICS.get(key), v["bands"].get(key)
    if not p or not b:
        return ""
    pos = f' style="object-position:{p["pos"]}"' if p.get("pos") else ""
    return (f'<div class="band{" right" if b.get("right") else ""}" role="img" aria-label="{esc(b["alt"])}">'
            f'<div class="bgwrap"><img data-src="{rel}img/{p["file"]}" alt=""{pos}></div>'
            f'<div class="in"><p class="bh">{md(b["head"])}</p></div><span class="cred">{credit(p)}</span></div>')


SAY = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>'
       '<path d="M16 8.5c1.5 1 1.5 6 0 7M18.5 6c3 2.5 3 9.5 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>')


def head_block(sid, h, v):
    return f'<header class="sh"><h2>{md(h)}</h2><button class="say" type="button" data-for="{sid}" aria-pressed="false" aria-label="{esc(v["t"]["ui"]["say"])}">{SAY}</button></header>'


def king(v, u, i, col):
    step = lambda d, lab, ch: f'<button class="step" type="button" data-i="{i}" data-d="{d}" aria-label="{esc(lab)}">{ch}</button>'
    return (f'<div class="king" data-i="{i}" style="--c:{col}"><div class="kname">{esc(v["t"]["game"]["kings"][i])}</div><div class="meter" role="img"></div><div class="want"></div>'
            f'<div class="give">{step(-1, u["less"], "−")}<span class="giv"><b>3</b></span>{step(1, u["more"], "+")}</div></div>')


def toys(v):
    u = v["toy"]
    return {
        "maker": (f'<div class="toy" id="toy-maker"><div class="stage sq"><canvas aria-label="{esc(u["maker_aria"])}"></canvas></div>'
                  f'<div class="ctl"><div class="swatches" role="group" aria-label="{esc(u["colors"])}"></div>'
                  f'<button class="btn gold" data-k="fill" type="button">{esc(u["fill"])}</button><button class="btn coat" data-k="spin" type="button" aria-pressed="false">{esc(u["spin"])}</button>'
                  f'<button class="btn" data-k="sweep" type="button">{esc(u["sweep"])}</button><button class="btn ghost" data-k="clear" type="button">{esc(u["clear"])}</button></div>'
                  f'<p class="out" aria-live="polite"></p></div>'),
        "rings": f'<div class="toy" id="toy-rings"><div class="stage hexs"><canvas aria-label="{esc(u["rings_aria"])}"></canvas></div><div class="legend"></div><p class="out" aria-live="polite"></p></div>',
        "lights": (f'<div class="toy" id="toy-lights"><div class="stage wide"><canvas aria-label="{esc(u["lights_aria"])}"></canvas></div>'
                   f'<div class="tally" aria-live="polite"></div><p class="out" aria-live="polite">{esc(u["lights_hint"])}</p></div>'),
        "dolls": (f'<div class="toy" id="toy-dolls"><div class="stage sq"><canvas aria-label="{esc(u["dolls_aria"])}"></canvas><span class="lv"></span></div>'
                  f'<div class="ctl"><button class="btn ghost" data-k="back" type="button" hidden>{esc(u["back"])}</button></div><p class="out" aria-live="polite"></p></div>'),
        "game": (f'<div class="toy game" id="toy-game"><div class="gboard">{king(v, u, 0, "#ff5a3c")}'
                 f'<div class="town"><div class="year"></div><div class="baskets"></div><div class="keep">{esc(u["keep"])} <b></b></div><div class="titles"></div></div>'
                 f'{king(v, u, 1, "#2fb0ff")}</div>'
                 f'<div class="gctl"><button class="btn gold" data-k="send" type="button">{esc(u["send"])}</button><button class="btn gold" data-k="again" type="button" hidden>{esc(u["again"])}</button></div>'
                 f'<div class="log" aria-live="polite"></div></div>'),
        "orbits": (f'<div class="toy" id="toy-orbits"><div class="stage wide"><canvas aria-label="{esc(u["orbits_aria"])}"></canvas></div><div class="tally" aria-live="polite"></div>'
                   f'<div class="ctl"><button class="btn" data-k="die" type="button">{esc(u["die"])}</button><button class="btn gold" data-k="rise" type="button">{esc(u["rise"])}</button></div>'
                   f'<p class="out" aria-live="polite"></p></div>'),
        "years": (f'<div class="toy" id="toy-years"><div class="stage tall"><canvas aria-label="{esc(u["years_aria"])}"></canvas><span class="yr">{num(v, 1300 + v.get("era", 0))}</span></div>'
                  f'<div class="ctl yrs"><button class="btn gold" data-k="play" type="button" aria-pressed="false">{esc(u["play"])}</button>'
                  f'<input type="range" min="600" max="2026" value="1300" aria-label="{esc(u["year"])}"></div><p class="out" aria-live="polite"></p></div>'),
        "overlay": (f'<div class="toy" id="toy-overlay"><div class="stage wide"><canvas aria-label="{esc(u["overlay_aria"])}"></canvas></div>'
                    f'<label class="rng mixr"><span>{esc(u["lines"])}</span><input type="range" min="0" max="100" value="50" aria-label="{esc(u["lines"])} / {esc(u["lights"])}"><span>{esc(u["lights"])}</span></label>'
                    f'<p class="key"><span><i class="g"></i>{esc(u["key_people"])}</span><span><i class="b"></i>{esc(u["key_paper"])}</span></p><p class="out" aria-live="polite"></p></div>'),
    }


def dialect_select(v, all_v, cur):
    opts = "".join(f'<option value="{all_v[k]["href_from"][cur]}" data-v="{k}" lang="{all_v[k]["lang"]}"{" selected" if k == cur else ""}>{esc(all_v[k]["dname"])}</option>' for k in ORDER)
    return f'<select id="dialect" class="dial" aria-label="{esc(v["voices_label"])}">{opts}</select>'


SND = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>'
       '<path class="w" d="M16 8.5c1.5 1 1.5 6 0 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>')


def page(key, v, all_v):
    rel = "../" if (ART or key != "us") else ""
    url = SITE + "/" + v["path"]
    T = toys(v)
    secs = []
    for sid, toy, bk in SECTIONS:
        s = v["s"][sid]
        paras = "".join(f"<p>{md(p)}</p>" for p in s["p"])
        secs.append(f'<section id="{sid}" class="sec">{head_block(sid, s["h"], v)}<div class="talk">{paras}</div>{T[toy]}</section>')
        if bk:
            secs.append(band(bk, v, rel))
    visit = "".join(f'<figure class="card"><div class="ph"><img data-src="{rel}img/{PICS[c["pic"]]["file"]}" alt="{esc(c["alt"])}" width="800" height="600"></div>'
                    f'<figcaption><b>{md(c["h"])}</b><span>{md(c["p"])}</span><small>{credit(PICS[c["pic"]])}</small></figcaption></figure>' for c in v["visit"]["cards"])
    words = "".join(f'<div class="word"><dt>{md(a)}</dt><dd>{md(b)}</dd></div>' for a, b in v["words"]["list"])
    srcs = "".join(f"<li>{md(s)}</li>" for s in SOURCES)
    alts = "" if ART else "".join(f'<link rel="alternate" hreflang="{all_v[k]["lang"]}" href="{SITE}/{all_v[k]["path"]}">' for k in ORDER)
    pick = ""
    if key == "us" and not ART:
        pick = f"<script>(function(){{var v=({PICKV})();if(v!=='us')location.replace(location.pathname.replace(/[^/]*$/,'')+v+'/'+location.hash)}})();</script>\n"
    Vjs = {"key": key, "tts": v["tts"], "tts2": v.get("tts2"), "rate": v.get("rate", 0.92), "digits": v.get("digits"), "era": v.get("era", 0), "era_label": v.get("era_label", ""), "t": v["t"]}
    return f'''<!doctype html>
<html lang="{v['lang']}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
{pick}<title>{esc(v['title'])}</title>
<meta name="description" content="{esc(v['desc'])}">
<link rel="canonical" href="{url}">{alts}
<meta property="og:type" content="website"><meta property="og:url" content="{url}"><meta property="og:title" content="{esc(v['title'])}"><meta property="og:description" content="{esc(v['desc'])}">
<meta property="og:image" content="{SITE}/card-{key}.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="{esc(v['card_alt'])}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{SITE}/card-{key}.jpg"><meta name="twitter:title" content="{esc(v['title'])}"><meta name="twitter:description" content="{esc(v['desc'])}">
<meta name="theme-color" content="#120d33"><link rel="icon" href="{rel}icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{v['fonts']}&display=swap">
<link rel="stylesheet" href="{rel}mandala.css">
<style>:root{{--display:{v['display']};--body:{v['body']};--canvas-font:{v['canvas']}}}</style>
</head><body>
<a class="skip" href="#circle">{esc(v['skip'])}</a>
<header class="top"><a class="brand" href="#top"><svg viewBox="0 0 40 40" aria-hidden="true"><use href="{rel}icon.svg#m"/></svg><span>{esc(v['brand'])}</span></a>
<div class="tools">{dialect_select(v, all_v, key)}<button class="snd" type="button" aria-pressed="true" aria-label="{esc(v['t']['ui']['soundOn'])}">{SND}</button></div></header>
<main id="top">
<section class="hero"><canvas id="hero-cv" aria-label="{esc(v['hero_aria'])}"></canvas><div class="hin"><h1>{md(v['h1'])}</h1><p class="lede">{md(v['lede'])}</p></div></section>
<div class="col">
{''.join(secs)}
<section id="visit" class="sec"><header class="sh"><h2>{md(v['visit']['h'])}</h2></header><div class="cards">{visit}</div></section>
<section id="words" class="sec"><header class="sh"><h2>{md(v['words']['h'])}</h2></header><dl class="words">{words}</dl></section>
<details class="src"><summary>{esc(v['sources']['h'])}</summary><ul>{srcs}</ul></details>
</div></main>
<footer class="bot"><div class="in"><p>{md(v['foot'])}</p></div></footer>
<script>window.V={json.dumps(Vjs, ensure_ascii=False)};</script>
<script src="{rel}mandala.js" defer></script>
</body></html>
'''


def front(all_v):
    """The Artifact's root page: sends the reader on to their dialect. No skeleton; the host adds it."""
    links = "".join(f'<a href="{k}/index.html" lang="{all_v[k]["lang"]}">{esc(all_v[k]["dname"])}</a>' for k in ORDER)
    return f'''<title>The Circle Kings</title>
<style>:root{{--bg:#0d0a26;--fg:#fff3d6;--gold:#f5b800;color-scheme:dark}}body{{background:var(--bg);color:var(--fg);font:1.3rem system-ui,sans-serif;min-height:90vh;display:grid;place-items:center;text-align:center;padding-inline:max(16px,env(safe-area-inset-left,0px)) max(16px,env(safe-area-inset-right,0px))}}nav{{display:flex;flex-wrap:wrap;gap:.6rem;justify-content:center}}a{{color:var(--bg);background:var(--gold);padding:.5rem 1rem;border-radius:99px;text-decoration:none;font-weight:700}}h1{{margin:0 0 1rem;font-size:2.4rem}}</style>
<main><h1>The Circle Kings</h1><nav>{links}</nav></main>
<script>(function(){{var v=({PICKV})();location.replace(v+'/index.html')}})();</script>
'''


def main():
    all_v = {k: load(k) for k in ORDER}
    for k, v in all_v.items():
        v["path"] = f"{k}/" if (ART or k != "us") else ""
        if not v["t"]["years"].get("names"):
            v["t"]["years"]["names"] = all_v["us"]["t"]["years"]["names"]
    for k, v in all_v.items():
        v["href_from"] = {cur: (f"../{k}/index.html" if ART else ((("" if cur == "us" else "../") + v["path"]) or "./")) for cur in ORDER}
    keep = {"img"} | {f"card-{k}.jpg" for k in ORDER}
    if OUT.exists():
        for p in OUT.iterdir():
            if p.name not in keep:
                shutil.rmtree(p) if p.is_dir() else p.unlink()
    OUT.mkdir(parents=True, exist_ok=True)
    for k, v in all_v.items():
        d = OUT / v["path"]; d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(page(k, v, all_v))
    (OUT / "mandala.js").write_text("\n".join((ROOT / "src" / f).read_text() for f in JS))
    shutil.copy(ROOT / "src/mandala.css", OUT / "mandala.css")
    shutil.copy(ROOT / "src/icon.svg", OUT / "icon.svg")
    if ART:
        (OUT / "index.html").write_text(front(all_v))
        shutil.copytree(ROOT / "docs/img", OUT / "img", dirs_exist_ok=True)
        print("built artifact →", OUT)
        return
    (OUT / ".nojekyll").write_text("")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
    (OUT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                                     + "".join(f"<url><loc>{SITE}/{all_v[k]['path']}</loc></url>\n" for k in ORDER) + "</urlset>\n")
    us = all_v["us"]
    (OUT / "llms.txt").write_text(f"# {us['title']}\n\n> {us['llms']}\n\n" + "".join(f"- [{all_v[k]['dname']}]({SITE}/{all_v[k]['path']})\n" for k in ORDER)
                                  + "- Text CC BY 4.0, NaNoBotCo. Code MIT. Photographs from Wikimedia Commons keep their own licences, credited on each.\n")
    (OUT / "404.html").write_text(f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(us["title"])}</title>'
                                  f'<style>body{{margin:0;min-height:100vh;display:grid;place-items:center;background:#120d33;color:#fff3d6;font:1.3rem system-ui;text-align:center}}a{{color:#f5b800}}</style>'
                                  f'<p>{esc(us["lost"])}<br><a href="{SITE}/">{esc(us["title"])}</a></p></html>')
    print("built", ", ".join(ORDER), "→", OUT)


if __name__ == "__main__":
    main()
