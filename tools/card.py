"""Share cards: one 1200x630 picture per voice, the hero galaxy drawn by the site's own code,
the title in that voice's words. Run after build.py; needs the preview server on :9113.

    python3 tools/card.py            # writes docs/card-<voice>.jpg
"""
import importlib.util, html, json, pathlib, subprocess, sys, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9113
ORDER = ["us", "bogan", "lanna", "marathi", "genz"]


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / "voices" / f"{name}.py")
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m.V


PAGE = """<!doctype html><html lang="{lang}"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{fonts}&display=block">
<style>
html,body{{margin:0;width:1200px;height:630px;overflow:hidden;background:#0d0a26}}
#hero-cv{{position:absolute;inset:0;width:1200px;height:630px}}
.t{{position:absolute;left:64px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center;font-family:{display}}}
.k{{font-weight:800;font-size:24px;letter-spacing:{ks};color:#ffd77a;text-transform:{kt};text-shadow:0 2px 12px #000}}
h1{{margin:8px 0 14px;font-size:{h1}px;line-height:{lh};font-weight:800;background:linear-gradient(92deg,#ffe7a3,#f5b800 35%,#ff7a1a 70%,#ff5c9a);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 4px 22px rgba(0,0,0,.6))}}
.who{{font:700 34px {display};color:#fff6e6;text-shadow:0 2px 14px #000}}
.u{{position:absolute;left:64px;bottom:34px;font:700 22px "Avenir Next",system-ui,sans-serif;color:#e9dcff;letter-spacing:.03em;text-shadow:0 1px 10px #000}}
.scrim{{position:absolute;inset:0;background:linear-gradient(90deg,rgba(9,6,30,.82) 0%,rgba(9,6,30,.55) 42%,transparent 70%)}}
</style></head><body>
<canvas id="hero-cv"></canvas><div class="scrim"></div>
<div class="t"><div class="k">{kicker}</div><h1>{h1t}</h1><div class="who">{who}</div></div>
<div class="u">nanobotco.github.io/mandala</div>
<script>window.V={{t:{{}}}};</script>
<script src="/mandala.js"></script>
</body></html>"""


def main():
    try:
        urllib.request.urlopen(f"http://127.0.0.1:{PORT}/", timeout=3)
    except Exception:
        sys.exit(f"card.py: start the preview server on :{PORT} first (tools/serve.py)")
    tmp = DOCS / "_card"; tmp.mkdir(exist_ok=True)
    for k in ORDER:
        v = load(k)
        latin = v["lang"].startswith("en")
        title = v["h1"]
        size = 112 if len(title) <= 16 else 96
        if v["lang"] == "th": size, lh = 104, 1.15
        elif v["lang"] == "mr": size, lh = 100, 1.1
        else: lh = 0.92
        page = PAGE.format(lang=v["lang"], fonts=v["fonts"], display=v["display"], ks=".22em" if latin else ".02em", kt="uppercase" if latin else "none",
                           h1=size, lh=lh, kicker=html.escape(v["brand"]), h1t=html.escape(title), who=html.escape(v["who"] + " · " + v["whosub"]))
        (tmp / f"{k}.html").write_text(page)
        png = tmp / f"{k}.png"
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=1200,630",
                        "--timeout=4000", f"--screenshot={png}", f"http://127.0.0.1:{PORT}/_card/{k}.html"], check=True, capture_output=True)
        out = DOCS / f"card-{k}.jpg"
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "84", str(png), "--out", str(out)], check=True, capture_output=True)
        print("card", out.name, out.stat().st_size // 1024, "KB")
    for p in tmp.iterdir(): p.unlink()
    tmp.rmdir()


if __name__ == "__main__":
    main()
