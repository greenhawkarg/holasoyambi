document.addEventListener("DOMContentLoaded", () => {

    //══════════════════════════════
    // LIGHTBOX
    //══════════════════════════════

    const lightbox = document.getElementById('lightbox-video');
    const videoWrapper = document.getElementById('video-wrapper');
    const closeBtn = document.getElementById('close-lightbox-video');

    //══════════════════════════════
    // ABRIR VIDEOS DESDE CLICK-LAYER
    //══════════════════════════════

    document.querySelectorAll('.click-layer').forEach(layer => {

        layer.addEventListener('click', function () {

            const iframeOriginal = this.nextElementSibling;

            if (iframeOriginal && iframeOriginal.tagName === 'IFRAME') {

                let videoUrl = iframeOriginal.src;

                if (!videoUrl.includes('autoplay=1')) {
                    videoUrl += (videoUrl.includes('?') ? '&' : '?') + 'autoplay=1';
                }

                videoWrapper.innerHTML = `
                    <iframe 
                        src="${videoUrl}"
                        allow="autoplay; encrypted-media"
                        allowfullscreen
                        style="width:100%; height:100%; border:none;">
                    </iframe>
                `;

                lightbox.classList.add('active');

            }

        });

    });

    //══════════════════════════════
    // ABRIR VIDEOS DESDE BOTONES
    //══════════════════════════════
	
    document.querySelectorAll("[data-video]").forEach(btn => {

        btn.addEventListener("click", (e) => {

            e.preventDefault();

            const videoId = btn.getAttribute("data-video");

            videoWrapper.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1"
                    allow="autoplay; encrypted-media"
                    allowfullscreen
                    style="width:100%; height:100%; border:none;">
                </iframe>
            `;

            lightbox.classList.add("active");
			document.body.classList.add("lightbox-open");

        });

    });

    //══════════════════════════════
    // CERRAR LIGHTBOX
    //══════════════════════════════

	function cerrarTodo() {

		lightbox.classList.remove('active');
		document.body.classList.remove("lightbox-open");

		if (videoWrapper) {
			videoWrapper.innerHTML = '';
		}

	}

    // cerrar con X
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarTodo);
    }

    // cerrar fondo
    lightbox.addEventListener('click', (e) => {

        if (e.target === lightbox) {
            cerrarTodo();
        }

    });

    // cerrar ESC
    document.addEventListener('keydown', (e) => {

        if (e.key === 'Escape') {
            cerrarTodo();
        }

    });

});