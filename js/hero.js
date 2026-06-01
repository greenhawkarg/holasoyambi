/* ══════════════════════════════════════════════════════════════════
   AMBI — hero.js
   Lee index_config.json y pinta la sección HERO.
   Independiente: no sabe nada de otras secciones ni de bleeds.
══════════════════════════════════════════════════════════════════ */

(async function () {
    try {
        const res  = await fetch('data/index_config.json?v=' + Date.now())
        const data = await res.json();

        /* BG — background-image via style inline */
        if (data.bg) {
            document.getElementById('hero-bg').style.backgroundImage =
                `url('${data.bg}')`;
        }

        /* OVIMG — personaje / arte del juego */
        if (data.object) {
            document.getElementById('hero-ovimg').src = data.object;
        }

        /* LOGO — logo del juego */
        if (data.logo) {
            document.getElementById('hero-logo').src = data.logo;
        }

    } catch (e) {
        console.warn('[hero.js] No se pudo cargar index_config.json', e);
    }
})();

// ── HERO FX: Grain ──
(function() {
    var canvas = document.querySelector('.hero-fx-grain canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var alpha = 16;
    function renderGrain() {
        var w = canvas.offsetWidth, h = canvas.offsetHeight;
        canvas.width = w; canvas.height = h;
        var img = ctx.createImageData(w, h);
        var d = img.data;
        for (var i = 0; i < d.length; i += 4) {
            var v = Math.random() * 255;
            d[i] = d[i+1] = d[i+2] = v;
            d[i+3] = alpha;
        }
        ctx.putImageData(img, 0, 0);
    }
    setInterval(renderGrain, 128);
})();