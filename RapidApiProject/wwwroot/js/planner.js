// wwwroot/js/planner.js

// ------- Basit in-memory store (sonra SQL ile değiştirilecek) -------
const Store = {
    tasks: [
        { id: 1, title: "Raporu bitir", notes: "", scheduledDate: null, scope: "backlog", done: false, color: "indigo" },
        { id: 2, title: "Spor", notes: "", scheduledDate: null, scope: "day", done: false, color: "emerald" },
        { id: 3, title: "Alışveriş", notes: "", scheduledDate: null, scope: "week", done: false, color: "rose" },
    ],
    goals: [
        { id: 11, title: "3 kitap oku", scope: "month", completed: false },
        { id: 12, title: "React öğren", scope: "year", completed: false },
    ],
    changed: new Set(), // değişen task id'leri
};

// ------- Yardımcılar -------
const fmtDate = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD
const parseYmd = (s) => new Date(s + "T00:00:00");

// ------- Chip oluşturucu -------
function chip(task) {
    const el = document.createElement("div");
    el.className =
        `task-chip select-none inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm cursor-grab
     border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900
     hover:bg-gray-100 dark:hover:bg-gray-800`;
    el.draggable = true;
    el.dataset.taskId = task.id;

    // renk rozet
    const dot = document.createElement("span");
    dot.className = `inline-block h-2.5 w-2.5 rounded-full bg-${task.color || "indigo"}-500`;
    el.appendChild(dot);

    const txt = document.createElement("span");
    txt.textContent = task.title;
    el.appendChild(txt);

    // drag
    el.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", String(task.id));
        e.dataTransfer.effectAllowed = "move";
        setTimeout(() => el.classList.add("opacity-50"), 0);
    });
    el.addEventListener("dragend", () => el.classList.remove("opacity-50"));

    return el;
}

// ------- Backlog/Plan/Goals doldur -------
function renderSidePanels(today) {
    const backlog = document.getElementById("backlogList");
    if (backlog) {
        backlog.innerHTML = "";
        Store.tasks.filter(t => !t.scheduledDate && t.scope !== "year" && t.scope !== "month")
            .forEach(t => backlog.appendChild(chip(t)));
    }

    const dayPlan = document.getElementById("dayPlan");
    if (dayPlan) {
        dayPlan.innerHTML = "";
        Store.tasks.filter(t => t.scope === "day" && !t.scheduledDate)
            .forEach(t => {
                const li = document.createElement("li");
                li.appendChild(chip(t));
                dayPlan.appendChild(li);
            });
    }

    const weekPlan = document.getElementById("weekPlan");
    if (weekPlan) {
        weekPlan.innerHTML = "";
        Store.tasks.filter(t => t.scope === "week" && !t.scheduledDate)
            .forEach(t => {
                const li = document.createElement("li");
                li.appendChild(chip(t));
                weekPlan.appendChild(li);
            });
    }

    const monthGoals = document.getElementById("monthGoals");
    if (monthGoals) {
        monthGoals.innerHTML = "";
        Store.goals.filter(g => g.scope === "month").forEach(g => {
            const li = document.createElement("li");
            li.className = "flex items-center justify-between";
            li.innerHTML = `<span>${g.title}</span>
        <input type="checkbox" ${g.completed ? "checked" : ""} class="h-4 w-4">`;
            monthGoals.appendChild(li);
        });
    }

    const yearGoals = document.getElementById("yearGoals");
    if (yearGoals) {
        yearGoals.innerHTML = "";
        Store.goals.filter(g => g.scope === "year").forEach(g => {
            const li = document.createElement("li");
            li.className = "flex items-center justify-between";
            li.innerHTML = `<span>${g.title}</span>
        <input type="checkbox" ${g.completed ? "checked" : ""} class="h-4 w-4">`;
            yearGoals.appendChild(li);
        });
    }
}

// ------- Ay takvimi -------
let viewYear, viewMonth; // 0-based month

