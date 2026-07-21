/* ==========================================================================
   AMBI DROPS — Assets
   Lee el bloque "assets" de data/drops.json y aplica las imágenes editables
   desde el panel (fondo general, fondo del countdown, badge). Se carga
   antes que countdown.js y loader.js para que no haya flash del fallback.
   ========================================================================== */

(function () {
  function applyAssets(assets) {
    if (!assets) return;
    const root = document.documentElement.style;

    // Las rutas de assets.json son relativas a hunt-drops.html. Como
    // --bg-image y --countdown-bg-image las usa drops.css (que vive en
    // css/, un nivel más adentro), un url() relativo se resolvería mal —
    // el navegador resuelve el url() de una custom property contra la
    // hoja de estilos donde se USA (var()), no contra donde se define
    // (este JS). Por eso armamos acá la URL absoluta con document.baseURI,
    // que no depende de ese contexto.
    if (assets.bg_image) {
      root.setProperty('--bg-image', `url('${new URL(assets.bg_image, document.baseURI).href}')`);
    }
    if (assets.countdown_bg) {
      root.setProperty('--countdown-bg-image', `url('${new URL(assets.countdown_bg, document.baseURI).href}')`);
    }
    if (assets.badge_image) {
      const badgeEl = document.getElementById('hunter-badge');
      if (badgeEl) badgeEl.src = new URL(assets.badge_image, document.baseURI).href;
    }
  }

  fetch('data/drops.json')
    .then(res => res.json())
    .then(data => applyAssets(data.assets))
    .catch(err => console.error('[AMBI DROPS] Error cargando assets', err));
})();
