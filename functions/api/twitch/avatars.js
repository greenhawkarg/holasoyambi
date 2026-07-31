/* ══════════════════════════════════════════════════════════════════
   Cloudflare Pages Function — /api/twitch/avatars
   Recibe ?logins=a,b,c y devuelve { login: profile_image_url, ... }
   para todo el crew de una sola vez (en vez de un pedido por persona).
   Comparte la misma lógica de token que channel.js, pero duplicada
   acá adentro para que cada función sea independiente y no dependa
   de imports entre archivos de Cloudflare Pages Functions.
══════════════════════════════════════════════════════════════════ */

let cachedToken = null;
let tokenExpiry = 0;

async function getAppToken(env) {
    const now = Date.now();

    if (cachedToken && now < tokenExpiry) {
        return cachedToken;
    }

    const res = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: env.TWITCH_CLIENT_ID,
            client_secret: env.TWITCH_CLIENT_SECRET,
            grant_type: 'client_credentials'
        })
    });

    const data = await res.json();

    if (!data.access_token) {
        throw new Error('No se pudo obtener token de Twitch: ' + JSON.stringify(data));
    }

    cachedToken = data.access_token;
    tokenExpiry = now + (data.expires_in - 300) * 1000;

    return cachedToken;
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const loginsParam = url.searchParams.get('logins') || '';

    // Limpieza: separa por coma, saca espacios y vacíos
    const logins = loginsParam
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    if (logins.length === 0) {
        return new Response(JSON.stringify({}), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const token = await getAppToken(env);
        const headers = {
            'Client-ID': env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${token}`
        };

        // La API de Twitch helix acepta hasta 100 "login" en un solo pedido
        // (?login=a&login=b&login=c), así que se resuelve todo el crew junto.
        const query = logins.map(l => `login=${encodeURIComponent(l)}`).join('&');
        const res = await fetch(`https://api.twitch.tv/helix/users?${query}`, { headers });
        const data = await res.json();

        // Arma un mapa { login: profile_image_url } para que el frontend
        // solo tenga que hacer avatarMap[login]
        const map = {};
        (data.data || []).forEach(u => {
            map[u.login] = u.profile_image_url;
        });

        return new Response(JSON.stringify(map), {
            headers: {
                'Content-Type': 'application/json',
                // Los avatares cambian poco: cache más largo (5 min)
                'Cache-Control': 'public, max-age=300'
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
