/* ══════════════════════════════════════════════════════════════════
   AMBI — NOTICIAS.JS
   Carrusel: lista izquierda + featured derecha con caption sobre imagen
   Datos: noticias_config.json — fallback hardcodeado
══════════════════════════════════════════════════════════════════ */

(function () {

    /* ── FALLBACK ── */
    const FALLBACK = [
        {
            cat:    'stream',
            badge:  'Stream',
            titulo: 'Dying Light: The Beast — primeras impresiones',
            desc:   'Early Access exclusivo. Kyle Crane regresa con más parkour, más terror y un mundo abierto que sorprende desde el primer minuto.',
            fecha:  '24 Mayo 2026',
            img:    'imgs/index/agenda/ta-dltb.jpg',
        },
        {
            cat:    'comunidad',
            badge:  'Comunidad',
            titulo: 'Torneo interno: resultados y campeones',
            desc:   'Más de 40 participantes se enfrentaron durante el fin de semana en el primer torneo organizado desde el Discord del canal.',
            fecha:  '20 Mayo 2026',
            img:    'imgs/index/agenda/ta-dltb.jpg',
        },
        {
            cat:    'noticia',
            badge:  'Noticia',
            titulo: 'Early Access exclusivo: los primeros en probar el FPS del año',
            desc:   'Acceso anticipado antes del lanzamiento mundial. Todo lo que vimos, lo que nos gustó y lo que todavía tiene por pulir.',
            fecha:  '17 Mayo 2026',
            img:    'imgs/index/agenda/ta-dltb.jpg',
        },
        {
            cat:    'review',
            badge:  'Review',
            titulo: 'Review completo: 40 horas con Ghost of Tsushima',
            desc:   'Análisis en profundidad después de recorrer cada rincón de la isla. ¿Vale la pena en 2026? Spoiler: sí.',
            fecha:  '12 Mayo 2026',
            img:    'imgs/index/agenda/ta-dltb.jpg',
        },
        {
            cat:    'juego',
            badge:  'Juego',
            titulo: 'Maratón de 8 horas: survival horror de la vieja escuela',
            desc:   'Los mejores momentos del stream más largo del canal hasta ahora. Susto, risas y una comunidad que bancó hasta el final.',
            fecha:  '5 Mayo 2026',
            img:    'imgs/index/agenda/ta-dltb.jpg',
        },
    ];

    /* ── COLOR POR CATEGORÍA ── */
    const CAT_COLOR = {
        stream:        '#9146FF',
        comunidad:     '#9146FF',
        juego:         '#10B981',
        evento:        '#10B981',
        lanzamiento:   '#10B981',
        noticia:       '#38BDF8',
        review:        '#38BDF8',
        hotfix:        '#EF4444',
        update:        '#EF4444',
        actualizacion: '#EF4444',
    };

    /* ── ESTADO ── */
    let items   = [];
    let current = 0;
    let timer   = null;

    /* ── ELEMENTOS DOM ── */
    const featImg   = document.getElementById('noticias-featured-img');
    const featBadge = document.getElementById('noticias-featured-badge');
    const featFecha = document.getElementById('noticias-featured-fecha');
    const featTitle = document.getElementById('noticias-featured-title');
    const featDesc  = document.getElementById('noticias-featured-desc');
    const dotsWrap  = document.getElementById('noticias-dots');
    const listWrap  = document.getElementById('noticias-list');

    /* ── RENDER FEATURED ── */
    function renderFeatured(idx) {
        const it = items[idx];

        /* Imagen con fade */
        featImg.style.opacity = '0';
        setTimeout(() => {
            featImg.src           = it.img;
            featImg.style.opacity = '1';
        }, 150);

        /* Textos */
        featBadge.textContent = it.badge;
        featBadge.className   = 'noticias-badge cat-' + it.cat;
        featFecha.textContent = it.fecha || '';
        featDesc.textContent  = it.desc;

        /* Título como link — externo si la noticia tiene "url" cargada
           (abre en pestaña nueva), interno a noticia.html si no la tiene */
        featTitle.innerHTML = '';
        const titleLink = document.createElement('a');
        titleLink.className   = 'noticias-featured-title-link';
        titleLink.textContent = it.titulo;
        if (it.url) {
            titleLink.href   = it.url;
            titleLink.target = '_blank';
            titleLink.rel    = 'noopener';
        } else {
            titleLink.href = 'noticia.html?id=' + encodeURIComponent(it.id || '');
        }
        featTitle.appendChild(titleLink);

        /* Dots */
        dotsWrap.querySelectorAll('.noticias-dot').forEach((d, i) => {
            d.className = 'noticias-dot cat-' + items[i].cat + (i === idx ? ' active' : '');
        });

        /* Lista */
        listWrap.querySelectorAll('.noticias-item').forEach((el, i) => {
            const isActive = i === idx;
            el.classList.toggle('active', isActive);
            el.style.borderLeftColor = isActive ? (CAT_COLOR[items[i].cat] || 'transparent') : 'transparent';
        });

        current = idx;
    }

    /* ── BUILD ── */
    function buildList() {
        listWrap.innerHTML = '';
        dotsWrap.innerHTML = '';

        items.forEach((it, idx) => {

            /* Dot */
            const dot = document.createElement('button');
            dot.className = 'noticias-dot cat-' + it.cat;
            dot.setAttribute('aria-label', 'Noticia ' + (idx + 1));
            dot.addEventListener('click', () => goTo(idx));
            dotsWrap.appendChild(dot);

            /* Item lista */
            const el = document.createElement('div');
            el.className = 'noticias-item';
            el.innerHTML =
                '<img class="noticias-item-thumb" src="' + it.img + '" alt="' + it.titulo + '" loading="lazy">' +
                '<div class="noticias-item-body">' +
                    '<span class="noticias-badge cat-' + it.cat + '">' + it.badge + '</span>' +
                    '<div class="noticias-item-title">' + it.titulo + '</div>' +
                    '<div class="noticias-item-fecha">' + (it.fecha || '') + '</div>' +
                '</div>';
            el.addEventListener('click', () => goTo(idx));
            listWrap.appendChild(el);
        });

        renderFeatured(0);
    }

    /* ── NAVEGACIÓN ── */
    function goTo(idx) {
        clearInterval(timer);
        renderFeatured(idx);
        startTimer();
    }

    function navDir(dir) {
        goTo((current + dir + items.length) % items.length);
    }

    /* ── TIMER ── */
    function startTimer() {
        timer = setInterval(() => {
            renderFeatured((current + 1) % items.length);
        }, 7000);
    }

    /* ── INIT ── */
    async function init() {
        try {
            const res  = await fetch('data/noticias_config.json');
            if (!res.ok) throw new Error('sin json');
            const data = await res.json();
            items = Array.isArray(data) && data.length ? data : FALLBACK;
        } catch (e) {
            items = FALLBACK;
        }

        buildList();
        startTimer();

        document.getElementById('noticias-prev').addEventListener('click', () => navDir(-1));
        document.getElementById('noticias-next').addEventListener('click', () => navDir(1));

        /* Recalcular bleeds con layout estable */
        if (typeof window.posicionarBleeds === 'function') {
            window.posicionarBleeds();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();