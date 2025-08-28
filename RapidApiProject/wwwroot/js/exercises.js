
const REGION_LABELS = {
    chest: "Göğüs",
    abs: "Karın",
    shoulders: "Omuz",
    biceps: "Biceps",
    forearms: "Ön Kol",
    triceps: "Arka Kol",
    quads: "Quadriceps",
    calves: "Baldır",
    traps: "Trapez",
    "rear-delts": "Arka Omuz",
    lats: "Kanatlar (Lats)",
    "lower-back": "Alt Sırt",
    glutes: "Kalça (Glutes)",
    hamstrings: "Arka Bacak (Hamstring)"
};

const cfg = window.ExerciseCfg || { urls: {} };
const API = cfg.urls || {};

const bodyFront = document.getElementById("bodyFront");
const bodyBack = document.getElementById("bodyBack");
const flipBtn = document.getElementById("flipSide");
const listEl = document.getElementById("exerciseList");
const titleEl = document.getElementById("regionTitle");
const searchEl = document.getElementById("searchInput");
const sideBadge = document.getElementById("sideBadge");
const btnFront = document.getElementById("btnFront");
const btnBack = document.getElementById("btnBack");
let currentRegion = null;
let currentSide = "front";
const ACTIVE_FILL = "fill-indigo-400/40 stroke-indigo-600";
const INACTIVE_FILL = "fill-transparent stroke-gray-300 dark:stroke-gray-700";
const HOVER_FILL = "hover:fill-indigo-300/40 hover:stroke-indigo-500 cursor-pointer";

[...document.querySelectorAll("#bodyFront .region, #bodyBack .region")].forEach(el => {
    el.setAttribute("vector-effect", "non-scaling-stroke");
    el.setAttribute("stroke-width", "2");
    el.classList.add(...INACTIVE_FILL.split(" "), ...HOVER_FILL.split(" "));
    el.addEventListener("click", () => {
        const region = el.getAttribute("data-region");
        selectRegion(region);
    });
});

function updateSideUI() {
    bodyFront.classList.toggle("hidden", currentSide !== "front");
    bodyBack.classList.toggle("hidden", currentSide !== "back");

    if (sideBadge) sideBadge.innerHTML = (currentSide === "front")
        ? `<i class="fa-regular fa-circle-dot"></i> Ön`
        : `<i class="fa-regular fa-circle-dot"></i> Arka`;

    if (btnFront && btnBack) {
        if (currentSide === "front") {
            btnFront.classList.add("bg-indigo-50", "dark:bg-indigo-900/30", "text-indigo-700", "dark:text-indigo-200");
            btnBack.classList.remove("bg-indigo-50", "dark:bg-indigo-900/30", "text-indigo-700", "dark:text-indigo-200");
        } else {
            btnBack.classList.add("bg-indigo-50", "dark:bg-indigo-900/30", "text-indigo-700", "dark:text-indigo-200");
            btnFront.classList.remove("bg-indigo-50", "dark:bg-indigo-900/30", "text-indigo-700", "dark:text-indigo-200");
        }
    }
}

function selectRegion(region) {
    currentRegion = region;

    [...document.querySelectorAll("#bodyFront .region, #bodyBack .region")].forEach(el => {
        ACTIVE_FILL.split(" ").forEach(c => el.classList.remove(c));
        INACTIVE_FILL.split(" ").forEach(c => el.classList.add(c));
    });

    const scope = (currentSide === "front" ? "#bodyFront" : "#bodyBack");
    [...document.querySelectorAll(`${scope} .region[data-region="${region}"]`)].forEach(el => {
        INACTIVE_FILL.split(" ").forEach(c => el.classList.remove(c));
        ACTIVE_FILL.split(" ").forEach(c => el.classList.add(c));
    });

    loadRegionList();
}
async function loadRegionList() {
    const label = REGION_LABELS[currentRegion] || "Bölge";
    titleEl.textContent = label;

    listEl.innerHTML = `<li class="py-3 text-sm text-gray-500 dark:text-gray-400">Yükleniyor…</li>`;

    try {
        const url = new URL(API.regionList, window.location.origin);
        url.searchParams.set("region", currentRegion || "");
        const q = (searchEl?.value || "").trim();
        if (q) url.searchParams.set("q", q);

        const r = await fetch(url.toString(), { credentials: "same-origin" });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const data = await r.json();
        const items = (data && data.ok && Array.isArray(data.items)) ? data.items : [];
        renderList(items);
    } catch (err) {
        console.error("[exercise] region list error:", err);
        listEl.innerHTML = `<li class="py-3 text-sm text-rose-600">Liste getirilemedi.</li>`;
    }
}

function renderList(items) {
    const ph = "https://via.placeholder.com/800x600?text=Exercise";
    listEl.innerHTML = "";

    if (!items.length) {
        listEl.innerHTML = `<li class="py-3 text-sm text-gray-500 dark:text-gray-400">Bu bölge için sonuç yok.</li>`;
        return;
    }

    items.forEach(x => {
        const li = document.createElement("li");
        li.className = "py-3 flex items-center justify-between gap-3";
        li.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <img src="${x.img || ph}"
             class="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 rounded-xl object-cover border border-gray-200 dark:border-gray-800 flex-shrink-0"
             alt="${x.name}">
        <div class="min-w-0">
          <div class="font-medium truncate">${x.name}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 truncate">${x.cat || ""}</div>
        </div>
      </div>
      <a href="${window.location.origin}/Exercise/Detail/${x.id}"
         class="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 text-xs hover:bg-gray-100 dark:hover:bg-gray-800">
         Detay
      </a>`;
        listEl.appendChild(li);
    });
}

searchEl?.addEventListener("input", () => {
    if (currentRegion) loadRegionList();
});

flipBtn?.addEventListener("click", () => {
    currentSide = (currentSide === "front" ? "back" : "front");

    updateSideUI();

    if (currentRegion) {
        const scope = (currentSide === "front" ? "#bodyFront" : "#bodyBack");
        const exists = document.querySelector(`${scope} .region[data-region="${currentRegion}"]`);
        if (!exists) currentRegion = null;
    }

    if (currentRegion) selectRegion(currentRegion);
    else {
        titleEl.textContent = "Bölge Seçin";
        listEl.innerHTML = `<li class="py-3 text-sm text-gray-500 dark:text-gray-400">Herhangi bir bölgeye tıklayın.</li>`;
    }
});

btnFront?.addEventListener("click", () => {
    if (currentSide !== "front") { currentSide = "front"; updateSideUI(); if (currentRegion) selectRegion(currentRegion); }
});
btnBack?.addEventListener("click", () => {
    if (currentSide !== "back") { currentSide = "back"; updateSideUI(); if (currentRegion) selectRegion(currentRegion); }
});
updateSideUI();
