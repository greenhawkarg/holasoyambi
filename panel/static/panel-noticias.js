/* ══════════════════════════════════════════════════════════════════════════════
   AMBI — PANEL DE CONTROL — Módulo Noticias  (v2)
   Archivo : panel/static/panel-noticias.js
   Depende de: panel-utils.js
   Sub-tab : Home → Noticias
   API     : GET/POST /api/noticias · POST /api/noticias/upload-image
══════════════════════════════════════════════════════════════════════════════ */

/* ── ESTADO ── */
let noticiasData = [];

/* ── BADGE CONFIG ── */
const BADGE_LABEL = {
    stream:    'Stream',
    juego:     'Juego',
    comunidad: 'Comunidad',
    noticia:   'Noticia',
    review:    'Review',
};

const BADGE_COLOR = {
    stream:    { text: 'var(--purple)', bg: 'rgba(145,70,255,0.18)' },
    juego:     { text: '#10B981',       bg: 'rgba(16,185,129,0.15)' },
    comunidad: { text: '#38BDF8',       bg: 'rgba(56,189,248,0.15)' },
    noticia:   { text: '#FBBF24',       bg: 'rgba(251,191,36,0.15)' },
    review:    { text: '#FB923C',       bg: 'rgba(251,146,60,0.15)' },
};


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
    renderNoticias();
}


/* ══════════════════════════════════════════════════════════════════════════════
   RENDER PRINCIPAL
══════════════════════════════════════════════════════════════════════════════ */

function renderNoticias() {
    const list  = document.getElementById('noticias-list');
    const count = document.getElementById('noticias-count');
    if (!list) return;

    count.textContent = noticiasData.length ? `(${noticiasData.length})` : '';
    list.innerHTML = '';

    if (!noticiasData.length) {
        list.innerHTML = `<div class="nc-empty">No hay noticias. Hacé clic en <strong>✨ Nueva Noticia</strong> para agregar.</div>`;
        return;
    }

    noticiasData.forEach((n, idx) => renderNoticiaCard(n, idx, list));
}

