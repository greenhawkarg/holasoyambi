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
      "CAMPAÑA",
      "CONTENIDO EXCLUSIVO",
      "DEMO CERRADA",
      "DESAFIO",
      "DÍA DE FALOPITAS",
      "DÍA DE SIMULANDO",
      "EARLY ACCESS",
      "EARLY ACCESS EXCLUSIVO",
      "ESTRENO",
      "EVENTO",
      "INVITADOS A LA PLAYTEST",
      "INVITADOS AL EVENTO",
      "INVITADOS POR EL STUDIO",
      "REVIEW"
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
       UTILIDADES — DRAG & DROP DE IMÁGENES
       Convierte el recuadro de preview de una imagen (el div que muestra
       "preview" / la miniatura) en una zona donde se puede soltar un
       archivo arrastrado desde el explorador de Windows/Mac.

       No reemplaza el flujo existente: cuando se suelta un archivo válido,
       se lo asigna al <input type="file"> real (usando DataTransfer) y se
       dispara su evento "change". Como cada input ya tiene su propio
       onchange (indexPreview, twitchCardPreview, huntPreview, etc.), todo
       el resto de la lógica (preview, nombre del archivo, upload al
       guardar) sigue funcionando sin tocar nada más.

       Uso: habilitarDragDrop('ix-thumb-prev', 'ix-thumb-file');
    ══════════════════════════════════════════════════════════════════ */

    function habilitarDragDrop(previewId, fileInputId) {
      const zona  = document.getElementById(previewId);
      const input = document.getElementById(fileInputId);
      if (!zona || !input) return; // Si no existen los elementos, no hace nada (evita errores en consola)

      /* Frena el comportamiento default del navegador (que sería abrir/
         descargar el archivo) en todos los eventos de drag relevantes */
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evName => {
        zona.addEventListener(evName, e => {
          e.preventDefault();
          e.stopPropagation();
        });
      });

      /* Feedback visual: resalta el recuadro mientras se arrastra un
         archivo encima. Se usa outline (no border) para no mover el
         layout, y var(--cyan) porque ya se usa ese color en el panel
         para indicar "archivo nuevo seleccionado" (ver ix-thumb-name) */
      const resaltar   = () => { zona.style.outline = '2px dashed var(--cyan)'; zona.style.outlineOffset = '-2px'; };
      const quitarResaltado = () => { zona.style.outline = ''; zona.style.outlineOffset = ''; };

      zona.addEventListener('dragenter', resaltar);
      zona.addEventListener('dragover',  resaltar);
      zona.addEventListener('dragleave', quitarResaltado);

      /* Al soltar el archivo */
      zona.addEventListener('drop', e => {
        quitarResaltado();

        const file = e.dataTransfer.files[0];
        if (!file) return;

        /* Valida que sea una imagen antes de aceptarla */
        if (!/^image\//.test(file.type)) {
          toast('El archivo soltado debe ser una imagen', 'err');
          return;
        }

        /* Construye un FileList "falso" con el archivo soltado y se lo
           asigna al input real. Esto es necesario porque input.files
           es de solo lectura y no se puede asignar un array directo */
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;

        /* Dispara el evento change del input para que corra el mismo
           preview/lógica que correría si el usuario lo hubiera
           seleccionado con el botón "Seleccionar imagen" */
        input.dispatchEvent(new Event('change'));
      });

      /* Bonus: permite también hacer click sobre el recuadro de preview
         para abrir el selector de archivos, no solo arrastrar */
      zona.style.cursor = 'pointer';
      zona.addEventListener('click', () => input.click());
    }


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