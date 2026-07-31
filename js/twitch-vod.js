/* ══════════════════════════════════════════════════════════════════
   TWITCH — Live status, título, viewers, último VOD
   Canal: 4mbitv

   IMPORTANTE: este archivo YA NO tiene el token de Twitch adentro.
   El token vive server-side, en las Cloudflare Pages Functions
   (/functions/api/twitch/channel.js), que lo genera y renueva solas.
   Acá simplemente se pide la data a NUESTRO propio endpoint.
══════════════════════════════════════════════════════════════════ */

const TWITCH_CHANNEL = '4mbitv';

async function getTwitchData() {
    // En vez de pegarle directo a api.twitch.tv (que exige un token
    // que vence), pedimos a nuestra propia función serverless, que
    // ya devuelve todo listo: user, stream y vod.
    const res = await fetch(`/api/twitch/channel?channel=${encodeURIComponent(TWITCH_CHANNEL)}`);

    if (!res.ok) {
        throw new Error(`Error al pedir datos de Twitch: ${res.status}`);
    }

    const data = await res.json();
    return { stream: data.stream, vod: data.vod };
}

function formatViewers(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
    return n.toString();
}

async function initTwitch() {
    try {
        const { stream, vod } = await getTwitchData();
        const isLive = !!stream;

        /* ── EMBED PRINCIPAL (player en vivo o thumbnail offline) ── */
        const embedEl = document.querySelector('.twitch-player-embed');
        if (embedEl) {
            if (isLive) {
                const parent = window.location.hostname || 'localhost';
                embedEl.innerHTML = `
                    <iframe
                        src="https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=${parent}&muted=true"
                        frameborder="0" allowfullscreen scrolling="no">
                    </iframe>
                `;
            } else {
                embedEl.innerHTML = `
                    <img src="imgs/index/twitch/thumb_stream.webp" alt="Stream offline" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">
                `;
            }
        }

        /* ── TÍTULO DEL STREAM ── */
        const titleEl = document.querySelector('.twitch-stream-title');
        if (titleEl) {
            titleEl.textContent = isLive
                ? stream.title
                : '// ESTATE ATENTO A LA AGENDA PARA EL PRÓXIMO STREAM';
        }

        /* ── STATUS (LIVE / OFFLINE + viewers) ── */
        const statusWrap = document.querySelector('.twitch-status');
        if (statusWrap) {
            if (isLive) {
                statusWrap.innerHTML = `
                    <span class="twitch-status-dot"></span>
                    <span class="twitch-status-label">LIVE</span>
                    <span class="twitch-viewers">${formatViewers(stream.viewer_count)} viewers</span>
                `;
            } else {
                statusWrap.innerHTML = `
                    <span class="twitch-status-dot offline"></span>
                    <span class="twitch-status-label offline">OFFLINE</span>
                `;
            }
        }

        /* ── VOD PREVIEW (último stream grabado) ── */
        const vodWrap = document.querySelector('.twitch-vod-embed');
        if (vodWrap && vod) {
            const thumbUrl = vod.thumbnail_url
                .replace('%{width}', '640')
                .replace('%{height}', '360');

            vodWrap.innerHTML = `
                <div class="twitch-vod-preview" data-vod-id="${vod.id}">
                    <img src="${thumbUrl}" alt="Último stream" class="twitch-vod-thumb">
                    <div class="twitch-vod-play">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <circle cx="24" cy="24" r="24" fill="rgba(145,70,255,0.85)"/>
                            <polygon points="19,14 37,24 19,34" fill="#fff"/>
                        </svg>
                    </div>
                    <div class="twitch-vod-duration">${vod.duration}</div>
                </div>
            `;

            // Al hacer click en el thumbnail del VOD, lo reemplaza por el
            // player embebido real (con autoplay) usando el id del VOD.
            vodWrap.querySelector('.twitch-vod-preview').addEventListener('click', function () {
                const id = this.dataset.vodId;
                const parent = window.location.hostname || 'localhost';
                vodWrap.innerHTML = `
                    <iframe
                        src="https://player.twitch.tv/?video=${id}&parent=${parent}&autoplay=true"
                        frameborder="0" allowfullscreen scrolling="no">
                    </iframe>
                `;
            });
        }

    } catch (e) {
        console.warn('Twitch API error:', e);
    }
}

document.addEventListener('DOMContentLoaded', initTwitch);
