# Feast

A hand-curated collection of slacklining videos, with a focus on highlining.
Visitors can browse by discipline (highline, longline, trickline, waterline, rodeo, midline),
filter by level and video type, search, and play videos right on the page.

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
| `discipline` | `highline`, `longline`, `trickline`, `waterline`, `rodeo`, `midline` |
| `level` | `beginner`, `intermediate`, `advanced`, `all` |
| `type` | `tutorial`, `documentary`, `edit`, `safety`, `competition`, `talk` |
| `featured` | `true` shows it in the Featured row at the top |

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
- `index.html` – page layout
- `style.css` – colours and layout
- `app.js` – filtering, search and the video player
