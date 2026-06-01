/* ══════════════════════════════════════════════════════════════════
   AMBI — live-reload.js
   Escucha cambios del panel de control via localStorage.
   Cuando el panel guarda, recarga la web automáticamente.
   Solo activo en localhost — en producción no hace nada.
══════════════════════════════════════════════════════════════════ */

(function () {
    if (!location.hostname.includes('localhost') && !location.hostname.includes('127.0.0.1')) return;

    window.addEventListener('storage', function (e) {
        if (e.key === 'ambi_reload') {
            location.reload();
        }
    });
})();
