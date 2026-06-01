/* ══════════════════════════════════════════════════════════════════
   AMBI — agenda.js
   1. Lee data/index_config.json  → pinta sección AGENDA del index
   2. Lee data/agenda_config.json → renderiza lightbox de schedule
   Independiente: no sabe nada de bleeds ni de otras secciones.
══════════════════════════════════════════════════════════════════ */

(async function () {

    /* ──────────────────────────────────────────
       1. SECCIÓN AGENDA DEL INDEX
    ────────────────────────────────────────── */
    try {
        const res  = await fetch('data/index_config.json?v=' + Date.now());
        const data = await res.json();

        if (data.juego) document.getElementById('agenda-title').textContent = data.juego;
        if (data.thumb) document.getElementById('agenda-thumb').src = data.thumb;
        if (data.tipo)  document.getElementById('agenda-badge').textContent = data.tipo;

        const descEl = document.getElementById('agenda-desc');
        if (descEl) {
            descEl.textContent    = data.desc || '';
            descEl.style.display  = data.desc ? '' : 'none';
        }

        if (data.dia && data.fecha && data.hora) {
            document.getElementById('agenda-fecha').textContent =
                `${data.dia} ${data.fecha} — ${data.hora}`;
        }

    } catch (e) {
        console.warn('[agenda.js] No se pudo cargar index_config.json', e);
    }

    /* ──────────────────────────────────────────
       2. LIGHTBOX — SCHEDULE
    ────────────────────────────────────────── */

    const lightbox  = document.getElementById('lightbox-agenda');
    const lista     = document.getElementById('lightbox-agenda-list');
    const btnAbrir  = document.getElementById('agenda-btn');
    const btnCerrar = document.querySelector('.lightbox-agenda-close');

    let renderizado = false;

    function abrirLightbox() {
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (!renderizado) renderSchedule();
    }

    function cerrarLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (btnAbrir)  btnAbrir.addEventListener('click',  (e) => { e.preventDefault(); abrirLightbox(); });
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarLightbox);
    if (lightbox)  lightbox.addEventListener('click',  (e) => { if (e.target === lightbox) cerrarLightbox(); });

    async function renderSchedule() {
        try {
            const res   = await fetch('data/agenda_config.json?v=' + Date.now());
            const items = await res.json();

            lista.innerHTML = items.map(item => {
                const esBgExclusivo = item.tipo === 'exclusivo';
                const bgClass       = esBgExclusivo ? 'bg-exclusivo' : 'bg-standard';
                const bgStyle       = (esBgExclusivo && item.bg_url)
                    ? ` style="--bg-url: url('${item.bg_url}')"` : '';

                return `
                <section class="section-twitch-agenda ${bgClass}"${bgStyle}>

                    <!-- CAPA 1: BG -->
                    <div class="section-bg"></div>

                    <!-- CAPA 2: CONTENIDO -->
                    <div class="section-content">
                        <div class="twitch-banner">

                            <div class="twitch-thumb">
                                <img src="${item.imagen}" alt="${item.juego}">
                            </div>

                            <div class="twitch-divider"></div>

                            <div class="twitch-info">
                                <span class="twitch-date">${item.fecha}</span>
                                <h3 class="twitch-game">${item.juego}</h3>
                                <span class="twitch-day">${item.dia} — ${item.hora}</span>
                                <span class="twitch-type">${item.tipo_stream}</span>
                            </div>

                            <div class="twitch-actions">
                                <a href="#" class="twitch-btn primary" data-video="${item.video}">VER TRAILER</a>
                                <a href="https://www.twitch.tv/4mbitv" target="_blank" class="twitch-btn channel">VER CANAL</a>
                            </div>

                        </div>
                    </div>

                    <!-- CAPA 3: BLEEDS -->
                    <div class="section-bleeds"></div>

                </section>`;
            }).join('');


            renderizado = true;

        } catch (e) {
            console.warn('[agenda.js] No se pudo cargar agenda_config.json', e);
        }
    }

})();

window.addEventListener('scroll', function () {
    const below = document.getElementById('sections-below');
    if (window.scrollY > 10) {
        below.classList.add('scrolled');
    } else {
        below.classList.remove('scrolled');
    }
}, { passive: true });