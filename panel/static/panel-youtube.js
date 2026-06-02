/* ══════════════════════════════════════════════════════════════════
   AMBI PANEL — panel-youtube.js
   Lee y guarda data/youtube_config.json
══════════════════════════════════════════════════════════════════ */

/* ── Helpers de limpieza de ID ──────────────────────────────── */

function ytExtraerId(input) {
    const val = input.trim();
    // URL completa: youtube.com/watch?v=ID o youtu.be/ID o /shorts/ID
    try {
        const url = new URL(val);
        if (url.hostname.includes('youtu.be')) return url.pathname.slice(1);
        if (url.searchParams.get('v'))          return url.searchParams.get('v');
        const m = url.pathname.match(/\/(shorts|embed|v)\/([^/?&]+)/);
        if (m) return m[2];
    } catch(e) {}
    // Ya es solo un ID (sin slash, sin punto)
    if (/^[A-Za-z0-9_-]{8,15}$/.test(val)) return val;
    return val;
}

/* ── Cargar datos al abrir el panel ─────────────────────────── */

async function cargarYoutube() {
    try {
        const res  = await fetch('/api/youtube');
        const data = await res.json();

        val('yt-kicker',          data.kicker  || '');
        val('yt-titulo',          data.titulo  || '');
        val('yt-col-izq-titulo',  data.col_izquierda?.titulo || '');
        val('yt-col-izq-texto',   data.col_izquierda?.texto  || '');
        val('yt-col-der-titulo',  data.col_derecha?.titulo   || '');
        val('yt-col-der-texto',   data.col_derecha?.texto    || '');

        const shorts = data.shorts || [];
        val('yt-short1-id',     shorts[0]?.embed_id || '');
        val('yt-short1-titulo', shorts[0]?.titulo   || '');
        val('yt-short2-id',     shorts[1]?.embed_id || '');
        val('yt-short2-titulo', shorts[1]?.titulo   || '');

        const vd = data.videos_destacados || {};
        val('yt-destac-bg-opacity', vd.bg_opacity ?? 0.4);
        if (vd.bg) {
            const prev = document.getElementById('yt-destac-bg-prev');
            if (prev) prev.style.backgroundImage = `url('/${vd.bg}')`;
            prev.style.backgroundSize = 'cover';
            document.getElementById('yt-destac-bg-prev')._current = vd.bg;
        }
        const items = vd.items || [];
        val('yt-destac1-id',     items[0]?.embed_id || '');
        val('yt-destac1-titulo', items[0]?.titulo   || '');
        val('yt-destac2-id',     items[1]?.embed_id || '');
        val('yt-destac2-titulo', items[1]?.titulo   || '');
        val('yt-destac3-id',     items[2]?.embed_id || '');
        val('yt-destac3-titulo', items[2]?.titulo   || '');

        const uv = data.ultimo_video || {};
        val('yt-ultimo-id',        uv.embed_id   || '');
        val('yt-ultimo-kicker',    uv.kicker     || 'ÚLTIMO VIDEO');
        val('yt-ultimo-titulo',    uv.titulo     || '');
        val('yt-ultimo-desc',      uv.desc       || '');
        val('yt-ultimo-btn-texto', uv.btn_texto  || 'VER EN YOUTUBE');
        val('yt-ultimo-btn-url',   uv.btn_url    || '');

    } catch(e) {
        console.warn('[panel-youtube] Error al cargar:', e);
    }
}

function val(id, v) {
    const el = document.getElementById(id);
    if (el) el.value = v;
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

/* ── Preview del fondo de videos destacados ─────────────────── */

function ytDestacBgPreview(input) {
    if (!input.files[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
        const prev = document.getElementById('yt-destac-bg-prev');
        prev.style.backgroundImage = `url('${e.target.result}')`;
        prev.style.backgroundSize  = 'cover';
        prev._file = input.files[0];
        prev._current = null;
    };
    reader.readAsDataURL(input.files[0]);
}

function ytLimpiarDestacBg() {
    const prev = document.getElementById('yt-destac-bg-prev');
    prev.style.backgroundImage = '';
    prev._file    = null;
    prev._current = null;
    prev.innerHTML = '<span style="font-size:10px;color:var(--muted)">Sin fondo</span>';
    const fileInput = document.getElementById('yt-destac-bg-file');
    if (fileInput) fileInput.value = '';
}

/* ── Guardar ─────────────────────────────────────────────────── */

async function guardarYoutube() {
    try {
        // 1. Subir BG de videos destacados si hay archivo nuevo
        let bgRel = '';
        const bgPrev = document.getElementById('yt-destac-bg-prev');
        if (bgPrev?._file) {
            const fd = new FormData();
            fd.append('file', bgPrev._file);
            fd.append('dest', 'youtube');
            const r = await fetch('/api/youtube/upload-image', { method: 'POST', body: fd });
            const d = await r.json();
            if (d.ok) bgRel = d.rel;
        } else if (bgPrev?._current) {
            bgRel = bgPrev._current;
        }

        // 2. Armar el objeto limpiando IDs automáticamente
        const payload = {
            kicker: getVal('yt-kicker'),
            titulo: getVal('yt-titulo'),
            col_izquierda: {
                titulo: getVal('yt-col-izq-titulo'),
                texto:  getVal('yt-col-izq-texto')
            },
            col_derecha: {
                titulo: getVal('yt-col-der-titulo'),
                texto:  getVal('yt-col-der-texto')
            },
            shorts: [
                { embed_id: ytExtraerId(getVal('yt-short1-id')), titulo: getVal('yt-short1-titulo') },
                { embed_id: ytExtraerId(getVal('yt-short2-id')), titulo: getVal('yt-short2-titulo') }
            ].filter(s => s.embed_id),
            videos_destacados: {
                bg:         bgRel,
                bg_opacity: parseFloat(getVal('yt-destac-bg-opacity')) || 0.4,
                items: [
                    { embed_id: ytExtraerId(getVal('yt-destac1-id')), titulo: getVal('yt-destac1-titulo') },
                    { embed_id: ytExtraerId(getVal('yt-destac2-id')), titulo: getVal('yt-destac2-titulo') },
                    { embed_id: ytExtraerId(getVal('yt-destac3-id')), titulo: getVal('yt-destac3-titulo') }
                ].filter(v => v.embed_id)
            },
            ultimo_video: {
                embed_id:  ytExtraerId(getVal('yt-ultimo-id')),
                kicker:    getVal('yt-ultimo-kicker'),
                titulo:    getVal('yt-ultimo-titulo'),
                desc:      getVal('yt-ultimo-desc'),
                btn_texto: getVal('yt-ultimo-btn-texto'),
                btn_url:   getVal('yt-ultimo-btn-url')
            }
        };

        const res = await fetch('/api/youtube', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });
        const result = await res.json();
        showToast(result.ok ? '✅ YouTube guardado' : '❌ ' + result.msg, result.ok ? 'green' : 'red');

    } catch(e) {
        showToast('❌ Error: ' + e.message, 'red');
    }
}

/* ── Cargar al iniciar ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', cargarYoutube);
