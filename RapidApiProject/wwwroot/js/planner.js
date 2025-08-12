// wwwroot/js/planner.js

const COLORS = ["indigo", "emerald", "rose", "amber", "violet", "sky", "slate", "fuchsia"];

const Store = {
    tasks: [],        // { id, title, notes, scheduledDate:'YYYY-MM-DD'|null, scope, done, color }
    goals: [],        // { id, title, scope, completed }
    changed: new Set(),   // drag ile tarih değişenler vs. (hala "Kaydet" ile upsert)
};

let viewYear, viewMonthIndex; // 0-based

// ---------- Local date helpers (UTC yok) ----------
function ymdFromLocalDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function normalizeServerDate(x) {
    if (!x) return null;
    const s = String(x);
    const m = s.match(/^\d{4}-\d{2}-\d{2}/);
    if (m) return m[0];
    const d = new Date(s);
    return ymdFromLocalDate(d);
}

// ---------- HTTP ----------
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
async function postDelete(id) {
    const r = await fetch(`/Planner/Delete?id=${id}`, { method: "POST", credentials: "same-origin" });
    if (!r.ok) throw new Error("Delete failed");
    return true;
}

// ---------- Data load / create ----------
async function loadMonthData(year, month1) {
    const data = await getJson(`/Planner/MonthData?year=${year}&month=${month1}`);
    Store.tasks = (data.tasks || []).map((t, i) => ({
        id: t.id,
        title: t.title,
        notes: t.notes,
        scheduledDate: normalizeServerDate(t.scheduledDate),
        scope: t.scope || "day",
        done: !!t.done,
        color: t.color || COLORS[i % COLORS.length],
    }));
    Store.goals = data.goals || [];
}
async function createTask({ title, scope = "day", date = null, color = "indigo", notes = "" }) {
    const payload = { id: 0, title, notes, scheduledDate: date, scope, done: false, color };
    const res = await postJson("/Planner/QuickAdd", payload);
    const newId = res?.id ?? 0;
    const task = { id: newId, title, notes, scheduledDate: date, scope, done: false, color };
    Store.tasks.push(task);
    return task;
}

// ---------- Modal (detay) ----------
function openTaskModal(task) {
    const modal = document.getElementById("taskModal");
    if (!modal) return;
    modal.querySelector("[data-m-title]").textContent = task.title || "(Başlık yok)";
    modal.querySelector("[data-m-date]").textContent = task.scheduledDate || "—";
    modal.querySelector("[data-m-scope]").textContent = task.scope;
    modal.querySelector("[data-m-notes]").textContent = task.notes?.trim() ? task.notes : "Not eklenmemiş.";
    modal.querySelector("[data-m-color]").className =
        `inline-block h-3 w-3 rounded-full bg-${task.color || "indigo"}-500`;

    const delBtn = modal.querySelector("[data-m-delete]");
    delBtn.onclick = async () => {
        if (!confirm("Bu görevi silmek istiyor musun?")) return;
        try { await postDelete(task.id); } catch { alert("Silme sırasında hata oluştu."); return; }
        // Store'dan çıkar ve UI'ı yenile
        const idx = Store.tasks.findIndex(t => t.id === task.id);
        if (idx >= 0) Store.tasks.splice(idx, 1);
        closeTaskModal();
        renderSidePanels();
        if (document.getElementById("calendarGrid")) renderMonth(viewYear, viewMonthIndex);
        if (document.getElementById("focusColumns")) {
            const modeSel = document.getElementById("focusMode");
            renderFocus(modeSel?.value || "next");
        }
    };

    modal.classList.remove("hidden");
}
function closeTaskModal() {
    const modal = document.getElementById("taskModal");
    if (modal) modal.classList.add("hidden");
}

