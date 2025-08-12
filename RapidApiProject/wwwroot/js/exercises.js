// wwwroot/js/exercises.js

// Bölgelerin görünen adları
const REGION_LABELS = {
    chest: "Göğüs",
    abs: "Karın",
    shoulders: "Omuz",
    biceps: "Biceps",
    forearms: "Ön Kol",
    quads: "Quadriceps",
    calves: "Baldır",
    traps: "Trapez",
    "rear-delts": "Arka Omuz",
    lats: "Kanatlar (Lats)",
    "lower-back": "Alt Sırt",
    glutes: "Kalça (Glutes)",
    hamstrings: "Arka Bacak (Hamstring)"
};

// Demo verisi (sonra API bağlayacağız)
const DEMO = {
    chest: ["Bench Press", "Incline DB Press", "Dips", "Cable Fly"],
    abs: ["Plank", "Hanging Leg Raise", "Cable Crunch"],
    shoulders: ["Overhead Press", "Lateral Raise", "Front Raise"],
    biceps: ["Barbell Curl", "Incline DB Curl", "Hammer Curl"],
    forearms: ["Reverse Curl", "Wrist Curl"],
    quads: ["Back Squat", "Leg Press", "Bulgarian Split Squat"],
    calves: ["Standing Calf Raise", "Seated Calf Raise"],
    traps: ["Barbell Shrug", "Face Pull"],
    "rear-delts": ["Reverse Pec Deck", "Bent-Over Lateral Raise"],
    lats: ["Pull-up", "Lat Pulldown", "One-arm Row"],
    "lower-back": ["Back Extension", "Good Morning"],
    glutes: ["Hip Thrust", "Glute Bridge", "Cable Kickback"],
    hamstrings: ["Romanian Deadlift", "Leg Curl", "Good Morning"]
};

const bodyFront = document.getElementById("bodyFront");
const bodyBack = document.getElementById("bodyBack");
const flipBtn = document.getElementById("flipSide");
const listEl = document.getElementById("exerciseList");
const titleEl = document.getElementById("regionTitle");
const searchEl = document.getElementById("searchInput");

let currentRegion = null;
let currentSide = "front";

// Bölge vurgulama stili (Tailwind class'ları)
const ACTIVE_FILL = "fill-indigo-400/40 stroke-indigo-600";
const INACTIVE_FILL = "fill-transparent stroke-gray-300 dark:stroke-gray-700";
const HOVER_FILL = "hover:fill-indigo-300/40 hover:stroke-indigo-500 cursor-pointer";

// SVG içindeki tüm region şekillerini hazırla (ön+arka)
[...document.querySelectorAll("#bodyFront .region, #bodyBack .region")].forEach(el => {
    el.setAttribute("vector-effect", "non-scaling-stroke");
    el.setAttribute("stroke-width", "2");
    el.classList.add(...INACTIVE_FILL.split(" "), ...HOVER_FILL.split(" "));

    el.addEventListener("click", () => {
        const region = el.getAttribute("data-region");
        selectRegion(region);
    });
});

// Bölge seçimi
function selectRegion(region) {
    currentRegion = region;

    // Önce tüm bölgeleri pasifleştir
    [...document.querySelectorAll("#bodyFront .region, #bodyBack .region")].forEach(el => {
        el.classList.remove(...ACTIVE_FILL.split(" "));
        ACTIVE_FILL.split(" ").forEach(c => el.classList.remove(c));
        INACTIVE_FILL.split(" ").forEach(c => el.classList.add(c));
    });

    // Şu anki yüzün şekillerini aktif yap
    const scope = (currentSide === "front" ? "#bodyFront" : "#bodyBack");
    [...document.querySelectorAll(`${scope} .region[data-region="${region}"]`)].forEach(el => {
        INACTIVE_FILL.split(" ").forEach(c => el.classList.remove(c));
        ACTIVE_FILL.split(" ").forEach(c => el.classList.add(c));
    });

    renderList();
}

// Listeyi doldur (şimdilik DEMO; sonra fetch)
function renderList() {
    const label = REGION_LABELS[currentRegion] || "Bölge";
    titleEl.textContent = label;

    const items = (DEMO[currentRegion] || []);
    const q = (searchEl?.value || "").trim().toLowerCase();
    const filtered = q ? items.filter(x => x.toLowerCase().includes(q)) : items;

    listEl.innerHTML = "";
    if (!filtered.length) {
        listEl.innerHTML = `<li class="py-3 text-sm text-gray-500 dark:text-gray-400">Bu bölge için sonuç yok.</li>`;
        return;
    }

    filtered.forEach(name => {
        const li = document.createElement("li");
        li.className = "py-3 flex items-center justify-between";
        li.innerHTML = `
      <div class="min-w-0">
        <div class="font-medium truncate">${name}</div>
        <div class="text-xs text-gray-500">Set/tekrar rehberi yakında</div>
      </div>
      <button class="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 text-xs hover:bg-gray-100 dark:hover:bg-gray-800">Detay</button>`;
        listEl.appendChild(li);
    });
}

// Arama
searchEl?.addEventListener("input", () => renderList());

// Ön/arka çevir
flipBtn?.addEventListener("click", () => {
    currentSide = (currentSide === "front" ? "back" : "front");
    bodyFront.classList.toggle("hidden", currentSide !== "front");
    bodyBack.classList.toggle("hidden", currentSide !== "back");

    // Yan tarafta aynı bölgenin arka/ön karşılığı yoksa vurguyu sıfırla
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

// Varsayılan: ön yüz açık
