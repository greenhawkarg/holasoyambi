/* ══════════════════════════════════════════════════════════════════
   AMBI — NOTICIA.JS
   Página de detalle. Lee ?id=xxx de la URL, busca la noticia en
   data/noticias_config.json y renderiza el array "bloques" en el
   orden exacto en que viene — el template no decide el orden,
   solo pinta lo que el panel ya armó.
══════════════════════════════════════════════════════════════════ */

(function () {

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    const page = document.getElementById('noticia-page');

    /* ── RENDER DE UN BLOQUE SEGÚN TIPO ── */
    function renderBloque(bloque) {
        if (bloque.tipo === 'titulo') {
            const h = document.createElement('h2');
            h.className = 'noticia-block-titulo';
            h.textContent = bloque.contenido || '';
            return h;
        }

        if (bloque.tipo === 'subtitulo') {
            const h = document.createElement('h3');
            h.className = 'noticia-block-subtitulo';
            h.textContent = bloque.contenido || '';
            return h;
        }

        if (bloque.tipo === 'texto') {
            const p = document.createElement('p');
            p.className = 'noticia-block-texto';
            p.textContent = bloque.contenido || '';
            return p;
        }

        if (bloque.tipo === 'imagen') {
            const modo = bloque.modo === 'cover' ? 'cover' : 'contain';
            const wrap = document.createElement('div');
            wrap.className = 'noticia-block-imagen modo-' + modo;
            const img = document.createElement('img');
            img.src = bloque.src || '';
            img.alt = '';
            img.loading = 'lazy';
            wrap.appendChild(img);
            return wrap;
        }

        if (bloque.tipo === 'galeria') {
            const wrap = document.createElement('div');
            wrap.className = 'noticia-block-galeria';
            (bloque.imagenes || []).forEach(function (imgData) {
                const modo = imgData.modo === 'cover' ? 'cover' : 'contain';
                const item = document.createElement('div');
                item.className = 'noticia-galeria-item modo-' + modo;
                const img = document.createElement('img');
                img.src = imgData.src || '';
                img.alt = '';
                img.loading = 'lazy';
                item.appendChild(img);
                wrap.appendChild(item);
            });
            return wrap;
        }

        /* tipo desconocido → lo ignoramos en vez de romper el render */
        return null;
    }

    /* ── ESTADO: NO ENCONTRADA ── */
    function renderNotFound() {
        page.innerHTML =
            '<a class="noticia-back" id="noticia-back-nf" href="index.html#noticias">‹ Volver a Noticias</a>' +
            '<div class="noticia-not-found">' +
                '<div class="noticia-not-found-title">No encontramos esa noticia</div>' +
                '<div class="noticia-not-found-desc">Puede que el link esté roto o la noticia ya no exista.</div>' +
                '<a href="index.html#noticias">Ver todas las noticias</a>' +
            '</div>';
    }

    /* ── RENDER PRINCIPAL ── */
    function renderNoticia(it) {
        document.title = it.titulo + ' | AmbiTV';

        const header = document.getElementById('noticia-header-img');
        const headerWrap = document.getElementById('noticia-header-imgwrap');
        const badge  = document.getElementById('noticia-badge');
        const fecha  = document.getElementById('noticia-fecha');
        const title  = document.getElementById('noticia-title');
        const body   = document.getElementById('noticia-body');

        header.src = it.img || '';
        header.alt = it.titulo || '';

        const modo = it.modo === 'contain' ? 'contain' : 'cover';
        headerWrap.className = 'noticia-header-imgwrap modo-' + modo;

        /* Fondo personalizado fijo — cubre toda la pantalla, no se mueve con el scroll */
        if (it.bg) {
            page.style.backgroundImage    = `linear-gradient(rgba(0,0,0,.72), rgba(0,0,0,.72)), url('/${it.bg}')`;
            page.style.backgroundSize     = 'cover';
            page.style.backgroundPosition = 'center';
            page.style.backgroundAttachment = 'fixed';
            page.style.backgroundRepeat   = 'no-repeat';
        } else {
            page.style.backgroundImage = '';
        }

        badge.textContent = it.badge || '';
        badge.className   = 'noticia-badge cat-' + it.cat;

        fecha.textContent = it.fecha || '';
        title.textContent = it.titulo || '';

        body.innerHTML = '';
        const bloques = Array.isArray(it.bloques) ? it.bloques : [];

        /* si no hay bloques cargados, el cuerpo queda vacío — sin relleno */
        bloques.forEach(function (bloque) {
            const el = renderBloque(bloque);
            if (el) body.appendChild(el);
        });
    }

    /* ── INIT ── */
    async function init() {
        if (!id) {
            renderNotFound();
            return;
        }

        try {
            const res  = await fetch('data/noticias_config.json');
            if (!res.ok) throw new Error('sin json');
            const data = await res.json();
            const items = Array.isArray(data) ? data : [];
            const it = items.find(function (n) { return n.id === id; });

            if (!it) {
                renderNotFound();
                return;
            }

            renderNoticia(it);
        } catch (e) {
            renderNotFound();
        }
    }

    init();

})();
