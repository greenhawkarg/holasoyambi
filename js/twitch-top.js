/* ══════════════════════════════════════════════════════════════════
   AMBI — twitch-top.js
   Lee data/twitch_config.json y pinta el bloque superior de la
   sección Twitch (kicker, título, cards, crew).
   Fotos del crew: manual (foto) o auto desde API Twitch (url).
══════════════════════════════════════════════════════════════════ */



/* Extrae el login de una URL de Twitch o devuelve el string tal cual */
function extractTwitchLogin(url) {
    if (!url) return null;
    try {
        const u = new URL(url);
        if (u.hostname.includes('twitch.tv')) {
            const parts = u.pathname.split('/').filter(Boolean);
            return parts[0] || null;
        }
    } catch(e) {}
    return null;
}

/* Trae la profile_image_url de un login de Twitch via API */
async function fetchTwitchAvatar(login) {
    try {
        const res  = await fetch(
            `https://api.twitch.tv/helix/users?login=${login}`,
            { headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${TWITCH_TOKEN}`
            }}
        );
        const data = await res.json();
        return data.data[0]?.profile_image_url || null;
    } catch(e) {
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    try {
        const res  = await fetch('data/twitch_config.json?v=' + Date.now());
        const data = await res.json();

        const section = document.getElementById('twitch');
        if (!section) return;

        /* ── KICKER + TÍTULO ── */
        const header = document.createElement('div');
        header.className = 'twitch-top-header';
        header.innerHTML = `
            <span class="twitch-top-kicker">${data.kicker || ''}</span>
            <h2 class="twitch-top-titulo">${data.titulo || ''}</h2>
        `;

        /* ── CARDS ── */
        const cardsWrap = document.createElement('div');
        cardsWrap.className = 'twitch-top-cards';
        (data.cards || []).forEach(card => {
            const el = document.createElement('div');
            el.className = 'twitch-top-card';
            el.innerHTML = `
                <img src="${card.img}" alt="${card.caption_titulo || ''}">
                <div class="twitch-top-card-caption">
                    <span class="twitch-top-card-titulo">${card.caption_titulo || ''}</span>
                    <span class="twitch-top-card-desc">${card.caption_desc || ''}</span>
                </div>
            `;
            cardsWrap.appendChild(el);
        });

        /* ── CREW & STREAMERS ── */
        const crewList = (data.crew || []).filter(c => c.nombre);

        /* Resolver fotos: manual primero, API como fallback */
        const crewWithAvatars = await Promise.all(crewList.map(async c => {
            if (c.foto) return { ...c, avatar: '/' + c.foto };
            const login = extractTwitchLogin(c.url);
            if (login) {
                const apiAvatar = await fetchTwitchAvatar(login);
                if (apiAvatar) return { ...c, avatar: apiAvatar };
            }
            return { ...c, avatar: null };
        }));

        const ROL_VALID = ['hammer', 'sword', 'vip'];

        const crew = document.createElement('div');
        crew.className = 'twitch-top-crew';
            if (data.crew_bg) {
                crew.style.backgroundImage = `url('${data.crew_bg}')`;
                crew.style.backgroundSize = 'cover';
                crew.style.backgroundPosition = 'center';
                crew.style.backgroundBlendMode = 'overlay';
                crew.style.backgroundColor = 'rgba(109, 52, 164, 0.85)';
            }
            const crewItems = crewWithAvatars.map(c => {
            const rolHtml = (c.rol && ROL_VALID.includes(c.rol))
                ? `<img class="twitch-top-crew-rol" src="imgs/index/twitch/${c.rol}.png" alt="${c.rol}">`
                : '';
            return `
            <a class="twitch-top-crew-item" href="${c.url || '#'}" target="_blank" rel="noopener">
                <div class="twitch-top-crew-avatar-wrap">
                    ${rolHtml}
                    <div class="twitch-top-crew-avatar">
                        ${c.avatar ? `<img src="${c.avatar}" alt="${c.nombre}">` : ''}
                    </div>
                </div>
                <span class="twitch-top-crew-nombre">${c.nombre}</span>
            </a>
        `;
        }).join('');
        crew.innerHTML = `
            <div class="twitch-top-crew-header">
                <i class="fab fa-twitch"></i>
                <h3 class="twitch-top-crew-titulo">Crew &amp; Streamers</h3>
            </div>
            <div class="twitch-top-crew-grid" style="--crew-count:${crewWithAvatars.length}">${crewItems}</div>
        `;

        /* ── CONTENEDOR GENERAL ── */
        const wrap = document.createElement('div');
        wrap.className = 'twitch-top';
        wrap.appendChild(header);
        wrap.appendChild(cardsWrap);
        wrap.appendChild(crew);

        const headerEl = section.querySelector('.twitch-top-header');
        const cardsEl  = section.querySelector('.twitch-top-cards');
        const crewEl   = section.querySelector('.twitch-top-crew');

        if (headerEl) headerEl.innerHTML = header.innerHTML;
        if (cardsEl)  cardsEl.innerHTML  = cardsWrap.innerHTML;
        if (crewEl) {
            crewEl.innerHTML = crew.innerHTML;
            if (data.crew_bg) {
                crewEl.style.backgroundImage     = `url('${data.crew_bg}')`;
                crewEl.style.backgroundSize      = 'cover';
                crewEl.style.backgroundPosition  = 'center';
                crewEl.style.backgroundBlendMode = 'overlay';
                crewEl.style.backgroundColor     = 'rgba(109, 52, 164, 0.85)';
            }
        }

    } catch (e) {
        console.warn('[twitch-top.js] No se pudo cargar twitch_config.json', e);
    }
});