/* ==========================================================================
   AMBI DROPS — Countdown
   Lee data/drops.json y muestra cuenta regresiva hasta el inicio de la
   campaña (si todavía no arrancó) o hasta el final (si ya está en curso).
   ========================================================================== */

(function () {
  const els = {
    label: document.getElementById('countdown-label'),
    days:  document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    mins:  document.getElementById('cd-mins'),
    secs:  document.getElementById('cd-secs'),
  };

  let campaign = null;
  let timerId = null;

  function pad(n) { return String(n).padStart(2, '0'); }

  function diffParts(ms) {
    if (ms < 0) ms = 0;
    const totalSecs = Math.floor(ms / 1000);
    return {
      days:  Math.floor(totalSecs / 86400),
      hours: Math.floor((totalSecs % 86400) / 3600),
      mins:  Math.floor((totalSecs % 3600) / 60),
      secs:  totalSecs % 60,
    };
  }

  function paintTick(el, newVal) {
    const formatted = pad(newVal);
    if (el.textContent !== formatted) {
      el.textContent = formatted;
      el.classList.add('tick');
      setTimeout(() => el.classList.remove('tick'), 250);
    }
  }

  function render() {
    if (!campaign) return;

    const now = Date.now();
    const start = new Date(campaign.start_utc).getTime();
    const end = new Date(campaign.end_utc).getTime();

    let target, prefix, live = false;

    if (now < start) {
      target = start;
      prefix = 'La campaña comienza en';
    } else if (now >= start && now <= end) {
      target = end;
      prefix = 'Campaña en curso — finaliza en';
      live = true;
    } else {
      els.label.textContent = 'La campaña de Drops ha finalizado';
      els.label.classList.remove('live');
      [els.days, els.hours, els.mins, els.secs].forEach(el => el.textContent = '00');
      clearInterval(timerId);
      return;
    }

    const p = diffParts(target - now);
    els.label.innerHTML = `${prefix} <strong>${p.days}d ${pad(p.hours)}:${pad(p.mins)}:${pad(p.secs)}</strong>`;
    els.label.classList.toggle('live', live);

    paintTick(els.days, p.days);
    paintTick(els.hours, p.hours);
    paintTick(els.mins, p.mins);
    paintTick(els.secs, p.secs);
  }

  fetch('data/drops.json')
    .then(res => res.json())
    .then(data => {
      campaign = data.campaign;
      render();
      timerId = setInterval(render, 1000);
    })
    .catch(err => {
      els.label.textContent = 'No se pudo cargar la información de la campaña';
      console.error('[AMBI DROPS] Error cargando drops.json', err);
    });
})();