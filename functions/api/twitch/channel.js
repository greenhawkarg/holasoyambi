/* ══════════════════════════════════════════════════════════════════
   Cloudflare Pages Function — /api/twitch/channel
   Devuelve { user, stream, vod } para el canal pedido.
   El token de Twitch se genera y renueva automáticamente acá adentro:
   nunca hay que tocarlo a mano.
══════════════════════════════════════════════════════════════════ */

// Cache en memoria del token. Vive mientras el "isolate" de Cloudflare
// esté caliente (varios requests seguidos reusan el mismo token).
// Si el isolate se reinicia, simplemente se pide uno nuevo: no rompe nada.
let cachedToken = null;
let tokenExpiry = 0; // timestamp (ms) en que el token deja de ser válido

async function getAppToken(env) {
    const now = Date.now();

    // Si ya tenemos un token vigente, lo reusamos (evita pedir uno nuevo
    // en cada visita al sitio).
    if (cachedToken && now < tokenExpiry) {
        return cachedToken;
    }

    // Pide un token nuevo usando Client ID + Client Secret (client_credentials
    // flow). Esto SOLO puede correr server-side porque el Secret nunca
    // debe llegar al navegador del usuario.
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
    // Restamos 5 minutos de margen para renovar antes de que Twitch lo rechace.
    tokenExpiry = now + (data.expires_in - 300) * 1000;

    return cachedToken;
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const channel = url.searchParams.get('channel') || '4mbitv';

    try {
        const token = await getAppToken(env);
        const headers = {
            'Client-ID': env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${token}`
        };

        // 1) Resolver el user_id a partir del login del canal
        const userRes = await fetch(
            `https://api.twitch.tv/helix/users?login=${encodeURIComponent(channel)}`,
            { headers }
        );
        const userData = await userRes.json();
        const user = userData.data?.[0] || null;

        if (!user) {
            return new Response(JSON.stringify({ error: 'canal no encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2) Pedir en paralelo el estado del stream y el último VOD
        const [streamRes, vodRes] = await Promise.all([
            fetch(`https://api.twitch.tv/helix/streams?user_id=${user.id}`, { headers }),
            fetch(`https://api.twitch.tv/helix/videos?user_id=${user.id}&first=1&type=archive`, { headers })
        ]);
        const streamData = await streamRes.json();
        const vodData = await vodRes.json();

        const body = JSON.stringify({
            user,
            stream: streamData.data?.[0] || null,
            vod: vodData.data?.[0] || null
        });

        return new Response(body, {
            headers: {
                'Content-Type': 'application/json',
                // Cachea 30s en el borde de Cloudflare: si entran varios
                // visitantes juntos, no se golpea la API de Twitch por cada uno.
                'Cache-Control': 'public, max-age=30'
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
