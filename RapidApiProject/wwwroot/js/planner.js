// wwwroot/js/planner.js

// ---------------- In-memory store ----------------
const Store = {
    tasks: [],   // { id, title, notes, scheduledDate: 'YYYY-MM-DD' | null, scope, done, color }
    goals: [],   // { id, title, scope, completed }
    changed: new Set(),
};

let viewYear, viewMonthIndex; // 0-based

// ---------------- Local date helpers (UTC YOK) ----------------
function ymdFromLocalDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function dateFromYmdLocal(s) {
    // "YYYY-MM-DD" -> local Date (00:00, local tz)
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
}
// Sunucudan gelen scheduledDate birçok formatta olabilir.
// Varsa ilk 10 karakteri (YYYY-MM-DD) al; yoksa Local'e çevir.
function normalizeServerDate(x) {
    if (!x) return null;
    const s = String(x);
    const m = s.match(/^\d{4}-\d{2}-\d{2}/);
    if (m) return m[0];
    const d = new Date(s);
    return ymdFromLocalDate(d);
}

// ---------------- HTTP ----------------
async function getJson(url) {
    const r = await fetch(url, { credentials: "same-origin" });
    if (!r.ok) throw new Error("GET " + url + " failed");
    return await r.json();
}
async function postJson(url, payload) {
    const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error("POST " + url + " failed");
    try { return await r.json(); } catch { return {}; }
}

// ---------------- Data load / create ----------------
async function loadMonthData(year, month1) {
    const data = await getJson(`/Planner/MonthData?year=${year}&month=${month1}`);
    Store.tasks = (data.tasks || []).map(t => ({
        id: t.id,
        title: t.title,
        notes: t.notes,
        scheduledDate: normalizeServerDate(t.scheduledDate), // <-- yerel YMD
        scope: t.scope || "day",
        done: !!t.done,
        color: t.color || "indigo",
    }));
    Store.goals = data.goals || [];
}

async function createTask({ title, scope = "day", date = null, color = "indigo", notes = "" }) {
    // Sunucuya Date nesnesi değil, "YYYY-MM-DD" string gönderiyoruz
    const payload = {
        id: 0, title, notes,
        scheduledDate: date, // <-- string veya null
        scope, done: false, color
    };
    const res = await postJson("/Planner/QuickAdd", payload);
    const newId = res?.id ?? 0;
    const task = { id: newId, title, notes, scheduledDate: date, scope, done: false, color };
    Store.tasks.push(task);
    return task;
}

// ---------------- Chip (draggable) ----------------
function chip(task) {
    const el = document.createElement("div");
    el.className =
        `task-chip select-none inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm cursor-grab
     border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900
     hover:bg-gray-100 dark:hover:bg-gray-800`;
    el.draggable = true;
    el.dataset.taskId = task.id;
    el.title = task.title;

    const dot = document.createElement("span");
    dot.className = `inline-block h-2.5 w-2.5 rounded-full bg-${task.color || "indigo"}-500`;
    el.appendChild(dot);

    const txt = document.createElement("span");
    txt.className = "max-w-[12rem] truncate";
    txt.textContent = task.title;
    el.appendChild(txt);

    el.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", String(task.id));
        e.dataTransfer.effectAllowed = "move";
        requestAnimationFrame(() => el.classList.add("opacity-50"));
    });
    el.addEventListener("dragend", () => el.classList.remove("opacity-50"));

    return el;
}

