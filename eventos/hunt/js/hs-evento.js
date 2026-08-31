document.addEventListener('DOMContentLoaded', () => {
  const btnInfo = document.getElementById('hsBtnInfo');
  const btnReplay = document.getElementById('hsBtnReplay');
  const hero = document.getElementById('hsHero');
  const menu = document.getElementById('hsMenu');
  const video = document.querySelector('.hs-video');

  // --- Transición Vista 1 (tráiler) -> Vista 2 (menú) ---
  if (btnInfo && hero && menu) {
    btnInfo.addEventListener('click', () => {
      if (video) video.pause();
      hero.classList.add('is-hidden');
      menu.classList.add('is-visible');
    });
  }

  // --- Volver a ver el tráiler desde el menú (Vista 2 -> Vista 1) ---
  if (btnReplay && hero && menu) {
    btnReplay.addEventListener('click', () => {
      menu.classList.remove('is-visible');
      hero.classList.remove('is-hidden');
      if (video) {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    });
  }

  // --- Pantalla completa para los clips en loop (Make Them Bleed / The Burgess) ---
  function setupClipFullscreen(clipId, btnId) {
    const clip = document.getElementById(clipId);
    const btn = document.getElementById(btnId);
    if (!clip || !btn) return;

    btn.addEventListener('click', () => {
      if (clip.requestFullscreen) clip.requestFullscreen();
      else if (clip.webkitRequestFullscreen) clip.webkitRequestFullscreen();
      else if (clip.webkitEnterFullscreen) clip.webkitEnterFullscreen();
    });

    const onFsChange = () => {
      const enFullscreen = document.fullscreenElement === clip;
      clip.controls = enFullscreen;
      clip.muted = !enFullscreen;
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
  }

  setupClipFullscreen('hsClipMTB', 'hsBtnFullscreenMTB');
  setupClipFullscreen('hsClipTB', 'hsBtnFullscreenTB');

  // --- Tríptico de fases (Make Them Bleed): 3 clips en horizontal, cada
  // uno con su propio botón de pantalla completa (mismo patrón que los
  // clips de arriba). Se arma 100% desde el JSON, sin nada fijo en el HTML.
  function renderTriptico(fases) {
    const cont = document.getElementById('hsTriptychMTB');
    if (!cont || !Array.isArray(fases) || !fases.length) return;

    const textos = fases.map(fase => `
      <div class="hs-triptych-text">
        <h4 class="hs-triptych-title">${fase.titulo || ''}</h4>
        <span class="hs-triptych-sub">${fase.sub || ''}</span>
        <ul class="hs-triptych-list">
          ${(fase.items || []).map(it => `<li><strong>${it.label || ''}</strong>${it.text || ''}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    const videos = fases.map((fase, i) => {
      if (fase.clip) {
        return `
          <div class="hs-triptych-media hs-media-frame">
            <video id="hsClipMTB-${i}" autoplay muted loop playsinline preload="auto" poster="${fase.poster || ''}">
              <source src="${fase.clip}" type="video/mp4">
            </video>
            <button class="hs-btn-fullscreen" id="hsBtnFullscreenMTB-${i}" type="button" aria-label="Pantalla completa" title="Pantalla completa">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
                <path d="M16 3h3a2 2 0 0 1 2 2v3"/>
                <path d="M21 16v3a2 2 0 0 1-2 2h-3"/>
                <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            </button>
          </div>
        `;
      }
      // Sin clip todavía: placeholder de estática de TV (ver .hs-tv-static en el CSS)
      return `
        <div class="hs-triptych-media hs-tv-static" aria-hidden="true">
          <span class="hs-tv-static-label">Sin señal</span>
        </div>
      `;
    }).join('');

    // Orden en el DOM: los 3 textos primero, después los 3 videos. El CSS
    // (grid-template-areas) los reubica visualmente por par texto+video en
    // mobile, pero acá el orden importa porque las áreas se asignan por
    // nth-of-type — ver hs-triptych en el CSS.
    cont.innerHTML = textos + videos;

    fases.forEach((fase, i) => {
      if (fase.clip) setupClipFullscreen(`hsClipMTB-${i}`, `hsBtnFullscreenMTB-${i}`);
    });
  }

  // --- Dúo de columnas (The Burgess): texto+clip al lado de texto+imagen.
  // Mismo criterio que el tríptico — todo sale del JSON, nada fijo en el
  // HTML. Cada item admite "lista" (bullets) o "parrafos" (texto corrido),
  // y "clip" (video con botón de pantalla completa) o "img" (imagen fija).
  function renderDuo(items) {
    const cont = document.getElementById('hsDuoTB');
    if (!cont || !Array.isArray(items) || !items.length) return;

    const textos = items.map(item => `
      <div class="hs-duo-text">
        ${item.eyebrow ? `<span class="hs-eyebrow hs-duo-eyebrow">${item.eyebrow}</span>` : ''}
        <h4 class="hs-triptych-title">${item.titulo || ''}</h4>
        ${
          item.lista
            ? `<ul class="hs-duo-list">${item.lista.map(l => `<li>${l}</li>`).join('')}</ul>`
            : (item.parrafos || []).map(p => `<p>${p}</p>`).join('')
        }
      </div>
    `).join('');

    const medias = items.map((item, i) => {
      if (item.clip) {
        return `
          <div class="hs-duo-media hs-media-frame">
            <video id="hsClipDuoTB-${i}" autoplay muted loop playsinline preload="auto">
              <source src="${item.clip}" type="video/mp4">
            </video>
            <button class="hs-btn-fullscreen" id="hsBtnFullscreenDuoTB-${i}" type="button" aria-label="Pantalla completa" title="Pantalla completa">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
                <path d="M16 3h3a2 2 0 0 1 2 2v3"/>
                <path d="M21 16v3a2 2 0 0 1-2 2h-3"/>
                <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            </button>
          </div>
        `;
      }
      if (item.img) {
        return `
          <div class="hs-duo-media hs-media-frame">
            <img src="${item.img}" alt="${item.titulo || ''}">
          </div>
        `;
      }
      return `<div class="hs-duo-media hs-tv-static" aria-hidden="true"><span class="hs-tv-static-label">Sin señal</span></div>`;
    }).join('');

    // Igual que en el tríptico: primero los 2 textos, después las 2 medias.
    // El CSS ubica cada una en su celda de grid por posición (ver hs-duo).
    cont.innerHTML = textos + medias;

    items.forEach((item, i) => {
      if (item.clip) setupClipFullscreen(`hsClipDuoTB-${i}`, `hsBtnFullscreenDuoTB-${i}`);
    });
  }

  // --- Carga de datos del evento (bg, video, textos, colores, links) ---
  // El HTML ya trae el contenido de Blood Testament como fallback visual;
  // si el JSON carga bien, lo pisa. Así la página nunca queda en blanco
  // aunque el fetch falle (ej. abierta con file:// en vez de servidor).
  fetch('data/hs-evento.json')
    .then(res => res.ok ? res.json() : Promise.reject(res.status))
    .then(aplicarDatosEvento)
    .catch(err => console.warn('hs-evento: no se pudo cargar el JSON, se usa el contenido fijo del HTML.', err));

  function aplicarDatosEvento(data) {
    // Colores
    if (data.colores) {
      const root = document.documentElement;
      if (data.colores.blood) root.style.setProperty('--hs-blood', data.colores.blood);
      if (data.colores.glow) root.style.setProperty('--hs-glow', data.colores.glow);
    }

    // BG
    const bgEl = document.querySelector('.hs-bg');
    if (bgEl && data.bg) bgEl.style.backgroundImage = `url('${data.bg}')`;

    // Video + poster
    if (video && data.video) {
      const source = video.querySelector('source');
      if (source) source.src = data.video;
      if (data.poster) video.poster = data.poster;
      video.load();
    }

    // Eyebrow + logo (hero)
    const heroEyebrow = hero ? hero.querySelector('.hs-eyebrow') : null;
    if (heroEyebrow && data.eyebrow) heroEyebrow.textContent = data.eyebrow;

    const logoEl = document.querySelector('.hs-logo');
    if (logoEl && data.logo_linea1 && data.logo_linea2) {
      logoEl.innerHTML = `${data.logo_linea1}<br>${data.logo_linea2}`;
    }

    // Header del menú
    const menuEyebrow = menu ? menu.querySelector('.hs-eyebrow') : null;
    if (menuEyebrow && data.logo_linea1 && data.logo_linea2) {
      menuEyebrow.textContent = `${data.logo_linea1} ${data.logo_linea2}`;
    }
    const menuTitle = document.querySelector('.hs-menu-title');
    if (menuTitle && data.menu_titulo) menuTitle.textContent = data.menu_titulo;

    // Links del menú (reemplaza los 4 fijos por los del JSON)
    const linksNav = document.getElementById('hsLinks');
    if (linksNav && Array.isArray(data.links) && data.links.length) {
      linksNav.innerHTML = data.links.map(link => `
        <a class="hs-link" href="#" data-target="${link.target || ''}">
          <span class="hs-link-face hs-link-title">${link.titulo}</span>
          <span class="hs-link-face hs-link-sub">${link.sub}</span>
        </a>
      `).join('');
    }

    // Bg (y media) por sección — pisa el fallback fijo del CSS/HTML
    if (data.secciones) {
      Object.keys(data.secciones).forEach(id => {
        const sec = document.getElementById(id);
        if (!sec) return;
        const cfg = data.secciones[id] || {};
        if (cfg.bg) {
          sec.style.backgroundImage =
            `linear-gradient(180deg, rgba(10,10,10,.88), rgba(10,10,10,.94)), url('${cfg.bg}')`;
        }
        if (cfg.img) {
          const imgEl = sec.querySelector('.hs-media-frame img');
          if (imgEl) imgEl.src = cfg.img;
        }
        if (cfg.clip) {
          const videoEl = sec.querySelector('.hs-media-frame video');
          const source = videoEl ? videoEl.querySelector('source') : null;
          if (source) {
            source.src = cfg.clip;
            videoEl.load();
          }
        }
      });

      // Tríptico de fases de Make Them Bleed (3 clips horizontales)
      if (data.secciones.evento && data.secciones.evento.fases) {
        renderTriptico(data.secciones.evento.fases);
      }

      // Dúo de columnas de The Burgess (lista+clip / párrafos+imagen)
      if (data.secciones.arma && data.secciones.arma.duo) {
        renderDuo(data.secciones.arma.duo);
      }
    }
  }

  // TODO (fase 2 - panel): el panel va a escribir directamente
  // data/hs-evento.json (textos, colores) y subir bg/video/poster
  // a imgs/ con nombre fijo — esta página no necesita más cambios.

  // --- ONE-PAGE: scroll a sección + nav lateral con scrollspy ---
  const stickyNav = document.getElementById('hsStickyNav');

  // "Paradas" del scroll, en orden de aparición en la página: el
  // hero/menú (#hsPage) + las 4 secciones de contenido. Se recalculan
  // en cada uso porque el alto de cada una puede cambiar (ej. si el
  // JSON reemplaza texto/imágenes más largas/cortas).
  function getScrollStops() {
    const stops = [document.getElementById('hsPage')];
    document.querySelectorAll('.hs-section').forEach(sec => stops.push(sec));
    return stops.filter(Boolean); // por si #hsPage no existiera, no rompe
  }

  // Índice (dentro de getScrollStops()) de la sección en la que el
  // usuario tiene permitido scrollear libremente en este momento.
  // Arranca en 0 (hero/menú) y se actualiza al cargar la página y
  // después de cada salto por link.
  let lockedStopIndex = 0;

  // true mientras dura la animación de scrollIntoView disparada por
  // un click en un link — durante ese lapso el bloqueo de scroll se
  // desactiva por completo, porque ese salto SÍ tiene que poder
  // cruzar de sección.
  let saltoPorLink = false;
  let saltoTimeoutId = null;

  // Recalcula lockedStopIndex en base a la posición real de scroll
  // (mirando el centro del viewport contra el borde superior de
  // cada parada, de arriba hacia abajo).
  function actualizarParadaActual() {
    const stops = getScrollStops();
    const scrollCenter = window.scrollY + window.innerHeight / 2;
    let idx = 0;
    stops.forEach((el, i) => {
      if (el.offsetTop <= scrollCenter) idx = i;
    });
    lockedStopIndex = idx;
  }
  actualizarParadaActual(); // valor inicial al cargar la página

  // Delegación en document: funciona con los links fijos del HTML Y con
  // los que el JSON reescribe después (mismo criterio que hunter-profile.js en DROPS).
  // También cubre el ícono home (data-target="hsPage") sin agregar lógica nueva.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-target]');
    if (!link) return;
    const target = document.getElementById(link.dataset.target);
    if (!target) return;

    e.preventDefault();

    // Mientras dura el salto dejamos pasar el scroll libremente: si no,
    // el propio bloqueo frenaría el scrollIntoView a mitad de camino
    // y el link dejaría de funcionar.
    saltoPorLink = true;
    if (saltoTimeoutId) clearTimeout(saltoTimeoutId);
    target.scrollIntoView({ behavior: 'smooth' });

    // scroll-behavior:smooth no tiene un evento "terminé" con soporte
    // parejo en todos los navegadores, así que usamos un timeout
    // prudencial (de sobra para el scroll más largo de la página) y
    // al final recalculamos en qué sección quedamos parados.
    saltoTimeoutId = setTimeout(() => {
      saltoPorLink = false;
      actualizarParadaActual();
    }, 900);
  });

  if (hero && stickyNav) {
    // el nav lateral aparece recién cuando el usuario ya bajó del hero+menu
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        stickyNav.classList.toggle('is-visible', !entry.isIntersecting);
      });
    }, { threshold: 0.05 });
    heroObserver.observe(document.getElementById('hsPage'));
  }

  const sections = document.querySelectorAll('.hs-section');
  if (sections.length && stickyNav) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          document.querySelectorAll('.hs-sticky-link').forEach(l => {
            l.classList.toggle('is-active', l.dataset.target === entry.target.id);
          });
        }
      });
    }, { threshold: 0.4 });
    sections.forEach(s => sectionObserver.observe(s));
  }

  // ==================================================
  // BLOQUEO DE SCROLL LIBRE ENTRE SECCIONES
  // ==================================================
  // Regla: se puede scrollear con normalidad DENTRO de una sección
  // (por ejemplo, para llegar al final de un lore largo), pero al
  // llegar al borde superior/inferior de la sección actual, ya NO se
  // avanza a la siguiente/anterior — para eso hay que usar los links
  // del menú o del panel lateral (que sí pueden cruzar, por el flag
  // saltoPorLink de arriba).
  //
  // Se combinan DOS mecanismos para cubrir todos los casos:
  //
  // 1) proyección de movimiento (wheel / touch / teclado): en vez de
  //    preguntar "¿ya estoy en el borde?", cada evento calcula a dónde
  //    terminarías con ESE movimiento puntual. Si eso cruza el borde
  //    permitido, se frena exactamente ahí (scrollTo preciso) ANTES de
  //    que el navegador mueva la página — así no hay ni un parpadeo,
  //    ni siquiera con un tick grande de rueda/trackpad que arranca
  //    lejos del borde.
  //
  // 2) scroll + clamp: red de seguridad para lo que el punto 1 no
  //    puede interceptar (arrastre directo de la scrollbar del
  //    navegador — aunque está oculta por CSS, por si reaparece en
  //    algún navegador — o inercia de trackpad en Safari que a veces
  //    sigue empujando después de preventDefault): si por cualquier
  //    motivo el scroll ya cruzó el borde permitido, se lo "clampea"
  //    de vuelta en el mismo frame. Con rueda/touch/teclado normales
  //    ni se nota, porque el punto 1 ya frenó antes de que pase.

  // --- Mecanismo 1: proyección de movimiento (frena antes de cruzar el borde) ---
  // Calcula a dónde terminaría el scroll con el deltaY del evento puntual.
  // Si eso cruza el borde de la sección bloqueada, devuelve la posición
  // exacta donde hay que frenar; si no cruza, devuelve null (dejar pasar).
  function getClampObjetivo(deltaY) {
    const stops = getScrollStops();
    const el = stops[lockedStopIndex];
    if (!el) return null;

    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    const viewportH = window.innerHeight;
    const maxScrollY = Math.max(top, bottom - viewportH);
    const proyectado = window.scrollY + deltaY;

    if (deltaY > 0 && proyectado > maxScrollY) return maxScrollY; // bajando, se pasaría del borde
    if (deltaY < 0 && proyectado < top) return top;               // subiendo, se pasaría del borde
    return null; // este movimiento no cruza el borde, dejar pasar normal
  }

  function bloquearYClampear(e, deltaY) {
    const objetivo = getClampObjetivo(deltaY);
    if (objetivo === null) return; // no hace falta tocar nada

    e.preventDefault();
    if (window.scrollY !== objetivo) {
      // OJO: 'auto' NO es "instantáneo" — significa "hacé lo que diga
      // scroll-behavior en el CSS", y como html tiene scroll-behavior:smooth,
      // 'auto' terminaba animando esta corrección durante ~1s (eso era el
      // parpadeo). 'instant' sí ignora el CSS y salta sin animación.
      window.scrollTo({ top: objetivo, behavior: 'instant' });
    }
  }

  document.addEventListener('wheel', (e) => {
    if (saltoPorLink) return; // durante un salto por link, no interferir
    bloquearYClampear(e, e.deltaY);
  }, { passive: false });

  // Touch (tablets, que sí pasan el gate mobile): como no hay un
  // "deltaY" directo, se compara la posición del dedo entre el touch
  // anterior y el actual para saber la dirección y magnitud del intento
  // de scroll, y se usa el mismo criterio de proyección de arriba.
  let touchLastY = null;

  document.addEventListener('touchstart', (e) => {
    touchLastY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (saltoPorLink || touchLastY === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = touchLastY - currentY; // positivo = dedo sube = intento de scroll hacia abajo
    touchLastY = currentY;
    bloquearYClampear(e, deltaY);
  }, { passive: false });

  // Teclado: flechas, Page Up/Down y barra espaciadora también pueden
  // mover el scroll nativo. Antes solo se pasaba +1/-1 (dirección sin
  // magnitud real), lo que no alcanzaba para saber si el movimiento
  // real iba a cruzar el borde o no. Ahora se estima cuánto mueve cada
  // tecla en el navegador y se usa esa magnitud con el mismo criterio
  // de proyección que rueda/touch.
  const TECLA_DELTA = {
    ArrowDown: 40,
    ArrowUp: -40,
    PageDown: () => window.innerHeight * 0.9,
    PageUp: () => -window.innerHeight * 0.9,
    ' ': () => window.innerHeight * 0.9,
    Spacebar: () => window.innerHeight * 0.9,
  };

  document.addEventListener('keydown', (e) => {
    if (saltoPorLink) return;
    const val = TECLA_DELTA[e.key];
    if (val === undefined) return;
    const deltaY = typeof val === 'function' ? val() : val;
    bloquearYClampear(e, deltaY);
  }, { passive: false });

  // --- Mecanismo 2: scroll + clamp (red de seguridad universal) ---
  // No usa preventDefault (el evento 'scroll' ya es tardío, la página
  // ya se movió): en cambio, corrige la posición con window.scrollTo
  // apenas se detecta que se pasó del borde permitido.
  let clampRAF = null;

  document.addEventListener('scroll', () => {
    if (saltoPorLink) return; // durante un salto por link, no tocar nada
    if (clampRAF) return;     // ya hay una corrección programada para este frame

    clampRAF = requestAnimationFrame(() => {
      clampRAF = null;

      const stops = getScrollStops();
      const el = stops[lockedStopIndex];
      if (!el) return;

      const top = el.offsetTop;
      const bottom = top + el.offsetHeight;
      const viewportH = window.innerHeight;
      // tope de scroll permitido dentro de esta sección (nunca menor a "top",
      // por si la sección es más baja que un viewport)
      const maxScrollY = Math.max(top, bottom - viewportH);

      if (window.scrollY > maxScrollY) {
        window.scrollTo({ top: maxScrollY, behavior: 'instant' });
      } else if (window.scrollY < top) {
        window.scrollTo({ top: top, behavior: 'instant' });
      }
    });
  }, { passive: true });
});
