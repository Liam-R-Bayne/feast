/*
  Shared helpers for the Map and spot pages.
  Reads window.VIDEOS (videos.js) and window.SPOTS (spots.js).
*/
(function () {
  const VIDEOS = window.VIDEOS || [];
  const SPOTS = window.SPOTS || [];

  const spotById = Object.fromEntries(SPOTS.map((s) => [s.id, s]));

  // How many videos list each spot.
  const counts = {};
  VIDEOS.forEach((v) => (v.locations || []).forEach((id) => (counts[id] = (counts[id] || 0) + 1)));

  function esc(text) {
    return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Works out where a link points: { kind: "youtube" | "vimeo", id }
  function parseVideoUrl(url) {
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\.|^m\./, "");
      if (host === "youtube.com" && u.searchParams.get("v")) return { kind: "youtube", id: u.searchParams.get("v") };
      if (host === "youtu.be") return { kind: "youtube", id: u.pathname.slice(1) };
      if (host === "youtube.com" && /^\/(shorts|embed)\//.test(u.pathname)) return { kind: "youtube", id: u.pathname.split("/")[2] };
      if (host === "vimeo.com" && /^\/\d+/.test(u.pathname)) return { kind: "vimeo", id: u.pathname.split("/")[1] };
    } catch (e) { /* not a link */ }
    return null;
  }

  function embedUrl(url) {
    const v = parseVideoUrl(url);
    if (!v) return "";
    return v.kind === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?autoplay=1&rel=0`
      : `https://player.vimeo.com/video/${encodeURIComponent(v.id)}?autoplay=1`;
  }

  function thumbnailUrl(url) {
    const v = parseVideoUrl(url);
    return v && v.kind === "youtube" ? `https://i.ytimg.com/vi/${encodeURIComponent(v.id)}/hqdefault.jpg` : "";
  }

  function formatCoords(spot) {
    if (spot.lat == null || spot.lng == null) return "";
    const lat = `${Math.abs(spot.lat).toFixed(3)}° ${spot.lat >= 0 ? "N" : "S"}`;
    const lng = `${Math.abs(spot.lng).toFixed(3)}° ${spot.lng >= 0 ? "E" : "W"}`;
    return `${lat}, ${lng}`;
  }

  window.Feast = {
    videos: VIDEOS,
    spots: SPOTS,
    spotById,
    videoCount: (id) => counts[id] || 0,
    videosAt: (id) => VIDEOS.filter((v) => (v.locations || []).includes(id)),
    hasCoords: (s) => typeof s.lat === "number" && typeof s.lng === "number",
    spotUrl: (id) => `spot.html?id=${encodeURIComponent(id)}`,
    plural: (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`,
    esc, parseVideoUrl, embedUrl, thumbnailUrl, formatCoords
  };
})();