// ---------------- Side panels ----------------
function renderSidePanels() {
    const backlog = document.getElementById("backlogList");
    if (backlog) {
        backlog.innerHTML = "";
        backlog.addEventListener("dragover", (e) => e.preventDefault());
        backlog.addEventListener("drop", (e) => {
            e.preventDefault();
            const id = Number(e.dataTransfer.getData("text/plain"));
            const task = Store.tasks.find(t => t.id === id);
            if (!task) return;
            task.scheduledDate = null;
            Store.changed.add(task.id);
            renderSidePanels();
            renderMonth(viewYear, viewMonthIndex);
        });
        Store.tasks
            .filter(t => !t.scheduledDate && t.scope !== "year" && t.scope !== "month")
            .forEach(t => backlog.appendChild(chip(t)));
    }

    const dayPlan = document.getElementById("dayPlan");
    if (dayPlan) {
        dayPlan.innerHTML = "";
        Store.tasks.filter(t => t.scope === "day" && !t.scheduledDate)
            .forEach(t => { const li = document.createElement("li"); li.appendChild(chip(t)); dayPlan.appendChild(li); });
    }

    const weekPlan = document.getElementById("weekPlan");
    if (weekPlan) {
        weekPlan.innerHTML = "";
        Store.tasks.filter(t => t.scope === "week" && !t.scheduledDate)
            .forEach(t => { const li = document.createElement("li"); li.appendChild(chip(t)); weekPlan.appendChild(li); });
    }

    const monthGoals = document.getElementById("monthGoals");
    if (monthGoals) {
        monthGoals.innerHTML = "";
        Store.goals.filter(g => g.scope === "month").forEach(g => {
            const li = document.createElement("li");
            li.className = "flex items-center justify-between";
            li.innerHTML = `<span>${g.title}</span><input type="checkbox" ${g.completed ? "checked" : ""} class="h-4 w-4">`;
            monthGoals.appendChild(li);
        });
    }

    const yearGoals = document.getElementById("yearGoals");
    if (yearGoals) {
        yearGoals.innerHTML = "";
        Store.goals.filter(g => g.scope === "year").forEach(g => {
            const li = document.createElement("li");
            li.className = "flex items-center justify-between";
            li.innerHTML = `<span>${g.title}</span><input type="checkbox" ${g.completed ? "checked" : ""} class="h-4 w-4">`;
            yearGoals.appendChild(li);
        });
    }
}

// ---------------- Month view ----------------
function renderMonth(year, monthIndex0) {
    viewYear = year;
    viewMonthIndex = monthIndex0;

    const monthTitle = document.getElementById("monthTitle");
    const grid = document.getElementById("calendarGrid");
    if (!grid) return;

    const names = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    if (monthTitle) monthTitle.textContent = `${names[monthIndex0]} ${year}`;

    grid.innerHTML = "";

    const first = new Date(year, monthIndex0, 1);
    const last = new Date(year, monthIndex0 + 1, 0);
    const startOffset = (first.getDay() + 6) % 7; // Monday=0
    const totalCells = startOffset + last.getDate();
    const todayStr = ymdFromLocalDate(new Date()); // <-- yerel bugün

    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement("div");
        cell.className = "border border-gray-200 dark:border-gray-800 p-2 relative overflow-hidden";
        if (i < startOffset) {
            cell.classList.add("bg-gray-50", "dark:bg-gray-800/40");
            grid.appendChild(cell);
            continue;
        }

        const day = i - startOffset + 1;
        const dateStr = ymdFromLocalDate(new Date(year, monthIndex0, day)); // <-- yerel tarih
        cell.dataset.date = dateStr;

        const isToday = (dateStr === todayStr);
        if (isToday) {
            cell.className += " ring-2 ring-indigo-400 dark:ring-indigo-500/60 bg-indigo-50/40 dark:bg-indigo-900/20";
        }

        // header
        const head = document.createElement("div");
        head.className = "flex items-center justify-between gap-2 mb-2";
        head.innerHTML = `
      <div class="text-xs font-semibold ${isToday ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}">
        ${day}
      </div>
      <button class="addSmall inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg
                     border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800
                     shrink-0">
        <i class="fa-solid fa-plus"></i>
        <span class="hidden sm:inline">Ekle</span>
      </button>
    `;
        cell.appendChild(head);

        // list (droppable)
        const list = document.createElement("div");
        list.className = "space-y-2 min-h-16";
        list.addEventListener("dragover", (e) => e.preventDefault());
        list.addEventListener("drop", (e) => {
            e.preventDefault();
            const id = Number(e.dataTransfer.getData("text/plain"));
            const task = Store.tasks.find(t => t.id === id);
            if (!task) return;
            task.scheduledDate = dateStr;               // <-- string
            Store.changed.add(task.id);
            list.appendChild(chip(task));
            renderSidePanels();
        });
        cell.appendChild(list);

        // existing tasks
        Store.tasks.filter(t => t.scheduledDate === dateStr)
            .forEach(t => list.appendChild(chip(t)));

        // add small
        head.querySelector(".addSmall").addEventListener("click", async () => {
            const title = prompt(`${dateStr} için görev:`);
            if (title && title.trim().length) {
                const t = await createTask({ title: title.trim(), scope: "day", date: dateStr, color: "indigo" });
                list.appendChild(chip(t));
                renderSidePanels();
            }
        });

        grid.appendChild(cell);
    }
}