function renderNoticiaCard(n, idx, container) {
    const cat    = n.cat || 'noticia';
    const color  = BADGE_COLOR[cat] || BADGE_COLOR.noticia;
    const label  = BADGE_LABEL[cat] || cat;
    const isFirst = idx === 0;

    const card = document.createElement('div');
    card.className   = 'nc-card';
    card.draggable   = true;
    card.dataset.idx = idx;

    /* ── Imagen ── */
    const imgSrc = n.img ? `/${n.img}` : '';
    const imgHTML = imgSrc
        ? `<img src="${imgSrc}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : '';
    const emptyHTML = `<div class="nc-img-empty" style="${imgSrc ? 'display:none' : ''}">📷</div>`;

    /* ── Opciones del select de categoría ── */
    const catOptions = Object.keys(BADGE_LABEL).map(c =>
        `<option value="${c}"${cat === c ? ' selected' : ''}>${BADGE_LABEL[c]}</option>`
    ).join('');

    card.innerHTML = `
        <div class="nc-drag-handle" title="Arrastrar para reordenar">⠿</div>

        <!-- IMAGEN -->
        <div class="nc-img-wrap" onclick="triggerNoticiaImg(${idx})" title="Cambiar imagen">
            ${imgHTML}
            ${emptyHTML}
            <div class="nc-img-overlay">📷</div>
            <input type="file" id="nc-file-${idx}" accept=".jpg,.jpeg,.png,.webp"
                   style="display:none" onchange="onNoticiaImgChange(this,${idx})">
        </div>

        <!-- CAMPOS -->
        <div class="nc-fields">

            <!-- FILA 1: badge + fecha + borrar -->
            <div class="nc-row-top">
                ${isFirst ? '<span class="nc-featured-badge">★ DESTACADA</span>' : ''}

                <!-- Badge / categoría -->
                <div class="nc-badge-wrap">
                    <select class="nc-badge-select" data-idx="${idx}"
                            style="color:${color.text};background:${color.bg}"
                            onchange="onNoticiaCatChange(this,${idx})">
                        ${catOptions}
                    </select>
                </div>

                <!-- Fecha con datepicker -->
                <div class="nc-fecha-wrap">
                    <input type="text" class="nc-fecha-input" id="nc-fecha-${idx}"
                           value="${escHtml(n.fecha || '')}"
                           placeholder="25 Mayo 2026" readonly
                           onclick="abrirFechaNoticia(${idx})"
                           title="Seleccionar fecha">
                    <span class="nc-fecha-icon" onclick="abrirFechaNoticia(${idx})">📅</span>
                </div>

                <button class="nc-btn-borrar" onclick="limpiarNoticia(${idx})" title="Limpiar noticia">
                    Borrar
                </button>

                <button class="nc-btn-del" onclick="eliminarNoticia(${idx})" title="Eliminar noticia">✕</button>
            </div>

            <!-- FILA 2: Título -->
            <input class="nc-input nc-titulo" type="text"
                   value="${escHtml(n.titulo || '')}"
                   placeholder="Título de la noticia"
                   oninput="noticiasData[${idx}].titulo=this.value">

            <!-- FILA 3: URL -->
            <input class="nc-input nc-url" type="text"
                   value="${escHtml(n.url || '')}"
                   placeholder="https://... (URL de la noticia completa)"
                   oninput="noticiasData[${idx}].url=this.value">

            <!-- FILA 4: Descripción -->
            <textarea class="nc-input nc-desc" rows="3"
                      placeholder="Descripción larga${isFirst ? ' — se muestra en la web como destacada' : ' — solo la noticia destacada la muestra'}"
                      oninput="noticiasData[${idx}].desc=this.value">${escHtml(n.desc || '')}</textarea>

        </div>
    `;

    /* ── Drag & Drop ── */
    card.addEventListener('dragstart', onNoticiaDragStart);
    card.addEventListener('dragover',  onNoticiaDragOver);
    card.addEventListener('drop',      onNoticiaDrop);
    card.addEventListener('dragend',   onNoticiaDragEnd);

    container.appendChild(card);
}


/* ══════════════════════════════════════════════════════════════════════════════
   BADGE — cambio de categoría con color dinámico
══════════════════════════════════════════════════════════════════════════════ */

function onNoticiaCatChange(select, idx) {
    const cat   = select.value;
    const color = BADGE_COLOR[cat] || BADGE_COLOR.noticia;
    select.style.color      = color.text;
    select.style.background = color.bg;
    noticiasData[idx].cat   = cat;
    noticiasData[idx].badge = BADGE_LABEL[cat] || cat;
}


/* ══════════════════════════════════════════════════════════════════════════════
   FECHA — datepicker inline
══════════════════════════════════════════════════════════════════════════════ */

let _fechaNoticiaIdx = null;

function abrirFechaNoticia(idx) {
    _fechaNoticiaIdx = idx;

    /* Reusar el datepicker del panel si existe, o crear uno propio */
    let picker = document.getElementById('nc-datepicker');
    if (!picker) {
        picker = document.createElement('div');
        picker.id        = 'nc-datepicker';
        picker.className = 'nc-datepicker';
        document.body.appendChild(picker);
    }

    const n      = noticiasData[idx];
    const hoy    = new Date();
    const parsed = parseNoticieFecha(n.fecha);
    const year   = parsed ? parsed.getFullYear() : hoy.getFullYear();
    const month  = parsed ? parsed.getMonth()    : hoy.getMonth();

    renderFechaNoticiaPicker(picker, year, month, parsed);

    /* Posicionar cerca del input */
    const inputEl = document.getElementById(`nc-fecha-${idx}`);
    if (inputEl) {
        const rect = inputEl.getBoundingClientRect();
        picker.style.top  = (rect.bottom + window.scrollY + 4) + 'px';
        picker.style.left = rect.left + 'px';
    }

    picker.style.display = 'block';

    /* Cerrar al click fuera */
    setTimeout(() => {
        document.addEventListener('click', cerrarFechaNoticiaOutside, { once: true });
    }, 0);
}

function cerrarFechaNoticiaOutside(e) {
    const picker = document.getElementById('nc-datepicker');
    if (picker && !picker.contains(e.target)) {
        picker.style.display = 'none';
    }
}

function renderFechaNoticiaPicker(picker, year, month, selectedDate) {
    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun',
                          'Jul','Ago','Sep','Oct','Nov','Dic'];
    const DIAS = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += `<div class="nc-dp-cell empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = selectedDate &&
            selectedDate.getFullYear() === year &&
            selectedDate.getMonth()    === month &&
            selectedDate.getDate()     === d;
        cells += `<div class="nc-dp-cell${isToday ? ' selected' : ''}"
                       onclick="seleccionarFechaNoticia(${year},${month},${d})">${d}</div>`;
    }

    picker.innerHTML = `
        <div class="nc-dp-header">
            <button onclick="navFechaNoticia(${year},${month - 1})">‹</button>
            <span>${MESES[month]} ${year}</span>
            <button onclick="navFechaNoticia(${year},${month + 1})">›</button>
        </div>
        <div class="nc-dp-grid">
            ${DIAS.map(d => `<div class="nc-dp-day">${d}</div>`).join('')}
            ${cells}
        </div>
    `;
}

function navFechaNoticia(year, month) {
    if (month < 0)  { year--; month = 11; }
    if (month > 11) { year++; month = 0;  }
    const picker = document.getElementById('nc-datepicker');
    const idx    = _fechaNoticiaIdx;
    const n      = noticiasData[idx];
    const parsed = parseNoticieFecha(n.fecha);
    renderFechaNoticiaPicker(picker, year, month, parsed);
}

