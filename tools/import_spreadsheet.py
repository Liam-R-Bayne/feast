"""
Rebuild videos.js and spots.js from the "Stoke Feast videos.xlsx" spreadsheet.

    pip install openpyxl
    python tools/import_spreadsheet.py "path/to/Stoke Feast videos.xlsx"

Rules:
  - Rows on the Videos sheet with no title or no link are skipped,
    and so are rows whose Status is "Idea".
  - Cells reading "Missing" are treated as empty.
  - Spots without a latitude/longitude are kept (their page still works)
    but get no dot on the globe until coordinates are added.
  - The Notes columns are private and are never copied to the site.
"""
import datetime
import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import openpyxl

ROOT = Path(__file__).resolve().parent.parent


def clean(value):
    if value is None:
        return ""
    if isinstance(value, str):
        value = value.strip()
        return "" if value.lower() == "missing" else value
    return value


def split_list(value):
    value = clean(value)
    return [part.strip() for part in str(value).split(",") if part.strip()] if value else []


def slug(name):
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def tidy_url(url):
    """Drop playlist and tracking bits from YouTube links, keep the video id."""
    url = clean(url)
    parsed = urlparse(url)
    if "youtube.com" in parsed.netloc:
        vid = parse_qs(parsed.query).get("v", [""])[0]
        if vid:
            return f"https://www.youtube.com/watch?v={vid}"
    return url


def number(value):
    value = clean(value)
    try:
        return round(float(value), 5)
    except (TypeError, ValueError):
        return None


def rows(sheet):
    it = sheet.iter_rows(values_only=True)
    header = [str(h).strip() if h else "" for h in next(it)]
    for row in it:
        if any(c is not None for c in row):
            yield dict(zip(header, row))


def js_file(var, comment, items):
    body = ",\n".join("  " + json.dumps(item, ensure_ascii=False) for item in items)
    return f"{comment}\nwindow.{var} = [\n{body}\n];\n"


def main(path):
    wb = openpyxl.load_workbook(path, data_only=True)

    spots = []
    for r in rows(wb["Spots"]):
        name = clean(r.get("Spot name"))
        if not name:
            continue
        lat, lng = number(r.get("Latitude")), number(r.get("Longitude"))
        spots.append({
            "id": slug(name),
            "name": name,
            "region": clean(r.get("Area / region")),
            "country": clean(r.get("Country")),
            "continent": clean(r.get("Continent")),
            "lat": lat if lng is not None else None,
            "lng": lng if lat is not None else None,
        })
    spot_ids = {s["name"].lower(): s["id"] for s in spots}

    videos, used_ids = [], set()
    for i, r in enumerate(rows(wb["Videos"]), start=1):
        title, url = clean(r.get("Title")), tidy_url(r.get("Video link"))
        if not title or not url or str(clean(r.get("Status"))).lower() == "idea":
            continue
        vid = clean(r.get("ID"))
        vid = int(vid) if isinstance(vid, (int, float)) and int(vid) not in used_ids else i
        while vid in used_ids:
            vid += 1000
        used_ids.add(vid)

        locations = []
        for col in ("Location 1", "Location 2", "Location 3"):
            name = clean(r.get(col))
            if not name:
                continue
            if name.lower() not in spot_ids:
                print(f"  ! '{title}': location '{name}' is not on the Spots sheet, skipped")
                continue
            locations.append(spot_ids[name.lower()])

        published = clean(r.get("Date published"))
        if isinstance(published, (datetime.date, datetime.datetime)):
            published = published.strftime("%Y-%m-%d")

        videos.append({
            "id": vid,
            "title": title,
            "url": url,
            "channel": clean(r.get("Channel / creator")),
            "people": split_list(r.get("People")),
            "published": str(published or ""),
            "discipline": clean(r.get("Discipline")),
            "type": clean(r.get("Type")),
            "locations": locations,
            "tags": split_list(r.get("Tags")),
            "description": clean(r.get("Description")),
            "featured": str(clean(r.get("Featured"))).lower() == "yes",
        })

    (ROOT / "videos.js").write_text(js_file("VIDEOS", VIDEOS_COMMENT, videos), encoding="utf-8")
    (ROOT / "spots.js").write_text(js_file("SPOTS", SPOTS_COMMENT, spots), encoding="utf-8")
    print(f"Wrote {len(videos)} videos and {len(spots)} spots.")


VIDEOS_COMMENT = """/*
  THE VIDEO LIST
  Built from the "Videos" sheet of "Stoke Feast videos.xlsx" by
  tools/import_spreadsheet.py. Easiest: edit the spreadsheet and re-run the
  import. Small fixes straight in this file are fine too.

  Fields:
    id           Running number from the sheet.
    title        Name shown on the video card.
    url          Normal YouTube or Vimeo link.
    channel      Channel or person who posted it.
    people       Athletes or riggers in the video.
    published    Date the video came out (YYYY-MM-DD).
    discipline   Recorded but not shown yet (the filter is paused).
    type         tutorial, video, edit, documentary, safety, competition, talk
    locations    Spot ids from spots.js. A video shows on each spot's page.
    tags         Extra words.
    description  One or two sentences, shown on the card.
    featured     true or false. Not used yet.
*/"""

SPOTS_COMMENT = """/*
  THE SPOTS (one per filming location, shown as dots on the globe)
  Built from the "Spots" sheet of "Stoke Feast videos.xlsx" by
  tools/import_spreadsheet.py.

  The dot size comes from how many videos list the spot in "locations".
  Spots with lat/lng set to null have a page but no dot yet.
*/"""


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
