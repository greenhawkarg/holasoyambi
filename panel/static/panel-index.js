/* ══════════════════════════════════════════════════════════════════
   AMBI — PANEL DE CONTROL — Módulo Index
   Archivo : panel/static/panel-index.js
   Depende de: panel-utils.js
══════════════════════════════════════════════════════════════════ */

/* ── CARGA INICIAL ── */
async function loadIndex() {
    try {
        const res  = await fetch('/api/index');
        const data = await res.json();
        populateIndex(data);
    } catch(e) {
        console.warn('No se pudo cargar index config:', e);
    }
}

function populateIndex(data) {
    /* Agenda */
    if (data.juego)     document.getElementById('ix-juego').value = data.juego;
    if (data.tipo)      document.getElementById('ix-tipo').value  = data.tipo;
    if (data.fecha_iso) {
        document.getElementById('ix-fecha').value = data.fecha_iso;
        onIndexFecha(data.fecha_iso);
    }
    if (data.hora)      document.getElementById('ix-hora').value  = data.hora;
    document.getElementById('ix-desc').value = data.desc || '';

    /* Previews de imágenes actuales */
    const previews = {
        'ix-bg-prev':    data.bg,
        'ix-obj-prev':   data.object,
        'ix-logo-prev':  data.logo,
        'ix-thumb-prev': data.thumb,
        'ix-bleed-prev': data.bleed,
    };
    for (const [id, src] of Object.entries(previews)) {
        if (src) {
            document.getElementById(id).innerHTML = `<img src="/${src}" style="width:100%;height:100%;object-fit:contain;display:block;" onerror="this.style.display='none'">`;
        }
    }
}

/* ── AUTO DÍA DE LA SEMANA ── */
function onIndexFecha(iso) {
    if (!iso) return;
    const dia = DIAS_S[new Date(iso + 'T00:00:00').getDay()];
    document.getElementById('ix-dia').value = dia;
}

/* ── PREVIEW LOCAL DE IMAGEN ── */
function indexPreview(input, previewId) {
    const file = input.files[0];
    if (!file) return;

    /* Actualiza nombre */
    const nameId = input.id.replace('-file', '-name');
    const nameEl = document.getElementById(nameId);
    if (nameEl) { nameEl.textContent = file.name; nameEl.style.color = 'var(--cyan)'; }

    /* Preview con object-fit contain para no distorsionar */
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById(previewId).innerHTML =
            `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:contain;display:block;">`;
    };
    reader.readAsDataURL(file);
}

/* ── CAMPOS BORRADOS EXPLÍCITAMENTE ── */
const _indexCleared = new Set();

/* ── LIMPIAR PREVIEW ── */
function limpiarIndexPreview(previewId, fileInputId, nameId) {
    const prev = document.getElementById(previewId);
    if (prev) prev.innerHTML = '<span style="font-size:10px;color:var(--muted)">preview</span>';
    const inp = document.getElementById(fileInputId);
    if (inp) inp.value = '';
    const nm = document.getElementById(nameId);
    if (nm) { nm.textContent = '(sin imagen)'; nm.style.color = 'var(--red)'; }
    /* Marca el campo como borrado para que el payload mande "" al guardar */
    _indexCleared.add(fileInputId);
}

/* ── SUB-TAB HOME ── */
function switchHomeTab(name) {
    document.querySelectorAll('#tab-home .tab').forEach(t => t.classList.remove('active'));
    document.getElementById('htab-player').style.display    = name === 'player'   ? '' : 'none';
    document.getElementById('htab-hero').style.display      = name === 'hero'     ? '' : 'none';
    document.getElementById('htab-agenda').style.display    = name === 'agenda'   ? '' : 'none';
    document.getElementById('htab-noticias').style.display  = name === 'noticias' ? '' : 'none';
    document.getElementById('htab-twitch').style.display    = name === 'twitch'   ? '' : 'none';
    document.getElementById('htab-youtube').style.display   = name === 'youtube'  ? '' : 'none';
    document.getElementById('htab-hunt').style.display      = name === 'hunt'     ? '' : 'none';
    document.getElementById('hsub-' + name).classList.add('active');

    /* Carga lazy al activar cada sub-tab */
    if (name === 'noticias') initNoticias();
    if (name === 'youtube')  cargarYoutube();
    if (name === 'hunt')     cargarHunt();
}

/* ── UPLOAD DE IMAGEN AL SERVIDOR ── */
async function uploadIndexImg(fileInputId, dest) {
    const input = document.getElementById(fileInputId);
    if (!input.files[0]) return null;
    const fd = new FormData();
    fd.append('file', input.files[0]);
    fd.append('dest', dest);
    try {
        const res  = await fetch('/api/index/upload-image', { method: 'POST', body: fd });
        const data = await res.json();
        return data.ok ? data.rel : null;
    } catch(e) {
        return null;
    }
}

/* ── GUARDAR ── */
async function guardarIndex() {
    setStatus('Guardando...', '');

    /* Subir imágenes que hayan cambiado */
    const [bg, obj, logo, thumb, bleed] = await Promise.all([
        uploadIndexImg('ix-bg-file',    'index_bg'),
        uploadIndexImg('ix-obj-file',   'index_obj'),
        uploadIndexImg('ix-logo-file',  'index_logo'),
        uploadIndexImg('ix-thumb-file', 'index_thumb'),
        uploadIndexImg('ix-bleed-file', 'index_bleed'),
    ]);

    const fechaISO = document.getElementById('ix-fecha').value;

    const payload = {
        juego:     document.getElementById('ix-juego').value.trim().toUpperCase(),
        tipo:      document.getElementById('ix-tipo').value,
        desc:      document.getElementById('ix-desc').value.trim(),
        fecha:     isoToFechaWeb(fechaISO),
        fecha_iso: fechaISO,
        dia:       document.getElementById('ix-dia').value,
        hora:      document.getElementById('ix-hora').value.trim(),
        ...(bg                                      && { bg }),
        ...(obj                                     && { object: obj }),
        ...(logo                                    && { logo }),
        ...(thumb                                   && { thumb }),
        ...(!thumb && _indexCleared.has('ix-thumb-file') && { thumb: '' }),
        ...(bleed                                   && { bleed }),
        ...(!bleed && _indexCleared.has('ix-bleed-file') && { bleed: '' }),
    };

    try {
        const res  = await fetch('/api/index', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.ok) {
            toast('✅ Index guardado correctamente');
            setStatus('Guardado', 'ok');
            _indexCleared.clear();
            localStorage.setItem('ambi_reload', Date.now());
            refrescarVistaPublica();
        } else {
            toast('Error: ' + data.msg, 'err');
            setStatus('Error', 'err');
        }
    } catch(e) {
        toast('Error de conexión', 'err');
        setStatus('Error', 'err');
    }
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', loadIndex);