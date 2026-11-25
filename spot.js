/*
  SPOT PAGE  (spot.html?id=moab)
  Shows one filming location and a list of every video that lists it.
*/
(function () {
  const F = window.Feast;
  const id = new URLSearchParams(location.search).get("id") || "";
  const spot = F.spotById[id];
  const $ = (sel) => document.getElementById(sel);

  if (!spot) {
    document.title = "Spot not found · Stoke Feast";
    $("spot-kicker").textContent = "Hmm";
    $("spot-name").textContent = "Spot not found";
    $("spot-region").textContent = "That spot isn't in the collection (yet). Head back to the globe to pick another.";
    return;
  }

  const videos = F.videosAt(spot.id).sort((a, b) => (b.published || "").localeCompare(a.published || ""));

  document.title = `${spot.name} · Stoke Feast`;
  $("spot-kicker").textContent = [spot.country, spot.continent].filter(Boolean).join(" · ") || "Spot";
  $("spot-name").textContent = spot.name;
  $("spot-region").textContent = spot.region && spot.region !== spot.name ? spot.region : "";

  const coords = F.formatCoords(spot);
  $("spot-meta").innerHTML = [
    `<span class="tag">${F.plural(videos.length, "video")}</span>`,
    coords ? `<span class="coords">${coords}</span>` : `<span class="coords">No exact coordinates yet</span>`
  ].join("");
  if (coords) $("back-link").href = `map.html#${encodeURIComponent(spot.id)}`;

  const year = (v) => (v.published || "").slice(0, 4);

  $("video-list").innerHTML = videos.map((v) => {
    const thumb = F.thumbnailUrl(v.url);
    const others = (v.locations || []).filter((l) => l !== spot.id && F.spotById[l]);
    return `
    <li class="video-card">
      <div class="player" data-embed="${F.esc(F.embedUrl(v.url))}">
        <button type="button" class="play" aria-label="Play ${F.esc(v.title)}">
          ${thumb ? `<img src="${thumb}" alt="" loading="lazy" onerror="this.remove()">` : ""}
          <span class="play-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
        </button>
      </div>
      <div class="video-body">
        <p class="video-meta">
          ${[v.channel, year(v), v.type].filter(Boolean).map(F.esc).join(" · ")}
        </p>
        <h3><a href="${F.esc(v.url)}" target="_blank" rel="noopener">${F.esc(v.title)}</a></h3>
        ${v.description ? `<p class="video-desc">${F.esc(v.description)}</p>` : ""}
        ${v.people && v.people.length ? `<p class="video-people"><span>With</span> ${v.people.map(F.esc).join(", ")}</p>` : ""}
        ${others.length ? `<p class="video-also"><span>Also filmed at</span> ${others.map((l) =>
          `<a href="${F.spotUrl(l)}">${F.esc(F.spotById[l].name)}</a>`).join("")}</p>` : ""}
        ${v.tags && v.tags.length ? `<ul class="video-tags">${v.tags.map((t) => `<li>${F.esc(t)}</li>`).join("")}</ul>` : ""}
      </div>
    </li>`;
  }).join("");

  // Load the real player only when someone presses play (keeps the page fast).
  $("video-list").addEventListener("click", (e) => {
    const btn = e.target.closest(".play");
    if (!btn) return;
    const player = btn.parentElement;
    const src = player.dataset.embed;
    if (!src) { window.open(player.parentElement.querySelector("h3 a").href, "_blank", "noopener"); return; }
    player.innerHTML = `<iframe src="${src}" title="${F.esc(btn.getAttribute("aria-label").replace(/^Play /, ""))}"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  });
})();
