/* ══════════════════════════════════════════════════════════════════════════════
   AMBI — PANEL DE CONTROL — Módulo Noticias  (v2)
   Archivo : panel/static/panel-noticias.js
   Depende de: panel-utils.js
   Sub-tab : Home → Noticias
   API     : GET/POST /api/noticias · POST /api/noticias/upload-image
══════════════════════════════════════════════════════════════════════════════ */

/* ── ESTADO ── */
let noticiasData = [];

/* Índices de noticias con el "Cuerpo" expandido (se mantiene entre renders) */
const cuerposAbiertos = new Set();

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

            <!-- CUERPO — bloques texto/imagen/galería -->
            <div class="nc-cuerpo">
                ${renderCuerpoHeader(n, idx)}
                <div class="nb-list" id="nb-list-${idx}">
                    ${cuerposAbiertos.has(idx) ? renderBloquesHTML(n, idx) : ''}
                </div>
            </div>

        </div>
    `;

    /* ── Drag & Drop ── */
    card.addEventListener('dragstart', onNoticiaDragStart);
    card.addEventListener('dragover',  onNoticiaDragOver);
    card.addEventListener('drop',      onNoticiaDrop);
    card.addEventListener('dragend',   onNoticiaDragEnd);

    container.appendChild(card);
    card.querySelectorAll('.nb-texto').forEach(autoGrowTextarea);
}


/* ══════════════════════════════════════════════════════════════════════════════
   CUERPO — BLOQUES (texto / imagen / galería)
   El orden de las cards en pantalla = el orden que se guarda en "bloques".
══════════════════════════════════════════════════════════════════════════════ */

function toggleCuerpo(idx) {
    if (cuerposAbiertos.has(idx)) cuerposAbiertos.delete(idx);
    else cuerposAbiertos.add(idx);
    renderNoticias();
}

function renderCuerpoHeader(n, idx) {
    const count   = (n.bloques || []).length;
    const abierto = cuerposAbiertos.has(idx);
    const label   = count ? `${count} bloque${count === 1 ? '' : 's'}` : 'vacío';
    return `
        <div class="nc-cuerpo-header" onclick="toggleCuerpo(${idx})">
            <span class="nc-cuerpo-arrow">${abierto ? '▾' : '▸'}</span>
            <span class="nc-cuerpo-label">Cuerpo de la noticia</span>
            <span class="nc-cuerpo-count">${label}</span>
        </div>
    `;
}

function renderBloquesHTML(n, idx) {
    const bloques = n.bloques || [];
    const items   = bloques.map((b, bIdx) => renderBloqueCard(b, idx, bIdx)).join('');
    return `
        ${items}
        <div class="nb-add-row">
            <button class="nb-btn-add" onclick="agregarBloque(${idx},'titulo')">+ Título</button>
            <button class="nb-btn-add" onclick="agregarBloque(${idx},'subtitulo')">+ Subtítulo</button>
            <button class="nb-btn-add" onclick="agregarBloque(${idx},'texto')">+ Texto</button>
            <button class="nb-btn-add" onclick="agregarBloque(${idx},'imagen')">+ Imagen</button>
            <button class="nb-btn-add" onclick="agregarBloque(${idx},'galeria')">+ Galería</button>
        </div>
    `;
}

/* Re-renderiza solo el cuerpo de UNA noticia (no toda la lista),
   así no se pierde el estado de scroll ni el de otras cards */
function refrescarBloques(idxN) {
    const n    = noticiasData[idxN];
    const list = document.getElementById(`nb-list-${idxN}`);
    if (list) {
        list.innerHTML = renderBloquesHTML(n, idxN);
        list.querySelectorAll('.nb-texto').forEach(autoGrowTextarea);
    }

    const header = list ? list.closest('.nc-cuerpo')?.querySelector('.nc-cuerpo-header') : null;
    if (header) header.outerHTML = renderCuerpoHeader(n, idxN);
}

function agregarBloque(idxN, tipo) {
    if (!Array.isArray(noticiasData[idxN].bloques)) noticiasData[idxN].bloques = [];

    let nuevo;
    if (tipo === 'titulo')    nuevo = { tipo: 'titulo',    contenido: '' };
    if (tipo === 'subtitulo') nuevo = { tipo: 'subtitulo', contenido: '' };
    if (tipo === 'texto')     nuevo = { tipo: 'texto',     contenido: '' };
    if (tipo === 'imagen')    nuevo = { tipo: 'imagen',    src: '', modo: 'contain' };
    if (tipo === 'galeria')   nuevo = { tipo: 'galeria',   imagenes: [] };
    if (!nuevo) return;

    noticiasData[idxN].bloques.push(nuevo);
    cuerposAbiertos.add(idxN);
    refrescarBloques(idxN);
}

function eliminarBloque(idxN, idxB) {
    noticiasData[idxN].bloques.splice(idxB, 1);
    refrescarBloques(idxN);
}

function renderBloqueCard(b, idxN, idxB) {
    const tipoLabel = { titulo: 'Título', subtitulo: 'Subtítulo', texto: 'Texto', imagen: 'Imagen', galeria: 'Galería' }[b.tipo] || b.tipo;
    return `
        <div class="nb-card" draggable="true" data-idxn="${idxN}" data-idxb="${idxB}"
             ondragstart="onBloqueDragStart(event,this)"
             ondragover="onBloqueDragOver(event,this)"
             ondrop="onBloqueDrop(event,this)"
             ondragend="onBloqueDragEnd(event,this)">
            <div class="nb-drag-handle" title="Arrastrar para reordenar">⠿</div>
            <div class="nb-body">
                <div class="nb-row-top">
                    <span class="nb-tipo-label">${tipoLabel}</span>
                    <button class="nb-btn-del" onclick="eliminarBloque(${idxN},${idxB})" title="Eliminar bloque">✕</button>
                </div>
                ${renderBloqueBody(b, idxN, idxB)}
            </div>
        </div>
    `;
}

function renderBloqueBody(b, idxN, idxB) {
    if (b.tipo === 'titulo')    return renderBloqueBodyTituloInput(b, idxN, idxB, 'Título del bloque');
    if (b.tipo === 'subtitulo') return renderBloqueBodyTituloInput(b, idxN, idxB, 'Subtítulo del bloque');
    if (b.tipo === 'texto')     return renderBloqueBodyTexto(b, idxN, idxB);
    if (b.tipo === 'imagen')    return renderBloqueBodyImagen(b, idxN, idxB);
    if (b.tipo === 'galeria')   return renderBloqueBodyGaleria(b, idxN, idxB);
    return '';
}

function renderBloqueBodyTituloInput(b, idxN, idxB, placeholder) {
    return `
        <input class="nc-input nb-titulo-input" type="text" placeholder="${placeholder}"
               value="${escHtml(b.contenido || '')}"
               oninput="noticiasData[${idxN}].bloques[${idxB}].contenido=this.value">
    `;
}

function renderBloqueBodyTexto(b, idxN, idxB) {
    return `
        <textarea class="nc-input nb-texto" id="nb-texto-${idxN}-${idxB}" rows="3" placeholder="Texto del bloque"
                  oninput="autoGrowTextarea(this); noticiasData[${idxN}].bloques[${idxB}].contenido=this.value">${escHtml(b.contenido || '')}</textarea>
        <div class="nb-texto-tools">
            <button type="button" class="nb-btn-vineta" onclick="insertarVineta(${idxN},${idxB})"
                    title="Insertar línea de viñeta (se ve como lista con círculo)">• Viñeta</button>
        </div>
    `;
}

/* Inserta "- " en la posición del cursor del textarea de un bloque de texto.
   Si el cursor no está al inicio de línea, agrega un salto de línea antes
   para que la viñeta arranque en su propia línea. */
function insertarVineta(idxN, idxB) {
    const ta = document.getElementById(`nb-texto-${idxN}-${idxB}`);
    if (!ta) return;

    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const value = ta.value;

    const necesitaSalto = start > 0 && value[start - 1] !== '\n';
    const insercion = (necesitaSalto ? '\n' : '') + '- ';

    ta.value = value.slice(0, start) + insercion + value.slice(end);
    noticiasData[idxN].bloques[idxB].contenido = ta.value;

    /* Recolocar el cursor justo después del "- " insertado */
    const nuevaPos = start + insercion.length;
    ta.focus();
    ta.setSelectionRange(nuevaPos, nuevaPos);

    autoGrowTextarea(ta);
}

function renderBloqueBodyImagen(b, idxN, idxB) {
    const modo    = b.modo === 'cover' ? 'cover' : 'contain';
    const imgSrc  = b.src ? `/${b.src}` : '';
    const imgHTML = imgSrc
        ? `<img src="${imgSrc}" alt="" onerror="this.style.display='none'">`
        : `<div class="nb-img-empty">📷</div>`;
    return `
        <div class="nb-img-row">
            <div class="nb-img-wrap" onclick="triggerBloqueImg(${idxN},${idxB})" title="Subir/cambiar imagen">
                ${imgHTML}
                <div class="nb-img-overlay">📷</div>
                <input type="file" id="nb-file-${idxN}-${idxB}" accept=".jpg,.jpeg,.png,.webp"
                       style="display:none" onchange="onBloqueImgChange(this,${idxN},${idxB})">
            </div>
            <div class="nb-modo-toggle">
                <button class="nb-modo-btn ${modo === 'cover' ? 'active' : ''}" onclick="setModoImagen(${idxN},${idxB},'cover')">Cover</button>
                <button class="nb-modo-btn ${modo === 'contain' ? 'active' : ''}" onclick="setModoImagen(${idxN},${idxB},'contain')">Contain</button>
            </div>
        </div>
    `;
}

const GALERIA_MAX = 6;

function renderBloqueBodyGaleria(b, idxN, idxB) {
    const imagenes = b.imagenes || [];
    const thumbs = imagenes.map((imgData, iIdx) => {
        const modo = imgData.modo === 'cover' ? 'cover' : 'contain';
        const src  = imgData.src ? `/${imgData.src}` : '';
        return `
            <div class="nb-gal-item">
                <div class="nb-gal-thumb">
                    ${src ? `<img src="${src}" alt="">` : `<div class="nb-img-empty">📷</div>`}
                    <button class="nb-gal-del" onclick="eliminarImgGaleria(${idxN},${idxB},${iIdx})" title="Quitar">✕</button>
                </div>
                <div class="nb-modo-toggle nb-modo-toggle-sm">
                    <button class="nb-modo-btn ${modo === 'cover' ? 'active' : ''}" onclick="setModoGaleriaImg(${idxN},${idxB},${iIdx},'cover')">Cover</button>
                    <button class="nb-modo-btn ${modo === 'contain' ? 'active' : ''}" onclick="setModoGaleriaImg(${idxN},${idxB},${iIdx},'contain')">Contain</button>
                </div>
            </div>
        `;
    }).join('');

    const canAddMore = imagenes.length < GALERIA_MAX;

    return `
        <div class="nb-gal-grid">
            ${thumbs}
            ${canAddMore ? `
                <div class="nb-gal-add" onclick="triggerGaleriaImgs(${idxN},${idxB})" title="Agregar imágenes (máx. ${GALERIA_MAX})">
                    <span>+ Agregar</span>
                    <input type="file" id="nb-galfile-${idxN}-${idxB}" accept=".jpg,.jpeg,.png,.webp" multiple
                           style="display:none" onchange="onGaleriaImgsChange(this,${idxN},${idxB})">
                </div>
            ` : ''}
        </div>
        <div class="nb-gal-count">${imagenes.length}/${GALERIA_MAX} imágenes</div>
    `;
}

/* ── IMAGEN — bloque tipo "imagen" ── */

function triggerBloqueImg(idxN, idxB) {
    document.getElementById(`nb-file-${idxN}-${idxB}`)?.click();
}

async function onBloqueImgChange(input, idxN, idxB) {
    const file = input.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('dest', 'cuerpo');

    try {
        setStatus('Subiendo imagen...', 'loading');
        const res  = await fetch('/api/noticias/upload-image', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.ok) {
            noticiasData[idxN].bloques[idxB].src = data.rel;
            setStatus('Imagen subida ✓', 'ok');
            refrescarBloques(idxN);
        } else {
            setStatus('Error subiendo imagen', 'error');
            toast('Error subiendo imagen', 'error');
        }
    } catch (e) {
        setStatus('Error de red', 'error');
        toast('Error de red', 'error');
    }
}

function setModoImagen(idxN, idxB, modo) {
    noticiasData[idxN].bloques[idxB].modo = modo;
    refrescarBloques(idxN);
}

/* ── GALERÍA — bloque tipo "galeria" ── */

function triggerGaleriaImgs(idxN, idxB) {
    document.getElementById(`nb-galfile-${idxN}-${idxB}`)?.click();
}

async function onGaleriaImgsChange(input, idxN, idxB) {
    const files = Array.from(input.files || []);
    if (!files.length) return;

    const bloque = noticiasData[idxN].bloques[idxB];
    if (!Array.isArray(bloque.imagenes)) bloque.imagenes = [];

    const espacioLibre = GALERIA_MAX - bloque.imagenes.length;
    const aSubir        = files.slice(0, espacioLibre);

    if (files.length > espacioLibre) {
        toast(`Solo se agregaron ${espacioLibre} imágenes (máximo ${GALERIA_MAX} por galería)`, 'error');
    }

    setStatus('Subiendo imágenes...', 'loading');
    for (const file of aSubir) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('dest', 'cuerpo');
        try {
            const res  = await fetch('/api/noticias/upload-image', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.ok) bloque.imagenes.push({ src: data.rel, modo: 'contain' });
        } catch (e) {
            toast('Error de red subiendo una imagen', 'error');
        }
    }
    setStatus('Imágenes subidas ✓', 'ok');
    refrescarBloques(idxN);
}

function eliminarImgGaleria(idxN, idxB, iIdx) {
    noticiasData[idxN].bloques[idxB].imagenes.splice(iIdx, 1);
    refrescarBloques(idxN);
}

function setModoGaleriaImg(idxN, idxB, iIdx, modo) {
    noticiasData[idxN].bloques[idxB].imagenes[iIdx].modo = modo;
    refrescarBloques(idxN);
}

/* ── DRAG & DROP — reordenar bloques dentro de UNA noticia
   (stopPropagation obligatorio: si no, el drag de un bloque
   termina disparando también el drag&drop de la noticia entera) ── */

let dragSrcBloque = null;

function onBloqueDragStart(e, el) {
    e.stopPropagation();
    dragSrcBloque = { idxN: +el.dataset.idxn, idxB: +el.dataset.idxb };
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function onBloqueDragOver(e, el) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.nb-card').forEach(c => c.classList.remove('drag-over'));
    el.classList.add('drag-over');
}

function onBloqueDrop(e, el) {
    e.preventDefault();
    e.stopPropagation();
    el.classList.remove('drag-over');
    if (!dragSrcBloque) return;

    const idxN       = +el.dataset.idxn;
    const idxBTarget = +el.dataset.idxb;

    /* Los bloques no se mezclan entre noticias distintas */
    if (dragSrcBloque.idxN !== idxN || dragSrcBloque.idxB === idxBTarget) {
        dragSrcBloque = null;
        return;
    }

    const bloques = noticiasData[idxN].bloques;
    const moved   = bloques.splice(dragSrcBloque.idxB, 1)[0];
    bloques.splice(idxBTarget, 0, moved);
    refrescarBloques(idxN);
    dragSrcBloque = null;
}

function onBloqueDragEnd(e, el) {
    e.stopPropagation();
    el.classList.remove('dragging');
    document.querySelectorAll('.nb-card').forEach(c => c.classList.remove('drag-over'));
    dragSrcBloque = null;
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
   texto largos se ven completos, sin scroll interno ni clicks extra */
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