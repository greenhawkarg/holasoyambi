/* ══════════════════════════════════════════════════════════════════
   AMBI — agenda.js (v4)
   1. Lee data/agenda_destacado.json → pinta sección AGENDA del index
      (banner de "próximo evento destacado" debajo del HERO)
   2. Lee data/agenda_config.json    → renderiza lightbox de schedule
      (ahora con botón DESAFÍO condicional -- ver v4 más abajo)
   Independiente: no sabe nada de bleeds ni de otras secciones.

   CAMBIOS v3:
   - badge_color: si viene seteado desde el panel, se aplica como
     background-color del badge (#agenda-badge). Si viene vacío, NO se
     toca el style -> queda el color que ya define el CSS del sitio
     por default (no forzamos nada si el usuario no eligió uno).
   - btn_texto / btn_link: el botón "VER DROPS" ahora es editable desde
     el panel -- antes el texto y el href estaban fijos en el HTML.

   CAMBIOS v4:
   - Nuevo botón DESAFÍO en cada card del lightbox de agenda, pero
     SOLO cuando el evento trae un objeto "desafio" en agenda_config.json.
     Si el evento no tiene ese campo, la card queda exactamente igual
     que antes (un solo botón TRAILER, ancho completo).
   - Cuando hay desafío, la fila de botones se parte 50/50 (TRAILER +
     DESAFÍO) en vez de agrandar la card -- el layout del grid no se
     mueve.
   - El objeto "desafio" completo se manda como JSON en un data-attribute
     del botón (data-desafio), para que lb-agenda.js (script aparte, que
     no comparte scope con este archivo) pueda leerlo y abrir su propio
     modal sin tener que volver a pedir el JSON.
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

        const badgeEl = document.getElementById('agenda-badge');
        if (badgeEl) {
            if (data.tipo) badgeEl.textContent = data.tipo;
            // Solo se pisa el color de fondo si el panel guardó uno --
            // si "badge_color" viene vacío, se deja el color que ya
            // trae el CSS del sitio por default (no forzar nada acá).
            if (data.badge_color) {
                badgeEl.style.backgroundColor = data.badge_color;
            }
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

        // Botón: texto y link editables desde el panel (antes fijos en
        // el HTML del sitio como "VER DROPS" -> drop/hunt-drops.html).
        // Si no hay link cargado (btn_link vacío), el botón no debe
        // navegar a ningún lado -- en su lugar muestra un aviso de que
        // todavía no está disponible, y no depende de que quede pegado
        // el link viejo (bug ya corregido del lado del panel).
        const btnEl = document.getElementById('agenda-btn');
        if (btnEl) {
            if (data.btn_texto) btnEl.textContent = data.btn_texto;

            if (data.btn_link) {
                btnEl.setAttribute('href', data.btn_link);
            } else {
                btnEl.setAttribute('href', '#');
                btnEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    alert('PRÓXIMAMENTE');
                });
            }
        }

    } catch (e) {
        console.warn('[agenda.js] No se pudo cargar agenda_destacado.json', e);
    }

    /* ──────────────────────────────────────────
       2. LIGHTBOX — SCHEDULE
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

                /* ── BOTÓN(ES) DE LA CARD ──
                   Si el evento tiene un objeto "desafio" en el JSON, la fila
                   de botones se parte en dos (TRAILER + DESAFÍO). Si no lo
                   tiene, queda el botón TRAILER solo, ancho completo, igual
                   que antes -- así los eventos sin drop/desafío no cambian
                   en nada. */
                const tieneDesafio = !!item.desafio;

                /* Ya no se manda el desafío como JSON en un data-attribute:
                   el contenido se renderiza directo dentro del imgwrap (ver
                   más abajo) y lb-agenda.js solo togglea la visibilidad --
                   no necesita volver a leer el objeto. */
                const esPrensa = tieneDesafio && item.desafio.origen === 'prensa';
                const desafioBtnLabel = esPrensa ? '📣 PRENSA' : '⚔️ DESAFÍO';

                const botones = tieneDesafio
                    ? `<div class="agenda-grid-btns">
                           <a href="#" class="agenda-grid-btn agenda-grid-btn--split" data-video="${item.video}">▶ TRAILER</a>
                           <a href="#" class="agenda-grid-btn-desafio" data-desafio-origen="${item.desafio.origen || 'dare_drop'}">${desafioBtnLabel}</a>
                       </div>`
                    : `<a href="#" class="agenda-grid-btn" data-video="${item.video}">▶ TRAILER</a>`;

                /* Dos capas separadas -- la de fondo (color sólido +
                   marca de agua) y la de texto (título/descripción) no
                   comparten contenedor, así el logo nunca puede verse
                   afectado por el layout flex del texto. Solo se
                   renderiza la traducción en español (titulo_es/
                   descripcion_es) -- el inglés original queda en el
                   JSON como referencia, no se muestra en el sitio. */
                const desafioLogo = item.desafio && item.desafio.origen === 'prensa'
                    ? 'imgs/index/agenda/prensa.png'
                    : 'imgs/index/agenda/daredrop_logo.webp';

                const desafioBg = tieneDesafio
                    ? `<div class="agenda-grid-desafio-bg">
                           <img class="agenda-grid-desafio-watermark" src="${desafioLogo}" alt="">
                       </div>`
                    : '';

                const desafioBadge = (tieneDesafio && item.desafio.dificultad)
                    ? `<span class="agenda-grid-desafio-badge" data-dificultad="${item.desafio.dificultad}">${item.desafio.dificultad}</span>`
                    : '';

                const desafioContent = tieneDesafio
                    ? `<div class="agenda-grid-desafio-content">
                           ${desafioBadge}
                           <h4 class="agenda-grid-desafio-titulo">${item.desafio.titulo_es || item.desafio.titulo || ''}</h4>
                           <p class="agenda-grid-desafio-desc">${item.desafio.descripcion_es || item.desafio.descripcion || ''}</p>
                       </div>`
                    : '';

                return `
                <div class="agenda-grid-card ${bgClass}"${bgStyle}>

                    <!-- CAPA DE FONDO (solo visible en tipo exclusivo) -->
                    <div class="section-bg"></div>

                    <!-- IMAGEN + FECHA COMO CHIP FLOTANDO -->
                    <div class="agenda-grid-imgwrap">
                        <img src="${item.imagen}" alt="${item.juego}">
                        <span class="agenda-grid-date">${item.fecha}</span>
                        ${desafioBg}
                        ${desafioContent}
                    </div>

                    <!-- TÍTULO / DÍA-HORA / CATEGORÍAS / BOTÓN(ES) -->
                    <div class="agenda-grid-body">
                        <h3 class="agenda-grid-title">${item.juego}</h3>
                        <span class="agenda-grid-daytime">${item.dia} — ${item.hora}</span>
                        ${item.tipo_stream ? `<span class="agenda-grid-tags">${item.tipo_stream}</span>` : ''}
                        ${botones}
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
