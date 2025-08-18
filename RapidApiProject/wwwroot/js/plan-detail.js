(function () {
    // ----- Kronometre -----
    const elTime = document.getElementById('swTime');
    const btnStart = document.getElementById('swStart');
    const btnPause = document.getElementById('swPause');
    const btnReset = document.getElementById('swReset');

    let swStartAt = 0;
    let swElapsed = 0;
    let swTick = null;

    function fmt(ms) {
        const t = Math.max(0, ms | 0);
        const m = Math.floor(t / 60000);
        const s = Math.floor((t % 60000) / 1000);
        const d = Math.floor((t % 1000) / 100);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${d}`;
    }

    function render() {
        elTime && (elTime.textContent = fmt(swElapsed));
    }

    function start() {
        if (swTick) return;
        swStartAt = performance.now() - swElapsed;
        swTick = setInterval(() => {
            swElapsed = performance.now() - swStartAt;
            render();
        }, 100);
    }

    function pause() {
        if (!swTick) return;
        clearInterval(swTick); swTick = null;
        swElapsed = performance.now() - swStartAt;
        render();
    }

    function reset() {
        clearInterval(swTick); swTick = null;
        swElapsed = 0; swStartAt = 0;
        render();
    }

    btnStart?.addEventListener('click', start);
    btnPause?.addEventListener('click', pause);
    btnReset?.addEventListener('click', reset);
    render();

    // ----- Global hızlı dinlenme -----
    const restQuickBtns = document.querySelectorAll('.rest-quick');
    const restLabel = document.getElementById('restCountdown');
    let restTimer = null, restLeft = 0;

    function restTick() {
        if (restLeft <= 0) {
            clearInterval(restTimer); restTimer = null;
            if (restLabel) restLabel.textContent = "";
            return;
        }
        restLeft--;
        if (restLabel) restLabel.textContent = `${restLeft}s`;
    }

    restQuickBtns.forEach(b => {
        b.addEventListener('click', () => {
            const sec = parseInt(b.dataset.sec || "0", 10) || 0;
            if (!sec) return;
            clearInterval(restTimer);
            restLeft = sec;
            restTick();
            restTimer = setInterval(restTick, 1000);
        });
    });

    // ----- Her kartta dinlenme sayacı -----
    document.querySelectorAll('.rest-btn').forEach(btn => {
        let timer = null, left = 0, orig = btn.textContent;

        function tick() {
            if (left <= 0) { clearInterval(timer); timer = null; btn.textContent = orig; btn.disabled = false; return; }
            left--; btn.textContent = `Dinlen (${left}s)`;
        }

        btn.addEventListener('click', () => {
            const sec = parseInt(btn.dataset.sec || "0", 10) || 60;
            clearInterval(timer);
            left = sec;
            btn.disabled = true;
            btn.textContent = `Dinlen (${left}s)`;
            timer = setInterval(tick, 1000);
        });
    });

    // ----- Tamamlandı işaretleme (görsel) -----
    document.querySelectorAll('.done-checkbox').forEach(ch => {
        ch.addEventListener('change', () => {
            const card = ch.closest('article');
            if (!card) return;
            if (ch.checked) {
                card.classList.add('opacity-70');
                card.classList.add('ring-2', 'ring-emerald-300');
            } else {
                card.classList.remove('opacity-70');
                card.classList.remove('ring-2', 'ring-emerald-300');
            }
        });
    });

})();
