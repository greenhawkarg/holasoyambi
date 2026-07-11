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
                <div class="agenda-grid-card ${bgClass}"${bgStyle}>

                    <!-- CAPA DE FONDO (solo visible en tipo exclusivo) -->
                    <div class="section-bg"></div>

                    <!-- IMAGEN + FECHA COMO CHIP FLOTANDO -->
                    <div class="agenda-grid-imgwrap">
                        <img src="${item.imagen}" alt="${item.juego}">
                        <span class="agenda-grid-date">${item.fecha}</span>
                    </div>

                    <!-- TÍTULO / DÍA-HORA / CATEGORÍAS / BOTÓN -->
                    <div class="agenda-grid-body">
                        <h3 class="agenda-grid-title">${item.juego}</h3>
                        <span class="agenda-grid-daytime">${item.dia} — ${item.hora}</span>
                        ${item.tipo_stream ? `<span class="agenda-grid-tags">${item.tipo_stream}</span>` : ''}
                        <a href="#" class="agenda-grid-btn" data-video="${item.video}">▶ TRAILER</a>
                    </div>

                </div>`;
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