// ---------------- Quick add ----------------
function bindQuickAdd() {
    const btn = document.getElementById("quickAdd");
    if (!btn) return;
    btn.addEventListener("click", async () => {
        const titleEl = document.getElementById("quickTitle");
        const scopeEl = document.getElementById("quickScope");
        const dateEl = document.getElementById("quickDate");

        const title = (titleEl?.value || "").trim();
        const scope = scopeEl?.value || "day";
        const date = (dateEl?.value || "") || null; // <-- "YYYY-MM-DD" veya null
        if (!title) return;

        const task = await createTask({ title, scope, date, color: "indigo" });
        titleEl.value = "";
        renderSidePanels();
        renderMonth(viewYear, viewMonthIndex);
    });
}

// ---------------- Month navigation ----------------
function bindMonthNav() {
    const prev = document.getElementById("prevMonth");
    const next = document.getElementById("nextMonth");
    const todayBtn = document.getElementById("todayBtn");

    prev?.addEventListener("click", async () => {
        const d = new Date(viewYear, viewMonthIndex - 1, 1);
        await loadMonthData(d.getFullYear(), d.getMonth() + 1);
        renderSidePanels();
        renderMonth(d.getFullYear(), d.getMonth());
    });

    next?.addEventListener("click", async () => {
        const d = new Date(viewYear, viewMonthIndex + 1, 1);
        await loadMonthData(d.getFullYear(), d.getMonth() + 1);
        renderSidePanels();
        renderMonth(d.getFullYear(), d.getMonth());
    });

    todayBtn?.addEventListener("click", async () => {
        const d = new Date();
        await loadMonthData(d.getFullYear(), d.getMonth() + 1);
        renderSidePanels();
        renderMonth(d.getFullYear(), d.getMonth());
    });
}

// ---------------- Save (upsert) ----------------
function bindSave() {
    const btn = document.getElementById("saveChanges");
    if (!btn) return;
    btn.addEventListener("click", async () => {
        const ids = [...Store.changed];
        if (!ids.length) { alert("Değişiklik yok."); return; }
        const payload = ids.map(id => {
            const t = Store.tasks.find(x => x.id === id);
            return {
                id: t?.id ?? 0,
                title: t?.title ?? "",
                notes: t?.notes ?? null,
                scheduledDate: t?.scheduledDate || null, // <-- string gönder
                scope: t?.scope ?? "day",
                done: !!(t?.done),
                color: t?.color ?? "indigo",
                deleted: false
            };
        });
        try {
            await postJson("/Planner/Save", payload);
            Store.changed.clear();
            alert("Kaydedildi.");
        } catch {
            alert("Kaydetme sırasında bir hata oluştu.");
        }
    });
}

