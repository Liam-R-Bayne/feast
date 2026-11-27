"""Cut each drawing out of a Feast Art PDF into its own icon.

Usage:
    pip install pymupdf vtracer pillow
    python tools/extract_art.py "path/to/Feast Art 1.pdf"

The drawings in the PDF are mostly vector pen strokes, so most icons come out
as true SVG (the strokes copied straight from the PDF, no tracing). The two
raster bits are handled like this:
  * the spiral lizard is traced to a vector shape with vtracer;
  * the crayon globe behind the peace sign is kept as a small embedded image.
Every icon also gets a transparent PNG at 1024 px on its long side.

Output goes to images/icons/. Regions are listed in ICONS below (PDF points,
origin top left). Add a row there if new drawings appear in the PDF.
"""
import base64, io, os, re, sys, tempfile

import pymupdf as fitz
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), "..", "images", "icons")
PNG_SIZE = 1024
PAD = 4  # points of breathing room around each drawing
SVG_SIZE = 256  # default display size (long side, px) when no CSS size is set

# name, page, (x0, y0, x1, y1) region in PDF points
ICONS = [
    ("hands-highline",       0, (28, 60, 480, 190)),
    ("mountain-cliff",       0, (28, 222, 108, 302)),
    ("mountain-ridge",       0, (108, 242, 200, 294)),
    ("mountain-pass",        0, (206, 226, 294, 302)),
    ("mountain-tent-tall",   0, (310, 218, 396, 325)),
    ("mountain-tent-wide",   0, (402, 244, 482, 306)),
    ("mountain-peak",        0, (22, 308, 108, 394)),
    ("mountain-sun",         0, (108, 328, 216, 388)),
    ("mountain-sun-twin",    0, (226, 326, 336, 394)),
    ("mountain-sun-valley",  0, (355, 331, 430, 426)),
    ("monkey",               0, (26, 412, 97, 482)),
    ("lizard",               0, (122, 412, 198, 487)),
    ("peace-sun",            1, (0, 0, 450, 450)),
]


def hexcol(c):
    return "#%02x%02x%02x" % tuple(round(v * 255) for v in c)


def fmt(v):
    s = ("%.1f" % v).rstrip("0").rstrip(".")
    s = s.replace("-0.", "-.") if s.startswith("-0.") else (s[1:] if s.startswith("0.") else s)
    return "0" if s in ("", "-0", "-") else s


def bez(p0, p1, p2, p3, t):
    u = 1 - t
    return (u**3 * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t**3 * p3.x,
            u**3 * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t**3 * p3.y)


