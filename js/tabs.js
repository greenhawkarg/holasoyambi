/* ══════════════════════════════════════════════════════════════════
   AMBI — tabs.js
   Maneja el sistema de tabs Twitch / YouTube
══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

    const btns   = document.querySelectorAll('.twitch-tab-btn');
    const panels = document.querySelectorAll('.twitch-tab-panel');

    btns.forEach(btn => {
        btn.addEventListener('click', function () {

            const target = this.dataset.tab;

            /* Botones */
            btns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            /* Panels */
            panels.forEach(p => p.classList.remove('active'));
            document.getElementById('tab-' + target)?.classList.add('active');
            const bleed = document.querySelector('.bleed-twitch-left');
            if (bleed) {
                bleed.style.display = target === 'twitch' ? '' : 'none';
            }

        });
    });

});
