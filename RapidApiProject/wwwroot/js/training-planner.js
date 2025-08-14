(function () {
    const qs = (s, r = document) => r.querySelector(s);
    const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

    // ---- Config (Razor'dan gelen) ----
    const CFG = window.TrainingCfg || { programId: 0, urls: {} };
    const URLS = CFG.urls || {};
    const programId = CFG.programId || 0;

    // Hızlı guard
    if (!URLS.search || !URLS.add || !URLS.remove || !URLS.apply) {
        console.error("[planner] URL config eksik:", URLS);
    }

    // ---- Arama UI ----
    const q = qs('#q');
    const region = qs('#region');
    const btn = qs('#btnSearch');
    const res = qs('#results');

    let lastResults = [];

    async function search() {
        try {
            const url = new URL(URLS.search, window.location.origin);
            const term = (q?.value || "").trim();
            const reg = (region?.value || "").trim();
            if (term) url.searchParams.set('q', term);
            if (reg) url.searchParams.set('region', reg);

            const r = await fetch(url, { credentials: 'same-origin' });
            if (!r.ok) throw new Error("HTTP " + r.status);
            lastResults = await r.json();
            renderResults();
        } catch (err) {
            console.error("[planner] search error:", err);
            if (res) res.innerHTML = `<li class="py-3 text-sm text-rose-600">Arama hatası.</li>`;
        }
    }

    function renderResults() {
        if (!res) return;
        res.innerHTML = '';
        if (!lastResults.length) {
            res.innerHTML = `<li class="py-3 text-sm text-gray-500 dark:text-gray-400">Sonuç yok.</li>`;
            return;
        }

        // sayfadaki gün id'leri (listeye ek butonları için)
        const dayIds = qsa('ul[id^="day-"]').map(ul => +ul.id.replace('day-', ''));

        lastResults.forEach(x => {
            const li = document.createElement('li');
            li.className = "py-2 flex items-center justify-between gap-2";
            li.innerHTML = `
        <div class="min-w-0">
          <div class="font-medium truncate">${x.name}</div>
          <div class="text-xs opacity-70">${x.cat} · ${x.mech} · ${x.eq} · ${x.diff}</div>
        </div>
        <div class="flex items-center gap-1">
          ${dayIds.map(id => `
            <button class="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 text-xs"
                    data-act="add" data-day="${id}" data-ex="${x.id}">Ekle</button>
          `).join('')}
        </div>`;
            res.appendChild(li);
        });
    }

    // Eventler
    btn?.addEventListener('click', search);
    q?.addEventListener('keydown', e => { if (e.key === 'Enter') search(); });

    // Sonuç listesindeki "Ekle" butonları (event delegation)
    res?.addEventListener('click', e => {
        const b = e.target.closest('button[data-act="add"]');
        if (!b) return;
        addToDay(+b.dataset.day, +b.dataset.ex);
    });

    // Gün kartındaki "Bu güne ekle" kısa yolu
    qsa('.add-here').forEach(b => {
        b.addEventListener('click', () => {
            if (!lastResults.length) { alert('Önce soldan egzersiz ara/seç.'); return; }
            addToDay(+b.dataset.day, +lastResults[0].id);
        });
    });

    // Sil butonları
    qsa('button.del').forEach(b => {
        b.addEventListener('click', async () => {
            if (!confirm('Silinsin mi?')) return;
            const id = +b.dataset.id;
            try {
                const fd = new FormData(); fd.set('id', id);
                const r = await fetch(URLS.remove, { method: 'POST', body: fd, credentials: 'same-origin' });
                if (!r.ok) throw 0;
                location.reload();
            } catch {
                alert('Silme hatası');
            }
        });
    });

    // Şablon uygula
    qsa('button.tpl').forEach(b => {
        b.addEventListener('click', async () => {
            if (!confirm('Bu haftaya şablon eklensin mi? (var olanın üstüne ekler)')) return;
            try {
                const fd = new FormData();
                fd.set('programId', String(programId));
                fd.set('template', b.dataset.tpl || '');
                const r = await fetch(URLS.apply, { method: 'POST', body: fd, credentials: 'same-origin' });
                if (!r.ok) throw 0;
                location.reload();
            } catch {
                alert('Şablon hatası');
            }
        });
    });

    // Ekleme
    async function addToDay(dayId, exerciseId) {
        try {
            const sets = prompt('Set sayısı? (boş geçilebilir)') || '';
            const reps = prompt('Tekrar? (örn: 8-10)') || '';
            const rest = prompt('Dinlenme (sn)?') || '';

            const fd = new FormData();
            fd.set('dayId', String(dayId));
            fd.set('exerciseId', String(exerciseId));
            if (sets) fd.set('sets', sets);
            if (reps) fd.set('reps', reps);
            if (rest) fd.set('restSec', rest);

            const r = await fetch(URLS.add, { method: 'POST', body: fd, credentials: 'same-origin' });
            if (!r.ok) throw 0;
            location.reload();
        } catch {
            alert('Ekleme hatası');
        }
    }

})();
