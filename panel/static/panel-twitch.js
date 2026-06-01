/* ══════════════════════════════════════════════════════════════════
   AMBI — PANEL DE CONTROL — Módulo Twitch Top
   Archivo : panel/static/panel-twitch.js
   Depende de: panel-utils.js
══════════════════════════════════════════════════════════════════ */
const _crewCleared = new Set();
let _crewBgCleared = false;

/* ── CARGA INICIAL ── */
async function loadTwitchTop() {
    try {
        const res  = await fetch('/api/twitch-top');
        const data = await res.json();
        populateTwitchTop(data);
    } catch(e) {
        console.warn('No se pudo cargar twitch_config:', e);
    }
}

function populateTwitchTop(data) {
    if (data.kicker) document.getElementById('tw-kicker').value = data.kicker;
    if (data.titulo) document.getElementById('tw-titulo').value = data.titulo;
    if (data.crew_bg) {
    document.getElementById('tw-crew-bg-prev').innerHTML =
        `<img src="/${data.crew_bg}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none'">`;
}

    /* Cards */
    (data.cards || []).forEach((card, i) => {
        const n = i + 1;
        const tituloEl = document.getElementById(`tw-card${n}-titulo`);
        const descEl   = document.getElementById(`tw-card${n}-desc`);
        const prevEl   = document.getElementById(`tw-card${n}-prev`);
        if (tituloEl) tituloEl.value = card.caption_titulo || '';
        if (descEl)   descEl.value   = card.caption_desc   || '';
        if (prevEl && card.img) {
            prevEl.innerHTML = `<img src="/${card.img}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none'">`;
        }
    });

    /* Crew */
    (data.crew || []).forEach((c, i) => {
        const n = i + 1;
        const nombreEl = document.getElementById(`tw-crew${n}-nombre`);
        const urlEl    = document.getElementById(`tw-crew${n}-url`);
        const rolEl    = document.getElementById(`tw-crew${n}-rol`);
        const prevEl   = document.getElementById(`tw-crew${n}-prev`);
        if (nombreEl) nombreEl.value = c.nombre || '';
        if (urlEl)    urlEl.value    = c.url    || '';
        if (rolEl)    rolEl.value    = c.rol    || '';
        if (prevEl && c.foto) {
            prevEl.innerHTML = `<img src="/${c.foto}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none'">`;
        }
    });
}

/* ── PREVIEW LOCAL — CARD ── */
function twitchCardPreview(input, previewId) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById(previewId).innerHTML =
            `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;display:block;">`;
    };
    reader.readAsDataURL(file);
}

/* ── PREVIEW LOCAL — CREW ── */
function twitchCrewPreview(input, previewId) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById(previewId).innerHTML =
            `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;display:block;">`;
    };
    reader.readAsDataURL(file);
}

/* ── UPLOAD DE IMAGEN ── */
async function uploadTwitchImg(fileInputId) {
    const input = document.getElementById(fileInputId);
    if (!input || !input.files[0]) return null;
    const fd = new FormData();
    fd.append('file', input.files[0]);
    try {
        const res  = await fetch('/api/twitch-top/upload-image', { method: 'POST', body: fd });
        const data = await res.json();
        return data.ok ? data.rel : null;
    } catch(e) {
        return null;
    }
}

/* ── GUARDAR ── */
async function guardarTwitchTop() {
    setStatus('Guardando...', '');

    /* Subir imágenes cards */
    const cardImgs = await Promise.all([1,2,3,4].map(n =>
        uploadTwitchImg(`tw-card${n}-file`)
    ));

    /* Subir fotos crew */
    const crewBgImg = await uploadTwitchImg('tw-crew-bg-file');
    const crewImgs = await Promise.all([1,2,3,4,5,6,7,8].map(n =>
        uploadTwitchImg(`tw-crew${n}-file`)
    ));

    /* Leer estado actual para no pisar rutas existentes con null */
    let current = { cards: [{},{},{},{}], crew: [{},{},{},{},{},{},{},{}] };
    try {
        const r = await fetch('/api/twitch-top');
        current = await r.json();
    } catch(e) {}

    const cards = [1,2,3,4].map((n, i) => ({
        img:            cardImgs[i] || (current.cards[i] && current.cards[i].img) || '',
        caption_titulo: document.getElementById(`tw-card${n}-titulo`).value.trim(),
        caption_desc:   document.getElementById(`tw-card${n}-desc`).value.trim(),
    }));

    const crew = [1,2,3,4,5,6,7,8].map((n, i) => ({
        foto:   crewImgs[i] || (_crewCleared.has(`tw-crew${n}-file`) ? '' : (current.crew[i] && current.crew[i].foto) || ''),
        nombre: document.getElementById(`tw-crew${n}-nombre`).value.trim(),
        url:    document.getElementById(`tw-crew${n}-url`).value.trim(),
        rol:    document.getElementById(`tw-crew${n}-rol`).value,
    }));

    const payload = {
    kicker:   document.getElementById('tw-kicker').value.trim(),
    titulo:   document.getElementById('tw-titulo').value.trim(),
    crew_bg:  crewBgImg || (_crewBgCleared ? '' : (current.crew_bg || '')),
    cards,
    crew,
};

    try {
        const res  = await fetch('/api/twitch-top', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.ok) {
            toast('✅ Twitch guardado correctamente');
            setStatus('Guardado', 'ok');
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
document.addEventListener('DOMContentLoaded', loadTwitchTop);



/* ── CREW BG + FOTO — funciones de preview y limpieza ── */
function twitchCrewBgPreview(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('tw-crew-bg-prev').innerHTML =
            `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;display:block;">`;
    };
    reader.readAsDataURL(file);
}

function limpiarCrewBg() {
    document.getElementById('tw-crew-bg-prev').innerHTML =
        '<span style="font-size:10px;color:var(--muted)">Sin textura</span>';
    const inp = document.getElementById('tw-crew-bg-file');
    if (inp) inp.value = '';
    _crewBgCleared = true;
}

function limpiarCrewFoto(previewId, fileInputId) {
    const prev = document.getElementById(previewId);
    if (prev) prev.innerHTML = '<span style="font-size:10px;color:var(--muted)">foto</span>';
    const inp = document.getElementById(fileInputId);
    if (inp) inp.value = '';
    _crewCleared.add(fileInputId);
}