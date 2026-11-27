# Feast Art icons

Every drawing from Liam's **Feast Art 1** PDF, one file each, transparent background.

- `*.svg`: the main version. The pen strokes are copied straight out of the PDF (no tracing), so they stay sharp at any size. The lizard was a raster drawing and is traced to vector; the crayon globe inside `peace-sun` stays a small embedded picture.
- `*.png`: 1024 px fallback with the same name.

Browse them all, with copy-paste snippets, at `icons.html`. Quick use:

```html
<img class="art art--md" src="images/icons/mountain-sun.svg" alt="">
<span class="art-tint art--sm" style="--art: url(images/icons/mountain-peak.svg); color: var(--rust)"></span>
```

Sizes: `art--xs` (1.5rem), `art--sm` (3rem), `art--md` (6rem), `art--lg` (10rem), `art--xl` (16rem), or set `--art-size`. Add `art--wide` to size by width instead of height (good for `hands-highline`). `art-tint` recolours single-colour drawings to the current text colour.

To rebuild after the PDF changes: `pip install pymupdf vtracer pillow`, then `python tools/extract_art.py "path/to/Feast Art 1.pdf"`. New drawings need a row in `ICONS` at the top of that script.
