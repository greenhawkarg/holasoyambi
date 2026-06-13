/* ══════════════════════════════════════════════════════════════════
   DOSSIER — LIGHTBOX
   Abre una imagen en pantalla completa con caption y badge opcional
══════════════════════════════════════════════════════════════════ */

// Abre el lightbox con la imagen, texto y badge de categoría
function abrirLightbox(src, caption, subcat) {
    const lb = document.getElementById('lightbox');
    document.getElementById('lb-img').src = src;           // pone la imagen
    document.getElementById('lb-caption').textContent = caption; // pone el caption
    const badge = document.getElementById('lb-badge');
    badge.textContent = subcat;
    badge.style.display = subcat ? '' : 'none'; // oculta el badge si no hay subcategoría
    lb.style.display = 'flex';                  // muestra el lightbox
    document.body.style.overflow = 'hidden';    // bloquea el scroll de fondo
}

// Cierra el lightbox — solo si se hace click en el fondo oscuro (no en la imagen)
function cerrarLightbox(e) {
    if (e && e.target !== document.getElementById('lightbox')) return;
    document.getElementById('lightbox').style.display = 'none';
    document.getElementById('lb-img').src = '';      // limpia la imagen
    document.body.style.overflow = '';               // restaura el scroll
}

// Cierra el lightbox también con la tecla Escape
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarLightbox(); });


/* ══════════════════════════════════════════════════════════════════
   DOSSIER — TABS
   Maneja el cambio entre pestañas y recuerda la última activa
══════════════════════════════════════════════════════════════════ */

const tabs   = document.querySelectorAll('.dossier-tab');   // todos los botones de tab
const panels = document.querySelectorAll('.tab-panel');     // todos los paneles de contenido

// Activa la tab con el nombre dado y desactiva las demás
function activarTab(name) {
    tabs.forEach(t   => t.classList.toggle('active', t.dataset.tab === name));
    panels.forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
}

// Escucha clicks en cada tab
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        activarTab(tab.dataset.tab);
        localStorage.setItem('dossier_tab', tab.dataset.tab); // guarda la tab activa
    });
});

// Al cargar la página, restaura la última tab que visitó el usuario
const saved = localStorage.getItem('dossier_tab');
if (saved && document.getElementById('tab-' + saved)) activarTab(saved);


/* ══════════════════════════════════════════════════════════════════
   DOSSIER — LIGHTBOX EN FLYERS DE CAMPAÑAS
   Agrega automáticamente el lightbox a todas las imágenes de campañas
   sin tocar el HTML
══════════════════════════════════════════════════════════════════ */

// Busca todos los <img> dentro de .flyer-item y les asigna el lightbox al hacer click
document.querySelectorAll('.flyer-item img').forEach(img => {
    img.style.cursor = 'pointer'; // cambia el cursor para indicar que es clickeable
    img.addEventListener('click', () => {
        abrirLightbox(img.src, img.alt, ''); // abre con src y alt como caption, sin badge
    });
});


/* ══════════════════════════════════════════════════════
   DOSSIER — MINI HERO GRAIN
   Genera ruido animado sobre el canvas del mini hero
══════════════════════════════════════════════════════ */

(function () {
    const canvas = document.querySelector('.dossier-fx-grain canvas');
    if (!canvas) return;                          // sale si no existe el canvas
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    function drawGrain() {
        const w = canvas.width;
        const h = canvas.height;
        const img = ctx.createImageData(w, h);
        const data = img.data;
        for (let i = 0; i < data.length; i += 4) {
            const v = Math.random() * 255 | 0;   // valor aleatorio por pixel
            data[i]     = v;                      // R
            data[i + 1] = v;                      // G
            data[i + 2] = v;                      // B
            data[i + 3] = 18;                     // alpha bajo = grain sutil
        }
        ctx.putImageData(img, 0, 0);
        requestAnimationFrame(drawGrain);         // loop continuo
    }

    resize();
    window.addEventListener('resize', resize);
    drawGrain();
})();