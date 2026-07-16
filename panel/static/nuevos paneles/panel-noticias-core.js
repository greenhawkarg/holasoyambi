/* ══════════════════════════════════════════════════════════════════════════════
   AMBI — PANEL DE CONTROL — Módulo Noticias · CORE  (v3)
   Archivo : panel/static/panel-noticias-core.js
   Depende de: panel-utils.js
   Usado por : panel-noticias-home.js · panel-noticias-pills.js
   API     : GET/POST /api/noticias · POST /api/noticias/upload-image
══════════════════════════════════════════════════════════════════════════════ */

/* ── ESTADO COMPARTIDO ── */
let noticiasData = [];

/* ── BADGE CONFIG — orden alfabético por label ── */
const BADGE_LABEL = {
    actualizacion: 'Actualización',
    comunidad:     'Comunidad',
    evento:        'Evento',
    hotfix:        'Hot Fix',
    juego:         'Juego',
    lanzamiento:   'Lanzamiento',
    noticia:       'Noticia',
    review:        'Review',
    stream:        'Stream',
    update:        'Update',
};

/* Familias de color: violeta (stream/comunidad) · verde (juego/evento/lanzamiento)
   · celeste (noticia/review) · rojo (hotfix/update/actualizacion) */
const BADGE_COLOR = {
    stream:        { text: '#9146FF', bg: 'rgba(145,70,255,0.18)' },
    comunidad:     { text: '#9146FF', bg: 'rgba(145,70,255,0.18)' },
    juego:         { text: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    evento:        { text: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    lanzamiento:   { text: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    noticia:       { text: '#38BDF8', bg: 'rgba(56,189,248,0.15)' },
    review:        { text: '#38BDF8', bg: 'rgba(56,189,248,0.15)' },
    hotfix:        { text: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
    update:        { text: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
    actualizacion: { text: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
};

/* ── ID — genera el próximo id libre para una categoría (cat-01, cat-02...)
   Se asigna una sola vez al crear la noticia y nunca más se toca,
   aunque después cambie de categoría. ── */
function generarIdNoticia(cat) {
    const prefix = cat || 'noticia';
    let max = 0;
    noticiasData.forEach(n => {
        if (n.id && n.id.startsWith(prefix + '-')) {
            const num = parseInt(n.id.slice(prefix.length + 1), 10);
            if (!isNaN(num) && num > max) max = num;
        }
    });
    const next = String(max + 1).padStart(2, '0');
    return `${prefix}-${next}`;
}


/* ══════════════════════════════════════════════════════════════════════════════
   CARGA INICIAL
══════════════════════════════════════════════════════════════════════════════ */

async function loadNoticias() {
    try {
        const res  = await fetch('/api/noticias');
        const data = await res.json();
        noticiasData = Array.isArray(data) ? data : [];
    } catch(e) {
        console.warn('No se pudieron cargar las noticias:', e);
        noticiasData = [];
    }

    /* Backfill defensivo: noticias viejas sin id o sin bloques
       (nunca reasigna id a las que ya lo tienen) */
    noticiasData.forEach(n => {
        if (!n.id) n.id = generarIdNoticia(n.cat || 'noticia');
        if (!Array.isArray(n.bloques)) n.bloques = [];
        if (!n.modo) n.modo = 'cover';
    });

    /* renderNoticias() vive en panel-noticias-home.js —
       se llama igual gracias al hoisting de function declarations */
    if (typeof renderNoticias === 'function') renderNoticias();

    /* renderNoticiaPills() vive en panel-noticias-pills.js (cuando exista) */
    if (typeof renderNoticiaPills === 'function') renderNoticiaPills();
}


/* ══════════════════════════════════════════════════════════════════════════════
   GUARDAR
══════════════════════════════════════════════════════════════════════════════ */

async function guardarNoticias() {
    try {
        setStatus('Guardando noticias...', 'loading');
        const res  = await fetch('/api/noticias', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(noticiasData),
        });
        const data = await res.json();
        if (data.ok) {
            setStatus('Noticias guardadas ✓', 'ok');
            toast('Noticias guardadas correctamente', 'ok');
            /* Solo refresca los datos, sin recargar la página entera
               (location.reload() reseteaba el panel a la pestaña Home) */
            await loadNoticias();
        } else {
            setStatus('Error al guardar', 'error');
            toast(data.msg || 'Error al guardar', 'error');
        }
    } catch(e) {
        setStatus('Error de red', 'error');
        toast('Error de red', 'error');
    }
}


/* ══════════════════════════════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════════════════════════════ */

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/* Auto-ajusta la altura del textarea a su contenido — así los bloques de
   texto largos se ven completos, sin scroll interno ni clicks extra
   (usado por el editor de bloques en el popup) */
function autoGrowTextarea(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}


/* ══════════════════════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════════════════════ */

let noticiasLoaded = false;

function initNoticias() {
    if (!noticiasLoaded) {
        noticiasLoaded = true;
        loadNoticias();
    }
}
