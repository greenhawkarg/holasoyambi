/* ══════════════════════════════════════════════════════════════════
   AMBI — PANEL DE CONTROL — Módulo Reproductor
   Archivo : panel/static/panel-player.js
   Depende de: panel-utils.js
══════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════
   PLAYER — ESTADO GLOBAL
══════════════════════════════════════════════════════════════════ */

let playerPlaylist = [];   // [{ name, track, file }]
let playerDragSrc  = null; // índice origen del drag


/* ══════════════════════════════════════════════════════════════════
   PLAYER — CARGA INICIAL
══════════════════════════════════════════════════════════════════ */

async function loadPlayer() {
  try {
    const res  = await fetch('/api/player');
    const data = await res.json();
    if (Array.isArray(data)) playerPlaylist = data;
  } catch(e) { /* primer uso: array vacío */ }
  renderPlayer();
}


/* ══════════════════════════════════════════════════════════════════
   PLAYER — RENDER
══════════════════════════════════════════════════════════════════ */

function renderPlayer() {
  const list = document.getElementById('player-list');
  if (!list) return;

  const count = document.getElementById('player-count');
  if (count) count.textContent = `(${playerPlaylist.length} tema${playerPlaylist.length !== 1 ? 's' : ''})`;

  if (playerPlaylist.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--muted);font-size:13px">
        No hay temas en la playlist. Agregá uno arriba.
      </div>`;
    return;
  }

  list.innerHTML = '';
  playerPlaylist.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className   = 'player-row';
    row.draggable   = true;
    row.dataset.idx = idx;

    row.innerHTML = `
      <div class="player-drag-handle" title="Arrastrar para reordenar">⠿</div>
      <div class="player-num">${idx + 1}</div>
      <div class="player-info">
        <div class="player-name">${escHtml(item.name)}</div>
        <div class="player-track">${escHtml(item.track)}</div>
        <div class="player-file">${escHtml(item.file)}</div>
      </div>
      <button class="btn btn-sm"
              style="color:var(--red);border-color:rgba(239,68,68,.3);flex-shrink:0"
              onclick="eliminarTema(${idx})">
        🗑 Eliminar
      </button>
    `;

    // ── Drag & Drop ──
    row.addEventListener('dragstart', e => {
      playerDragSrc = idx;
      row.style.opacity = '0.4';
      e.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragend', () => {
      row.style.opacity = '';
      document.querySelectorAll('.player-row').forEach(r => r.classList.remove('drag-over'));
    });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.player-row').forEach(r => r.classList.remove('drag-over'));
      row.classList.add('drag-over');
    });
    row.addEventListener('drop', e => {
      e.preventDefault();
      if (playerDragSrc === null || playerDragSrc === idx) return;
      const moved = playerPlaylist.splice(playerDragSrc, 1)[0];
      playerPlaylist.splice(idx, 0, moved);
      playerDragSrc = null;
      renderPlayer();
    });

    list.appendChild(row);
  });
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


/* ══════════════════════════════════════════════════════════════════
   PLAYER — AGREGAR TEMA
══════════════════════════════════════════════════════════════════ */

async function agregarTema() {
  const name  = document.getElementById('pl-name').value.trim();
  const track = document.getElementById('pl-track').value.trim();
  const fileInput = document.getElementById('pl-file');

  if (!name)  { toast('El nombre del artista no puede estar vacío', 'err'); return; }
  if (!track) { toast('El nombre del tema no puede estar vacío', 'err');    return; }
  if (!fileInput.files[0]) { toast('Seleccioná un archivo MP3', 'err');     return; }

  setStatus('Subiendo MP3...', '');

  const fd = new FormData();
  fd.append('file', fileInput.files[0]);

  let fileRel = '';
  try {
    const res  = await fetch('/api/player/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!data.ok) { toast('Error al subir el archivo: ' + data.msg, 'err'); setStatus('Error', 'err'); return; }
    fileRel = data.rel;
  } catch(e) {
    toast('Error de conexión al subir', 'err');
    setStatus('Error', 'err');
    return;
  }

  playerPlaylist.push({ name, track, file: fileRel });
  renderPlayer();

  // Limpiar formulario
  document.getElementById('pl-name').value  = '';
  document.getElementById('pl-track').value = '';
  fileInput.value = '';
  document.getElementById('pl-file-name').textContent = '(ninguno)';
  document.getElementById('pl-file-name').style.color = 'var(--muted)';

  setStatus('Listo', 'ok');
  toast('✅ Tema agregado — guardá los cambios');
}

function previewPlayerFile(input) {
  const file = input.files[0];
  if (!file) return;
  const label = document.getElementById('pl-file-name');
  label.textContent = file.name;
  label.style.color = 'var(--cyan)';
}


/* ══════════════════════════════════════════════════════════════════
   PLAYER — ELIMINAR TEMA
══════════════════════════════════════════════════════════════════ */

function eliminarTema(idx) {
  const item = playerPlaylist[idx];
  if (!confirm(`¿Eliminar "${item.name} — ${item.track}"?`)) return;
  playerPlaylist.splice(idx, 1);
  renderPlayer();
  toast('Tema eliminado — guardá los cambios');
}


/* ══════════════════════════════════════════════════════════════════
   PLAYER — GUARDAR
══════════════════════════════════════════════════════════════════ */

async function guardarPlayer() {
  setStatus('Guardando...', '');
  try {
    const res  = await fetch('/api/player', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(playerPlaylist)
    });
    const data = await res.json();
    if (data.ok) {
      toast('✅ Playlist guardada');
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

loadPlayer();