def simplify(pts, tol):
    """Ramer-Douglas-Peucker: drop points that sit within tol of the line."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (ax, ay), (bx, by) = pts[a], pts[b]
        dx, dy = bx - ax, by - ay
        n = (dx * dx + dy * dy) ** 0.5
        best, idx = -1, None
        for k in range(a + 1, b):
            px, py = pts[k]
            d = abs(dy * (px - ax) - dx * (py - ay)) / n if n else ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
            if d > best:
                best, idx = d, k
        if idx is not None and best > tol:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(pts, keep) if k]


def path_data(items, ox, oy, tol=0.12):
    """Turn PyMuPDF path items into compact SVG path data.

    The pencil strokes are thousands of tiny curves, so each run is flattened
    to points and simplified (tol is in PDF points, far below a pixel)."""
    runs, cur = [], None
    for it in items:
        kind = it[0]
        if kind in ("re", "qu"):
            q = it[1].quad if kind == "re" else it[1]
            runs.append([(q.ul.x, q.ul.y), (q.ur.x, q.ur.y), (q.lr.x, q.lr.y), (q.ll.x, q.ll.y), (q.ul.x, q.ul.y)])
            cur = None
            continue
        start = it[1]
        if cur is None or abs(cur.x - start.x) > 0.01 or abs(cur.y - start.y) > 0.01:
            runs.append([(start.x, start.y)])
        if kind == "l":
            runs[-1].append((it[2].x, it[2].y))
            cur = it[2]
        elif kind == "c":
            p0, p1, p2, p3 = it[1:5]
            length = abs(p3.x - p0.x) + abs(p3.y - p0.y) + abs(p1.x - p0.x) + abs(p2.y - p3.y)
            steps = max(1, min(12, int(length / 1.5)))
            for k in range(1, steps + 1):
                runs[-1].append(bez(p0, p1, p2, p3, k / steps))
            cur = p3
    out = []
    for run in runs:
        pts = simplify(run, tol)
        if len(pts) == 1:
            pts = pts * 2  # a dot: zero-length segment still draws a round cap
        x0, y0 = round((pts[0][0] - ox) * 10), round((pts[0][1] - oy) * 10)
        seg = ["M%s %s" % (fmt(x0 / 10), fmt(y0 / 10))]
        rel = []
        px, py = x0, y0
        for x, y in pts[1:]:
            ix, iy = round((x - ox) * 10), round((y - oy) * 10)
            rel.append("%s %s" % (fmt((ix - px) / 10), fmt((iy - py) / 10)))
            px, py = ix, iy
        out.append(seg[0] + "l" + " ".join(rel))
    return "".join(out)


def stroke_svg(drawings, ox, oy):
    """Group strokes that share colour and width into one <path> each."""
    groups, order = {}, []
    for d in drawings:
        if d["type"] != "s":
            continue
        key = (hexcol(d["color"]), round(d["width"], 2))
        if key not in groups:
            groups[key] = []
            order.append(key)
        groups[key].append(path_data(d["items"], ox, oy))
    parts = []
    for col, w in order:
        parts.append('<path fill="none" stroke="%s" stroke-width="%s" d="%s"/>' % (col, fmt(w), "".join(groups[(col, w)])))
    return parts


def traced_svg(png_bytes, box, ox, oy):
    """Trace a black-on-transparent raster to vector with vtracer."""
    import vtracer
    with tempfile.TemporaryDirectory() as tmp:
        src, dst = os.path.join(tmp, "in.png"), os.path.join(tmp, "out.svg")
        im = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
        # flatten onto white so the tracer sees ink vs paper
        bg = Image.new("RGBA", im.size, "white")
        bg.alpha_composite(im)
        big = bg.convert("RGB").resize((im.width * 3, im.height * 3), Image.LANCZOS)
        big.save(src)
        vtracer.convert_image_to_svg_py(src, dst, colormode="binary", filter_speckle=6,
                                        corner_threshold=60, length_threshold=4, splice_threshold=45,
                                        path_precision=2, mode="spline")
        svg = open(dst).read()
    w, h = big.size
    paths = re.findall(r"<path[^>]*/>", svg)
    sx, sy = box.width / w, box.height / h
    return ['<g transform="translate(%s %s) scale(%s %s)" fill="#1d1a17">%s</g>' % (
        fmt(box.x0 - ox), fmt(box.y0 - oy), "%.5f" % sx, "%.5f" % sy,
        "".join(re.sub(r'\sfill="[^"]*"', "", p) for p in paths))]


def embedded_image(doc, xref, box, ox, oy, clip_round=False, max_px=360):
    pix = fitz.Pixmap(doc, xref)
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    im.thumbnail((max_px, max_px), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=78)
    data = base64.b64encode(buf.getvalue()).decode()
    x, y = fmt(box.x0 - ox), fmt(box.y0 - oy)
    parts = []
    clip = ""
    if clip_round:
        parts.append('<clipPath id="globe"><ellipse cx="%s" cy="%s" rx="%s" ry="%s"/></clipPath>' % (
            fmt(box.x0 - ox + box.width / 2), fmt(box.y0 - oy + box.height / 2),
            fmt(box.width / 2 - 2), fmt(box.height / 2 - 2)))
        clip = ' clip-path="url(#globe)"'
    parts.append('<image%s x="%s" y="%s" width="%s" height="%s" preserveAspectRatio="none" href="data:image/jpeg;base64,%s"/>' % (
        clip, x, y, fmt(box.width), fmt(box.height), data))
    return parts


def main(pdf_path):
    os.makedirs(OUT, exist_ok=True)
    doc = fitz.open(pdf_path)
    for name, pno, region in ICONS:
        page = doc[pno]
        reg = fitz.Rect(region)
        # every stroke whose centre sits inside the region (skips the white page fill)
        ds = [d for d in page.get_drawings()
              if d["type"] == "s" and reg.contains(fitz.Point((d["rect"].x0 + d["rect"].x1) / 2,
                                                              (d["rect"].y0 + d["rect"].y1) / 2))]
        imgs = [i for i in page.get_image_info(xrefs=True) if reg.contains(fitz.Rect(i["bbox"]).tl + (1, 1))]
        bbox = fitz.Rect()
        for d in ds:
            bbox |= fitz.Rect(d["rect"]) + (-d["width"] / 2, -d["width"] / 2, d["width"] / 2, d["width"] / 2)
        for i in imgs:
            bbox |= fitz.Rect(i["bbox"])
        bbox += (-PAD, -PAD, PAD, PAD)
        ox, oy = bbox.x0, bbox.y0
        body = []
        for i in imgs:
            box = fitz.Rect(i["bbox"])
            if ds:  # image sits underneath pen strokes (the globe): keep it as a picture
                body += embedded_image(doc, i["xref"], box, ox, oy, clip_round=True)
            else:   # stand-alone ink drawing (the lizard): trace it
                pm = fitz.Pixmap(doc, i["xref"])
                smask = [im for im in page.get_images(full=True) if im[0] == i["xref"]][0][1]
                if smask:
                    pm = fitz.Pixmap(pm, fitz.Pixmap(doc, smask))
                body += traced_svg(pm.tobytes("png"), box, ox, oy)
        body += stroke_svg(ds, ox, oy)
        k = SVG_SIZE / max(bbox.width, bbox.height)
        svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %s %s" width="%d" height="%d" '
               'stroke-linecap="round" stroke-linejoin="round">\n<title>%s</title>\n%s\n</svg>\n') % (
            fmt(bbox.width), fmt(bbox.height), round(bbox.width * k), round(bbox.height * k),
            name.replace("-", " "), "\n".join(body))
        svg_path = os.path.join(OUT, name + ".svg")
        with open(svg_path, "w") as f:
            f.write(svg)

        # PNG fallback, rendered from the SVG so the two always match
        zoom = PNG_SIZE / SVG_SIZE
        render_png(svg_path, zoom).save(os.path.join(OUT, name + ".png"))
        print("%-22s %4d strokes %d images  %s" % (name, len(ds), len(imgs), "x".join(map(fmt, (bbox.width, bbox.height)))))


def render_png(svg_path, zoom):
    """Render an SVG to a transparent PNG with PyMuPDF."""
    svg = fitz.open(svg_path)
    pix = svg[0].get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=True)
    return Image.open(io.BytesIO(pix.tobytes("png")))


if __name__ == "__main__":
    main(sys.argv[1])
