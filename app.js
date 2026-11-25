// Site logic. You normally don't need to edit this file; videos live in videos.js.

const DISCIPLINES = {
  all:       { label: "All",       blurb: "Every video in the collection." },
  highline:  { label: "Highline",  blurb: "Walking a line rigged high above the ground, always tied in with a leash. The heart of this collection." },
  longline:  { label: "Longline",  blurb: "Very long lines close to the ground, where sway and focus matter more than height." },
  trickline: { label: "Trickline", blurb: "Short, tight, bouncy lines built for jumps, flips and combos." },
  waterline: { label: "Waterline", blurb: "Lines rigged over water, so falling is part of the fun." },
  rodeo:     { label: "Rodeo",     blurb: "A line with no tension that hangs like a smile and swings with you." },
  midline:   { label: "Midline",   blurb: "A few metres up, with a leash. The usual stepping stone from the ground to the heights." }
};
const LEVELS = { any: "Any level", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", all: "For everyone" };
const TYPES = { any: "Any type", tutorial: "Tutorial", documentary: "Documentary", edit: "Edit / highlights", safety: "Safety & rigging", competition: "Competition", talk: "Talk / interview" };

const videos = (window.VIDEOS || []).map((v, i) => ({ ...v, id: i, embed: parseUrl(v.url) }));
const state = { discipline: "all", level: "any", type: "any", q: "" };
const $ = (id) => document.getElementById(id);

// Turn a normal YouTube or Vimeo link into what we need to embed it.
function parseUrl(url) {
  if (!url) return null;
  let m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (m) {
    const t = url.match(/[?&]t=(\d+)/);
    return {
      src: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0${t ? "&start=" + t[1] : ""}`,
      thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`
    };
  }
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/);
  if (m) {
    return {
      src: `https://player.vimeo.com/video/${m[1]}?autoplay=1${m[2] ? "&h=" + m[2] : ""}`,
      thumb: `https://vumbnail.com/${m[1]}.jpg`
    };
  }
  return null;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function card(v) {
  const d = DISCIPLINES[v.discipline]?.label || v.discipline;
  const thumb = v.embed
    ? `<img src="${v.embed.thumb}" alt="" loading="lazy">`
    : `<div class="placeholder-thumb"><span>Video coming soon</span></div>`;
  return `
    <article class="card ${v.discipline}" data-id="${v.id}" tabindex="0" role="button" aria-label="Play ${escapeHtml(v.title)}">
      <div class="thumb">${thumb}<span class="play" aria-hidden="true">▶</span></div>
      <div class="body">
        <div class="chips">
          <span class="chip disc">${escapeHtml(d)}</span>
          <span class="chip">${escapeHtml(LEVELS[v.level] || v.level)}</span>
          <span class="chip">${escapeHtml(TYPES[v.type] || v.type)}</span>
        </div>
        <h3>${escapeHtml(v.title)}</h3>
        <p>${escapeHtml(v.description)}</p>
      </div>
    </article>`;
}

function matches(v) {
  if (state.discipline !== "all" && v.discipline !== state.discipline) return false;
  if (state.level !== "any" && v.level !== state.level) return false;
  if (state.type !== "any" && v.type !== state.type) return false;
  if (state.q) {
    const hay = [v.title, v.description, v.discipline, ...(v.tags || [])].join(" ").toLowerCase();
    if (!state.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  return true;
}

function render() {
  // Discipline buttons with counts
  $("disciplines").innerHTML = Object.entries(DISCIPLINES).map(([key, d]) => {
    const n = key === "all" ? videos.length : videos.filter((v) => v.discipline === key).length;
    return `<button class="disc-btn ${key} ${state.discipline === key ? "active" : ""}" data-disc="${key}" aria-pressed="${state.discipline === key}">${d.label} <span>${n}</span></button>`;
  }).join("");
  $("blurb").textContent = DISCIPLINES[state.discipline]?.blurb || "";

  const list = videos.filter(matches);
  $("results").innerHTML = list.map(card).join("") ||
    `<p class="empty">No videos match these filters yet. Try clearing a filter.</p>`;
  $("count").textContent = `${list.length} video${list.length === 1 ? "" : "s"}`;

  // Remember the filters in the address bar so a filtered view can be shared
  const params = new URLSearchParams();
  for (const [k, def] of [["discipline", "all"], ["level", "any"], ["type", "any"], ["q", ""]]) {
    if (state[k] !== def) params.set(k, state[k]);
  }
  const hash = params.toString();
  history.replaceState(null, "", hash ? "#" + hash : location.pathname);
}

function fillSelect(el, options, value) {
  el.innerHTML = Object.entries(options).map(([k, label]) => `<option value="${k}">${label}</option>`).join("");
  el.value = value;
}

function openPlayer(id) {
  const v = videos[id];
  if (!v) return;
  $("player-title").textContent = v.title;
  $("player-desc").textContent = v.description || "";
  $("player-frame").innerHTML = v.embed
    ? `<iframe src="${v.embed.src}" title="${escapeHtml(v.title)}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>`
    : `<div class="placeholder-thumb big"><span>This is a placeholder. Add a YouTube or Vimeo link in videos.js.</span></div>`;
  $("player").showModal();
}

function closePlayer() {
  $("player-frame").innerHTML = ""; // stops playback
  $("player").close();
}

function init() {
  // Read filters from the address bar, if any
  const p = new URLSearchParams(location.hash.slice(1));
  if (DISCIPLINES[p.get("discipline")]) state.discipline = p.get("discipline");
  if (LEVELS[p.get("level")]) state.level = p.get("level");
  if (TYPES[p.get("type")]) state.type = p.get("type");
  state.q = p.get("q") || "";

  fillSelect($("level"), LEVELS, state.level);
  fillSelect($("type"), TYPES, state.type);
  $("search").value = state.q;

  const featured = videos.filter((v) => v.featured);
  $("featured").innerHTML = featured.map(card).join("");
  $("featured-section").hidden = featured.length === 0;

  $("disciplines").addEventListener("click", (e) => {
    const b = e.target.closest("[data-disc]");
    if (b) { state.discipline = b.dataset.disc; render(); }
  });
  $("level").addEventListener("change", (e) => { state.level = e.target.value; render(); });
  $("type").addEventListener("change", (e) => { state.type = e.target.value; render(); });
  $("search").addEventListener("input", (e) => { state.q = e.target.value.trim(); render(); });

  const onCard = (e) => {
    const c = e.target.closest(".card");
    if (!c) return;
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    openPlayer(Number(c.dataset.id));
  };
  for (const id of ["featured", "results"]) {
    $(id).addEventListener("click", onCard);
    $(id).addEventListener("keydown", onCard);
  }
  $("player-close").addEventListener("click", closePlayer);
  $("player").addEventListener("cancel", (e) => { e.preventDefault(); closePlayer(); });
  $("player").addEventListener("click", (e) => { if (e.target === $("player")) closePlayer(); });

  render();
}

init();
