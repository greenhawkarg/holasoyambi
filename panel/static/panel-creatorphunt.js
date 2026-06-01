/* ══════════════════════════════════════════════════════════════════
   AMBI — PANEL-CREATORPHUNT.JS
   Gestiona el tab Hunt Showdown del panel de control
══════════════════════════════════════════════════════════════════ */

/* ── CARGA inicial ── */
function cargarHunt() {
    fetch('/api/creatorphunt')
        .then(r => r.json())
        .then(data => {

            /* Sección */
            document.getElementById('hunt-titulo').value = data.seccion?.titulo      || '';
            document.getElementById('hunt-desc').value   = data.seccion?.descripcion || '';
            document.getElementById('hunt-video').value  = data.video || '';

            /* Rotación */
            document.getElementById('hunt-rot-titulo').value = data.rotacion?.titulo      || '';
            document.getElementById('hunt-rot-fecha').value  = data.rotacion?.fecha       || '';
            document.getElementById('hunt-rot-desc').value   = data.rotacion?.descripcion || '';
            if (data.rotacion?.img) {
                document.getElementById('hunt-rot-img').value = data.rotacion.img;
                huntSetPreview('hunt-rot-prev', data.rotacion.img, 'hunt-rot-img-name');
            }

            /* DLC 1 */
            const dlc1 = data.dlcs?.[0];
            if (dlc1) {
                document.getElementById('hunt-dlc1-titulo').value = dlc1.titulo || '';
                if (dlc1.img) {
                    document.getElementById('hunt-dlc1-img').value = dlc1.img;
                    huntSetPreview('hunt-dlc1-prev', dlc1.img, 'hunt-dlc1-img-name');
                }
            }

            /* DLC 2 */
            const dlc2 = data.dlcs?.[1];
            if (dlc2) {
                document.getElementById('hunt-dlc2-titulo').value = dlc2.titulo || '';
                if (dlc2.img) {
                    document.getElementById('hunt-dlc2-img').value = dlc2.img;
                    huntSetPreview('hunt-dlc2-prev', dlc2.img, 'hunt-dlc2-img-name');
                }
            }
        })
        .catch(err => console.warn('[hunt] Error cargando config:', err));
}

/* ── Preview al seleccionar archivo ── */
function huntPreview(input, prevId, hiddenId) {
    const file = input.files[0];
    if (!file) return;

    const nameSpan = input.id.replace('-file', '-name');
    document.getElementById(nameSpan).textContent = file.name;

    /* Preview local inmediato */
    const reader = new FileReader();
    reader.onload = e => {
        const prev = document.getElementById(prevId);
        prev.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;
    };
    reader.readAsDataURL(file);

    /* Upload al servidor */
    const fd = new FormData();
    fd.append('file', file);
    fetch('/api/creatorphunt/upload-image', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(res => {
            if (res.ok) document.getElementById(hiddenId).value = res.rel;
            else console.warn('[hunt] Error subiendo imagen:', res.msg);
        });
}

/* ── Preview desde URL existente (al cargar) ── */
function huntSetPreview(prevId, src, nameId) {
    const prev = document.getElementById(prevId);
    if (prev) prev.innerHTML = `<img src="/imgs/${src.replace('imgs/','')}" style="width:100%;height:100%;object-fit:cover">`;
    const nameEl = document.getElementById(nameId);
    if (nameEl) nameEl.textContent = src.split('/').pop();
}

/* ── Guardar ── */
function guardarHunt() {
    const data = {
        seccion: {
            titulo:      document.getElementById('hunt-titulo').value.trim(),
            descripcion: document.getElementById('hunt-desc').value.trim()
        },
        rotacion: {
            titulo:      document.getElementById('hunt-rot-titulo').value.trim(),
            fecha:       document.getElementById('hunt-rot-fecha').value.trim(),
            descripcion: document.getElementById('hunt-rot-desc').value.trim(),
            img:         document.getElementById('hunt-rot-img').value.trim()
        },
        dlcs: [
            {
                id: 1,
                titulo: document.getElementById('hunt-dlc1-titulo').value.trim(),
                img:    document.getElementById('hunt-dlc1-img').value.trim()
            },
            {
                id: 2,
                titulo: document.getElementById('hunt-dlc2-titulo').value.trim(),
                img:    document.getElementById('hunt-dlc2-img').value.trim()
            }
        ],
        video: document.getElementById('hunt-video').value.trim(),
        bleeds: {
            left:   { activo: true },
            right:  { activo: true },
            top:    { activo: true },
            bottom: { activo: true },
            middle: { activo: true }
        }
    };

    setStatus('Guardando...', 'loading');
    fetch('/api/creatorphunt', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data)
    })
    .then(r => r.json())
    .then(res => {
        if (res.ok) { setStatus('Listo', ''); showToast('✅ Hunt Showdown guardado'); }
        else        { setStatus('Error', 'error'); showToast('❌ ' + res.msg); }
    })
    .catch(err => { setStatus('Error', 'error'); showToast('❌ Error de red'); });
}

/* ── Inicializar al cambiar al sub-tab (llamado desde switchHomeTab) ── */
/* cargarHunt() ya está disponible globalmente — switchHomeTab('hunt') la invoca */