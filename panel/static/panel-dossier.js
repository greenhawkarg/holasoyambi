/* ══════════════════════════════════════════════════════════════════
   AMBI — PANEL DE CONTROL — Módulo Dossier
   Archivo : panel/static/panel-dossier.js
   Depende de: panel-utils.js
══════════════════════════════════════════════════════════════════ */

    /* ══════════════════════════════════════════════════════════════════
       DOSSIER — ESTADO GLOBAL
    ══════════════════════════════════════════════════════════════════ */

    let dossier = {
      header: { subtitulo: "Streamer · Content Creator · Gaming Press",
                stat1_num: "4+",  stat1_lbl: "Años activo",
                stat2_num: "60+", stat2_lbl: "Campañas",
                stat3_num: "15+", stat3_lbl: "Studios & Sponsors" },
      sponsors_intro: "Campañas y colaboraciones con estudios de videojuegos con los que hemos trabajado a lo largo de mi carrera hasta la fecha.",
      campanas:  [],   // [{anio, titulo, desc, imagen}]
      disenos:   [],   // [{caption, imagen}]
      sponsors:  []    // [{nombre, url, imagen}]
    };

    let dDragSrc = null;  // índice origen del drag en dossier


    /* ══════════════════════════════════════════════════════════════════
       DOSSIER — SUB-TABS
    ══════════════════════════════════════════════════════════════════ */

    function switchDossierTab(name) {
      ['campanas','disenos','sponsors'].forEach(t => {
        document.getElementById('dtab-' + t).style.display = (t === name) ? '' : 'none';
        const btn = document.getElementById('dsub-' + t);
        if (btn) btn.classList.toggle('active', t === name);
      });
    }


    /* ══════════════════════════════════════════════════════════════════
       DOSSIER — CARGA INICIAL
    ══════════════════════════════════════════════════════════════════ */

    async function loadDossier() {
      try {
        const res  = await fetch('/api/dossier');
        const data = await res.json();
        if (data && data.campanas) {
          dossier = data;
        }
      } catch(e) { /* primer uso: usa defaults */ }
      renderDossier();
    }


    /* ══════════════════════════════════════════════════════════════════
       DOSSIER — POBLAR CAMPOS HEADER
    ══════════════════════════════════════════════════════════════════ */

    function renderDossierHeader() {
      const h = dossier.header || {};
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
      set('d-subtitulo',  h.subtitulo);
      set('d-stat1-num',  h.stat1_num);
      set('d-stat1-lbl',  h.stat1_lbl);
      set('d-stat2-num',  h.stat2_num);
      set('d-stat2-lbl',  h.stat2_lbl);
      set('d-stat3-num',  h.stat3_num);
      set('d-stat3-lbl',  h.stat3_lbl);
      const intro = document.getElementById('d-sponsors-intro');
      if (intro) intro.value = dossier.sponsors_intro || '';
      if (dossier.sponsors_photo) {
        const preview = document.getElementById('sp-photo-preview');
        if (preview) preview.innerHTML = `<img src="/${dossier.sponsors_photo}" style="width:100%;height:100%;object-fit:cover">`;
      }
    }


    /* ══════════════════════════════════════════════════════════════════
       DOSSIER — RENDER COMPLETO
    ══════════════════════════════════════════════════════════════════ */

    function renderDossier() {
      renderDossierHeader();
      renderCampanas();
      renderDisenos();
      renderSponsors();
    }


    /* ── CAMPAÑAS ───────────────────────────────────────────────────── */

    function renderCampanas() {
      const list = document.getElementById('campanas-list');
      list.innerHTML = '';

      // ── Botón "Agregar año" ──
      const addBtn = document.createElement('div');
      addBtn.style.cssText = 'margin-bottom:20px';
      addBtn.innerHTML = `
        <button class="btn btn-sm" onclick="agregarZonaUpload()" style="border-style:dashed;color:var(--purple);border-color:rgba(145,70,255,.4)">
          ＋ Agregar zona de año para subida masiva
        </button>
        <div id="mup-zonas" style="margin-top:10px"></div>
      `;
      list.appendChild(addBtn);

      // ── Bloques por año con sus flyers ──
      const byAnio = {};
      dossier.campanas.forEach((c, i) => {
        if (!byAnio[c.anio]) byAnio[c.anio] = [];
        byAnio[c.anio].push({ ...c, _idx: i });
      });

      const anios = Object.keys(byAnio).sort((a,b) => b - a);

      anios.forEach(anio => {
        const block = document.createElement('div');
        block.style.cssText = 'margin-bottom:28px';

        const items = byAnio[anio];
        const desc  = items[0].desc || '';

        block.innerHTML = `
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:8px">
            <span style="font-size:22px;font-weight:700">${anio}</span>
            <div style="flex:1;height:1px;background:var(--border)"></div>
            <span style="font-size:11px;color:var(--muted)">${items.length} flyer${items.length!==1?'s':''}</span>
            <button onclick="eliminarAnio('${anio}')"
              style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:var(--red);
                     padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer">
              🗑 Eliminar año
            </button>
          </div>
          <div class="form-group" style="margin-bottom:12px">
            <label class="form-label">Descripción del año</label>
            <input class="form-input" type="text" value="${desc.replace(/"/g,'&quot;')}"
                   oninput="syncAnioDesc('${anio}',this.value)" placeholder="Texto descriptivo...">
          </div>
          <div id="campanas-grid-${anio}" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px"></div>
        `;
        list.appendChild(block);

        const grid = document.getElementById('campanas-grid-' + anio);
        items.forEach(item => grid.appendChild(buildCampanaCard(item, item._idx)));
      });

      document.getElementById('campanas-count').textContent = `(${dossier.campanas.length} flyers)`;
    }

    function syncAnioDesc(anio, val) {
      dossier.campanas.filter(c => c.anio === anio).forEach(c => c.desc = val);
    }

    function eliminarAnio(anio) {
      const cantidad = dossier.campanas.filter(c => String(c.anio) === String(anio)).length;
      if (!confirm(`¿Eliminar los ${cantidad} flyer${cantidad!==1?'s':''} de ${anio}? Esta acción no se puede deshacer.`)) return;
      dossier.campanas = dossier.campanas.filter(c => String(c.anio) !== String(anio));
      renderCampanas();
    }


    /* ══════════════════════════════════════════════════════════════════
       MULTI-UPLOAD — zonas dinámicas por año
    ══════════════════════════════════════════════════════════════════ */

    let mupCounter = 0;

    function agregarZonaUpload() {
      const container = document.getElementById('mup-zonas');
      if (!container) return;

      const id   = ++mupCounter;
      const year = new Date().getFullYear();

      const block = document.createElement('div');
      block.className = 'mup-block';
      block.id        = 'mup-block-' + id;

      block.innerHTML = `
        <div class="mup-header">
          <span style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">Año</span>
          <input class="mup-year-input" type="number" value="${year}" min="2000" max="2099" id="mup-year-${id}">
          <button class="mup-remove" onclick="quitarZonaUpload(${id})" title="Cerrar zona">✕</button>
        </div>
        <div class="mup-zone" id="mup-zone-${id}"
             onclick="document.getElementById('mup-input-${id}').click()"
             ondragover="event.preventDefault();this.classList.add('dragover')"
             ondragleave="this.classList.remove('dragover')"
             ondrop="mupHandleDrop(event,${id})">
          <div class="mup-zone-icon">📂</div>
          <div class="mup-zone-label">
            <strong>Hacé click o arrastrá imágenes acá</strong><br>
            Seleccioná varias a la vez · JPG, PNG, WEBP
          </div>
          <div class="mup-progress" id="mup-prog-${id}">
            <div class="mup-progress-bar" id="mup-bar-${id}"></div>
          </div>
          <div class="mup-status" id="mup-status-${id}"></div>
        </div>
        <input type="file" id="mup-input-${id}" accept=".jpg,.jpeg,.png,.webp" multiple style="display:none"
               onchange="mupHandleFiles(this.files,${id})">
      `;

      container.appendChild(block);
      setTimeout(() => block.querySelector('.mup-year-input').select(), 50);
    }

    function quitarZonaUpload(id) {
      const el = document.getElementById('mup-block-' + id);
      if (el) el.remove();
    }

    function mupHandleDrop(event, id) {
      event.preventDefault();
      document.getElementById('mup-zone-' + id).classList.remove('dragover');
      mupHandleFiles(event.dataTransfer.files, id);
    }

    function mupFileToTitle(filename) {
      return filename
        .replace(/\.[^.]+$/, '')
        .replace(/[_\-]+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }

    async function mupHandleFiles(files, id) {
      if (!files || files.length === 0) return;

      const anio   = String(document.getElementById('mup-year-' + id).value).trim();
      const prog   = document.getElementById('mup-prog-'   + id);
      const bar    = document.getElementById('mup-bar-'    + id);
      const status = document.getElementById('mup-status-' + id);
      const input  = document.getElementById('mup-input-'  + id);

      prog.style.display = 'block';
      bar.style.width    = '0%';

      let ok = 0, fail = 0;
      const total = files.length;

      for (let i = 0; i < total; i++) {
        const file = files[i];
        status.textContent = `Subiendo ${i + 1} de ${total}: ${file.name}`;
        bar.style.width    = `${Math.round((i / total) * 100)}%`;

        const fd = new FormData();
        fd.append('file', file);
        fd.append('dest', 'dossier_flyers');
        fd.append('anio', anio);

        try {
          const res  = await fetch('/api/dossier/upload-image', { method: 'POST', body: fd });
          const data = await res.json();
          if (data.ok) {
            dossier.campanas.push({ anio, titulo: mupFileToTitle(file.name), desc: '', imagen: data.rel });
            ok++;
          } else { fail++; }
        } catch(e) { fail++; }
      }

      bar.style.width    = '100%';
      status.textContent = fail === 0
        ? `✅ ${ok} imagen${ok !== 1 ? 'es' : ''} agregada${ok !== 1 ? 's' : ''} al año ${anio}`
        : `✅ ${ok} OK  ⚠️ ${fail} con error`;

      if (input) input.value = '';

      renderCampanas();
      toast(`✅ ${ok} flyer${ok !== 1 ? 's' : ''} agregado${ok !== 1 ? 's' : ''} al año ${anio}`);
    }

    function buildCampanaCard(item, idx) {
      const wrap = document.createElement('div');
      wrap.dataset.idx = idx;
      wrap.draggable   = true;
      wrap.style.cssText = 'position:relative;cursor:grab;border-radius:6px;overflow:hidden;border:1px solid var(--border);transition:.2s';

      const imgSrc = item.imagen ? '/' + item.imagen : '';
      wrap.innerHTML = `
        <!-- imagen clickeable para reemplazar -->
        <div class="campana-img-wrap" style="background:var(--bg3);overflow:hidden;line-height:0;position:relative;cursor:pointer"
             onclick="triggerCampanaImg(${idx})" title="Click para cambiar imagen">
          ${imgSrc
            ? `<img id="campana-img-${idx}" src="${imgSrc}" style="width:100%;height:auto;display:block">`
            : '<div style="aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:11px;line-height:1">Click para agregar imagen</div>'}
          <div style="position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;opacity:0;transition:.2s;font-size:20px"
               class="campana-img-hover">🖼</div>
        </div>
        <input type="file" id="campana-file-${idx}" accept=".jpg,.jpeg,.png,.webp" style="display:none" onchange="uploadCampanaImg(${idx},this)">
        <!-- footer: año editable + título editable -->
        <div style="background:var(--bg2);border-top:1px solid var(--border)">
          <!-- fila año -->
          <div style="padding:4px 8px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px">
            <span style="font-size:10px;color:var(--muted);flex-shrink:0">AÑO</span>
            <select class="campana-anio-sel" style="background:transparent;border:none;color:var(--cyan);font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font);flex:1"
                    onchange="dossier.campanas[${idx}].anio=this.value;renderCampanas()" onclick="event.stopPropagation()">
              ${['2026','2025','2024','2023','2022'].map(y => `<option value="${y}"${y===String(item.anio)?' selected':''}>${y}</option>`).join('')}
            </select>
          </div>
          <!-- fila título -->
          <div class="campana-label" style="padding:6px 8px;display:flex;align-items:center;gap:6px;cursor:text" title="Click para editar nombre">
            <span class="campana-titulo" style="font-size:11px;font-weight:700;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text)">
              ${item.titulo || '(sin nombre)'}
            </span>
            <span style="font-size:10px;color:var(--muted);flex-shrink:0">✏️</span>
          </div>
        </div>
        <button onclick="eliminarCampana(${idx})" title="Eliminar"
                style="position:absolute;top:4px;right:4px;background:rgba(239,68,68,.85);border:none;color:#fff;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center">✕</button>
      `;

      // ── Edición inline del nombre al hacer click en el label ──
      const label  = wrap.querySelector('.campana-label');
      const titulo = wrap.querySelector('.campana-titulo');
      label.addEventListener('click', (e) => {
        e.stopPropagation();
        wrap.draggable = false; // desactivar drag mientras se edita
        const input = document.createElement('input');
        input.value = dossier.campanas[idx].titulo || '';
        input.style.cssText = 'width:100%;background:var(--bg4);border:1px solid var(--purple);border-radius:4px;color:var(--text);font-size:11px;font-weight:700;padding:2px 6px;font-family:var(--font)';
        label.innerHTML = '';
        label.appendChild(input);
        input.focus();
        input.select();
        const confirm = () => {
          const val = input.value.trim();
          dossier.campanas[idx].titulo = val;
          titulo.textContent = val || '(sin nombre — click para editar)';
          label.innerHTML = `
            <span class="campana-titulo" style="font-size:11px;font-weight:700;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text)">
              ${val || '(sin nombre — click para editar)'}
            </span>
            <span style="font-size:10px;color:var(--muted);flex-shrink:0">✏️</span>`;
          wrap.draggable = true;
          // re-attachear el listener
          label.addEventListener('click', arguments.callee, { once: true });
        };
        input.addEventListener('blur',   confirm);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); if (e.key === 'Escape') { input.value = dossier.campanas[idx].titulo || ''; input.blur(); } });
      });

      // ── Hover en imagen ──
      const imgWrap = wrap.querySelector('.campana-img-wrap');
      const imgHover = wrap.querySelector('.campana-img-hover');
      if (imgWrap && imgHover) {
        imgWrap.addEventListener('mouseenter', () => imgHover.style.opacity = '1');
        imgWrap.addEventListener('mouseleave', () => imgHover.style.opacity = '0');
      }

      // Drag & Drop
      wrap.addEventListener('dragstart', e => { dDragSrc = idx; setTimeout(() => wrap.style.opacity = '.4', 0); e.dataTransfer.effectAllowed = 'move'; });
      wrap.addEventListener('dragend',   () => { wrap.style.opacity = ''; document.querySelectorAll('.campana-dragover').forEach(el => el.classList.remove('campana-dragover')); });
      wrap.addEventListener('dragover',  e => { e.preventDefault(); if (dDragSrc !== null && dDragSrc !== idx) wrap.style.outline = '2px solid var(--purple)'; });
      wrap.addEventListener('dragleave', () => wrap.style.outline = '');
      wrap.addEventListener('drop', e => {
        e.preventDefault(); wrap.style.outline = '';
        if (dDragSrc === null || dDragSrc === idx) return;
        const moved = dossier.campanas.splice(dDragSrc, 1)[0];
        dossier.campanas.splice(idx, 0, moved);
        dDragSrc = null;
        renderCampanas();
      });

      return wrap;
    }

    function triggerCampanaImg(idx) {
      const input = document.getElementById('campana-file-' + idx);
      if (input) input.click();
    }

    async function uploadCampanaImg(idx, input) {
      const file = input.files[0]; if (!file) return;
      // Preview inmediato
      const reader = new FileReader();
      reader.onload = e => {
        const img = document.getElementById('campana-img-' + idx);
        if (img) { img.src = e.target.result; }
        else {
          const wrap = document.querySelector('[data-idx="' + idx + '"] .campana-img-wrap');
          if (wrap) wrap.innerHTML = '<img id="campana-img-' + idx + '" src="' + e.target.result + '" style="width:100%;height:auto;display:block"><div style="position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;opacity:0;transition:.2s;font-size:20px" class="campana-img-hover">🖼</div>';
        }
      };
      reader.readAsDataURL(file);
      // Upload al servidor
      const anioActual = dossier.campanas[idx] ? String(dossier.campanas[idx].anio || '') : '';
      const fd = new FormData(); fd.append('file', file); fd.append('dest', 'dossier_flyers'); fd.append('anio', anioActual);
      try {
        const res  = await fetch('/api/dossier/upload-image', { method:'POST', body:fd });
        const data = await res.json();
        if (data.ok) { dossier.campanas[idx].imagen = data.rel; toast('✅ Imagen actualizada'); }
        else toast('Error: ' + data.msg, 'err');
      } catch(e) { toast('Error subiendo imagen', 'err'); }
    }

    function eliminarCampana(idx) {
      if (!confirm('¿Eliminar este flyer?')) return;
      dossier.campanas.splice(idx, 1);
      renderCampanas();
    }


    /* ── DISEÑOS ────────────────────────────────────────────────────── */

    /* Mapa fijo: subcategoría → categoría padre */
    const DISENO_CATS = {
      'Key Art':                '🎮 GAMING',
      'Stream Overlay':         '🎮 GAMING',
      'HUD & Gameplay Overlay': '🎮 GAMING',
      'Gaming Artwork':         '🎮 GAMING',
      'Promo Banners':          '🎮 GAMING',
      'Cinematic Photography':  '📸 PHOTOGRAPHY',
      'Portraits':              '📸 PHOTOGRAPHY',
      'Visual Stories':         '📸 PHOTOGRAPHY',
      'Cinematics':             '🎬 FILMMAKING',
      'Video Editing':          '🎬 FILMMAKING',
      'Motion Design':          '🎬 FILMMAKING',
      'Creative Direction':     '🎨 CREATIVE',
      'Visual Identity':        '🎨 CREATIVE',
      'Artwork & Design':       '🎨 CREATIVE',
    };

    /* Orden fijo de los padres (alfabético) */
    const DISENO_PADRES = ['🎨 CREATIVE','🎬 FILMMAKING','🎮 GAMING','📸 PHOTOGRAPHY'];

    /* Select agrupado para usar en panel nuevo y en cards */
    function buildDisenoSelectHTML(selected) {
      const grupos = {
        '🎮 GAMING':      ['Key Art','Stream Overlay','HUD & Gameplay Overlay','Gaming Artwork','Promo Banners'],
        '📸 PHOTOGRAPHY': ['Cinematic Photography','Portraits','Visual Stories'],
        '🎬 FILMMAKING':  ['Cinematics','Video Editing','Motion Design'],
        '🎨 CREATIVE':    ['Creative Direction','Visual Identity','Artwork & Design'],
      };
      return Object.entries(grupos).map(([grupo, subs]) =>
        `<optgroup label="${grupo}">` +
        subs.map(s => `<option value="${s}"${s === selected ? ' selected' : ''}>${s}</option>`).join('') +
        `</optgroup>`
      ).join('');
    }

    function renderDisenos() {
      const list = document.getElementById('disenos-list');
      list.innerHTML = '';

      if (dossier.disenos.length === 0) {
        list.innerHTML = '<p style="color:var(--muted);font-size:13px;margin-top:8px">No hay diseños cargados todavía.</p>';
        document.getElementById('disenos-count').textContent = '(0 diseños)';
        return;
      }

      /* Agrupar por padre */
      const byPadre = {};
      const sinCategoria = [];
      dossier.disenos.forEach((d, i) => {
        const padre = DISENO_CATS[d.categoria] || null;
        if (!padre) {
          sinCategoria.push({ ...d, _idx: i });
        } else {
          if (!byPadre[padre]) byPadre[padre] = [];
          byPadre[padre].push({ ...d, _idx: i });
        }
      });

      /* Helper para construir un bloque de grupo */
      function buildGrupoBlock(titulo, items, esHuerfano) {
        const block = document.createElement('div');
        block.style.cssText = 'margin-bottom:32px';

        const headerColor = esHuerfano ? 'var(--red)' : 'inherit';
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;gap:14px;margin-bottom:12px';
        header.innerHTML = `
          <span style="font-size:18px;font-weight:900;letter-spacing:1px;text-transform:uppercase;color:${headerColor}">${titulo}</span>
          <div style="flex:1;height:1px;background:var(--border)"></div>
          <span style="font-size:11px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase">
            ${items.length} Diseño${items.length !== 1 ? 's' : ''}
          </span>
        `;
        block.appendChild(header);

        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:12px';
        items.forEach(item => grid.appendChild(buildDisenoCard(item, item._idx)));
        block.appendChild(grid);
        return block;
      }

      /* Renderizar en orden fijo alfabético */
      DISENO_PADRES.forEach(padre => {
        if (!byPadre[padre]) return;
        list.appendChild(buildGrupoBlock(padre, byPadre[padre], false));
      });

      /* Bloque huérfanos — al final, en rojo */
      if (sinCategoria.length > 0) {
        const aviso = document.createElement('div');
        aviso.style.cssText = 'margin-bottom:8px;padding:8px 12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:8px;font-size:12px;color:var(--red)';
        aviso.textContent = '⚠️ Estos diseños no tienen categoría asignada. Asignales una desde el selector en cada card para que aparezcan en el dossier correctamente.';
        list.appendChild(aviso);
        list.appendChild(buildGrupoBlock('⚠️ SIN CATEGORÍA', sinCategoria, true));
      }

      document.getElementById('disenos-count').textContent = `(${dossier.disenos.length} diseños)`;
    }

    function buildDisenoCard(item, idx) {
      const wrap = document.createElement('div');
      wrap.dataset.idx = idx;
      wrap.draggable = true;
      wrap.style.cssText = [
        'position:relative',
        'border-radius:8px',
        'overflow:hidden',
        'border:1px solid var(--border)',
        'background:var(--bg2)',
        'cursor:grab',
        'transition:transform .2s, box-shadow .2s, border-color .2s',
      ].join(';');

      const imgSrc = item.imagen ? '/' + item.imagen : '';

      wrap.innerHTML = `
        <!-- Imagen 16:9 — click para reemplazar -->
        <div class="diseno-img-wrap" style="position:relative;aspect-ratio:16/9;background:var(--bg4);overflow:hidden;cursor:pointer"
             onclick="triggerDisenoImg(${idx})" title="Click para cambiar imagen">
          ${imgSrc
            ? `<img id="dimg-${idx}" src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;display:block;transition:transform .25s">`
            : `<div id="dimg-${idx}" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:11px">Sin imagen</div>`
          }
          <div class="diseno-img-hover" style="position:absolute;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;opacity:0;transition:.2s;font-size:22px;pointer-events:none">🖼 Cambiar</div>
        </div>
        <input type="file" id="dimg-file-${idx}" accept=".jpg,.jpeg,.png,.webp" style="display:none" onchange="uploadDisenoImg(${idx},this)">

        <!-- Footer: categoría + caption + eliminar -->
        <div style="padding:7px 9px;display:flex;flex-direction:column;gap:5px;background:var(--bg2);border-top:1px solid var(--border)">
          <select class="form-input" style="font-size:11px;padding:4px 6px;color:var(--purple);font-weight:600;cursor:pointer"
                  onclick="event.stopPropagation()"
                  onchange="event.stopPropagation();dossier.disenos[${idx}].categoria=this.value;renderDisenos()">
            ${buildDisenoSelectHTML(item.categoria || '')}
          </select>
          <div style="display:flex;align-items:center;gap:6px">
            <input class="form-input" type="text"
                   value="${(item.caption || '').replace(/"/g,'&quot;')}"
                   placeholder="Caption..."
                   style="flex:1;font-size:11px;padding:5px 8px;cursor:text"
                   onclick="event.stopPropagation()"
                   oninput="dossier.disenos[${idx}].caption=this.value">
            <button onclick="event.stopPropagation();eliminarDiseno(${idx})" title="Eliminar"
                    style="flex-shrink:0;width:28px;height:28px;display:flex;align-items:center;justify-content:center;
                           background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);
                           color:var(--red);border-radius:6px;cursor:pointer;font-size:13px">✕</button>
          </div>
        </div>
      `;

      // ── Hover: levanta la card (sin zoom) + muestra overlay ──
      wrap.addEventListener('mouseenter', () => {
        wrap.style.transform   = 'translateY(-4px)';
        wrap.style.boxShadow   = '0 8px 24px rgba(0,0,0,.55)';
        wrap.style.borderColor = 'rgba(255,255,255,.18)';
        const hover = wrap.querySelector('.diseno-img-hover');
        if (hover) hover.style.opacity = '1';
      });
      wrap.addEventListener('mouseleave', () => {
        wrap.style.transform   = '';
        wrap.style.boxShadow   = '';
        wrap.style.borderColor = '';
        const hover = wrap.querySelector('.diseno-img-hover');
        if (hover) hover.style.opacity = '0';
      });

      // ── Drag & Drop ──
      wrap.addEventListener('dragstart', e => {
        dDragSrc = idx;
        setTimeout(() => wrap.style.opacity = '.4', 0);
        e.dataTransfer.effectAllowed = 'move';
      });
      wrap.addEventListener('dragend', () => {
        wrap.style.opacity = '';
        document.querySelectorAll('[data-diseno-drag]').forEach(el => el.removeAttribute('data-diseno-drag'));
      });
      wrap.addEventListener('dragover', e => {
        e.preventDefault();
        if (dDragSrc !== null && dDragSrc !== idx)
          wrap.style.outline = '2px solid var(--purple)';
      });
      wrap.addEventListener('dragleave', () => wrap.style.outline = '');
      wrap.addEventListener('drop', e => {
        e.preventDefault();
        wrap.style.outline = '';
        if (dDragSrc === null || dDragSrc === idx) return;
        const moved = dossier.disenos.splice(dDragSrc, 1)[0];
        dossier.disenos.splice(idx, 0, moved);
        dDragSrc = null;
        renderDisenos();
      });

      return wrap;
    }

    function triggerDisenoImg(idx) {
      const input = document.getElementById('dimg-file-' + idx);
      if (input) input.click();
    }

    function eliminarDiseno(idx) {
      if (!confirm('¿Eliminar este diseño?')) return;
      dossier.disenos.splice(idx, 1);
      renderDisenos();
    }

    async function uploadDisenoImg(idx, input) {
      const file = input.files[0]; if (!file) return;

      // Preview inmediato
      const reader = new FileReader();
      reader.onload = e => {
        const wrap = document.querySelector(`[data-idx="${idx}"] .diseno-img-wrap`);
        if (wrap) {
          let img = document.getElementById('dimg-' + idx);
          if (img && img.tagName === 'IMG') {
            img.src = e.target.result;
          } else {
            wrap.innerHTML = `
              <img id="dimg-${idx}" src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;display:block;transition:transform .25s">
              <div class="diseno-img-hover" style="position:absolute;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;opacity:0;transition:.2s;font-size:22px;pointer-events:none">🖼 Cambiar</div>
            `;
          }
        }
      };
      reader.readAsDataURL(file);

      // Upload al servidor
      const fd = new FormData();
      fd.append('file', file);
      fd.append('dest', 'dossier_overlays');
      try {
        const res  = await fetch('/api/dossier/upload-image', { method:'POST', body:fd });
        const data = await res.json();
        if (data.ok) { dossier.disenos[idx].imagen = data.rel; toast('✅ Imagen actualizada'); }
        else toast('Error subiendo imagen: ' + data.msg, 'err');
      } catch(e) { toast('Error subiendo imagen', 'err'); }
    }


    /* ── SPONSORS ───────────────────────────────────────────────────── */

    /* Counter para zonas de multi-upload de sponsors */
    let supCounter = 0;

    function renderSponsors() {
      const list = document.getElementById('sponsors-list');
      list.innerHTML = '';

      // ── Botón "Agregar categoría" ──
      const addBtn = document.createElement('div');
      addBtn.style.cssText = 'margin-bottom:20px';
      addBtn.innerHTML = `
        <button class="btn btn-sm" onclick="agregarZonaUploadSponsor()" style="border-style:dashed;color:var(--purple);border-color:rgba(145,70,255,.4)">
          ＋ Agregar zona de categoría para subida masiva
        </button>
        <div id="sup-zonas" style="margin-top:10px"></div>
      `;
      list.appendChild(addBtn);

      // ── Bloques por categoría ──
      const byCat = {};
      dossier.sponsors.forEach((s, i) => {
        const cat = s.categoria || 'Sin categoría';
        if (!byCat[cat]) byCat[cat] = [];
        byCat[cat].push({ ...s, _idx: i });
      });

      const cats = Object.keys(byCat);

      cats.forEach(cat => {
        const block = document.createElement('div');
        block.style.cssText = 'margin-bottom:28px';

        const items = byCat[cat];

        block.innerHTML = `
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:8px">
            <span style="font-size:22px;font-weight:700">${cat}</span>
            <div style="flex:1;height:1px;background:var(--border)"></div>
            <span style="font-size:11px;color:var(--muted)">${items.length} logo${items.length!==1?'s':''}</span>
            <button onclick="eliminarCategoriaSponsor('${cat.replace(/'/g,"\\'")}')"
              style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:var(--red);
                     padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer">
              🗑 Eliminar categoría
            </button>
          </div>
          <div id="sponsors-grid-${CSS.escape(cat)}" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px"></div>
        `;
        list.appendChild(block);

        const grid = document.getElementById('sponsors-grid-' + CSS.escape(cat));
        items.forEach(item => grid.appendChild(buildSponsorCard(item, item._idx)));
      });

      document.getElementById('sponsors-count').textContent = `(${dossier.sponsors.length} sponsors)`;
    }

    function eliminarCategoriaSponsor(cat) {
      const cantidad = dossier.sponsors.filter(s => (s.categoria || 'Sin categoría') === cat).length;
      if (!confirm(`¿Eliminar los ${cantidad} logo${cantidad!==1?'s':''} de "${cat}"? Esta acción no se puede deshacer.`)) return;
      dossier.sponsors = dossier.sponsors.filter(s => (s.categoria || 'Sin categoría') !== cat);
      renderSponsors();
    }

    /* ══════════════════════════════════════════════════════════════════
       MULTI-UPLOAD SPONSORS — zonas dinámicas por categoría
    ══════════════════════════════════════════════════════════════════ */

    function agregarZonaUploadSponsor() {
      const container = document.getElementById('sup-zonas');
      if (!container) return;

      const id = ++supCounter;

      const block = document.createElement('div');
      block.className = 'mup-block';
      block.id        = 'sup-block-' + id;

      block.innerHTML = `
        <div class="mup-header">
          <span style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">Categoría</span>
          <select class="mup-year-input" id="sup-cat-${id}" style="width:200px">
            <option value="Collab">Collab</option>
            <option value="Marketing / PR">Marketing / PR</option>
            <option value="Partner &amp; Creator Programs">Partner &amp; Creator Programs</option>
            <option value="Press &amp; Creator">Press &amp; Creator</option>
            <option value="Publishers">Publishers</option>
            <option value="Services &amp; Tech">Services &amp; Tech</option>
            <option value="Sponsors">Sponsors</option>
            <option value="Studios" selected>Studios</option>
          </select>
          <button class="mup-remove" onclick="quitarZonaUploadSponsor(${id})" title="Cerrar zona">✕</button>
        </div>
        <div class="mup-zone" id="sup-zone-${id}"
             onclick="document.getElementById('sup-input-${id}').click()"
             ondragover="event.preventDefault();this.classList.add('dragover')"
             ondragleave="this.classList.remove('dragover')"
             ondrop="supHandleDrop(event,${id})">
          <div class="mup-zone-icon">📂</div>
          <div class="mup-zone-label">
            <strong>Hacé click o arrastrá logos acá</strong><br>
            Seleccioná varios a la vez · JPG, PNG, WEBP, SVG
          </div>
          <div class="mup-progress" id="sup-prog-${id}">
            <div class="mup-progress-bar" id="sup-bar-${id}"></div>
          </div>
          <div class="mup-status" id="sup-status-${id}"></div>
        </div>
        <input type="file" id="sup-input-${id}" accept=".jpg,.jpeg,.png,.webp,.svg" multiple style="display:none"
               onchange="supHandleFiles(this.files,${id})">
      `;

      container.appendChild(block);
      setTimeout(() => block.querySelector('.mup-year-input').select(), 50);
    }

    function quitarZonaUploadSponsor(id) {
      const el = document.getElementById('sup-block-' + id);
      if (el) el.remove();
    }

    function supHandleDrop(event, id) {
      event.preventDefault();
      document.getElementById('sup-zone-' + id).classList.remove('dragover');
      supHandleFiles(event.dataTransfer.files, id);
    }

    function supFileToNombre(filename) {
      return filename
        .replace(/\.[^.]+$/, '')
        .replace(/[_\-]+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }

    async function supHandleFiles(files, id) {
      if (!files || files.length === 0) return;

      const cat    = String(document.getElementById('sup-cat-' + id).value).trim() || 'Sin categoría';
      const prog   = document.getElementById('sup-prog-'   + id);
      const bar    = document.getElementById('sup-bar-'    + id);
      const status = document.getElementById('sup-status-' + id);
      const input  = document.getElementById('sup-input-'  + id);

      prog.style.display = 'block';
      bar.style.width    = '0%';

      let ok = 0, fail = 0;
      const total = files.length;

      for (let i = 0; i < total; i++) {
        const file = files[i];
        status.textContent = `Subiendo ${i + 1} de ${total}: ${file.name}`;
        bar.style.width    = `${Math.round((i / total) * 100)}%`;

        const fd = new FormData();
        fd.append('file', file);
        fd.append('dest', 'dossier_sponsors');
        fd.append('categoria', cat);

        try {
          const res  = await fetch('/api/dossier/upload-image', { method: 'POST', body: fd });
          const data = await res.json();
          if (data.ok) {
            dossier.sponsors.push({ categoria: cat, nombre: supFileToNombre(file.name), url: '', imagen: data.rel });
            ok++;
          } else { fail++; }
        } catch(e) { fail++; }
      }

      bar.style.width    = '100%';
      status.textContent = fail === 0
        ? `✅ ${ok} logo${ok !== 1 ? 's' : ''} agregado${ok !== 1 ? 's' : ''} a "${cat}"`
        : `✅ ${ok} OK  ⚠️ ${fail} con error`;

      if (input) input.value = '';

      renderSponsors();
      toast(`✅ ${ok} logo${ok !== 1 ? 's' : ''} agregado${ok !== 1 ? 's' : ''} a "${cat}"`);
    }

    /* Opciones fijas de categoría para sponsors */
    const SPONSOR_CATS = ['Collab','Marketing / PR','Partner & Creator Programs','Press & Creator','Publishers','Services & Tech','Sponsors','Studios'];

    function buildSponsorCard(item, idx) {
      const wrap = document.createElement('div');
      wrap.dataset.idx = idx;
      wrap.draggable   = true;
      wrap.className   = 'sponsor-card';

      const imgSrc = item.imagen ? '/' + item.imagen : '';
      const catOpts = SPONSOR_CATS.map(c =>
        `<option value="${c}"${c === (item.categoria||'') ? ' selected' : ''}>${c}</option>`
      ).join('');

      wrap.innerHTML = `
        <!-- ZONA LOGO — click para reemplazar -->
        <div class="sponsor-card-logo" id="slogo-wrap-${idx}"
             onclick="document.getElementById('simg-file-${idx}').click()"
             title="Click para cambiar logo">
          ${imgSrc
            ? `<img id="slogo-img-${idx}" src="${imgSrc}" class="sponsor-logo">`
            : `<div class="sponsor-card-empty">📷<br><span>Sin logo</span></div>`}
          <div class="sponsor-card-logo-hover">🖼</div>
        </div>
        <input type="file" id="simg-file-${idx}" accept=".jpg,.jpeg,.png,.webp,.svg"
               style="display:none" onchange="uploadSponsorImg(${idx},this)">

        <!-- DATOS DEBAJO DEL LOGO -->
        <div class="sponsor-card-data">
          <input class="sponsor-card-input sponsor-card-nombre"
                 type="text" value="${(item.nombre||'').replace(/"/g,'&quot;')}"
                 placeholder="Nombre"
                 title="Nombre"
                 oninput="dossier.sponsors[${idx}].nombre=this.value">
          <select class="sponsor-card-select"
                  title="Categoría"
                  onchange="dossier.sponsors[${idx}].categoria=this.value;renderSponsors()">
            ${catOpts}
          </select>
          ${item.categoria === 'Partner & Creator Programs' ? `
          <select class="sponsor-card-select sponsor-card-badge-sel"
                  title="Tipo"
                  onchange="dossier.sponsors[${idx}].badge=this.value"
                  style="color:#22c55e;border-color:rgba(34,197,94,.3)">
            <option value="">— Tipo —</option>
            <option value="Partner"${(item.badge||'')==='Partner'?' selected':''}>Partner</option>
            <option value="Creator"${(item.badge||'')==='Creator'?' selected':''}>Creator</option>
          </select>` : ''}
          <input class="sponsor-card-input sponsor-card-url"
                 type="url" value="${(item.url||'').replace(/"/g,'&quot;')}"
                 placeholder="https://..."
                 title="URL oficial"
                 oninput="dossier.sponsors[${idx}].url=this.value">
        </div>

        <!-- BOTÓN ELIMINAR -->
        <button class="sponsor-card-del" onclick="eliminarSponsor(${idx})" title="Eliminar">✕</button>
      `;

      // hover logo
      const logoZone  = wrap.querySelector('.sponsor-card-logo');
      const logoHover = wrap.querySelector('.sponsor-card-logo-hover');
      logoZone.addEventListener('mouseenter', () => logoHover.style.opacity = '1');
      logoZone.addEventListener('mouseleave', () => logoHover.style.opacity = '0');

      // drag & drop
      wrap.addEventListener('dragstart', e => { dDragSrc = idx; setTimeout(() => wrap.style.opacity = '.4', 0); e.dataTransfer.effectAllowed = 'move'; });
      wrap.addEventListener('dragend',   () => { wrap.style.opacity = ''; document.querySelectorAll('.sponsor-card').forEach(c => c.style.outline = ''); });
      wrap.addEventListener('dragover',  e => { e.preventDefault(); if (dDragSrc !== null && dDragSrc !== idx) wrap.style.outline = '2px solid var(--purple)'; });
      wrap.addEventListener('dragleave', () => wrap.style.outline = '');
      wrap.addEventListener('drop', e => {
        e.preventDefault(); wrap.style.outline = '';
        if (dDragSrc === null || dDragSrc === idx) return;
        const moved = dossier.sponsors.splice(dDragSrc, 1)[0];
        dossier.sponsors.splice(idx, 0, moved);
        dDragSrc = null;
        renderSponsors();
      });

      return wrap;
    }
    function eliminarSponsor(idx) {
      if (!confirm('¿Eliminar este sponsor?')) return;
      dossier.sponsors.splice(idx, 1);
      renderSponsors();
    }

    async function uploadSponsorImg(idx, input) {
      const file = input.files[0]; if (!file) return;
      // Preview inmediato en la zona de logo
      const reader = new FileReader();
      reader.onload = e => {
        const zone = document.getElementById('slogo-wrap-' + idx);
        if (zone) {
          const hover = zone.querySelector('.sponsor-card-logo-hover');
          zone.innerHTML = `<img id="slogo-img-${idx}" src="${e.target.result}" class="sponsor-logo">`;
          if (hover) zone.appendChild(hover);
        }
      };
      reader.readAsDataURL(file);
      const fd = new FormData(); fd.append('file', file); fd.append('dest', 'dossier_sponsors');
      try {
        const res  = await fetch('/api/dossier/upload-image', { method:'POST', body:fd });
        const data = await res.json();
        if (data.ok) { dossier.sponsors[idx].imagen = data.rel; toast('✅ Logo actualizado'); }
        else toast('Error subiendo logo: ' + data.msg, 'err');
      } catch(e) { toast('Error subiendo logo', 'err'); }
    }


    /* ══════════════════════════════════════════════════════════════════
       DOSSIER — PANELES NUEVO
    ══════════════════════════════════════════════════════════════════ */

    /* ── CAMPAÑA ── */
    function abrirNuevoCampana() {
      ['nc-titulo','nc-desc'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('nc-anio').value    = '2026';
      document.getElementById('nc-img-file').value = '';
      document.getElementById('nc-img-name').textContent = '(ninguna)';
      document.getElementById('nc-preview').innerHTML = '<span>Sin imagen</span>';
      document.getElementById('nuevo-campana-overlay').classList.add('open');
      setTimeout(() => document.getElementById('nuevo-campana-panel').classList.add('open'), 10);
    }
    function cerrarNuevoCampana() {
      document.getElementById('nuevo-campana-panel').classList.remove('open');
      document.getElementById('nuevo-campana-overlay').classList.remove('open');
    }
    function previewNuevoCampana(input) {
      const file = input.files[0]; if (!file) return;
      document.getElementById('nc-img-name').textContent = file.name;
      document.getElementById('nc-img-name').style.color = 'var(--cyan)';
      const r = new FileReader();
      r.onload = e => { document.getElementById('nc-preview').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`; };
      r.readAsDataURL(file);
    }
    async function agregarNuevoCampana() {
      const titulo = document.getElementById('nc-titulo').value.trim();
      const anio   = document.getElementById('nc-anio').value;
      const desc   = document.getElementById('nc-desc').value.trim();
      let imgRel   = '';
      const fileInput = document.getElementById('nc-img-file');
      if (fileInput.files[0]) {
        const fd = new FormData(); fd.append('file', fileInput.files[0]); fd.append('dest', 'dossier_flyers'); fd.append('anio', anio);
        try {
          const res = await fetch('/api/dossier/upload-image', { method:'POST', body:fd });
          const data = await res.json();
          if (data.ok) imgRel = data.rel;
        } catch(e) {}
      }
      dossier.campanas.push({ anio, titulo, desc, imagen: imgRel });
      cerrarNuevoCampana();
      renderCampanas();
    }

    /* ── DISEÑO ── */
    function abrirNuevoDiseno() {
      document.getElementById('nd-caption').value   = '';
      document.getElementById('nd-img-file').value  = '';
      document.getElementById('nd-img-name').textContent = '(ninguna)';
      document.getElementById('nd-preview').innerHTML = '<span>Sin imagen</span>';
      const sel = document.getElementById('nd-categoria');
      if (sel) sel.innerHTML = buildDisenoSelectHTML('Key Art');
      document.getElementById('nuevo-diseno-overlay').classList.add('open');
      setTimeout(() => document.getElementById('nuevo-diseno-panel').classList.add('open'), 10);
    }
    function cerrarNuevoDiseno() {
      document.getElementById('nuevo-diseno-panel').classList.remove('open');
      document.getElementById('nuevo-diseno-overlay').classList.remove('open');
    }
    function previewNuevoDiseno(input) {
      const file = input.files[0]; if (!file) return;
      document.getElementById('nd-img-name').textContent = file.name;
      document.getElementById('nd-img-name').style.color = 'var(--cyan)';
      const r = new FileReader();
      r.onload = e => { document.getElementById('nd-preview').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`; };
      r.readAsDataURL(file);
    }
    async function agregarNuevoDiseno() {
      const caption = document.getElementById('nd-caption').value.trim() || 'Diseños para stream, intro.';
      let imgRel = '';
      const fileInput = document.getElementById('nd-img-file');
      if (fileInput.files[0]) {
        const fd = new FormData(); fd.append('file', fileInput.files[0]); fd.append('dest', 'dossier_overlays');
        try {
          const res = await fetch('/api/dossier/upload-image', { method:'POST', body:fd });
          const data = await res.json();
          if (data.ok) imgRel = data.rel;
        } catch(e) {}
      }
      const categoria = document.getElementById('nd-categoria') ? document.getElementById('nd-categoria').value : 'Key Art';
      dossier.disenos.push({ caption, categoria, imagen: imgRel });
      cerrarNuevoDiseno();
      renderDisenos();
    }

    /* ── SPONSOR ── */
    function abrirNuevoSponsor() {
      ['ns-nombre','ns-url','ns-categoria'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('ns-img-file').value  = '';
      document.getElementById('ns-img-name').textContent = '(ninguna)';
      document.getElementById('ns-preview').innerHTML = '<span style="color:var(--muted)">Sin logo</span>';
      document.getElementById('nuevo-sponsor-overlay').classList.add('open');
      setTimeout(() => document.getElementById('nuevo-sponsor-panel').classList.add('open'), 10);
    }
    function cerrarNuevoSponsor() {
      document.getElementById('nuevo-sponsor-panel').classList.remove('open');
      document.getElementById('nuevo-sponsor-overlay').classList.remove('open');
    }
    function previewNuevoSponsor(input) {
      const file = input.files[0]; if (!file) return;
      document.getElementById('ns-img-name').textContent = file.name;
      document.getElementById('ns-img-name').style.color = 'var(--cyan)';
      const r = new FileReader();
      r.onload = e => { document.getElementById('ns-preview').innerHTML = `<img src="${e.target.result}" class="sponsor-logo">`; };
      r.readAsDataURL(file);
    }
    async function agregarNuevoSponsor() {
      const nombre    = document.getElementById('ns-nombre').value.trim();
      const url       = document.getElementById('ns-url').value.trim();
      const categoria = document.getElementById('ns-categoria').value.trim() || 'Sin categoría';
      if (!nombre) { toast('El nombre no puede estar vacío', 'err'); return; }
      let imgRel = '';
      const fileInput = document.getElementById('ns-img-file');
      if (fileInput.files[0]) {
        const fd = new FormData(); fd.append('file', fileInput.files[0]); fd.append('dest', 'dossier_sponsors');
        try {
          const res = await fetch('/api/dossier/upload-image', { method:'POST', body:fd });
          const data = await res.json();
          if (data.ok) imgRel = data.rel;
        } catch(e) {}
      }
      dossier.sponsors.push({ nombre, url, categoria, imagen: imgRel });
      cerrarNuevoSponsor();
      renderSponsors();
    }


    /* ══════════════════════════════════════════════════════════════════
       DOSSIER — GUARDAR
       Lee los campos del header, guarda en JSON y regenera dossier.html
    ══════════════════════════════════════════════════════════════════ */

    async function guardarDossier() {
      // Leer campos del header antes de enviar
      const get = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
      dossier.header = {
        subtitulo: get('d-subtitulo'),
        stat1_num: get('d-stat1-num'), stat1_lbl: get('d-stat1-lbl'),
        stat2_num: get('d-stat2-num'), stat2_lbl: get('d-stat2-lbl'),
        stat3_num: get('d-stat3-num'), stat3_lbl: get('d-stat3-lbl'),
      };
      dossier.sponsors_intro = get('d-sponsors-intro');
      // sponsors_photo ya se actualiza en uploadSponsorsPhoto/quitarSponsorsPhoto

      setStatus('Guardando...', '');
      try {
        const res  = await fetch('/api/dossier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dossier)
        });
        const data = await res.json();
        if (data.ok) {
          toast('✅ Dossier guardado');
          setStatus('Guardado', 'ok');
        } else {
          toast('Error: ' + data.msg, 'err');
          setStatus('Error', 'err');
        }
      } catch(e) {
        toast('Error de conexión', 'err');
        setStatus('Error', 'err');
      }
    }

    loadAgenda();
    loadDossier();

    async function uploadSponsorsPhoto(input) {
      const file = input.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById('sp-photo-preview').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;
      };
      reader.readAsDataURL(file);
      const fd = new FormData(); fd.append('file', file); fd.append('dest', 'dossier_sponsors');
      try {
        const res  = await fetch('/api/dossier/upload-image', { method:'POST', body:fd });
        const data = await res.json();
        if (data.ok) { dossier.sponsors_photo = data.rel; toast('✅ Foto subida'); }
        else toast('Error subiendo foto', 'err');
      } catch(e) { toast('Error subiendo foto', 'err'); }
    }

    function quitarSponsorsPhoto() {
      dossier.sponsors_photo = '';
      document.getElementById('sp-photo-preview').innerHTML = '<span style="font-size:11px;color:var(--muted)">Sin foto</span>';
    }