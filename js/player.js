/* ══════════════════════════════════════════════════════════════════
   AMBI — player.js
   Reproductor de audio en el nav.
   Lee data/player_config.json.
   Botón: ícono nota musical + barras animadas (play=verde/titilan, pausa=gris/estáticas).
   Las barras actúan como botón de pausa también.
   Dropdown: play/pause · next · nombre de tema · btn lista · volumen.
   Segundo dropdown: playlist completa.
══════════════════════════════════════════════════════════════════ */

(async function () {

    /* ── CARGAR PLAYLIST ── */
    let playlist = [];
    try {
        const res = await fetch('data/player_config.json?v=' + Date.now());
        playlist = await res.json();
    } catch (e) {
        console.warn('[player.js] No se pudo cargar player_config.json', e);
        return;
    }

    if (!playlist.length) return;

    /* ── ESTADO ── */
    let index     = 0;
    let isPlaying = false;

    /* ── AUDIO ── */
    const audio = document.createElement('audio');
    audio.volume = 0.2;
    document.body.appendChild(audio);

    /* ── INYECTAR EN EL NAV ── */
    const nav = document.querySelector('.nav');
    if (!nav) return;

    const playerWrap = document.createElement('div');
    playerWrap.className = 'nav-player';
    playerWrap.innerHTML = `
        <!-- BOTÓN: ícono nota + barras animadas -->
        <button class="nav-player-btn" id="nav-player-toggle" title="Reproductor">
            <i class="fas fa-music"></i>
        </button>
        <div class="nav-player-bars" id="nav-player-bars" title="Pausa / Play">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
        </div>

        <!-- DROPDOWN PRINCIPAL -->
        <div class="nav-player-dropdown" id="nav-player-dropdown">

            <!-- Fila 1: controles + info + lista -->
            <div class="nav-player-row">
                <button class="nav-player-playpause" id="nav-player-playpause">
                    <i class="fas fa-play"></i>
                </button>
                <button class="nav-player-next" id="nav-player-next" title="Siguiente">
                    <i class="fas fa-forward-step"></i>
                </button>
                <span class="nav-player-info" id="nav-player-info">
                    <span class="nav-player-artist" id="nav-player-artist"></span>
                    <span class="nav-player-track"  id="nav-player-track"></span>
                </span>
                <button class="nav-player-list-btn" id="nav-player-list-btn" title="Playlist">
                    <i class="fas fa-list"></i>
                </button>
            </div>

            <!-- Fila 2: volumen -->
            <div class="nav-player-vol-row">
                <i class="fas fa-volume-low nav-player-vol-icon"></i>
                <input
                    class="nav-player-vol-slider"
                    id="nav-player-vol"
                    type="range"
                    min="0" max="100" value="20"
                    title="Volumen"
                >
            </div>

            <!-- Dropdown playlist (posicionado dentro del wrapper) -->
            <div class="nav-player-playlist" id="nav-player-playlist"></div>
        </div>
    `;

    /* Insertar ANTES de nav-left (queda en el extremo izquierdo del nav) */
    const navLeft = nav.querySelector('.nav-left');
    nav.insertBefore(playerWrap, navLeft);

    /* ── REFERENCIAS ── */
    const btnToggle   = document.getElementById('nav-player-toggle');
    const barsEl      = document.getElementById('nav-player-bars');
    const dropdown    = document.getElementById('nav-player-dropdown');
    const btnPlay     = document.getElementById('nav-player-playpause');
    const btnNext     = document.getElementById('nav-player-next');
    const artistEl    = document.getElementById('nav-player-artist');
    const trackEl     = document.getElementById('nav-player-track');
    const btnList     = document.getElementById('nav-player-list-btn');
    const playlistEl  = document.getElementById('nav-player-playlist');
    const volSlider   = document.getElementById('nav-player-vol');

    /* ── HELPERS ── */
    function setPlayUI(playing) {
        isPlaying = playing;
        btnPlay.innerHTML = playing
            ? '<i class="fas fa-pause"></i>'
            : '<i class="fas fa-play"></i>';
        if (playing) {
            barsEl.classList.add('playing');
            btnToggle.classList.add('playing');
        } else {
            barsEl.classList.remove('playing');
            btnToggle.classList.remove('playing');
        }
    }

    function updateInfo() {
        const item = playlist[index];
        artistEl.textContent = item.name;
        trackEl.textContent  = item.track;
    }

    function buildPlaylist() {
        playlistEl.innerHTML = '';
        playlist.forEach((item, i) => {
            const li = document.createElement('div');
            li.className = 'nav-player-playlist-item' + (i === index ? ' active' : '');
            li.innerHTML = `<span class="npp-artist">${item.name}</span><span class="npp-track">${item.track}</span>`;
            li.addEventListener('click', () => {
                index = i;
                loadAndPlay();
                buildPlaylist();
                playlistEl.classList.remove('open');
            });
            playlistEl.appendChild(li);
        });
    }

    function loadAndPlay() {
        audio.src = playlist[index].file;
        audio.load();
        audio.play();
        setPlayUI(true);
        updateInfo();
    }

    /* ── TOGGLE PLAY / PAUSE ── */
    function togglePlayPause() {
        if (!isPlaying) {
            if (!audio.src || audio.src === window.location.href) {
                audio.src = playlist[index].file;
                audio.load();
            }
            audio.play();
            setPlayUI(true);
        } else {
            audio.pause();
            setPlayUI(false);
        }
    }

    /* ── EVENTOS ── */
    btnPlay.addEventListener('click', togglePlayPause);

    /* Las barras también son botón de pausa/play */
    barsEl.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlayPause();
    });

    btnNext.addEventListener('click', () => {
        index = (index + 1) % playlist.length;
        loadAndPlay();
        buildPlaylist();
    });

    audio.addEventListener('ended', () => {
        index = (index + 1) % playlist.length;
        loadAndPlay();
        buildPlaylist();
    });

    /* Toggle dropdown principal */
    btnToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
        playlistEl.classList.remove('open');
        if (dropdown.classList.contains('open')) {
            updateInfo();
            buildPlaylist();
        }
    });

    /* Toggle playlist */
    btnList.addEventListener('click', (e) => {
        e.stopPropagation();
        playlistEl.classList.toggle('open');
    });

    /* Cerrar al click afuera */
    document.addEventListener('click', (e) => {
        if (!playerWrap.contains(e.target)) {
            dropdown.classList.remove('open');
            playlistEl.classList.remove('open');
        }
    });

    /* ── VOLUMEN ── */
    function updateVolUI() {
        const pct = volSlider.value + '%';
        volSlider.style.setProperty('--vol', pct);
        // Cambiar ícono según nivel
        const iconEl = playerWrap.querySelector('.nav-player-vol-icon');
        if (!iconEl) return;
        const v = parseInt(volSlider.value);
        if (v === 0) {
            iconEl.className = 'fas fa-volume-xmark nav-player-vol-icon';
        } else if (v < 50) {
            iconEl.className = 'fas fa-volume-low nav-player-vol-icon';
        } else {
            iconEl.className = 'fas fa-volume-high nav-player-vol-icon';
        }
    }

    volSlider.addEventListener('input', () => {
        audio.volume = parseInt(volSlider.value) / 100;
        updateVolUI();
    });

    /* Init estado inicial */
    updateVolUI();
    updateInfo();

    /* ── AUTOPLAY al terminar el intro (el botón es la interacción del usuario) ── */
    document.addEventListener('ambi:introEnd', function () {
        if (!isPlaying) {
            audio.src = playlist[index].file;
            audio.load();
            audio.play().catch(() => {});
            setPlayUI(true);
        }
    }, { once: true });

})();