function seleccionarFechaNoticia(year, month, day) {
    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const fechaStr = `${day} ${MESES[month]} ${year}`;
    const idx      = _fechaNoticiaIdx;

    noticiasData[idx].fecha = fechaStr;

    const inputEl = document.getElementById(`nc-fecha-${idx}`);
    if (inputEl) inputEl.value = fechaStr;

    const picker = document.getElementById('nc-datepicker');
    if (picker) picker.style.display = 'none';
}

function parseNoticieFecha(str) {
    if (!str) return null;
    const MESES = { enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,
                    julio:6,agosto:7,septiembre:8,octubre:9,noviembre:10,diciembre:11 };
    const parts = str.toLowerCase().split(' ');
    if (parts.length >= 3) {
        const d = parseInt(parts[0]);
        const m = MESES[parts[1]];
        const y = parseInt(parts[2]);
        if (!isNaN(d) && m !== undefined && !isNaN(y)) return new Date(y, m, d);
    }
    return null;
}


/* ══════════════════════════════════════════════════════════════════════════════
   IMAGEN
══════════════════════════════════════════════════════════════════════════════ */

function triggerNoticiaImg(idx) {
    document.getElementById(`nc-file-${idx}`)?.click();
}

async function onNoticiaImgChange(input, idx) {
    const file = input.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);

    try {
        setStatus('Subiendo imagen...', 'loading');
        const res  = await fetch('/api/noticias/upload-image', { method:'POST', body:fd });
        const data = await res.json();
        if (data.ok) {
            noticiasData[idx].img = data.rel;
            setStatus('Imagen subida ✓', 'ok');

            /* Actualizar preview sin re-renderizar toda la lista */
            const wrap = document.querySelector(`.nc-card[data-idx="${idx}"] .nc-img-wrap`);
            if (wrap) {
                let img = wrap.querySelector('img');
                if (!img) {
                    img = document.createElement('img');
                    img.onerror = () => { img.style.display = 'none'; };
                    wrap.insertBefore(img, wrap.firstChild);
                }
                img.src   = `/${data.rel}`;
                img.style.display = '';
                const empty = wrap.querySelector('.nc-img-empty');
                if (empty) empty.style.display = 'none';
            }
        } else {
            setStatus('Error subiendo imagen', 'error');
            toast('Error subiendo imagen', 'error');
        }
    } catch(e) {
        setStatus('Error de red', 'error');
        toast('Error de red', 'error');
    }
}


/* ══════════════════════════════════════════════════════════════════════════════
   LIMPIAR — vacía la card sin eliminarla
══════════════════════════════════════════════════════════════════════════════ */

function limpiarNoticia(idx) {
    if (!confirm('¿Limpiar todos los campos de esta noticia?')) return;
    noticiasData[idx] = { cat: 'noticia', badge: 'Noticia', titulo: '', desc: '', fecha: '', img: '', url: '' };
    renderNoticias();
}


/* ══════════════════════════════════════════════════════════════════════════════
   ELIMINAR — saca la card de la lista
══════════════════════════════════════════════════════════════════════════════ */

function eliminarNoticia(idx) {
    if (!confirm(`¿Eliminar "${noticiasData[idx].titulo || 'esta noticia'}"?`)) return;
    noticiasData.splice(idx, 1);
    renderNoticias();
}


/* ══════════════════════════════════════════════════════════════════════════════
   NUEVA NOTICIA — agrega una card vacía al final
══════════════════════════════════════════════════════════════════════════════ */

function abrirNuevaNoticia() {
    noticiasData.push({ cat: 'noticia', badge: 'Noticia', titulo: '', desc: '', fecha: '', img: '', url: '' });
    renderNoticias();

    /* Scroll a la nueva card */
    setTimeout(() => {
        const cards = document.querySelectorAll('.nc-card');
        if (cards.length) cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
}

/* Mantener compatibilidad con el botón del HTML que llama cerrarNuevaNoticia */
function cerrarNuevaNoticia() {}


/* ══════════════════════════════════════════════════════════════════════════════
   DRAG & DROP
══════════════════════════════════════════════════════════════════════════════ */

let dragSrcIdx = null;

function onNoticiaDragStart(e) {
    dragSrcIdx = +this.dataset.idx;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function onNoticiaDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.nc-card').forEach(c => c.classList.remove('drag-over'));
    this.classList.add('drag-over');
}

function onNoticiaDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    const targetIdx = +this.dataset.idx;
    if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;

    const moved = noticiasData.splice(dragSrcIdx, 1)[0];
    noticiasData.splice(targetIdx, 0, moved);
    renderNoticias();
}

function onNoticiaDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.nc-card').forEach(c => c.classList.remove('drag-over'));
    dragSrcIdx = null;
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
            setTimeout(() => location.reload(), 800);
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