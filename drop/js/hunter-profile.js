(function () {
  var overlay = document.getElementById('hunter-profile-overlay');
  var panel = document.getElementById('hunter-profile-panel');
  var closeBtn = document.getElementById('hunter-profile-close');
  var imgEl = document.getElementById('hunter-profile-img');
  var nameEl = document.getElementById('hunter-profile-name');
  var sectionsEl = document.getElementById('hunter-profile-sections');
  var loreData = null;
  var huntersData = null;

  fetch('data/recompensas.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      loreData = data.hunter_lore || {};
      huntersData = data.hunters || {};
    });

  function openProfile(name) {
    if (!loreData || !loreData[name]) return;
    var lore = loreData[name];

    imgEl.src = huntersData[name] || '';
    imgEl.alt = lore.full_name || name;
    nameEl.textContent = lore.full_name || name;

    sectionsEl.innerHTML = '';
    (lore.sections || []).forEach(function (sec) {
      var h4 = document.createElement('h4');
      h4.className = 'hunter-profile-heading';
      h4.textContent = sec.heading;

      var p = document.createElement('p');
      p.className = 'hunter-profile-text';
      p.innerHTML = (sec.text || '').replace(/\n\n/g, '<br><br>');

      sectionsEl.appendChild(h4);
      sectionsEl.appendChild(p);
    });

    overlay.classList.add('is-open');
    panel.classList.add('is-open');
  }

  function closeProfile() {
    overlay.classList.remove('is-open');
    panel.classList.remove('is-open');
  }

  // Delegado a document en vez de a #reward-detail: este script ahora
  // carga una sola vez junto al layout base (ver hunt-drops.html), y en
  // ese momento #reward-detail todavía no existe (recién lo crea loader.js
  // al fetchear recompensas.html). Además el nodo se destruye y se vuelve
  // a crear en cada visita a la pestaña, así que un listener puesto
  // directamente sobre él quedaría colgado del nodo viejo.
  document.addEventListener('click', function (e) {
    var card = e.target.closest('.hunter-card');
    if (!card) return;
    var nameSpan = card.querySelector('span');
    if (!nameSpan) return;
    openProfile(nameSpan.textContent.trim());
  });

  overlay.addEventListener('click', closeProfile);
  closeBtn.addEventListener('click', closeProfile);
})();