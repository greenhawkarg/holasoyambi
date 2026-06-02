/* ══════════════════════════════════════════════════════════════════
   AMBI — youtube.js
   Lee data/youtube_config.json y pinta el tab YouTube dentro de
   la sección Twitch.
══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async function () {
    try {
        const res  = await fetch('data/youtube_config.json?v=' + Date.now());
        const data = await res.json();

        const wrap = document.getElementById('youtube-tab-content');
        if (!wrap) return;

        /* ── KICKER + TÍTULO ── */
        const header = `
            <div class="yt-top-header">
                <span class="yt-top-kicker">${data.kicker || ''}</span>
                <h2 class="yt-top-titulo">${data.titulo || ''}</h2>
            </div>
        `;

        /* ── FILA: texto izq + 2 SHORTS + texto der ── */
        const shorts = (data.shorts || []).slice(0, 2);
        const shortsHTML = shorts.map(s => `
            <div class="yt-short-item">
                <div class="yt-short-embed" style="position:relative;overflow:hidden;">
                    <img
                        src="https://i.ytimg.com/vi/${s.embed_id}/maxresdefault.jpg"
                        alt="${s.titulo || ''}"
                        onerror="this.src='https://i.ytimg.com/vi/${s.embed_id}/hqdefault.jpg'"
                        data-short-id="${s.embed_id}"
                        class="yt-short-thumb"
                        style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block;cursor:pointer;">
                    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">
                        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="28" cy="28" r="28" fill="rgba(255,0,0,0.88)"/>
                            <polygon points="22,16 44,28 22,40" fill="white"/>
                        </svg>
                    </div>
                </div>
                <span class="yt-short-titulo">${s.titulo || ''}</span>
            </div>
        `).join('');

        const cardsRow = `
            <div class="yt-top-row">
                <div class="yt-top-col-text yt-top-col-text--left">
                    <span class="yt-top-col-label">${data.col_izquierda?.titulo || ''}</span>
                    <p class="yt-top-col-body">${data.col_izquierda?.texto || ''}</p>
                </div>
                <div class="yt-shorts-wrap">
                    ${shortsHTML}
                </div>
                <div class="yt-top-col-text yt-top-col-text--right">
                    <span class="yt-top-col-label">${data.col_derecha?.titulo || ''}</span>
                    <p class="yt-top-col-body">${data.col_derecha?.texto || ''}</p>
                </div>
            </div>
        `;

        /* ── VIDEOS DESTACADOS ── */
        const vd = data.videos_destacados || {};
        const bgStyle = vd.bg
            ? `style="background-image: url('${vd.bg}'); --yt-destac-bg-opacity: ${vd.bg_opacity ?? 0.4};"`
            : '';

        const destacados = `
            <div class="yt-destac" ${bgStyle}>
                ${vd.bg ? '<div class="yt-destac-overlay"></div>' : ''}
                <div class="yt-destac-grid">
                    <div class="yt-destac-col-izq">
                        <div class="yt-destac-header">
                            <i class="fab fa-youtube"></i>
                            <h3 class="yt-destac-titulo-bloque">Videos Destacados</h3>
                        </div>
                        <div class="yt-destac-texto">
                            <p class="yt-destac-texto-body">En Hunt Showdown: una forma de obligar a otros cazadores a salir del main. Ballesta de mano como secundaria, veneno para acorralarlos y forzar el PVP. Sin campeo, sin pasivos.</p>
                        </div>
                    </div>
                    <div class="yt-destac-item">
                        <div class="yt-destac-embed" id="yt-destac-thumb-wrap">
                            <img
                                src="https://i.ytimg.com/vi/Oiza-XXx4w0/maxresdefault.jpg"
                                alt="Video destacado"
                                onerror="this.src='https://i.ytimg.com/vi/Oiza-XXx4w0/hqdefault.jpg'"
                                id="yt-destac-thumb"
                                style="width:100%;height:100%;object-fit:cover;display:block;cursor:pointer;">
                            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">
                                <svg width="64" height="64" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="28" cy="28" r="28" fill="rgba(255,0,0,0.88)"/>
                                    <polygon points="22,16 44,28 22,40" fill="white"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div class="yt-destac-bleed"></div>
                </div>
            </div>
        `;

        /* ── ÚLTIMO VIDEO ── */
        const uv = data.ultimo_video || {};
        const ultimoVideo = `
            <div class="yt-ultimo">
                <div class="yt-ultimo-panel">
                    <span class="yt-ultimo-kicker">${uv.kicker || 'ÚLTIMO VIDEO'}</span>
                    <h3 class="yt-ultimo-titulo">${uv.titulo || ''}</h3>
                    <p class="yt-ultimo-desc">${uv.desc || ''}</p>
                    <a class="yt-ultimo-btn" href="${uv.btn_url || '#'}" target="_blank" rel="noopener">
                        ${uv.btn_texto || 'VER EN YOUTUBE'}
                    </a>
                </div>
                <div class="yt-ultimo-embed">
                    <div class="yt-ultimo-embed-inner">
                        <iframe
                            src="https://www.youtube.com/embed/${uv.embed_id || ''}"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen>
                        </iframe>
                    </div>
                    <div class="yt-ultimo-bar">
                        <span class="yt-ultimo-bar-label">// ${uv.titulo || ''}</span>
                        <span class="yt-ultimo-bar-logo">
                            <i class="fab fa-youtube"></i> YouTube
                        </span>
                    </div>
                </div>
            </div>
        `;

        /* ── RENDER FINAL ── */
        wrap.innerHTML = header + cardsRow + destacados + ultimoVideo;

        /* ── EVENT LISTENER VIDEO DESTACADO ── */
        const destaqThumb = document.getElementById('yt-destac-thumb');
        if (destaqThumb) {
            destaqThumb.addEventListener('click', function () {
                const w = document.getElementById('yt-destac-thumb-wrap');
                const iframe = document.createElement('iframe');
                iframe.src = 'https://www.youtube.com/embed/Oiza-XXx4w0?autoplay=1';
                iframe.frameBorder = '0';
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.allowFullscreen = true;
                iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';
                w.appendChild(iframe);
                setTimeout(function () {
                    var img = w.querySelector('img');
                    var overlay = w.querySelector('div');
                    if (img) img.remove();
                    if (overlay) overlay.remove();
                }, 200);
            });
        }

        /* ── EVENT LISTENERS SHORTS ── */
        wrap.querySelectorAll('.yt-short-thumb').forEach(img => {
            img.addEventListener('click', function () {
                const embedId = this.dataset.shortId;
                var existing = document.getElementById('yt-short-lightbox');
                if (existing) existing.remove();

                var lb = document.createElement('div');
                lb.id = 'yt-short-lightbox';
                lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;';

                var inner = document.createElement('div');
                inner.style.cssText = 'position:relative;width:min(90vw,400px);aspect-ratio:9/16;';

                var iframe = document.createElement('iframe');
                iframe.src = 'https://www.youtube.com/embed/' + embedId + '?autoplay=1';
                iframe.frameBorder = '0';
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                iframe.allowFullscreen = true;
                iframe.style.cssText = 'width:100%;height:100%;display:block;';

                var btn = document.createElement('button');
                btn.innerHTML = '&times;';
                btn.style.cssText = 'position:absolute;top:-36px;right:0;background:none;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;';
                btn.addEventListener('click', function () { lb.remove(); });

                inner.appendChild(iframe);
                inner.appendChild(btn);
                lb.appendChild(inner);
                document.body.appendChild(lb);

                lb.addEventListener('click', function (e) {
                    if (e.target === lb) lb.remove();
                });
            });
        });

    } catch (e) {
        console.warn('[youtube.js] No se pudo cargar youtube_config.json', e);
    }
});