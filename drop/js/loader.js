/* ==========================================================================
   AMBI DROPS — Loader
   Carga sections/*.html dentro de #content por fetch. El contenido de
   Campaña también se arma por fetch, leyendo el bloque "home" de
   data/drops.json (pensado para editarse después desde el panel).
   ========================================================================== */

(function () {
  const content = document.getElementById('content');
  const countdownWrap = document.querySelector('.countdown-wrap');
  const buttons = document.querySelectorAll('.foot-btn[data-section]');
  const submenu = document.getElementById('inicio-submenu');
  const campanaSubBtn = submenu.querySelector('.sub-btn[data-target="campana-main"]');
  const incluyeBtn = submenu.querySelector('.sub-btn[data-target="home-incluye"]');
  const campanaFootBtn = document.querySelector('.foot-btn[data-section="campana"]');
  const pageScroll = document.querySelector('.page-scroll');
  const footerbar = document.querySelector('.footerbar');

  let homeData = null; // cache para no re-fetchear cada vez que se toca Campaña

  function runScripts(container) {
    container.querySelectorAll('script').forEach(oldScript => {
      const newScript = document.createElement('script');
      [...oldScript.attributes].forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });
  }

  function setActiveButton(name) {
    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.section === name));
  }

  function hideCountdown() {
    countdownWrap.classList.add('is-hidden');
  }

  function closeSubmenu() {
    document.querySelectorAll('.inicio-submenu.is-open').forEach(nav => nav.classList.remove('is-open'));
    document.querySelectorAll('.foot-btn.is-disabled').forEach(btn => btn.classList.remove('is-disabled'));
    footerbar.classList.remove('is-pushed');
    pageScroll.classList.remove('has-submenu-open');
  }

  // Abre un submenú tipo "inicio-submenu": lo muestra, empuja el footerbar
  // hacia arriba, agranda el hueco del page-scroll y deshabilita visualmente
  // el botón del footer correspondiente a esa sección. Reusable por
  // cualquier sección (Campaña la usa acá abajo; Suministros la llama desde
  // su propio script vía window.AmbiOpenSubmenu).
  function openSubmenu(navEl, footBtn) {
    navEl.classList.add('is-open');
    footerbar.classList.add('is-pushed');
    pageScroll.classList.add('has-submenu-open');
    if (footBtn) {
      footBtn.classList.remove('active');
      footBtn.classList.add('is-disabled');
    }
  }

  window.AmbiOpenSubmenu = openSubmenu;

  function fadeIn() {
    content.classList.remove('content-fade');
    void content.offsetWidth;
    content.classList.add('content-fade');
    pageScroll.scrollTo({ top: 0 });
  }

  function renderCampanaMain(home) {
    let html = `<h2 class="home-title">${home.title}</h2>`;
    html += `<p class="home-paragraph">${home.intro}</p>`;
    (home.paragraphs || []).slice(0, 2).forEach(p => {
      html += `<p class="home-paragraph">${p}</p>`;
    });
    content.innerHTML = html;
    fadeIn();
    campanaSubBtn.classList.add('active');
    incluyeBtn.classList.remove('active');
  }

  function renderIncluye(home) {
    let html = '<h2 class="home-title">Qué incluye</h2>';
    (home.paragraphs || []).slice(2).forEach(p => {
      html += `<p class="home-paragraph">${p}</p>`;
    });
    html += `<ul class="home-bullets">${home.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
    content.innerHTML = html;
    fadeIn();
    incluyeBtn.classList.add('active');
    campanaSubBtn.classList.remove('active');
  }

  campanaSubBtn.addEventListener('click', () => {
    if (!homeData) return;
    renderCampanaMain(homeData);
  });

  incluyeBtn.addEventListener('click', () => {
    if (!homeData) return;
    renderIncluye(homeData);
  });

  function goCountdown() {
    countdownWrap.classList.remove('is-hidden');
    content.innerHTML = '';
    closeSubmenu();
    setActiveButton('countdown');
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  }

  function goCampana() {
    closeSubmenu();
    hideCountdown();
    setActiveButton('campana');
    openSubmenu(submenu, campanaFootBtn);
    if (history.replaceState) history.replaceState(null, '', '#campana');

    if (homeData) {
      renderCampanaMain(homeData);
      return;
    }

    content.innerHTML = '<p class="section-intro" style="text-align:center; margin-top:40px;">Cargando…</p>';

    fetch('data/drops.json')
      .then(res => res.json())
      .then(data => {
        homeData = data.home;
        renderCampanaMain(homeData);
      })
      .catch(err => {
        content.innerHTML = `<p class="section-intro" style="text-align:center; margin-top:40px;">No se pudo cargar la campaña.</p>`;
        console.error('[AMBI DROPS] Error cargando home', err);
      });
  }

  function loadSection(name) {
    content.innerHTML = '<p class="section-intro" style="text-align:center; margin-top:40px;">Cargando…</p>';
    hideCountdown();
    closeSubmenu();

    fetch(`sections/${name}.html`)
      .then(res => {
        if (!res.ok) throw new Error(`No se encontró sections/${name}.html`);
        return res.text();
      })
      .then(html => {
        content.innerHTML = html;
        fadeIn();
        runScripts(content);
      })
      .catch(err => {
        content.innerHTML = `<p class="section-intro" style="text-align:center; margin-top:40px;">No se pudo cargar esta sección.</p>`;
        console.error('[AMBI DROPS] Error cargando sección', err);
      });

    setActiveButton(name);
    if (history.replaceState) history.replaceState(null, '', `#${name}`);
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.section;
      if (name === 'countdown') {
        goCountdown();
      } else if (name === 'campana') {
        goCampana();
      } else {
        loadSection(name);
      }
    });
  });

  // Al entrar, respeta el hash de la URL solo para Suministros/Recompensas.
  // Un #campana viejo de una recarga anterior NO hace que arranque ahí:
  // siempre arranca en Countdown salvo que el link sea directo a esas dos.
  const initial = location.hash.replace('#', '');
  if (initial === 'suministros' || initial === 'recompensas') {
    loadSection(initial);
  } else {
    goCountdown();
  }
})();