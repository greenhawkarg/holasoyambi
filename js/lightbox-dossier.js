document.addEventListener("DOMContentLoaded", () => {

    //══════════════════════════════
    // DEBUG: confirma que el JS cargó
    //══════════════════════════════
    console.log("DOSSIER JS CARGADO");

    //══════════════════════════════
    // ELEMENTOS DEL LIGHTBOX DOSSIER
    //══════════════════════════════
    const lightboxDossier = document.getElementById('lightbox-dossier');
    const dossierWrapper  = document.getElementById('dossier-wrapper');
    const closeBtn        = document.getElementById('close-lightbox-dossier');

    //══════════════════════════════
    // ABRIR DOSSIER
    //══════════════════════════════
    document.querySelectorAll(".open-dossier").forEach(btn => {

        btn.addEventListener("click", (e) => {

            e.preventDefault();

            console.log("CLICK DOSSIER");

            dossierWrapper.innerHTML = `
                <iframe src="dossier.html" class="agenda-frame"></iframe>
            `;

            lightboxDossier.classList.add("active");
            document.body.classList.add("lightbox-open");
            document.documentElement.classList.add("agenda-open");

        });

    });

    //══════════════════════════════
    // CERRAR DOSSIER (BOTÓN X)
    //══════════════════════════════
    closeBtn.addEventListener("click", () => {

        lightboxDossier.classList.remove("active");
        document.body.classList.remove("lightbox-open");
        document.documentElement.classList.remove("agenda-open");
        dossierWrapper.innerHTML = "";

    });

    //══════════════════════════════
    // CERRAR CON FONDO
    //══════════════════════════════
    lightboxDossier.addEventListener("click", (e) => {

        if (e.target === lightboxDossier) {
            lightboxDossier.classList.remove("active");
            document.body.classList.remove("lightbox-open");
            document.documentElement.classList.remove("agenda-open");
            dossierWrapper.innerHTML = "";
        }

    });

    //══════════════════════════════
    // CERRAR CON ESC
    //══════════════════════════════
    document.addEventListener("keydown", (e) => {

        if (e.key === "Escape" && lightboxDossier.classList.contains("active")) {
            lightboxDossier.classList.remove("active");
            document.body.classList.remove("lightbox-open");
            document.documentElement.classList.remove("agenda-open");
            dossierWrapper.innerHTML = "";
        }

    });

});