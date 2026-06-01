/* ══════════════════════════════════════════════════════════════════
   AMBI — CREATORPHUNT.JS
   Lee data/creatorphunt_config.json y pinta la sección
══════════════════════════════════════════════════════════════════ */

fetch('data/creatorphunt_config.json?v=' + Date.now())
    .then(r => r.json())
    .then(data => {

        /* ── HEADER ── */
        const titulo    = document.getElementById('creatorphunt-titulo');
        const subtitulo = document.getElementById('creatorphunt-subtitulo');
        if (titulo)    titulo.textContent    = data.seccion.titulo;
        if (subtitulo) subtitulo.textContent = data.seccion.descripcion;

        /* ── DLCs — 2 items ── */
        const dlcsWrap = document.getElementById('creatorphunt-dlcs');
        if (dlcsWrap && data.dlcs) {
            dlcsWrap.innerHTML = '';
            data.dlcs.forEach(dlc => {
                dlcsWrap.innerHTML += `
                    <div class="creatorphunt-dlc">
                        <div class="creatorphunt-dlc-imgwrap">
                            <img src="${dlc.img}" alt="${dlc.titulo}">
                        </div>
                        <span class="creatorphunt-dlc-titulo">${dlc.titulo}</span>
                    </div>
                `;
            });
        }

        /* ── DLC EN ROTACIÓN ── */
        const rotImg   = document.getElementById('creatorphunt-rotacion-img');
        const rotFecha = document.getElementById('creatorphunt-rotacion-fecha');
        const rotTit   = document.getElementById('creatorphunt-rotacion-titulo');
        const rotDesc  = document.getElementById('creatorphunt-rotacion-desc');
        if (rotImg)   { rotImg.src = data.rotacion.img; rotImg.alt = data.rotacion.titulo; }
        if (rotFecha) rotFecha.textContent = data.rotacion.fecha;
        if (rotTit)   rotTit.textContent   = data.rotacion.titulo;
        if (rotDesc)  rotDesc.textContent  = data.rotacion.descripcion;

        /* ── BADGE NOVEDAD + VIDEO ── */
        const videoUrl = data.video || '';
        const ytMatch  = videoUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        const videoId  = ytMatch ? ytMatch[1] : null;

        if (videoId) {
            const badgeWrap = document.getElementById('creatorphunt-badge-wrap');
            const badgeVer  = document.getElementById('creatorphunt-badge-ver');
            const videoWrap = document.getElementById('creatorphunt-video-wrap');
            const closeBtn  = document.getElementById('creatorphunt-video-close');
            const iframe    = document.getElementById('creatorphunt-iframe');

            // Estado 1: solo NOVEDAD visible
            badgeWrap.classList.remove('hidden');
            badgeVer.classList.add('hidden');

            // Click NOVEDAD → muestra VER VIDEO
            document.getElementById('creatorphunt-badge-novedad').addEventListener('click', () => {
                badgeVer.classList.remove('hidden');
            });

            // Click VER VIDEO → abre el embed
            badgeVer.addEventListener('click', () => {
                iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                videoWrap.classList.remove('hidden');
                closeBtn.classList.remove('hidden');
            });

            // Click ✕ → cierra todo, vuelve a estado 1
            closeBtn.addEventListener('click', () => {
                iframe.src = '';
                videoWrap.classList.add('hidden');
                closeBtn.classList.add('hidden');
                badgeVer.classList.add('hidden');
            });
        }
    
        /* ── BLEEDS — activar/ocultar según JSON ── */
        const bleeds = data.bleeds || {};
        const mapaClases = {
            left:   '.bleed-creatorPhunt-left',
            right:  '.bleed-creatorPhunt-right',
            top:    '.bleed-creatorPhunt-top',
            bottom: '.bleed-creatorPhunt-bottom',
            middle: '.bleed-creatorPhunt-middle'
        };

        Object.entries(mapaClases).forEach(([key, selector]) => {
            const el = document.querySelector(selector);
            if (!el) return;
            el.style.display = (bleeds[key] && bleeds[key].activo === false) ? 'none' : '';
        });

        /* Recalcular bleeds después de pintar.
           Incluye la imagen del hunter para que su altura sea correcta
           antes de que posicionarBleeds() calcule su posición. */
        if (typeof window.posicionarBleeds === 'function') {
            const imgs = document.querySelectorAll(
                '#creatorphunt-dlcs img, #creatorphunt-rotacion-img, .bleed-creatorPhunt-hunter img'
            );
            let cargadas = 0;
            const total = imgs.length;
            if (total === 0) { window.posicionarBleeds(); return; }
            imgs.forEach(img => {
                const check = () => {
                    cargadas++;
                    if (cargadas === total) window.posicionarBleeds();
                };
                if (img.complete) {
                    check();
                } else {
                    img.addEventListener('load', check);
                    img.addEventListener('error', check);
                }
            });
        }

    })
    .catch(err => {
        console.warn('[creatorPhunt] No se pudo cargar creatorphunt_config.json', err);
    });