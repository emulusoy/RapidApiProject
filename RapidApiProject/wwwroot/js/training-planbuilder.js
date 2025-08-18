(function () {
    const qs = (s, r = document) => r.querySelector(s);

    const URLS = (window.PlanCfg && window.PlanCfg.urls) || {};
    const DEFAULT_TAKE = 200;

    const q = qs('#q'), region = qs('#region'), btnSearch = qs('#btnSearch');
    const res = qs('#results'), selected = qs('#selected'), title = qs('#planTitle'), btnSave = qs('#btnSave');
    const selCount = qs('#selCount');

    let results = [];
    let picks = [];

    // --- Arama ---
    async function search() {
        try {
            const url = new URL(URLS.search, location.origin);
            const term = (q?.value || "").trim();
            const reg = (region?.value || "").trim();
            if (term) url.searchParams.set('q', term);
            if (reg) url.searchParams.set('region', reg);
            url.searchParams.set('take', String(DEFAULT_TAKE));

            res.innerHTML = `<li class="py-3 text-sm text-gray-500 dark:text-gray-400">Yükleniyor…</li>`;

            const r = await fetch(url, { credentials: 'same-origin' });
            const data = await r.json().catch(() => null);

            if (!r.ok || !data || (data.ok === false)) {
                const msg = (data && data.message) ? data.message : `HTTP ${r.status}`;
                throw new Error(msg);
            }

            // hem dizi (eski sürüm) hem {ok,items} (yeni) desteklenir
            results = Array.isArray(data) ? data : (data.items || []);
            renderResults();
        } catch (err) {
            console.error("[planbuilder] search error:", err);
            res.innerHTML = `<li class="py-3 text-sm text-rose-600">Arama hatası: ${err?.message || ''}</li>`;
        }
    }

    function renderResults() {
        res.innerHTML = "";
        if (!results.length) {
            res.innerHTML = `<li class="py-3 text-sm text-gray-500 dark:text-gray-400">Sonuç yok.</li>`;
            return;
        }
        results.forEach(x => {
            const li = document.createElement('li');
            li.className = "rounded-xl border border-gray-200 dark:border-gray-800 p-3 flex items-center gap-3";
            li.innerHTML = `
        <img src="${x.img || 'https://via.placeholder.com/800x600?text=Exercise'}"
             class="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover border border-gray-200 dark:border-gray-800" alt="${x.name}">
        <div class="min-w-0 flex-1">
          <div class="font-medium truncate">${x.name}</div>
          <div class="text-xs opacity-70 truncate">${x.cat || ''} · ${x.mech || ''} · ${x.eq || ''} · ${x.diff || ''}</div>
        </div>
        <button class="add px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">Ekle</button>
      `;
            li.querySelector('.add').addEventListener('click', () => addPick(x));
            res.appendChild(li);
        });
    }

    function addPick(x) {
        if (picks.some(p => p.id === x.id)) {
            const row = selected.querySelector(`[data-id="${x.id}"]`);
            if (row) { row.classList.add('ring-2', 'ring-indigo-300'); setTimeout(() => row.classList.remove('ring-2', 'ring-indigo-300'), 600); }
            return;
        }
        picks.push({ id: x.id, name: x.name, img: x.img, cat: x.cat, sets: "", reps: "", restSec: "", sort: picks.length });
        renderPicks();
    }

    function renderPicks() {
        selected.innerHTML = "";
        if (!picks.length) {
            selected.innerHTML = `<li class="text-sm text-gray-500 dark:text-gray-400">Henüz egzersiz eklenmedi.</li>`;
            selCount && (selCount.textContent = "0");
            return;
        }
        selCount && (selCount.textContent = String(picks.length));

        picks.forEach((p, idx) => {
            const li = document.createElement('li');
            li.dataset.id = p.id;
            li.className = "group rounded-xl border border-gray-200 dark:border-gray-800 p-3";
            li.innerHTML = `
        <div class="flex items-start gap-3">
          <img src="${p.img || 'https://via.placeholder.com/800x600?text=Exercise'}"
               class="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-800" alt="${p.name}">
          <div class="min-w-0 flex-1">
            <div class="font-medium truncate">${p.name}</div>
            <div class="text-xs opacity-70">${p.cat || ''}</div>

            <div class="mt-2 grid grid-cols-3 gap-2">
              <div>
                <label class="text-xs opacity-70">Set</label>
                <input type="number" min="0" class="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800"
                       value="${p.sets || ""}" data-field="sets">
              </div>
              <div>
                <label class="text-xs opacity-70">Tekrar</label>
                <input type="text" class="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800"
                       placeholder="8-10" value="${p.reps || ""}" data-field="reps">
              </div>
              <div>
                <label class="text-xs opacity-70">Dinlen (sn)</label>
                <input type="number" min="0" class="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800"
                       value="${p.restSec || ""}" data-field="restSec">
              </div>
            </div>
          </div>

          <div class="flex flex-col items-stretch gap-1">
            <button class="up h-8 w-8 rounded-lg border border-gray-200 dark:border-gray-800" title="Yukarı">▲</button>
            <button class="down h-8 w-8 rounded-lg border border-gray-200 dark:border-gray-800" title="Aşağı">▼</button>
            <button class="del h-8 w-8 rounded-lg border border-rose-200 text-rose-600 dark:border-rose-900/60" title="Sil">🗑</button>
          </div>
        </div>
      `;

            li.querySelectorAll('input[data-field]').forEach(inp => {
                inp.addEventListener('input', () => {
                    const f = inp.getAttribute('data-field');
                    if (f === 'sets' || f === 'restSec') {
                        const v = inp.value ? parseInt(inp.value, 10) : null;
                        p[f] = isNaN(v) ? null : v;
                    } else {
                        p[f] = inp.value;
                    }
                });
            });

            li.querySelector('.up').addEventListener('click', () => movePick(idx, -1));
            li.querySelector('.down').addEventListener('click', () => movePick(idx, +1));
            li.querySelector('.del').addEventListener('click', () => { picks.splice(idx, 1); renderPicks(); });

            selected.appendChild(li);
        });
    }

    function movePick(index, delta) {
        const j = index + delta;
        if (j < 0 || j >= picks.length) return;
        const tmp = picks[index];
        picks[index] = picks[j];
        picks[j] = tmp;
        renderPicks();
    }

    // --- Kaydet ---
    async function savePlan() {
        const t = (title?.value || "").trim();
        if (!t) { alert("Lütfen plan başlığı girin."); return; }
        if (!picks.length) { alert("En az bir egzersiz ekleyin."); return; }

        picks.forEach((p, i) => p.sort = i);

        try {
            const fd = new FormData();
            fd.set('title', t);
            fd.set('itemsJson', JSON.stringify(picks.map(p => ({
                exerciseId: p.id,
                sets: p.sets || null,
                reps: p.reps || null,
                restSec: p.restSec || null,
                sort: p.sort
            }))));

            const r = await fetch(URLS.save, { method: 'POST', body: fd, credentials: 'same-origin' });
            const data = await r.json().catch(() => null);
            if (!r.ok || !data || data.ok === false) {
                const msg = (data && data.message) ? data.message : `HTTP ${r.status}`;
                throw new Error(msg);
            }
            alert("Plan kaydedildi!");
            if (data.redirect) location.href = data.redirect;
        } catch (err) {
            alert("Kaydetme hatası: " + (err?.message || ""));
        }
    }

    // events
    btnSearch?.addEventListener('click', search);
    q?.addEventListener('keydown', e => { if (e.key === 'Enter') search(); });
    btnSave?.addEventListener('click', savePlan);

    // İlk açılışta otomatik ara
    document.addEventListener('DOMContentLoaded', () => {
        if (region) region.value = "";
        if (q) q.value = "";
        search();
    });
})();
