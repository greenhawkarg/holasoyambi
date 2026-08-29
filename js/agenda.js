/* ══════════════════════════════════════════════════════════════════
   AMBI — agenda.js (v2)
   1. Lee data/agenda_destacado.json → pinta sección AGENDA del index
      (banner de "próximo evento destacado" debajo del HERO)
   2. Lee data/agenda_config.json    → renderiza lightbox de schedule
      (sin cambios respecto a la versión anterior)
   Independiente: no sabe nada de bleeds ni de otras secciones.

   CAMBIO DE ESTA VUELTA: el punto 1 antes leía data/index_config.json
   (fuente vieja, desconectada del panel nuevo de Agenda Destacado).
   Ahora lee data/agenda_destacado.json, que es el archivo que escribe
   el módulo "Agenda > Destacado" del panel. Los nombres de campo son
   distintos entre ambos JSON, por eso cambia también el mapeo de abajo
   (titulo en vez de juego, descripcion en vez de desc, etc.).
══════════════════════════════════════════════════════════════════ */

(async function () {

    /* ──────────────────────────────────────────
       Helpers de fecha — mismo criterio que usa
       agenda_panel.js del lado del panel, con
       nombres propios para no chocar con nada
       de otros scripts del sitio.
    ────────────────────────────────────────── */
    const AGENDA_DESTACADO_DIAS = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
    const AGENDA_DESTACADO_MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
                                     "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

    // Recibe una fecha ISO ("2026-09-08") y devuelve "MARTES 8 DE SEPTIEMBRE"
    function formatearFechaDestacado(isoDate) {
        if (!isoDate) return "";
        const d = new Date(isoDate + "T00:00:00");
        if (isNaN(d.getTime())) return "";
        const dia = AGENDA_DESTACADO_DIAS[d.getDay()];
        const mes = AGENDA_DESTACADO_MESES[d.getMonth()];
        return `${dia} ${d.getDate()} DE ${mes}`;
    }

    /* ──────────────────────────────────────────
       1. SECCIÓN AGENDA DEL INDEX (banner destacado)
    ────────────────────────────────────────── */
    try {
        const res  = await fetch('data/agenda_destacado.json?v=' + Date.now());
        const data = await res.json();

        if (data.titulo) {
            const titleEl = document.getElementById('agenda-title');
            if (titleEl) titleEl.textContent = data.titulo;
        }

        if (data.tipo) {
            const badgeEl = document.getElementById('agenda-badge');
            if (badgeEl) badgeEl.textContent = data.tipo;
        }

        // Imagen del thumb: usamos la ruta real guardada por el panel
        // (thumb_path, con la extensión que corresponda), no un nombre
        // fijo adivinado -- así evitamos el bug de extensión incorrecta.
        const thumbEl = document.getElementById('agenda-thumb');
        if (thumbEl && data.thumb_path) {
            thumbEl.src = data.thumb_path + '?v=' + Date.now(); // cache-buster
        }

        const descEl = document.getElementById('agenda-desc');
        if (descEl) {
            descEl.textContent   = data.descripcion || '';
            descEl.style.display = data.descripcion ? '' : 'none';
        }

        const fechaEl = document.getElementById('agenda-fecha');
        if (fechaEl && data.fecha && data.hora) {
            fechaEl.textContent = `${formatearFechaDestacado(data.fecha)} — ${data.hora}`;
        }

    } catch (e) {
        console.warn('[agenda.js] No se pudo cargar agenda_destacado.json', e);
    }

    /* ──────────────────────────────────────────
       2. LIGHTBOX — SCHEDULE (sin cambios)
    ────────────────────────────────────────── */

    const lightbox    = document.getElementById('lightbox-agenda');
    const lista       = document.getElementById('lightbox-agenda-list');
    const btnNavAgenda = document.getElementById('nav-agenda-link');
    const btnCerrar   = document.querySelector('.lightbox-agenda-close');

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

    if (btnNavAgenda) btnNavAgenda.addEventListener('click', (e) => { e.preventDefault(); abrirLightbox(); });
    if (btnCerrar)    btnCerrar.addEventListener('click', cerrarLightbox);
    if (lightbox)     lightbox.addEventListener('click',  (e) => { if (e.target === lightbox) cerrarLightbox(); });

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