function renderMonth(year, month) {
    viewYear = year; viewMonth = month;
    const monthTitle = document.getElementById("monthTitle");
    const grid = document.getElementById("calendarGrid");
    if (!grid) return;

    const names = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    monthTitle && (monthTitle.textContent = `${names[month]} ${year}`);

    grid.innerHTML = "";

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startOffset = (first.getDay() + 6) % 7; // Pazartesi=0
    const totalCells = startOffset + last.getDate();
    const todayStr = fmtDate(new Date());

    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement("div");
        cell.className = "border border-gray-200 dark:border-gray-800 p-2 relative";
        if (i < startOffset) {
            cell.classList.add("bg-gray-50", "dark:bg-gray-800/40");
            grid.appendChild(cell);
            continue;
        }
        const day = i - startOffset + 1;
        const dateStr = fmtDate(new Date(year, month, day));
        cell.dataset.date = dateStr;

        // başlık
        const head = document.createElement("div");
        head.className = "flex items-center justify-between mb-2";
        head.innerHTML = `
      <div class="text-xs font-semibold ${dateStr === todayStr ? 'text-indigo-600' : 'text-gray-500 dark:text-gray-400'}">
        ${day}
      </div>
      <button class="addSmall text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">Ekle</button>
    `;
        cell.appendChild(head);

        // liste
        const list = document.createElement("div");
        list.className = "space-y-2 min-h-16";
        list.addEventListener("dragover", (e) => e.preventDefault());
        list.addEventListener("drop", (e) => {
            e.preventDefault();
            const id = Number(e.dataTransfer.getData("text/plain"));
            const task = Store.tasks.find(t => t.id === id);
            if (!task) return;
            task.scheduledDate = dateStr;
            Store.changed.add(task.id);
            list.appendChild(chip(task));
        });
        cell.appendChild(list);

        // o güne atanmış görevleri bas
        Store.tasks.filter(t => t.scheduledDate === dateStr).forEach(t => list.appendChild(chip(t)));

        // küçük ekle butonu
        head.querySelector(".addSmall").addEventListener("click", () => {
            const title = prompt(`${dateStr} için görev:`);
            if (title && title.trim().length) {
                const id = (Math.max(0, ...Store.tasks.map(x => x.id)) + 1);
                Store.tasks.push({ id, title: title.trim(), notes: "", scheduledDate: dateStr, scope: "day", done: false, color: "indigo" });
                Store.changed.add(id);
                list.appendChild(chip(Store.tasks.find(t => t.id === id)));
            }
        });

        grid.appendChild(cell);
    }
}

// ------- Hızlı Ekle -------
function bindQuickAdd() {
    const btn = document.getElementById("quickAdd");
    if (!btn) return;
    btn.addEventListener("click", () => {
        const title = document.getElementById("quickTitle").value.trim();
        const scope = document.getElementById("quickScope").value;
        const date = document.getElementById("quickDate").value || null;
        if (!title) return;

        const id = (Math.max(0, ...Store.tasks.map(x => x.id)) + 1);
        Store.tasks.push({ id, title, notes: "", scheduledDate: date, scope, done: false, color: "indigo" });
        Store.changed.add(id);

        document.getElementById("quickTitle").value = "";
        if (scope === "backlog" || !date) renderSidePanels(new Date());
        renderMonth(viewYear, viewMonth);
    });
}

// ------- Ay navigasyonu -------
function bindMonthNav() {
    const prev = document.getElementById("prevMonth");
    const next = document.getElementById("nextMonth");
    const todayBtn = document.getElementById("todayBtn");
    prev?.addEventListener("click", () => {
        const d = new Date(viewYear, viewMonth - 1, 1);
        renderMonth(d.getFullYear(), d.getMonth());
    });
    next?.addEventListener("click", () => {
        const d = new Date(viewYear, viewMonth + 1, 1);
        renderMonth(d.getFullYear(), d.getMonth());
    });
    todayBtn?.addEventListener("click", () => {
        const d = new Date();
        renderMonth(d.getFullYear(), d.getMonth());
    });
}

// ------- Kaydet (stub) -------
function bindSave() {
    const btn = document.getElementById("saveChanges");
    if (!btn) return;
    btn.addEventListener("click", async () => {
        const changed = [...Store.changed].map(id => Store.tasks.find(t => t.id === id));
        // Burada backend'e POST edeceğiz (sonra SQL'e yazarsın)
        // fetch('/Planner/Save', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(changed) })
        //   .then(r=>r.ok && (Store.changed.clear(), alert('Kaydedildi')));
        console.log("Kaydedilecek (stub):", changed);
        alert("(Şimdilik stub) Değişiklikler konsola yazıldı.");
        Store.changed.clear();
    });
}

// ------- 3 Gün Odak -------
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
        const dateStr = fmtDate(d);
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
          <span>${t.title}</span>
        </div>
        <input type="checkbox" ${t.done ? "checked" : ""} class="h-4 w-4">`;
            list.appendChild(row);
        });

        col.querySelector(".addSmall").addEventListener("click", () => {
            const title = prompt(`${dateStr} için görev:`);
            if (title && title.trim().length) {
                const id = (Math.max(0, ...Store.tasks.map(x => x.id)) + 1);
                Store.tasks.push({ id, title: title.trim(), notes: "", scheduledDate: dateStr, scope: "day", done: false, color: "indigo" });
                Store.changed.add(id);
                renderFocus(mode);
            }
        });

        wrap.appendChild(col);
    });

    const modeSel = document.getElementById("focusMode");
    if (modeSel) {
        modeSel.value = mode;
        modeSel.onchange = () => renderFocus(modeSel.value);
    }
}

// ------- Init -------
document.addEventListener("DOMContentLoaded", () => {
    // Ay sayfası
    const now = new Date();
    if (document.getElementById("calendarGrid")) {
        renderSidePanels(now);
        renderMonth(now.getFullYear(), now.getMonth());
        bindQuickAdd();
        bindMonthNav();
        bindSave();
    }

    // 3 gün odak sayfası
    if (document.getElementById("focusColumns")) {
        renderFocus("next");
    }
});
