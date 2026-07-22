/* ==========================================================================
   Sección Suministros — lógica propia
   Se ejecuta cada vez que loader.js inyecta sections/suministros.html en
   #content (vía runScripts). Arma el submenú Suministros/Cronograma reusando
   la misma mecánica que Campaña/Recompensas (window.AmbiOpenSubmenu) y
   renderiza los datos leyendo data/drops.json.
   ========================================================================== */

(function () {
  const mainPanel = document.getElementById('sum-panel-main');
  const cronoPanel = document.getElementById('sum-panel-cronograma');
  const sumFootBtn = document.querySelector('.foot-btn[data-section="suministros"]');

  // Si ya existía un submenú de una visita anterior a esta sección, lo saco
  // antes de crear uno nuevo (evita que se acumulen duplicados en el body).
  const oldSubmenu = document.getElementById('suministros-submenu');
  if (oldSubmenu) oldSubmenu.remove();

  const submenu = document.createElement('nav');
  submenu.id = 'suministros-submenu';
  submenu.className = 'inicio-submenu';
  submenu.innerHTML = `
    <button class="sub-btn active" data-view="main">Suministros</button>
    <button class="sub-btn" data-view="cronograma">Cronograma</button>
  `;
  document.body.appendChild(submenu);

  const subButtons = submenu.querySelectorAll('.sub-btn');

  function showPanel(view) {
    mainPanel.style.display = view === 'main' ? '' : 'none';
    cronoPanel.style.display = view === 'cronograma' ? '' : 'none';
    subButtons.forEach(b => b.classList.toggle('active', b.dataset.view === view));
  }

  subButtons.forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.view));
  });

  // Abre el submenú reusando la misma mecánica que Campaña (footer se
  // empuja hacia arriba, page-scroll agranda su hueco, botón "Suministros"
  // del footer se deshabilita mientras este submenú maneja la navegación).
  if (window.AmbiOpenSubmenu) {
    window.AmbiOpenSubmenu(submenu, sumFootBtn);
  }

  fetch('data/drops.json')
    .then(res => res.json())
    .then(data => {
      const totalEl = document.getElementById('crate-total');
      totalEl.textContent = `Hasta ${data.campaign.total_supply_crates} Suministros a lo largo de toda la campaña`;

      const contentsWrap = document.getElementById('crate-contents');
      data.supply_crate.contents.forEach(item => {
        const card = document.createElement('div');
        card.className = 'sum-card';
        card.innerHTML = `
          <div class="sum-card-qty">${item.qty}×</div>
          <div class="sum-card-label">${item.item}</div>
        `;
        contentsWrap.appendChild(card);
      });

      const windowsWrap = document.getElementById('crate-windows');
      const fmt = d => d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });

      data.reward_windows.forEach(w => {
        const start = new Date(w.start_utc);
        const end = new Date(w.end_utc);

        const card = document.createElement('div');
        card.className = 'sum-window-card';

        const tracksHtml = (w.tracks || []).map(t => `
          <div class="sum-track-row">
            <span class="sum-track-time">${t.time}</span>
            <span class="sum-track-reward">${t.reward}</span>
          </div>
        `).join('');

        card.innerHTML = `
          <div class="sum-window-head">
            <span class="sum-window-label">${w.label}</span>
            <span class="sum-window-date">${fmt(start)} – ${fmt(end)}</span>
          </div>
          <div class="sum-window-tracks">${tracksHtml}</div>
        `;

        windowsWrap.appendChild(card);
      });
    })
    .catch(err => console.error('[AMBI DROPS] Error en suministros', err));
})();
