/* ══════════════════════════════════════════════════════════════════
   LOADING — INTRO ANIMADO
   Muestra la intro UNA SOLA VEZ por sesión.
   Si el usuario ya la vio, saca el loader y dispara introEnd directo.
══════════════════════════════════════════════════════════════════ */

if (sessionStorage.getItem('loader_shown')) {

    /* ── YA VIO LA INTRO: saca el loader sin animación ── */
    document.getElementById('ambi-loader').remove();        // elimina el div del DOM
    document.documentElement.style.overflow = '';           // libera scroll
    document.body.style.overflow = '';
    document.dispatchEvent(new Event('ambi:introEnd'));      // avisa al resto del sitio

} else {

    /* ── PRIMERA VEZ: marca que ya se mostró y ejecuta la intro ── */
    sessionStorage.setItem('loader_shown', '1');

    /* ── ESTILOS DEL LOADER — inyectados por JS para no necesitar loading.css ── */
    const s = document.createElement('style');
    s.textContent = `
        #ambi-loader {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #loader-ghost,
        #loader-text {
            position: absolute;
            width: 260px;
            height: auto;
        }
        @keyframes ghostIn {
            0%   { transform: scale(0.2) translateY(0); opacity: 0; }
            40%  { transform: scale(1)   translateY(0); opacity: 1; }
            70%  { transform: scale(1)   translateY(0); opacity: 1; }
            100% { transform: scale(1)   translateY(500px); opacity: 0; }
        }
        @keyframes textIn {
            0%   { transform: scale(0.2); opacity: 0; }
            40%  { transform: scale(1);   opacity: 1; }
            75%  { transform: scale(1);   opacity: 1; }
            95%  { transform: scale(2.5); opacity: 1; }
            100% { transform: scale(3);   opacity: 0; }
        }
        @keyframes loaderOut {
            0%   { opacity: 1; }
            100% { opacity: 0; }
        }
        #loader-ghost {
            animation: ghostIn 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
        }
        #loader-text {
            animation: textIn 1.1s cubic-bezier(0.22, 1, 0.36, 1) 1.4s both;
        }
        #ambi-loader.hide {
            animation: loaderOut 5s ease forwards;
            pointer-events: none;
        }
        #loader-ready-btn {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 14px 36px;
            background: transparent;
            border: 1px solid rgba(255,255,255,0.4);
            color: #fff;
            font-family: inherit;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            cursor: pointer;
            border-radius: 2px;
            opacity: 0;
            transition: opacity 0.6s ease, background 0.2s ease, border-color 0.2s ease;
            pointer-events: none;
            white-space: nowrap;
        }
        #loader-ready-btn.visible {
            opacity: 1;
            pointer-events: auto;
        }
        #loader-ready-btn:hover {
            background: rgba(255,255,255,0.08);
            border-color: rgba(255,255,255,0.8);
        }
    `;
    document.head.appendChild(s);          // agrega los estilos al <head>

    /* ── BLOQUEA EL SCROLL mientras la intro está activa ── */
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    /* ── CREA E INYECTA EL BOTÓN "¿Estás listo?" ── */
    var readyBtn = document.createElement('button');
    readyBtn.id = 'loader-ready-btn';
    readyBtn.textContent = '¿Estás listo?';
    document.getElementById('ambi-loader').appendChild(readyBtn);

    /* ── MUESTRA EL BOTÓN después de que termina la animación del logo (~2500ms) ── */
    setTimeout(function () {
        readyBtn.classList.add('visible');
    }, 2500);

    /* ── CLICK EN EL BOTÓN: cierra la intro y arranca el sitio ── */
    readyBtn.addEventListener('click', function () {
        readyBtn.style.display = 'none';
        var loader = document.getElementById('ambi-loader');
        if (typeof window.posicionarBleeds === 'function') window.posicionarBleeds(); // reposiciona bleeds si ya están listos
        document.documentElement.style.overflow = '';   // libera scroll
        document.body.style.overflow = '';
        document.dispatchEvent(new Event('ambi:introEnd')); // avisa al resto del sitio
        loader.classList.add('hide');                       // arranca el fadeout del loader
        setTimeout(function () { loader.remove(); }, 5000); // elimina el loader del DOM al terminar
    });

} /* ── FIN DEL ELSE — fin de la intro ── */