// ---------------- Focus (3 gün) ----------------
async function ensureFocusData(mode = "next") {
    const today = new Date();
    const days = [];
    if (mode === "next") {
        for (let i = 0; i < 3; i++) { const d = new Date(today); d.setDate(today.getDate() + i); days.push(d); }
    } else {
        for (let i = 3; i >= 1; i--) { const d = new Date(today); d.setDate(today.getDate() - i); days.push(d); }
    }
    const months = new Set(days.map(d => `${d.getFullYear()}-${d.getMonth() + 1}`));
    for (const key of months) {
        const [y, m] = key.split("-").map(Number);
        await loadMonthData(y, m);
    }
}

function renderFocus(mode = "next") {
    const wrap = document.getElementById("focusColumns");
    if (!wrap) return;
    wrap.innerHTML = "";

    const today = new Date();
    const days = [];
    if (mode === "next") {
        for (let i = 0; i < 3; i++) { const d = new Date(today); d.setDate(today.getDate() + i); days.push(d); }
    } else {
        for (let i = 3; i >= 1; i--) { const d = new Date(today); d.setDate(today.getDate() - i); days.push(d); }
    }

    days.forEach(d => {
        const dateStr = ymdFromLocalDate(d);
        const col = document.createElement("div");
        col.className = "rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4";
        col.innerHTML = `<div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold">${d.toLocaleDateString('tr-TR', { weekday: 'long', day: '2-digit', month: 'short' })}</h2>
        <button class="addSmall text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">Ekle</button>
      </div>
      <div class="space-y-2" data-list="${dateStr}"></div>`;

        const list = col.querySelector(`[data-list="${dateStr}"]`);
        Store.tasks.filter(t => t.scheduledDate === dateStr).forEach(t => {
            const row = document.createElement("div");
            row.className = "flex items-center justify-between px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800";
            row.innerHTML = `<div class="flex items-center gap-2">
          <span class="inline-block h-2.5 w-2.5 rounded-full bg-${t.color || "indigo"}-500"></span>
          <span class="max-w-[14rem] truncate">${t.title}</span>
        </div>
        <input type="checkbox" ${t.done ? "checked" : ""} class="h-4 w-4">`;
            list.appendChild(row);
        });

        col.querySelector(".addSmall").addEventListener("click", async () => {
            const title = prompt(`${dateStr} için görev:`);
            if (title && title.trim().length) {
                const t = await createTask({ title: title.trim(), scope: "day", date: dateStr, color: "indigo" });
                const row = document.createElement("div");
                row.className = "flex items-center justify-between px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800";
                row.innerHTML = `<div class="flex items-center gap-2">
            <span class="inline-block h-2.5 w-2.5 rounded-full bg-${t.color || "indigo"}-500"></span>
            <span class="max-w-[14rem] truncate">${t.title}</span>
          </div>
          <input type="checkbox" class="h-4 w-4">`;
                list.appendChild(row);
                renderSidePanels();
            }
        });

        wrap.appendChild(col);
    });

    const modeSel = document.getElementById("focusMode");
    if (modeSel) {
        modeSel.value = mode;
        modeSel.onchange = async () => {
            await ensureFocusData(modeSel.value);
            renderFocus(modeSel.value);
        };
    }
}

// ---------------- Init ----------------
document.addEventListener("DOMContentLoaded", async () => {
    const now = new Date();

    // Ay takvimi sayfası
    if (document.getElementById("calendarGrid")) {
        const y = (window.PLANNER?.year) || now.getFullYear();
        const m = (window.PLANNER?.month) || (now.getMonth() + 1); // 1-based
        await loadMonthData(y, m);
        renderSidePanels();
        renderMonth(y, m - 1);
        bindQuickAdd();
        bindMonthNav();
        bindSave();
    }

    // 3 gün odak sayfası
    if (document.getElementById("focusColumns")) {
        const mode = (document.getElementById("focusMode")?.value) || "next";
        await ensureFocusData(mode);
        renderSidePanels();
        renderFocus(mode);
    }
});
