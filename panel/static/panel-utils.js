/* ══════════════════════════════════════════════════════════════════
   AMBI — PANEL DE CONTROL — Utilidades compartidas
   Archivo : panel/static/panel-utils.js
   Depende de: (ninguna)
══════════════════════════════════════════════════════════════════ */

    /* ══════════════════════════════════════════════════════════════════
       CONSTANTES GLOBALES
    ══════════════════════════════════════════════════════════════════ */

    /* Opciones del select de descripción de stream */
    const OPCIONES = [
      "ESTRENO",
      "CAMPAÑA",
      "DÍA DE FALOPITAS",
      "DÍA DE REALIDAD",
      "CONTENIDO EXCLUSIVO",
      "EARLY ACCESS EXCLUSIVO",
      "INVITADOS A LA PLAYTEST",
      "INVITADOS POR EL STUDIO",
      "INVITADOS AL EARLY ACCESS"
    ];

    /* ══════════════════════════════════════════════════════════════════
       UTILIDADES — YOUTUBE
    ══════════════════════════════════════════════════════════════════ */

    /* Extrae el ID del video de cualquier formato de URL de YouTube.
       Soporta:
         https://www.youtube.com/watch?v=dQw4w9WgXcQ
         https://youtu.be/dQw4w9WgXcQ
         https://www.youtube.com/embed/dQw4w9WgXcQ
         https://youtube.com/shorts/dQw4w9WgXcQ
         dQw4w9WgXcQ  (ID directo, lo devuelve tal cual)
       Devuelve el ID limpio o el string original si no matchea */
    function extractYoutubeId(input) {
      if (!input) return '';
      input = input.trim();
      // Intenta parsear como URL
      try {
        const url = new URL(input);
        // youtube.com/watch?v=ID
        if (url.searchParams.get('v')) return url.searchParams.get('v');
        // youtu.be/ID  o  youtube.com/embed/ID  o  youtube.com/shorts/ID
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length) return parts[parts.length - 1];
      } catch(e) {
        // No es URL válida → asume que ya es un ID directo
        return input;
      }
      return input;
    }

    /* ══════════════════════════════════════════════════════════════════
       UTILIDADES — REFRESH VISTA PÚBLICA
    ══════════════════════════════════════════════════════════════════ */

    /* Después de guardar, recarga automáticamente el HTML público
       para que el cambio se vea sin hacer F5 manualmente.
       Estrategia:
         1. Si hay iframes en esta página que apunten a tschedule → los recarga
         2. Si se abrió la web pública en otra pestaña con window.open → la recarga
         3. Fallback: nada (el usuario puede hacer F5 si quiere)             */
    function refrescarVistaPublica() {
      // Opción 1: iframes en el panel
      document.querySelectorAll('iframe').forEach(f => {
        try { f.contentWindow.location.reload(); } catch(e) {}
      });
      // Opción 2: referencia guardada a ventana externa abierta desde el panel
      if (window._vistaPublica && !window._vistaPublica.closed) {
        try { window._vistaPublica.location.reload(); } catch(e) {}
      }
    }

    /* Abre la web pública (tschedule.html) en una ventana separada
       y guarda la referencia para poder recargarla al guardar.
       Podés agregar un botón en el panel que llame a esta función si querés. */
    function abrirVistaPublica() {
      window._vistaPublica = window.open('../tschedule.html', 'vista-publica');
    }

    /* Nombres de meses para conversión de fechas */
    const MESES     = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const MESES_WEB = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];

    /* Días de la semana (índice 0 = Domingo, igual que Date.getDay()) */
    const DIAS_S = ["DOMINGO","LUNES","MARTES","MIÉRCOLES","JUEVES","VIERNES","SÁBADO"];

    /* Array global de la agenda (se carga desde la API al iniciar) */
    let agenda = [];

    /* Índice origen del drag & drop */
    let dragSrc = null;


    /* ══════════════════════════════════════════════════════════════════
       UTILIDADES — TABS
    ══════════════════════════════════════════════════════════════════ */

    /* Cambia la pestaña activa por nombre */
    function switchTab(name) {
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.getElementById('tab-' + name).classList.add('active');
      event.currentTarget.classList.add('active');
    }


    /* ══════════════════════════════════════════════════════════════════
       UTILIDADES — FEEDBACK VISUAL
    ══════════════════════════════════════════════════════════════════ */

    /* Muestra una notificación toast por 3 segundos
       type: 'ok' (verde) | 'err' (rojo) */
    function toast(msg, type = 'ok') {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.className = `toast ${type} show`;
      setTimeout(() => t.classList.remove('show'), 3000);
    }

    /* Actualiza el indicador de estado en la topbar
       type: '' (gris) | 'ok' (verde) | 'err' (rojo) */
    function setStatus(msg, type = '') {
      const el = document.getElementById('status');
      el.className = 'topbar-status ' + type;
      document.getElementById('status-text').textContent = msg;
    }


    /* ══════════════════════════════════════════════════════════════════
       UTILIDADES — FECHAS
    ══════════════════════════════════════════════════════════════════ */

    /* Convierte "21 DE MAYO" → "2026-05-21" (formato input[type=date]) */
    function fechaToISO(fechaWeb) {
      if (!fechaWeb) return '';
      const m = fechaWeb.match(/(\d+)\s+DE\s+([A-ZÁÉÍÓÚ]+)/i);
      if (!m) return '';
      const mes = MESES_WEB.indexOf(m[2].toUpperCase()) + 1;
      if (!mes) return '';
      return `${new Date().getFullYear()}-${String(mes).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
    }

    /* Convierte "2026-05-21" → "21 DE MAYO" (formato para el HTML público) */
    function isoToFechaWeb(iso) {
      if (!iso) return '';
      const [y, m, d] = iso.split('-');
      return `${parseInt(d)} DE ${MESES_WEB[parseInt(m) - 1]}`;
    }

    /* Genera texto de countdown a partir de una fecha ISO "YYYY-MM-DD"
       Devuelve string con días restantes, "HOY" o "Finalizado" */
    function calcCountdown(iso) {
      if (!iso) return '';
      const hoy  = new Date(); hoy.setHours(0,0,0,0);
      const fin  = new Date(iso + 'T00:00:00');
      const diff = Math.round((fin - hoy) / 86400000);
      const leg  = `${fin.getDate()} de ${MESES[fin.getMonth()]}`;
      if (diff > 0)   return `⏳ Restan ${diff} días / Finaliza el ${leg}`;
      if (diff === 0) return `🚨 ¡Finaliza HOY! ${leg}`;
      return `❌ Finalizado el ${leg}`;
    }