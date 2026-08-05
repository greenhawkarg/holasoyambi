/* ==========================================================================
   Sección Recompensas — lógica propia
   Se ejecuta cada vez que loader.js inyecta sections/recompensas.html en
   #content (vía runScripts). Arma el submenú de categorías reusando la
   misma mecánica que Campaña/Suministros (window.AmbiOpenSubmenu) y
   renderiza el detalle de cada categoría leyendo data/recompensas.json.
   ========================================================================== */

(function () {
  const categories = [
    { key: 'cazador_legendario', label: 'Cazador' },
    { key: 'skin_legendaria',    label: 'Skin' },
    { key: 'golden_skin',        label: 'Golden Skin' },
    { key: 'avatar',             label: 'Avatar' },
    { key: 'amuleto',            label: 'Amuleto' },
  ];

  const detail = document.getElementById('reward-detail');
  const recFootBtn = document.querySelector('.foot-btn[data-section="recompensas"]');

  const oldSubmenu = document.getElementById('recompensas-submenu');
  if (oldSubmenu) oldSubmenu.remove();

  // Si venimos de un click en Suministros sobre un premio puntual, arrancamos
  // directamente en esa categoría en vez de la primera de la lista.
  const pendingCategory = window.AmbiPendingRewardCategory;
  window.AmbiPendingRewardCategory = null;
  const initialKey = categories.some(c => c.key === pendingCategory) ? pendingCategory : categories[0].key;

  const submenu = document.createElement('nav');
  submenu.id = 'recompensas-submenu';
  submenu.className = 'inicio-submenu';
  submenu.innerHTML = categories.map((cat, i) =>
    `<button class="sub-btn${cat.key === initialKey ? ' active' : ''}" data-view="${cat.key}">${cat.label}</button>`
  ).join('');
  document.body.appendChild(submenu);

  const subButtons = submenu.querySelectorAll('.sub-btn');

  let rec = null;
  let hunters = {};
  let avatars = {};

  function skinImagePath(name) {
    const fileName = name.replace(/:/g, '');
    return `imgs/guns/${fileName}.jpg`;
  }

  function charmImagePath(name) {
    return `imgs/charms/${name}.webp`;
  }

  function renderPoolItem(name, kind) {
    if (kind === 'hunter') {
      const img = hunters[name];
      if (img) {
        return `<div class="hunter-card"><img src="${img}" alt="${name}" loading="lazy"><span>${name}</span></div>`;
      }
      return `<span>${name}</span>`;
    }
    if (kind === 'avatar') {
      const img = avatars[name];
      if (img) {
        return `<div class="hunter-card"><img src="${img}" alt="${name}" loading="lazy"><span>${name}</span></div>`;
      }
      return `<span>${name}</span>`;
    }
    if (kind === 'gun') {
      const sepIndex = name.indexOf(' - ');
      const skinName = sepIndex === -1 ? name : name.slice(0, sepIndex);
      const weaponName = sepIndex === -1 ? '' : name.slice(sepIndex + 3);
      return `<div class="gun-card"><img src="${skinImagePath(name)}" alt="${name}" loading="lazy">
        <div class="gun-card-label">
          <span class="gun-card-weapon">${weaponName}</span>
          <span class="gun-card-skin">${skinName}</span>
        </div>
      </div>`;
    }
    if (kind === 'charm') {
      return `<div class="charm-card"><img src="${charmImagePath(name)}" alt="${name}" loading="lazy">
        <span class="charm-card-name">${name}</span>
      </div>`;
    }
    return `<span>${name}</span>`;
  }

  function poolContainerClass(kind) {
    if (kind === 'hunter') return 'reward-pool reward-pool--cards';
    if (kind === 'avatar') return 'reward-pool reward-pool--cards';
    if (kind === 'gun') return 'reward-pool reward-pool--guns';
    if (kind === 'charm') return 'reward-pool reward-pool--charms';
    return 'reward-pool reward-pool--text';
  }

  function renderDetail(key) {
    if (!rec) return;
    const r = rec[key];

    const kind = (key === 'cazador_legendario') ? 'hunter'
               : (key === 'avatar') ? 'avatar'
               : (key === 'skin_legendaria') ? 'gun'
               : (key === 'amuleto') ? 'charm'
               : 'text';

    let html = `<h3 style="font-family:var(--f-display); font-size:18px; letter-spacing:.04em; color:var(--bone); text-transform:uppercase; margin-bottom:6px;">${r.label}</h3>`;
    if (r.note) html += `<p class="section-intro">${r.note}</p>`;
    if (r.pool) {
      html += `<div class="${poolContainerClass(kind)}">${r.pool.map(n => renderPoolItem(n, kind)).join('')}</div>`;
    }
    if (r.fallback_note) html += `<p class="section-intro">${r.fallback_note}</p>`;
    if (r.fallback_pool) {
      html += `<p class="section-intro" style="margin-bottom:6px;">Si ya tenés todo lo anterior, el pool pasa a ser:</p>`;
      html += `<div class="${poolContainerClass(kind)}">${r.fallback_pool.map(n => renderPoolItem(n, kind)).join('')}</div>`;
    }
    if (r.excluded_note) html += `<p class="section-intro" style="font-style:italic;">${r.excluded_note}</p>`;
    if (r.final_fallback) html += `<p class="reward-final">${r.final_fallback}</p>`;
    detail.innerHTML = html;
  }

  subButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      subButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderDetail(btn.dataset.view);
    });
  });

  if (window.AmbiOpenSubmenu) {
    window.AmbiOpenSubmenu(submenu, recFootBtn);
  }

  fetch('data/recompensas.json')
    .then(res => res.json())
    .then(data => {
      rec = data.recompensas;
      hunters = data.hunters || {};
      avatars = data.avatars || {};
      renderDetail(initialKey);
    })
    .catch(err => console.error('[AMBI DROPS] Error en recompensas', err));

  let zoomEl = document.getElementById('gun-zoom-popup');
  if (!zoomEl) {
    zoomEl = document.createElement('div');
    zoomEl.id = 'gun-zoom-popup';
    zoomEl.innerHTML = '<img id="gun-zoom-img" src="" alt="">';
    document.body.appendChild(zoomEl);
  }
  const zoomImg = document.getElementById('gun-zoom-img');

  // Nota: se agregó .charm-card al selector para que el zoom también
  // funcione al pasar el mouse por los amuletos, no solo por las armas.
  detail.addEventListener('mouseover', (e) => {
    const card = e.target.closest('.gun-card, .charm-card');
    if (!card) return;
    const img = card.querySelector('img');
    if (!img) return;
    zoomImg.src = img.src;
    zoomEl.classList.add('is-visible');
  });

  detail.addEventListener('mousemove', (e) => {
    if (!zoomEl.classList.contains('is-visible')) return;
    zoomEl.style.left = `${e.clientX + 20}px`;
    zoomEl.style.top = `${e.clientY + 20}px`;
  });

  detail.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.gun-card, .charm-card');
    if (!card) return;
    if (card.contains(e.relatedTarget)) return;
    zoomEl.classList.remove('is-visible');
  });
})();