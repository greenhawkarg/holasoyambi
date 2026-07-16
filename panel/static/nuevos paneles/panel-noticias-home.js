/* ══════════════════════════════════════════════════════════════════════════════
   AMBI — PANEL DE CONTROL — Módulo Noticias · HOME  (v3)
   Archivo : panel/static/panel-noticias-home.js
   Depende de: panel-utils.js · panel-noticias-core.js
   Sub-tab : Home → Noticias
   Nota    : esta pestaña ya NO edita el cuerpo de bloques (texto/imagen/
             galería) — eso se mudó a la pestaña NOTICIAS + popup editor.
             Acá solo vive lo que alimenta el carrusel del index: portada,
             badge, fecha, título, url, fondo fijo y descripción.
══════════════════════════════════════════════════════════════════════════════ */

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

    /* ── Opciones del select de categoría — cada una con su propio color
       (si no, hereda el color del <select> y se ve ilegible en el desplegable) ── */
    const catOptions = Object.keys(BADGE_LABEL).map(c => {
        const optColor = BADGE_COLOR[c] || BADGE_COLOR.noticia;
        return `<option value="${c}"${cat === c ? ' selected' : ''} style="color:${optColor.text};background:#1a1a1a">${BADGE_LABEL[c]}</option>`;
    }).join('');

    card.innerHTML = `
        <div class="nc-drag-handle" title="Arrastrar para reordenar">⠿</div>

        <!-- IMAGEN -->
        <div class="nc-img-wrap" onclick="triggerNoticiaImg(${idx})" title="Cambiar imagen">
            ${imgHTML}
            ${emptyHTML}
            <div class="nc-img-overlay">📷</div>
            <input type="file" id="nc-file-${idx}" accept=".jpg,.jpeg,.png,.webp"
                   style="display:none" onchange="onNoticiaImgChange(this,${idx})">
            <div class="nc-modo-toggle" id="nc-modo-${idx}" onclick="event.stopPropagation()">
                ${renderModoPortadaBtns(n, idx)}
            </div>
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

            <!-- FILA 3.5: Fondo personalizado fijo (opcional) -->
            <div class="nc-bg-row" id="nc-bgrow-${idx}">
                ${renderBgRow(n, idx)}
            </div>

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


/* ── PORTADA — toggle Cover / Contain (evita recortes forzados en el header) ── */

function renderModoPortadaBtns(n, idx) {
    const modo = n.modo === 'contain' ? 'contain' : 'cover';
    return `
        <button class="nc-modo-btn ${modo === 'cover' ? 'active' : ''}" onclick="setModoPortada(${idx},'cover')">Cover</button>
        <button class="nc-modo-btn ${modo === 'contain' ? 'active' : ''}" onclick="setModoPortada(${idx},'contain')">Contain</button>
    `;
}

function setModoPortada(idx, modo) {
    noticiasData[idx].modo = modo;
    const toggle = document.getElementById(`nc-modo-${idx}`);
    if (toggle) toggle.innerHTML = renderModoPortadaBtns(noticiasData[idx], idx);
}


/* ── FONDO PERSONALIZADO FIJO — se ve completo en toda la pantalla,
   no se mueve con el scroll (background-attachment: fixed) ── */

function renderBgRow(n, idx) {
    const nombre = n.bg ? n.bg.split('/').pop() : '';
    return `
        <button class="nc-bg-btn" onclick="triggerNoticiaBg(${idx})">
            🖼️ ${n.bg ? 'Cambiar fondo fijo' : 'Fondo personalizado fijo (opcional)'}
        </button>
        ${n.bg ? `
            <span class="nc-bg-name" title="${escHtml(n.bg)}">${escHtml(nombre)}</span>
            <button class="nc-bg-clear" onclick="quitarNoticiaBg(${idx})" title="Quitar fondo">✕</button>
        ` : ''}
        <input type="file" id="nc-bgfile-${idx}" accept=".jpg,.jpeg,.png,.webp"
               style="display:none" onchange="onNoticiaBgChange(this,${idx})">
    `;
}

function triggerNoticiaBg(idx) {
    document.getElementById(`nc-bgfile-${idx}`)?.click();
}

async function onNoticiaBgChange(input, idx) {
    const file = input.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('dest', 'cuerpo');

    try {
        setStatus('Subiendo fondo...', 'loading');
        const res  = await fetch('/api/noticias/upload-image', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.ok) {
            noticiasData[idx].bg = data.rel;
            setStatus('Fondo subido ✓', 'ok');
            const row = document.getElementById(`nc-bgrow-${idx}`);
            if (row) row.innerHTML = renderBgRow(noticiasData[idx], idx);
        } else {
            setStatus('Error subiendo fondo', 'error');
            toast('Error subiendo fondo', 'error');
        }
    } catch (e) {
        setStatus('Error de red', 'error');
        toast('Error de red', 'error');
    }
}

function quitarNoticiaBg(idx) {
    noticiasData[idx].bg = '';
    const row = document.getElementById(`nc-bgrow-${idx}`);
    if (row) row.innerHTML = renderBgRow(noticiasData[idx], idx);
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

    /* El id se asigna una sola vez — si ya tiene, no se toca */
    if (!noticiasData[idx].id) {
        noticiasData[idx].id = generarIdNoticia(cat);
    }
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
   IMAGEN — portada
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
    const idExistente = noticiasData[idx].id;
    noticiasData[idx] = { id: idExistente, cat: 'noticia', badge: 'Noticia', titulo: '', desc: '', fecha: '', img: '', url: '', modo: 'cover', bg: '', bloques: [] };
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
    const cat = 'noticia';
    noticiasData.push({ id: generarIdNoticia(cat), cat, badge: 'Noticia', titulo: '', desc: '', fecha: '', img: '', url: '', modo: 'cover', bg: '', bloques: [] });
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
   DRAG & DROP — reordenar cards
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
