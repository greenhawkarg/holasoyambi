/* ══════════════════════════════════════════════════════════════════
   AMBI — lb-agenda.js
   Maneja el lightbox de agenda y el lightbox de video (trailers).
══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    
    /* ──────────────────────────────────────────
       ELEMENTOS
    ────────────────────────────────────────── */
    const lbAgenda        = document.getElementById('lightbox-agenda');
    const lbVideo         = document.getElementById('lightbox-video');
    const videoWrapper    = document.getElementById('lightbox-video-wrapper');
    const btnCerrarAgenda = document.querySelector('.lightbox-agenda-close');
    const btnCerrarVideo  = document.querySelector('.lightbox-video-close');
    const btnPause        = document.getElementById('lb-pause-music');
    const pauseBars       = document.getElementById('lb-pause-bars');

    /* FLAGS */
    let usuarioPauso       = false;
    let musicaEstabaSonando = false;

    /* ──────────────────────────────────────────
       BOTÓN PAUSAR MÚSICA
    ────────────────────────────────────────── */
    if (btnPause) {
        btnPause.addEventListener('click', () => {
            const audio = document.querySelector('audio');
            if (!audio) return;

            if (!audio.paused) {
                audio.pause();
                usuarioPauso = true;
                btnPause.classList.add('paused');
                pauseBars.classList.remove('playing');
            } else {
                audio.play();
                usuarioPauso = false;
                btnPause.classList.remove('paused');
                pauseBars.classList.add('playing');
            }
        });
    }

    /* ──────────────────────────────────────────
       LIGHTBOX AGENDA — OPEN / CLOSE
    ────────────────────────────────────────── */
    function abrirAgenda() {
        const audio = document.querySelector('audio');
        musicaEstabaSonando = audio ? !audio.paused : false;

        lbAgenda.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (btnPause && audio) {
            if (audio.paused) {
                btnPause.classList.add('paused');
                pauseBars.classList.remove('playing');
            } else {
                btnPause.classList.remove('paused');
                pauseBars.classList.add('playing');
            }
        }
    }

    function cerrarAgenda() {
        lbAgenda.classList.remove('active');
        document.body.style.overflow = '';

        if (musicaEstabaSonando && usuarioPauso) {
            const audio = document.querySelector('audio');
            if (audio) audio.play();
        }

        musicaEstabaSonando = false;
        usuarioPauso = false;
        if (btnPause) {
            btnPause.classList.remove('paused');
            if (pauseBars) pauseBars.classList.remove('playing');
        }
    }

    const btnVerAgenda = document.getElementById('agenda-btn');
    if (btnVerAgenda) {
        btnVerAgenda.addEventListener('click', (e) => {
            e.preventDefault();
            abrirAgenda();
        });
    }

    if (btnCerrarAgenda) {
        btnCerrarAgenda.addEventListener('click', cerrarAgenda);
    }

    if (lbAgenda) {
        lbAgenda.addEventListener('click', (e) => {
            if (e.target === lbAgenda) cerrarAgenda();
        });
    }

    /* ──────────────────────────────────────────
       LIGHTBOX VIDEO — OPEN / CLOSE
    ────────────────────────────────────────── */
    function abrirVideo(videoId) {
        videoWrapper.innerHTML = `
            <iframe
                src="https://www.youtube.com/embed/${videoId}?autoplay=1"
                allow="autoplay; encrypted-media"
                allowfullscreen>
            </iframe>
        `;
        lbVideo.classList.add('active');
    }

    function cerrarVideo() {
        lbVideo.classList.remove('active');
        videoWrapper.innerHTML = '';
    }

    if (btnCerrarVideo) {
        btnCerrarVideo.addEventListener('click', cerrarVideo);
    }

    if (lbVideo) {
        lbVideo.addEventListener('click', (e) => {
            if (e.target === lbVideo) cerrarVideo();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (lbVideo.classList.contains('active')) {
            cerrarVideo();
        } else if (lbAgenda.classList.contains('active')) {
            cerrarAgenda();
        }
    });

    /* ──────────────────────────────────────────
       DELEGACIÓN — BOTONES VER TRAILER
    ────────────────────────────────────────── */
    const lista = document.getElementById('lightbox-agenda-list');
    if (lista) {
        lista.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-video]');
            if (!btn) return;
            e.preventDefault();
            abrirVideo(btn.dataset.video);
        });
    }

});