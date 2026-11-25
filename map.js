/*
  THE MAP PAGE
  A 3D globe (MapLibre) with one dot per spot that has videos.
  Dot size grows with the number of videos. Clicking a dot opens spot.html.

  Imagery: satellite tiles from Esri load on top of a built-in NASA
  Blue Marble globe (images/globe/), so the globe still shows something
  if the satellite tiles are slow or blocked.
*/
(function () {
  const F = window.Feast;
  // Zoom so the whole globe fits the screen (about 530px across at zoom 1.75).
  const fitZoom = () => {
    const room = Math.min(window.innerWidth, window.innerHeight - 60) * 0.8;
    return Math.min(2.1, 1.75 + Math.log2(room / 530));
  };
  const HOME_VIEW = { center: [-62, 32], zoom: fitZoom(), pitch: 0, bearing: 0 };
  const SPOT_ZOOM = 9.5;
  const SHOW_LABELS_FROM_ZOOM = 4;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";
  const here = (path) => new URL(path, window.location.href).href;

  // Spots with at least one video, biggest first.
  const spots = F.spots
    .map((s) => ({ ...s, count: F.videoCount(s.id) }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const pinned = spots.filter(F.hasCoords);
  const unpinned = spots.filter((s) => !F.hasCoords(s));

  // Dot diameter in pixels: 1 video = 14px, then grows with the square root.
  const dotSize = (n) => Math.round(14 + 9 * Math.sqrt(n - 1));

  /* ---------- Side panel ---------- */

  const located = F.videos.filter((v) => (v.locations || []).length).length;
  document.getElementById("panel-stats").textContent =
    `${F.plural(located, "video")} · ${F.plural(pinned.length, "spot")} on the globe`;

  document.getElementById("spot-list").innerHTML = pinned.map((s) => `
    <li>
      <a href="${F.spotUrl(s.id)}" data-spot="${F.esc(s.id)}">
        <span class="spot-swatch" style="--size:${Math.min(dotSize(s.count), 26)}px" aria-hidden="true"></span>
        <span class="spot-name">${F.esc(s.name)}<small>${F.esc(s.country)}</small></span>
        <span class="spot-count" aria-label="${F.plural(s.count, "video")}">${s.count}</span>
      </a>
    </li>`).join("");

  if (unpinned.length) {
    document.getElementById("unpinned").innerHTML = `
      <p class="unpinned-title">No exact spot yet</p>
      <ul class="spot-list is-unpinned">${unpinned.map((s) => `
        <li><a href="${F.spotUrl(s.id)}">
          <span class="spot-name">${F.esc(s.name)}<small>${F.esc(s.country)}</small></span>
          <span class="spot-count" aria-label="${F.plural(s.count, "video")}">${s.count}</span>
        </a></li>`).join("")}
      </ul>`;
  }

  const panel = document.getElementById("spot-panel");
  const toggle = document.getElementById("panel-toggle");
  const setOpen = (open) => {
    panel.classList.toggle("is-collapsed", !open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.addEventListener("click", () => setOpen(panel.classList.contains("is-collapsed")));
  if (window.matchMedia("(max-width: 700px)").matches) setOpen(false);

  /* ---------- Globe ---------- */

  if (!window.maplibregl) {
    document.getElementById("globe").innerHTML = '<p class="globe-error">The globe could not load. The list of spots still works.</p>';
    return;
  }

  const map = new maplibregl.Map({
    container: "globe",
    ...HOME_VIEW,
    minZoom: 0.4,
    maxZoom: 17,
    attributionControl: false,
    style: {
      version: 8,
      projection: { type: "globe" },
      sources: {
        bluemarble: {
          type: "raster",
          tiles: [here("images/globe/") + "{z}/{x}/{y}.jpg"],
          tileSize: 256,
          maxzoom: 3,
          attribution: "Blue Marble: NASA"
        },
        satellite: {
          type: "raster",
          tiles: [`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`],
          tileSize: 256,
          maxzoom: 18,
          attribution: "Imagery © Esri, Maxar, Earthstar Geographics and the GIS User Community"
        },
        places: {
          type: "raster",
          tiles: [`${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`],
          tileSize: 256,
          maxzoom: 18
        }
      },
      layers: [
        { id: "ocean", type: "background", paint: { "background-color": "#14202a" } },
        { id: "bluemarble", type: "raster", source: "bluemarble" },
        { id: "satellite", type: "raster", source: "satellite", paint: { "raster-fade-duration": 200 } },
        { id: "places", type: "raster", source: "places", minzoom: 2.5, paint: { "raster-opacity": 0.85 } }
      ],
      sky: {
        "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 5, 1, 8, 0]
      }
    }
  });

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
  map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
  map.dragRotate.enable();
  map.touchZoomRotate.enableRotation();

  /* ---------- Dots ---------- */

  const markers = {};
  // Smaller dots are added last so they sit on top of nearby big ones.
  [...pinned].reverse().forEach((s) => {
    const el = document.createElement("a");
    el.className = "spot-dot";
    el.href = F.spotUrl(s.id);
    el.style.setProperty("--size", `${dotSize(s.count)}px`);
    el.setAttribute("aria-label", `${s.name}, ${s.country}: ${F.plural(s.count, "video")}`);
    el.innerHTML = `
      <span class="dot" aria-hidden="true">${s.count > 1 ? s.count : ""}</span>
      <span class="dot-label" aria-hidden="true">${F.esc(s.name)}<small>${F.plural(s.count, "video")}</small></span>`;
    markers[s.id] = new maplibregl.Marker({ element: el, anchor: "center", opacityWhenCovered: "0" })
      .setLngLat([s.lng, s.lat])
      .addTo(map);
  });

  const globeEl = document.getElementById("globe");
  const updateLabels = () => globeEl.classList.toggle("show-labels", map.getZoom() >= SHOW_LABELS_FROM_ZOOM);
  map.on("zoom", updateLabels);
  updateLabels();

  // Hovering a spot in the list lights up its dot.
  document.getElementById("spot-list").addEventListener("mouseover", (e) => {
    const a = e.target.closest("[data-spot]");
    Object.values(markers).forEach((m) => m.getElement().classList.remove("is-highlighted"));
    if (a && markers[a.dataset.spot]) markers[a.dataset.spot].getElement().classList.add("is-highlighted");
  });
  document.getElementById("spot-list").addEventListener("mouseleave", () =>
    Object.values(markers).forEach((m) => m.getElement().classList.remove("is-highlighted")));

  /* ---------- Gentle spin until someone touches the globe ---------- */

  let spinning = !reduceMotion && !location.hash;
  const stopSpin = () => { spinning = false; };
  ["mousedown", "touchstart", "wheel", "keydown"].forEach((ev) =>
    globeEl.addEventListener(ev, stopSpin, { passive: true }));
  panel.addEventListener("mouseover", stopSpin);

  let last = performance.now();
  function spin(now) {
    const dt = Math.min(now - last, 100);
    last = now;
    if (spinning && map.getZoom() < 3 && !map.isMoving()) {
      const c = map.getCenter();
      map.jumpTo({ center: [c.lng + dt * 0.0035, c.lat] });
    }
    requestAnimationFrame(spin);
  }
  map.once("load", () => requestAnimationFrame(spin));

  /* ---------- Buttons and links ---------- */

  document.getElementById("reset-view").addEventListener("click", () => {
    stopSpin();
    map.flyTo({ ...HOME_VIEW, zoom: fitZoom(), center: [map.getCenter().lng, HOME_VIEW.center[1]], duration: reduceMotion ? 0 : 2200 });
  });

  // map.html#moab flies straight to that spot (used by "Show on the globe" on spot pages).
  function flyToHash() {
    const s = pinned.find((p) => p.id === decodeURIComponent(location.hash.slice(1)));
    if (!s) return;
    stopSpin();
    map.flyTo({ center: [s.lng, s.lat], zoom: SPOT_ZOOM, pitch: 45, duration: reduceMotion ? 0 : 4000, essential: true });
    markers[s.id].getElement().classList.add("is-highlighted");
  }
  map.once("load", flyToHash);
  window.addEventListener("hashchange", flyToHash);

  window.feastMap = map; // handy for debugging in the browser console
})();
