/*
  HOME PAGE PHOTOS
  ----------------
  These rotate behind "Welcome to the Stoke Feast".
  To add a photo: put the file in images/home/ and add a line below.
  "alt" is a short description for people using screen readers.
*/
const HOME_PHOTOS = [
  { src: "images/home/image1.webp",  alt: "A highliner balancing high above a forested valley" },
  { src: "images/home/image2.webp",  alt: "A highliner crossing above a misty fjord" },
  { src: "images/home/image3.webp",  alt: "Three highliners on lines rigged across a desert canyon" },
  { src: "images/home/image5.jpg",   alt: "A highliner doing a handstand above an alpine lake" },
  { src: "images/home/image6.avif",  alt: "A highliner silhouetted against a sunset over a lake" },
  { src: "images/home/image7.webp",  alt: "A highliner far above a granite valley" },
  { src: "images/home/image8.jpg",   alt: "A slackliner walking a line between two hot air balloons" },
  { src: "images/home/image9.avif",  alt: "A highliner silhouetted against a full moon between red rock towers" },
  { src: "images/home/image4.jpg",   alt: "A highliner on a line rigged above a cliff and pine trees" },
  { src: "images/home/image10.jpg",  alt: "A highliner balancing with mountains behind" },
  { src: "images/home/image11.jpg",  alt: "A slackliner silhouetted against a golden granite dome" },
  { src: "images/home/image12.jpg",  alt: "A highliner walking over a red rock canyon" },
  { src: "images/home/image13.jpg",  alt: "A highliner over a snowy desert canyon under a pale sky" }
];

const SECONDS_PER_PHOTO = 6;

(function () {
  const slidesEl = document.getElementById("slides");
  const dotsEl = document.getElementById("dots");
  const countEl = document.getElementById("slide-count");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The first photo is already in the HTML, so the page looks right before this runs.
  const imgs = [slidesEl.querySelector("img")];
  HOME_PHOTOS.slice(1).forEach((p) => {
    const img = document.createElement("img");
    img.className = "slide";
    img.alt = p.alt;
    img.dataset.src = p.src; // loaded just before it is shown
    slidesEl.appendChild(img);
    imgs.push(img);
  });

  dotsEl.innerHTML = HOME_PHOTOS.map((p, i) =>
    `<button type="button" aria-label="Photo ${i + 1}"${i === 0 ? ' aria-current="true"' : ""}></button>`
  ).join("");
  const dots = [...dotsEl.children];

  let current = 0;
  let timer = null;

  function load(i) {
    const img = imgs[i];
    if (img && img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
  }

  function show(i) {
    i = (i + imgs.length) % imgs.length;
    load(i);
    load((i + 1) % imgs.length); // warm up the next one
    imgs[current].classList.remove("is-active");
    dots[current].removeAttribute("aria-current");
    current = i;
    imgs[current].classList.add("is-active");
    dots[current].setAttribute("aria-current", "true");
    countEl.textContent = `${String(current + 1).padStart(2, "0")} / ${String(imgs.length).padStart(2, "0")}`;
  }

  function start() {
    if (reduceMotion || imgs.length < 2) return;
    stop();
    timer = setInterval(() => show(current + 1), SECONDS_PER_PHOTO * 1000);
  }
  function stop() { clearInterval(timer); timer = null; }

  dotsEl.addEventListener("click", (e) => {
    const i = dots.indexOf(e.target.closest("button"));
    if (i >= 0) { show(i); start(); }
  });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  show(0);
  start();

  // Header turns solid once you scroll past the top of the photo.
  const header = document.getElementById("site-header");
  const onScroll = () => header.classList.toggle("is-solid", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