// ---------- Chip (wrap + info + delete) ----------
function chip(task) {
    const el = document.createElement("div");
    el.className =
        `group relative task-chip flex w-full items-center gap-2 px-3 py-1.5 rounded-xl border text-sm
     border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900
     hover:bg-gray-100 dark:hover:bg-gray-800`;
    el.draggable = true;
    el.dataset.taskId = task.id;
    el.title = ""; // native tooltip kapalı

    const dot = document.createElement("span");
    dot.className = `inline-block h-2.5 w-2.5 rounded-full bg-${task.color || "indigo"}-500 shrink-0`;
    el.appendChild(dot);

    // --- Tek satır (truncate) metin ---
    const txt = document.createElement("span");
    txt.className = "flex-1 min-w-0 truncate";  // <— tek satır, ‘…’ ile kes
    txt.textContent = task.title;
    el.appendChild(txt);

    // info butonu
    const info = document.createElement("button");
    info.type = "button";
    info.className = "p-1 rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 shrink-0";
    info.innerHTML = `<i class="fa-solid fa-circle-info text-[0.95rem]"></i>`;
    info.title = "Detay";
    info.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); openTaskModal(task); });
    el.appendChild(info);

    // sil butonu
    const del = document.createElement("button");
    del.type = "button";
    del.className = "p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 shrink-0";
    del.innerHTML = `<i class="fa-solid fa-trash text-[0.95rem]"></i>`;
    del.title = "Sil";
    del.addEventListener("click", async (e) => {
        e.stopPropagation(); e.preventDefault();
        if (!confirm("Bu görevi silmek istiyor musun?")) return;
        try { await postDelete(task.id); } catch { alert("Silme sırasında hata oluştu."); return; }
        const idx = Store.tasks.findIndex(t => t.id === task.id);
        if (idx >= 0) Store.tasks.splice(idx, 1);
        renderSidePanels();
        if (document.getElementById("calendarGrid")) renderMonth(viewYear, viewMonthIndex);
        if (document.getElementById("focusColumns")) {
            const modeSel = document.getElementById("focusMode");
            renderFocus(modeSel?.value || "next");
        }
    });
    el.appendChild(del);

    // --- Hover'da popover (layout'u bozmaz) ---
    const pop = document.createElement("div");
    pop.className =
        `hidden group-hover:block absolute left-0 top-full mt-1 z-20 w-64 max-w-[80vw]
     rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 shadow-lg`;
    pop.innerHTML = `
      <div class="flex items-center gap-2 mb-1">
        <span class="inline-block h-2.5 w-2.5 rounded-full bg-${task.color || "indigo"}-500"></span>
        <div class="font-medium">${escapeHtml(task.title || "")}</div>
      </div>
      ${task.notes ? `<div class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">${escapeHtml(task.notes)}</div>` : ""}
  `;
    el.appendChild(pop);

    // drag - ikonlarda sürükleme olmasın
    el.addEventListener("dragstart", (e) => {
        if ((e.target.closest && e.target.closest('button'))) { e.preventDefault(); return; }
        e.dataTransfer.setData("text/plain", String(task.id));
        e.dataTransfer.effectAllowed = "move";
        requestAnimationFrame(() => el.classList.add("opacity-50"));
    });
    el.addEventListener("dragend", () => el.classList.remove("opacity-50"));

    return el;
}

// basit XSS koruması için:
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Side panels ----------
function renderSidePanels() {
    const backlog = document.getElementById("backlogList");
    if (backlog) {
        backlog.innerHTML = "";
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

// ---------- Month view ----------
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
    const todayStr = ymdFromLocalDate(new Date());

    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement("div");
        cell.className = "h-full flex flex-col border border-gray-200 dark:border-gray-800 p-2 relative overflow-hidden";

        if (i < startOffset) {
            cell.classList.add("bg-gray-50", "dark:bg-gray-800/40");
            grid.appendChild(cell);
            continue;
        }

        const day = i - startOffset + 1;
        const dateStr = ymdFromLocalDate(new Date(year, monthIndex0, day));
        cell.dataset.date = dateStr;

        const isToday = (dateStr === todayStr);
        if (isToday) {
            const list = document.createElement("div");
            list.className = "flex-1 mt-1 space-y-2 overflow-y-auto pr-1";
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

        // droppable list
        const list = document.createElement("div");
        list.className = "space-y-2 min-h-16";
        list.addEventListener("dragover", (e) => e.preventDefault());
        list.addEventListener("drop", (e) => {
            e.preventDefault();
            const id = Number(e.dataTransfer.getData("text/plain"));
            const task = Store.tasks.find(t => t.id === id);
            if (!task) return;
            task.scheduledDate = dateStr;    // yerel string
            Store.changed.add(task.id);
            list.appendChild(chip(task));
            renderSidePanels();
        });
        cell.appendChild(list);

        // mevcut görevler
        Store.tasks.filter(t => t.scheduledDate === dateStr)
            .forEach(t => list.appendChild(chip(t)));

        // küçük ekle
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

// ---------- Quick add ----------
function bindQuickAdd() {
    const btn = document.getElementById("quickAdd");
    if (!btn) return;
    btn.addEventListener("click", async () => {
        const titleEl = document.getElementById("quickTitle");
        const scopeEl = document.getElementById("quickScope");
        const colorEl = document.getElementById("quickColor");
        const dateEl = document.getElementById("quickDate");

        const title = (titleEl?.value || "").trim();
        const scope = scopeEl?.value || "day";
        const color = colorEl?.value || COLORS[Store.tasks.length % COLORS.length];
        const date = (dateEl?.value || "") || null;

        if (!title) return;

        const task = await createTask({ title, scope, date, color });
        titleEl.value = "";
        renderSidePanels();
        renderMonth(viewYear, viewMonthIndex);
    });
}

// ---------- Month navigation ----------
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

// ---------- Save (drag ile tarih değişikliklerini yaz) ----------
function bindSave() {
    const btn = document.getElementById("saveChanges");
    if (!btn) return;
    btn.addEventListener("click", async () => {
        const changedIds = [...Store.changed];
        if (!changedIds.length) { alert("Değişiklik yok."); return; }

        const payload = changedIds.map(id => {
            const t = Store.tasks.find(x => x.id === id);
            return {
                id: t?.id ?? 0,
                title: t?.title ?? "",
                notes: t?.notes ?? null,
                scheduledDate: t?.scheduledDate || null,
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

// ---------- Focus (3 gün) ----------
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
            row.innerHTML = `<div class="flex items-center gap-2 min-w-0">
          <span class="inline-block h-2.5 w-2.5 rounded-full bg-${t.color || "indigo"}-500"></span>
          <span class="max-w-[14rem] break-words whitespace-normal">${t.title}</span>
        </div>
        <div class="flex items-center gap-2">
          <button class="p-1 rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30" title="Detay" data-info="${t.id}">
            <i class="fa-solid fa-circle-info text-[0.95rem]"></i>
          </button>
          <button class="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30" title="Sil" data-del="${t.id}">
            <i class="fa-solid fa-trash text-[0.95rem]"></i>
          </button>
        </div>`;
            list.appendChild(row);
        });

        list.addEventListener("click", async (e) => {
            const infoBtn = e.target.closest?.("button[data-info]");
            if (infoBtn) {
                const id = Number(infoBtn.getAttribute("data-info"));
                const task = Store.tasks.find(t => t.id === id);
                if (task) openTaskModal(task);
                return;
            }
            const delBtn = e.target.closest?.("button[data-del]");
            if (delBtn) {
                const id = Number(delBtn.getAttribute("data-del"));
                if (!confirm("Bu görevi silmek istiyor musun?")) return;
                try { await postDelete(id); } catch { alert("Silme sırasında hata oluştu."); return; }
                const idx = Store.tasks.findIndex(t => t.id === id);
                if (idx >= 0) Store.tasks.splice(idx, 1);
                renderFocus(mode);
                renderSidePanels();
            }
        });

        col.querySelector(".addSmall").addEventListener("click", async () => {
            const title = prompt(`${dateStr} için görev:`);
            if (title && title.trim().length) {
                const t = await createTask({ title: title.trim(), scope: "day", date: dateStr, color: "indigo" });
                renderFocus(mode);
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

// ---------- Init ----------
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

    // Modal kapama
    document.getElementById("taskModalClose")?.addEventListener("click", closeTaskModal);
    document.getElementById("taskModalBackdrop")?.addEventListener("click", (e) => {
        if (e.target.id === "taskModalBackdrop") closeTaskModal();
    });
});
