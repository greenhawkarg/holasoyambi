/* ══════════════════════════════════════════
   SPONSOR POPUP
   Abre el link del sponsor en popup interno
   en lugar de nueva pestaña
══════════════════════════════════════════ */

(function () {

    const popup    = document.getElementById('sponsor-popup');
    const iframe   = document.getElementById('sponsor-iframe');
    const closeBtn = document.getElementById('close-sponsor');

    // Abre el popup con la URL del botón
    document.querySelectorAll('.open-sponsor').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const url = btn.getAttribute('data-url');
            if (!url || url === '#') {
                console.warn('Sponsor: no hay URL configurada en data-url');
                return;
            }
            iframe.src = url;
            popup.classList.add('active');
            document.body.classList.add('lightbox-open');
        });
    });

    // Cierra con el botón ×
    closeBtn.addEventListener('click', cerrar);

    // Cierra haciendo click fuera del panel
    popup.addEventListener('click', function (e) {
        if (e.target === popup) cerrar();
    });

    // Cierra con Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && popup.classList.contains('active')) cerrar();
    });

    function cerrar() {
        popup.classList.remove('active');
        document.body.classList.remove('lightbox-open');
        iframe.src = '';   // limpia el iframe al cerrar
    }

})();
