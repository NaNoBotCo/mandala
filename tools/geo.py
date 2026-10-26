"""Cut Natural Earth 1:50m countries (public domain) down to mainland and island
Southeast Asia, simplify, project, and write src/geo.js for the years map."""
import json, math, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
W, E, S, N = 88.0, 116.0, -9.5, 29.0
src = json.loads((ROOT / "data/ne_50m.geojson").read_text())

def proj(lon, lat):  # equirectangular scaled by cos(mid-lat), y down, 0..1000 wide
    k = math.cos(math.radians((S + N) / 2))
    x = (lon - W) * k; y = (N - lat)
    sx = 1000 / ((E - W) * k)
    return round(x * sx, 1), round(y * sx, 1)

def rdp(pts, eps):
    if len(pts) < 3: return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1; L = math.hypot(dx, dy) or 1e-9
    i, dmax = 0, 0
    for j in range(1, len(pts) - 1):
        d = abs(dy * pts[j][0] - dx * pts[j][1] + x2 * y1 - y2 * x1) / L
        if d > dmax: i, dmax = j, d
    if dmax > eps:
        return rdp(pts[: i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]

out = []
for f in src["features"]:
    p = f["properties"]; iso = p.get("ADM0_A3") or p.get("ISO_A3")
    g = f["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    rings = []
    for poly in polys:
        ring = poly[0]
        if not any(W - 3 <= lo <= E + 3 and S - 3 <= la <= N + 3 for lo, la in ring):
            continue
        pts = [proj(lo, la) for lo, la in ring]
        h = len(pts) // 2
        pts = rdp(pts[: h + 1], 1.1)[:-1] + rdp(pts[h:], 1.1)
        if len(pts) < 4: continue
        xs = [a for a, b in pts]; ys = [b for a, b in pts]
        if max(xs) - min(xs) < 6 and max(ys) - min(ys) < 6: continue
        rings.append([v for pt in pts for v in pt])
    if rings:
        out.append({"c": iso, "r": rings})
H = proj(W, S)[1]
js = "window.GEO=" + json.dumps({"w": 1000, "h": H, "W": W, "E": E, "S": S, "N": N, "k": math.cos(math.radians((S + N) / 2)), "land": out}, separators=(",", ":")) + ";\n"
(ROOT / "src/geo.js").write_text(js)
print(len(out), "countries", len(js) // 1024, "KB", "h", H)
