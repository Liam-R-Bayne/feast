# Feast

**Stoke Feast**: a hand-curated collection of slacklining videos, with a focus on highlining.
The site has a home page plus three sections: a Map, Channels & People, and a Timeline.
The Map is live: a 3D globe with a dot for every filming spot. Channels and Timeline are placeholders for now.

The site is plain HTML, CSS and JavaScript. There is no server, database or build step,
and it is hosted for free on GitHub Pages.

## Adding or editing videos

The master list is the spreadsheet **Stoke Feast videos.xlsx** (sheets *Videos* and *Spots*).
The site reads two files built from it:

- **`videos.js`**: one entry per video.
- **`spots.js`**: one entry per filming location, with latitude and longitude for the globe.

To update the site after editing the spreadsheet:

```
pip install openpyxl
python tools/import_spreadsheet.py "path/to/Stoke Feast videos.xlsx"
```

Then commit the changed `videos.js` and `spots.js`. Rows marked *Idea* are skipped,
cells reading "Missing" are left empty, and the *Notes* columns never reach the site.
Small fixes can also be made straight in `videos.js` on GitHub (pencil icon, then **Commit changes**).

## The map

- `map.html` + `map.js`: the globe. Dot size grows with the number of videos at a spot.
  Spots without coordinates have no dot but are listed under "No exact spot yet".
- `spot.html?id=moab` + `spot.js`: one page per spot with its videos.
  Videos load only when you press play.
- Satellite imagery comes from Esri; a built-in NASA Blue Marble globe (`images/globe/`)
  shows underneath in case the satellite tiles can't load.
- The map library (MapLibre GL JS) is stored in `vendor/maplibre/`, so nothing depends on a CDN.

## Home page photos

The rotating photos on the home page are listed at the top of **`home.js`**.
Put a new photo in `images/home/` and add a line for it there.

If the page goes blank after an edit, a missing comma or quote in `videos.js` is almost always the cause.

## Turning on GitHub Pages (one time)

1. On GitHub, go to the repository's **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to *Deploy from a branch*.
3. Choose branch **main** and folder **/ (root)**, then click **Save**.
4. After a minute the site is live at `https://liam-r-bayne.github.io/feast/`.

From then on, every change to `main` goes live automatically.

## Previewing locally

Double-click `index.html` to open it in your browser. For the map's built-in globe to show,
run `python -m http.server` in this folder and open http://localhost:8000 instead.

## Files

- `videos.js`, `spots.js` – the video and spot lists (built from the spreadsheet)
- `tools/import_spreadsheet.py` – rebuilds those two files from the spreadsheet
- `index.html` – home page
- `map.html`, `map.js` – the globe
- `spot.html`, `spot.js` – one page per spot
- `site.js` – shared helpers for the map and spot pages
- `channels.html`, `timeline.html` – section pages (coming soon)
- `home.js` – home page photo slideshow and its photo list
- `style.css` – colours, fonts and layout (the colour palette is at the top)
- `images/home/` – home page photos
