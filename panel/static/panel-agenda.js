/* ══════════════════════════════════════════════════════════════════
   AMBI — PANEL DE CONTROL — Módulo Agenda
   Archivo : panel/static/panel-agenda.js
   Depende de: panel-utils.js
══════════════════════════════════════════════════════════════════ */

    /* ══════════════════════════════════════════════════════════════════
       HANDLERS DE CAMPOS — TARJETAS EXISTENTES
    ══════════════════════════════════════════════════════════════════ */

    /* Cuando se cambia la fecha en una tarjeta existente:
       - Actualiza agenda[idx].fecha con formato web ("21 DE MAYO")
       - Detecta el día de la semana y lo sincroniza en el select */
    function onFechaChange(idx, iso) {
      const fechaWeb = isoToFechaWeb(iso);
      agenda[idx].fecha = fechaWeb;

      const dia = DIAS_S[new Date(iso + 'T00:00:00').getDay()];
      agenda[idx].dia = dia;

      updateCardHeader(idx);

      // Actualiza visualmente el select de día en la tarjeta abierta
      const card = document.querySelector(`[data-idx="${idx}"]`);
      if (card) {
        const sel = card.querySelectorAll('.entry-body select')[1]; // 2do select = Día
        if (sel) sel.value = dia;
      }
    }

    /* Cuando se cambia "Días Restantes" en tarjeta existente:
       Calcula la fecha límite y actualiza el countdown */
    function onDiasChange(idx, val) {
      const dias = parseInt(val);
      if (isNaN(dias)) {
        agenda[idx].fecha_limite_calculada = '';
        document.getElementById(`countdown-${idx}`).textContent = '';
        return;
      }
      const fecha = new Date(); fecha.setHours(0,0,0,0);
      fecha.setDate(fecha.getDate() + dias);
      const iso = fecha.toISOString().split('T')[0];
      agenda[idx].fecha_limite_calculada = iso;
      document.getElementById(`countdown-${idx}`).textContent = calcCountdown(iso);
    }


    /* ══════════════════════════════════════════════════════════════════
       HANDLERS DE CAMPOS — PANEL NUEVO STREAM
    ══════════════════════════════════════════════════════════════════ */

    /* Cuando se cambia "Días Restantes" en el panel Nuevo:
       Solo muestra el countdown (no hay idx aún) */
    function onNuevoDias(val) {
      const dias = parseInt(val);
      const el   = document.getElementById('n-countdown');
      if (isNaN(dias)) { el.textContent = ''; return; }
      const fecha = new Date(); fecha.setHours(0,0,0,0);
      fecha.setDate(fecha.getDate() + dias);
      el.textContent = calcCountdown(fecha.toISOString().split('T')[0]);
    }

    /* Cuando se cambia la fecha en el panel Nuevo:
       Auto-completa el select de Día según el día de la semana */
    function onNuevoFecha(iso) {
      document.getElementById('n-dia').value = DIAS_S[new Date(iso + 'T00:00:00').getDay()];
    }


    /* ══════════════════════════════════════════════════════════════════
       CARGA INICIAL — API
    ══════════════════════════════════════════════════════════════════ */

    /* Obtiene la agenda desde el servidor y renderiza las tarjetas */
    async function loadAgenda() {
      try {
        const res = await fetch('/api/agenda');
        agenda    = await res.json();
        renderAgenda();
      } catch(e) {
        toast('Error cargando agenda', 'err');
      }
    }


    /* ══════════════════════════════════════════════════════════════════
       RENDER — LISTA DE TARJETAS
    ══════════════════════════════════════════════════════════════════ */

    /* Vacía y regenera toda la lista de tarjetas desde el array agenda[] */
    function renderAgenda() {
      const list = document.getElementById('agenda-list');
      list.innerHTML = '';
      agenda.forEach((e, i) => list.appendChild(buildCard(e, i)));
      document.getElementById('badge-agenda').textContent = agenda.length;
      document.getElementById('agenda-count').textContent = `(${agenda.length} entradas)`;
    }

    /* Construye el elemento DOM de una tarjeta con su header, body y drag events */
    function buildCard(entry, idx) {
      const card = document.createElement('div');
      card.className  = `entry-card ${entry.tipo}`;
      card.dataset.idx = idx;
      card.draggable  = true;

      const isEx = entry.tipo === 'exclusivo';

      card.innerHTML = `
        <div class="entry-header" onclick="toggleCard(${idx})">
          <span class="drag-handle" draggable="false" onclick="event.stopPropagation()">⠿</span>
          <span class="entry-badge ${isEx ? 'badge-exclusivo' : 'badge-standard'}">${isEx ? 'Exclusivo' : 'Standard'}</span>
          <span class="entry-name">${entry.juego || '(sin nombre)'}</span>
          <span class="entry-meta">${entry.fecha} · ${entry.dia} ${entry.hora}${entry.fecha_limite_calculada ? ' · ' + calcCountdown(entry.fecha_limite_calculada) : ''}</span>
          <div class="entry-actions" onclick="event.stopPropagation()">
            <button class="btn btn-sm btn-red" onclick="eliminarEntry(${idx})">🗑 Eliminar</button>
            <span class="chevron">▼</span>
          </div>
        </div>
        <div class="entry-body">
          ${buildBodyHTML(entry, idx)}
        </div>
      `;

      /* ── Drag & Drop eventos ── */
      card.addEventListener('dragstart', e => {
        dragSrc = idx;
        setTimeout(() => card.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.entry-card').forEach(c => c.classList.remove('drag-over'));
      });
      card.addEventListener('dragover', e => {
        e.preventDefault();
        if (dragSrc !== null && dragSrc !== idx) card.classList.add('drag-over');
      });
      card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
      card.addEventListener('drop', e => {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (dragSrc === null || dragSrc === idx) return;
        const moved = agenda.splice(dragSrc, 1)[0];
        agenda.splice(idx, 0, moved);
        dragSrc = null;
        renderAgenda();
      });

      return card;
    }

    /* Genera el HTML interno del cuerpo de una tarjeta (formulario completo) */
    function buildBodyHTML(entry, idx) {
      const dias     = ['LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO','DOMINGO'];
      const diasOpts = dias.map(d => `<option${entry.dia === d ? ' selected' : ''}>${d}</option>`).join('');
      const tipoOpts = ['standard','exclusivo'].map(t =>
        `<option value="${t}"${entry.tipo === t ? ' selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`
      ).join('');

      /* Parsea tipo_stream "CAT1 / CAT2" en partes para pre-seleccionar los selects */
      const descParts = (entry.tipo_stream || '').split('/').map(s => s.trim());
      function descOpts(val) {
        return `<option value="">—</option>` +
          OPCIONES.map(o => `<option${o === val ? ' selected' : ''}>${o}</option>`).join('');
      }

      const imgSrc   = entry.imagen    ? `/${entry.imagen}`    : '';
      const bgSrc    = entry.bg_imagen  ? `/${entry.bg_imagen}`  : '';
      const isEx     = entry.tipo === 'exclusivo';
      const borderColor = entry.border_color || '#d72626'; // color por defecto exclusivo

      /* ── Bloque exclusivo: BG + color picker (solo se muestra si tipo=exclusivo) ── */
      const exclBlock = isEx ? `
        <div class="excl-block">
          <div class="excl-block-title">🎨 Exclusivo — Fondo &amp; Color</div>
          <div class="excl-row">

            <!-- Selector de BG desde imgs/index/bgs/ -->
            <div class="form-group">
              <label class="form-label">Imagen de Fondo (BG)</label>
              <input type="file" id="bg-file-${idx}" accept=".jpg,.jpeg,.png,.webp,.gif,.avif"
                     style="display:none" onchange="uploadBg(${idx},this)">
              <button class="btn btn-sm" onclick="document.getElementById('bg-file-${idx}').click()">🖼 Buscar BG</button>
            </div>

            <!-- Mini preview del BG -->
            <div class="bg-mini-preview" id="bg-preview-${idx}">
              ${bgSrc
                ? `<img src="${bgSrc}" onerror="this.style.display='none'">`
                : '<span>Sin BG</span>'}
            </div>

            <!-- Color del border-top -->
            <div class="form-group">
              <label class="form-label">Color del Borde</label>
              <div style="display:flex;align-items:center;gap:8px">
                <!-- Input color nativo (abre el color picker del SO) -->
                <input type="color" value="${borderColor}"
                       id="border-color-${idx}"
                       oninput="onBorderColorChange(${idx},this.value)"
                       style="width:36px;height:34px;padding:2px;border-radius:4px;
                              border:1px solid var(--border2);background:var(--bg3);cursor:pointer">
                <!-- Valor hex editable -->
                <input class="form-input" type="text" id="border-hex-${idx}"
                       value="${borderColor}" maxlength="7" style="width:90px;font-family:monospace"
                       oninput="onBorderHexInput(${idx},this.value)">
                <!-- Botón auto-detect desde el BG -->
                <button class="btn btn-sm" style="color:var(--cyan);border-color:rgba(6,182,212,.3)"
                        onclick="autoDetectColor(${idx})"
                        title="Detecta el color dominante del BG automáticamente">
                  ✨ Auto
                </button>
              </div>
            </div>

          </div>
        </div>
      ` : '';

      return `
        <div class="form-grid">

          <!-- Tipo (al cambiar a exclusivo/standard regenera la tarjeta) -->
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-select" onchange="onTipoChange(${idx},this.value)">${tipoOpts}</select>
          </div>

          <!-- Fecha Web (input date; al cambiar sincroniza día) -->
          <div class="form-group">
            <label class="form-label">Fecha Web</label>
            <input class="form-input" type="date" value="${fechaToISO(entry.fecha)}" onchange="onFechaChange(${idx},this.value)">
          </div>

          <!-- Título del juego -->
          <div class="form-group full">
            <label class="form-label">Título del Juego</label>
            <input class="form-input" type="text" value="${entry.juego}" oninput="syncField(${idx},'juego',this.value);updateCardHeader(${idx})">
          </div>

          <!-- Día de la semana -->
          <div class="form-group">
            <label class="form-label">Día</label>
            <select class="form-select" onchange="syncField(${idx},'dia',this.value);updateCardHeader(${idx})">${diasOpts}</select>
          </div>

          <!-- Horario -->
          <div class="form-group">
            <label class="form-label">Horario</label>
            <input class="form-input" type="text" value="${entry.hora}" oninput="syncField(${idx},'hora',this.value);updateCardHeader(${idx})">
          </div>

          <!-- Descripción (3 selects encadenados) -->
          <div class="form-group full">
            <label class="form-label">Descripción</label>
            <div class="desc-row">
              <select class="form-select" onchange="syncDesc(${idx})">${descOpts(descParts[0] || '')}</select>
              <span class="desc-sep">/</span>
              <select class="form-select" onchange="syncDesc(${idx})">${descOpts(descParts[1] || '')}</select>
              <span class="desc-sep">/</span>
              <select class="form-select" onchange="syncDesc(${idx})">${descOpts(descParts[2] || '')}</select>
            </div>
          </div>

          <!-- ID YouTube (acepta URL completa o ID directo; extrae el ID automáticamente) -->
          <div class="form-group">
            <label class="form-label">Link / ID YouTube</label>
            <input class="form-input" type="text" value="${entry.video}"
                   oninput="this.value=extractYoutubeId(this.value);syncField(${idx},'video',this.value)"
                   onpaste="setTimeout(()=>{this.value=extractYoutubeId(this.value);syncField(${idx},'video',this.value)},0)">
          </div>

          <!-- Imagen thumbnail -->
          <div class="form-group">
            <label class="form-label">Imagen Thumbnail</label>
            <input type="file" id="img-file-${idx}" accept=".jpg,.jpeg,.png,.webp" style="display:none" onchange="uploadImg(${idx},this)">
            <button class="btn btn-sm" onclick="document.getElementById('img-file-${idx}').click()">📷 Buscar</button>
          </div>

          <!-- Días restantes con countdown calculado -->
          <div class="form-group full">
            <label class="form-label">Días Restantes</label>
            <div style="display:flex;align-items:center;gap:10px">
              <input class="form-input" type="number" min="0" style="width:80px"
                     value="${entry.dias_restantes || ''}"
                     oninput="onDiasChange(${idx},this.value)" placeholder="0">
              <span id="countdown-${idx}" style="font-size:12px;color:var(--yellow)">${calcCountdown(entry.fecha_limite_calculada)}</span>
            </div>
          </div>

          <!-- BLOQUE EXCLUSIVO (BG + color) — solo visible si tipo = exclusivo -->
          ${exclBlock}

        </div><!-- /form-grid -->

        <!-- Preview de imagen del thumbnail -->
        <div class="img-preview-box">
          <label>Preview Thumbnail</label>
          <div class="img-preview" id="img-preview-${idx}">
            ${imgSrc ? `<img src="${imgSrc}" onerror="this.style.display='none'">` : '<span>Sin imagen</span>'}
          </div>
          <span class="img-hint">460 × 215 px</span>
        </div>
      `;
    }


    /* ══════════════════════════════════════════════════════════════════
       EXCLUSIVO — TIPO CHANGE
       Al cambiar Tipo regenera la tarjeta para mostrar/ocultar el bloque BG
    ══════════════════════════════════════════════════════════════════ */

    /* Cambia el tipo, actualiza estilos y RE-RENDERIZA el body de la tarjeta
       para que el bloque exclusivo aparezca o desaparezca */
    function onTipoChange(idx, value) {
      agenda[idx].tipo = value;
      updateCardStyle(idx);
      // Regenera el body para mostrar/ocultar el bloque exclusivo
      const card = document.querySelector(`[data-idx="${idx}"]`);
      if (!card) return;
      const body = card.querySelector('.entry-body');
      if (body) body.innerHTML = buildBodyHTML(agenda[idx], idx);
    }


    /* ══════════════════════════════════════════════════════════════════
       EXCLUSIVO — UPLOAD BG
    ══════════════════════════════════════════════════════════════════ */

    /* Sube la imagen de fondo exclusivo a imgs/index/bgs/ en el servidor
       y actualiza la mini-preview y agenda[idx].bg_imagen */
    async function uploadBg(idx, input) {
      const file = input.files[0];
      if (!file) return;

      /* Mini-preview inmediata antes de subir */
      const reader = new FileReader();
      reader.onload = e => {
        const box = document.getElementById(`bg-preview-${idx}`);
        if (box) box.innerHTML = `<img src="${e.target.result}" id="bg-img-${idx}">`;
        /* Intenta auto-detectar color apenas carga la preview */
        const img = document.getElementById(`bg-img-${idx}`);
        if (img) img.onload = () => autoDetectColor(idx);
      };
      reader.readAsDataURL(file);

      /* Upload al servidor — usa el mismo endpoint de imágenes pero
         destino interno es imgs/index/bgs/ (el servidor lo diferencia por el campo 'dest') */
      const fd = new FormData();
      fd.append('file', file);
      fd.append('dest', 'bgs'); // Flask usará esta clave para redirigir a la carpeta bgs
      try {
        const res  = await fetch('/api/agenda/upload-image', { method:'POST', body:fd });
        const data = await res.json();
        if (data.ok) {
          agenda[idx].bg_imagen = data.rel;
        } else {
          toast('Error subiendo BG: ' + data.msg, 'err');
        }
      } catch(e) {
        toast('Error subiendo BG', 'err');
      }
    }


    /* ══════════════════════════════════════════════════════════════════
       EXCLUSIVO — COLOR DEL BORDE
    ══════════════════════════════════════════════════════════════════ */

    /* Sincroniza el color picker nativo → el input hex → agenda[] */
    function onBorderColorChange(idx, hex) {
      agenda[idx].border_color = hex;
      const hexInput = document.getElementById(`border-hex-${idx}`);
      if (hexInput) hexInput.value = hex;
      /* Actualiza el border-left de la tarjeta en el panel como preview */
      const card = document.querySelector(`[data-idx="${idx}"]`);
      if (card) card.style.borderLeftColor = hex;
    }

    /* Sincroniza el input hex manual → el color picker → agenda[]
       Solo aplica si es un hex válido de 7 caracteres (#RRGGBB) */
    function onBorderHexInput(idx, val) {
      if (!/^#[0-9a-fA-F]{6}$/.test(val)) return; // espera hex completo
      agenda[idx].border_color = val;
      const picker = document.getElementById(`border-color-${idx}`);
      if (picker) picker.value = val;
      const card = document.querySelector(`[data-idx="${idx}"]`);
      if (card) card.style.borderLeftColor = val;
    }


    /* ══════════════════════════════════════════════════════════════════
       EXCLUSIVO — AUTO-DETECT COLOR DOMINANTE DEL BG
    ══════════════════════════════════════════════════════════════════ */

    /* Usa un <canvas> oculto para samplear píxeles del BG y devolver
       el color más saturado/representativo (evita grises y negros).
       Algoritmo: recorre una muestra de píxeles, convierte a HSL,
       descarta colores de baja saturación y queda con el más saturado. */
    function autoDetectColor(idx) {
      const img = document.getElementById(`bg-img-${idx}`);
      if (!img || !img.complete || img.naturalWidth === 0) {
        toast('Cargá un BG primero para auto-detectar el color', 'err');
        return;
      }

      const canvas  = document.getElementById('color-canvas');
      const ctx     = canvas.getContext('2d');
      const W = canvas.width  = Math.min(img.naturalWidth,  120);
      const H = canvas.height = Math.min(img.naturalHeight, 56);

      try {
        ctx.drawImage(img, 0, 0, W, H);
        const data   = ctx.getImageData(0, 0, W, H).data;
        let bestH = 0, bestS = 0, bestL = 0, bestSat = -1;

        for (let i = 0; i < data.length; i += 16) { // cada 4 pixeles para velocidad
          const r = data[i] / 255, g = data[i+1] / 255, b = data[i+2] / 255;
          const max = Math.max(r,g,b), min = Math.min(r,g,b);
          const l   = (max + min) / 2;
          const d   = max - min;
          const s   = d === 0 ? 0 : d / (1 - Math.abs(2*l - 1));
          let h = 0;
          if (d !== 0) {
            if (max === r)      h = ((g - b) / d) % 6;
            else if (max === g) h = (b - r) / d + 2;
            else                h = (r - g) / d + 4;
            h = Math.round(h * 60);
            if (h < 0) h += 360;
          }
          /* Descarta colores muy oscuros, muy claros o con baja saturación */
          if (s > 0.25 && l > 0.1 && l < 0.85 && s > bestSat) {
            bestSat = s; bestH = h; bestS = s; bestL = l;
          }
        }

        if (bestSat < 0) {
          toast('No se detectó color dominante, ponélo manualmente', 'err');
          return;
        }

        /* Convierte HSL → HEX para usarlo en el picker y en el JSON */
        const hex = hslToHex(bestH, Math.round(bestS * 100), Math.round(bestL * 100));
        onBorderColorChange(idx, hex);
        toast(`🎨 Color detectado: ${hex}`, 'ok');

      } catch(e) {
        /* CORS: si la imagen es cross-origin el canvas queda "tainted" */
        toast('No se pudo leer el BG (CORS). Usá el color picker manual.', 'err');
      }
    }

    /* Convierte HSL (0-360, 0-100, 0-100) a string HEX "#RRGGBB" */
    function hslToHex(h, s, l) {
      s /= 100; l /= 100;
      const k = n => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
      return `#${f(0).toString(16).padStart(2,'0')}${f(8).toString(16).padStart(2,'0')}${f(4).toString(16).padStart(2,'0')}`;
    }


    /* ══════════════════════════════════════════════════════════════════
       SYNC DE CAMPOS — TARJETAS EXISTENTES
    ══════════════════════════════════════════════════════════════════ */

    /* Actualiza un campo puntual del objeto en agenda[]
       Uso: syncField(idx, 'juego', 'NUEVO NOMBRE') */
    function syncField(idx, field, value) {
      agenda[idx][field] = value;
    }

    /* Lee los 3 selects de descripción de una tarjeta y
       reconstruye tipo_stream como "CAT1 / CAT2 / CAT3" */
    function syncDesc(idx) {
      const card  = document.querySelector(`[data-idx="${idx}"]`);
      const sels  = card.querySelectorAll('.entry-body .desc-row select');
      const parts = [...sels].map(s => s.value).filter(v => v);
      agenda[idx].tipo_stream = parts.join(' / ');
    }

    /* Actualiza el texto del header de la tarjeta (nombre + fecha/día/hora) */
    function updateCardHeader(idx) {
      const card = document.querySelector(`[data-idx="${idx}"]`);
      if (!card) return;
      const e = agenda[idx];
      card.querySelector('.entry-name').textContent = e.juego || '(sin nombre)';
      card.querySelector('.entry-meta').textContent = `${e.fecha} · ${e.dia} ${e.hora}`;
    }

    /* Actualiza el color del borde y el badge al cambiar el tipo */
    function updateCardStyle(idx) {
      const card = document.querySelector(`[data-idx="${idx}"]`);
      if (!card) return;
      const e    = agenda[idx];
      const isEx = e.tipo === 'exclusivo';
      card.className = `entry-card ${e.tipo}` + (card.classList.contains('open') ? ' open' : '');
      const badge = card.querySelector('.entry-badge');
      badge.className  = `entry-badge ${isEx ? 'badge-exclusivo' : 'badge-standard'}`;
      badge.textContent = isEx ? 'Exclusivo' : 'Standard';
    }

    /* Abre / cierra el cuerpo de una tarjeta */
    function toggleCard(idx) {
      const card = document.querySelector(`[data-idx="${idx}"]`);
      card.classList.toggle('open');
    }


    /* ══════════════════════════════════════════════════════════════════
       UPLOAD DE IMAGEN — TARJETA EXISTENTE
    ══════════════════════════════════════════════════════════════════ */

    async function uploadImg(idx, input) {
      const file = input.files[0];
      if (!file) return;

      /* Preview inmediato en el panel (antes de subir) */
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById(`img-preview-${idx}`).innerHTML = `<img src="${e.target.result}">`;
      };
      reader.readAsDataURL(file);

      /* Upload real al servidor Flask */
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res  = await fetch('/api/agenda/upload-image', { method:'POST', body:fd });
        const data = await res.json();
        if (data.ok) {
          agenda[idx].imagen = data.rel; // guarda ruta relativa devuelta por el servidor
        } else {
          toast('Error subiendo imagen: ' + data.msg, 'err');
        }
      } catch(e) {
        toast('Error subiendo imagen', 'err');
      }
    }


    /* ══════════════════════════════════════════════════════════════════
       ELIMINAR ENTRADA
    ══════════════════════════════════════════════════════════════════ */

    function eliminarEntry(idx) {
      if (!confirm('¿Eliminar este juego de la agenda?')) return;
      agenda.splice(idx, 1);
      renderAgenda();
    }


    /* ══════════════════════════════════════════════════════════════════
       GUARDAR — ENVÍA A LA API Y REGENERA EL HTML PÚBLICO
    ══════════════════════════════════════════════════════════════════ */

    async function guardarAgenda() {
      setStatus('Guardando...', '');
      try {
        const res  = await fetch('/api/agenda', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(agenda)
        });
        const data = await res.json();
        if (data.ok) {
          toast('✅ Guardado correctamente');
          setStatus('Guardado', 'ok');
          /* Auto-refresh: recarga el tschedule.html en cualquier iframe o ventana
             hija que esté abierta con la web pública (evita tener que hacer F5) */
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


    /* ══════════════════════════════════════════════════════════════════
       PANEL NUEVO STREAM
    ══════════════════════════════════════════════════════════════════ */

    /* Puebla los selects de descripción con las OPCIONES disponibles */
    function poblarSelectsNuevo() {
      ['n-d1','n-d2','n-d3'].forEach(id => {
        const sel = document.getElementById(id);
        sel.innerHTML = `<option value="">—</option>` +
          OPCIONES.map(o => `<option>${o}</option>`).join('');
      });
    }

    /* Abre el panel y resetea todos los campos a valores por defecto */
    function abrirNuevo() {
      poblarSelectsNuevo();

      /* Reset campos de texto */
      ['n-juego','n-fecha','n-hora','n-video','n-dias'].forEach(id => {
        document.getElementById(id).value = '';
      });

      /* Reset selects y textos */
      document.getElementById('n-tipo').value         = 'standard';
      document.getElementById('n-dia').value          = 'VIERNES';
      document.getElementById('n-hora').value         = '16:00 HS';
      document.getElementById('n-img-name').textContent = '(ninguna)';
      document.getElementById('n-preview').innerHTML  = '<span>Sin imagen</span>';
      document.getElementById('n-img-file').value     = '';
      document.getElementById('n-countdown').textContent = '';

      /* Anima la apertura */
      document.getElementById('nuevo-overlay').classList.add('open');
      setTimeout(() => document.getElementById('nuevo-panel').classList.add('open'), 10);
    }

    /* Cierra el panel con animación */
    function cerrarNuevo() {
      document.getElementById('nuevo-panel').classList.remove('open');
      document.getElementById('nuevo-overlay').classList.remove('open');
    }

    /* Placeholder — los selects de descripción se leen al agregar */
    function rebuildNuevoDesc() {
      // Los valores se leen directamente en agregarNuevo()
    }

    /* Muestra preview de imagen seleccionada en el panel Nuevo */
    function previewNuevoImg(input) {
      const file = input.files[0];
      if (!file) return;
      document.getElementById('n-img-name').textContent = file.name;
      document.getElementById('n-img-name').style.color = 'var(--cyan)';
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById('n-preview').innerHTML = `<img src="${e.target.result}">`;
      };
      reader.readAsDataURL(file);
    }

    /* Agrega el nuevo stream al array y cierra el panel
       ── BUGS CORREGIDOS ──
       FIX 1: fecha se convierte de ISO → "DD DE MES" con isoToFechaWeb()
               (antes se guardaba crudo "2026-05-21" en vez de "21 DE MAYO")
       FIX 2: fecha_limite_calculada se calcula desde el campo n-dias
               (antes siempre quedaba '' aunque se ingresaran días restantes) */
    async function agregarNuevo() {
      const juego = document.getElementById('n-juego').value.trim();
      if (!juego) { toast('El nombre del juego no puede estar vacío', 'err'); return; }

      /* Subir imagen si el usuario seleccionó una */
      let imgRel = 'imgs/index/agenda/ta-nuevo.jpg'; // fallback por defecto
      const fileInput = document.getElementById('n-img-file');
      if (fileInput.files[0]) {
        const fd = new FormData();
        fd.append('file', fileInput.files[0]);
        try {
          const res  = await fetch('/api/agenda/upload-image', { method:'POST', body:fd });
          const data = await res.json();
          if (data.ok) imgRel = data.rel;
        } catch(e) { /* fallo silencioso, usará imagen por defecto */ }
      }

      /* Armar string de descripción desde los 3 selects */
      const parts = ['n-d1','n-d2','n-d3']
        .map(id => document.getElementById(id).value)
        .filter(v => v);

      /* FIX 1 — Convertir fecha ISO a formato web "DD DE MES" */
      const fechaISO = document.getElementById('n-fecha').value;
      const fechaWeb = isoToFechaWeb(fechaISO); // ← CORREGIDO (antes: .toUpperCase() directo)

      /* FIX 2 — Calcular fecha_limite_calculada desde días restantes */
      let fechaLimite = '';
      const diasVal = parseInt(document.getElementById('n-dias').value);
      if (!isNaN(diasVal)) {
        const f = new Date(); f.setHours(0,0,0,0);
        f.setDate(f.getDate() + diasVal);
        fechaLimite = f.toISOString().split('T')[0]; // ← CORREGIDO (antes: siempre '')
      }

      /* Push del nuevo objeto a la agenda */
      agenda.push({
        tipo:                   document.getElementById('n-tipo').value,
        fecha:                  fechaWeb,                                      // FIX 1
        juego:                  juego.toUpperCase(),
        dia:                    document.getElementById('n-dia').value,
        hora:                   document.getElementById('n-hora').value,
        tipo_stream:            parts.join(' / '),
        imagen:                 imgRel,
        video:                  document.getElementById('n-video').value.trim(),
        fecha_limite_calculada: fechaLimite,                                   // FIX 2
        bg_imagen:              '',       // se asigna luego desde la tarjeta si es exclusivo
        border_color:           '#d72626' // color por defecto exclusivo
      });

      cerrarNuevo();
      renderAgenda();

      /* Scroll suave hasta la nueva tarjeta agregada */
      setTimeout(() => {
        const cards = document.querySelectorAll('.entry-card');
        if (cards.length) cards[cards.length - 1].scrollIntoView({ behavior:'smooth' });
      }, 100);
    }


    /* ══════════════════════════════════════════════════════════════════
       APAGAR PANEL
    ══════════════════════════════════════════════════════════════════ */

    async function apagarPanel() {
      if (!confirm('¿Apagar el panel?')) return;
      await fetch('/api/shutdown', { method:'POST' }).catch(() => {});
      window.close();
    }


    /* ══════════════════════════════════════════════════════════════════
       INIT — Carga la agenda al abrir el panel
    ══════════════════════════════════════════════════════════════════ */