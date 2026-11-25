# Feast

**Stoke Feast**: a hand-curated collection of slacklining videos, with a focus on highlining.
The site has a home page plus three sections: a Map, Channels & People, and a Timeline.
The three sections are placeholders for now.

The site is plain HTML, CSS and JavaScript. There is no server, database or build step,
and it is hosted for free on GitHub Pages.

## Adding or editing videos

All videos live in **`videos.js`**. That is the only file you need to touch.

1. Open `videos.js` on GitHub and click the pencil icon (Edit).
2. Copy an existing block from `{` to `},` and paste it at the end of the list.
3. Change the values. For `url`, paste the normal YouTube or Vimeo link from your browser.
4. Click **Commit changes**. The live site updates within a minute or two.

Allowed values (also listed at the top of `videos.js`):

| Field | Values |
|---|---|
| `discipline` | `highline`, `longline`, `trickline`, `waterline`, `rodeo`, `midline` (paused, not shown yet) |
| `type` | `tutorial`, `documentary`, `edit`, `safety`, `competition`, `talk` |
| `featured` | `true` or `false` (not used yet) |

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

Double-click `index.html` to open it in your browser. No install needed.

## Files

- `videos.js` – the video list
- `index.html` – home page
- `map.html`, `channels.html`, `timeline.html` – section pages (coming soon)
- `home.js` – home page photo slideshow and its photo list
- `style.css` – colours, fonts and layout (the colour palette is at the top)
- `images/home/` – home page photos
