/* ══════════════════════════════════════════════════════════════════
   MENU — NAV AUTOHIDE + PEEK TAB + SCROLL SPY
══════════════════════════════════════════════════════════════════ */

const nav        = document.querySelector('.nav');
const sections   = document.querySelectorAll('section[id]');
const navBtns    = document.querySelectorAll('.side-nav-btn');
const mobileNav  = document.getElementById('mobile-nav');
const hamburger  = document.getElementById('hamburger-btn');
const overlay    = document.getElementById('mobile-nav-overlay');
const closeBtn   = document.getElementById('mobile-nav-close');
const mobileBtns = document.querySelectorAll('[data-mobile-nav]');

/* ── PEEK TAB ── */
const peekTab = document.createElement('div');
peekTab.className = 'nav-peek-tab';
peekTab.innerHTML = '<i class="fas fa-bars"></i>';
document.body.appendChild(peekTab);

/* ── ESTADO ── */
let lastScroll  = window.scrollY;
let peekActive  = false;
let ticking     = false;
let navigating  = false; // bloquea el scroll listener durante navegación por click

function hideNav() {
    if (peekActive) return;
    nav.style.setProperty('top', '-200px', 'important');
    peekTab.classList.add('visible');
}

function showNav() {
    nav.style.setProperty('top', '50px', 'important');
    peekTab.classList.remove('visible');
    peekActive = false;
}

/* ── AUTOHIDE por scroll ── */
window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
        const current = window.scrollY;

        if (!navigating) {
            if (current <= 20) {
                showNav();
            } else if (current > lastScroll + 5) {
                hideNav();
            } else if (current < lastScroll - 5) {
                showNav();
            }
        }

        // Si el scroll se detuvo (llegó al destino), liberamos el flag
        if (navigating && current === lastScroll) {
            navigating = false;
        }

        lastScroll = current;
        ticking = false;
    });
}, { passive: true });


/* ── PEEK TAB — hover muestra nav ── */
peekTab.addEventListener('mouseenter', () => {
    peekActive = true;
    nav.style.setProperty('top', '0px', 'important');
    peekTab.classList.add('visible');
});

peekTab.addEventListener('mouseleave', () => {
    setTimeout(() => {
        if (!nav.matches(':hover')) {
            peekActive = false;
            nav.style.setProperty('top', '-200px', 'important');
        }
    }, 60);
});

nav.addEventListener('mouseenter', () => {
    const currentTop = parseInt(getComputedStyle(nav).top);
    if (currentTop < 0) {
        peekActive = true;
        nav.style.setProperty('top', '0px', 'important');
        peekTab.classList.add('visible');
    }
});

nav.addEventListener('mouseleave', () => {
    const currentTop = parseInt(getComputedStyle(nav).top);
    if (currentTop <= 0 && window.scrollY > 20) {
        peekActive = false;
        nav.style.setProperty('top', '-200px', 'important');
    }
});


/* ── SCROLL SPY ── */
function getRealTop(el) {
    return el.getBoundingClientRect().top + window.scrollY;
}

function updateActiveLink() {
    let current = '';
    const trigger = window.innerHeight * 0.45;

    sections.forEach(section => {
        if (window.scrollY >= getRealTop(section) - trigger) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-links a, .side-nav-btn').forEach(btn => {
        const href = btn.getAttribute('href');
        btn.classList.remove('active');
        if (href === '#' + current) btn.classList.add('active');
        if (href === '#top' && current === '') btn.classList.add('active');
    });

    mobileBtns.forEach(btn => {
        const href = btn.getAttribute('href');
        btn.classList.remove('active');
        if (href === '#' + current) btn.classList.add('active');
    });
}

window.addEventListener('scroll', updateActiveLink, { passive: true });
updateActiveLink();


/* ── SCROLL AL TOP ── */
document.querySelectorAll('[href="#top"]').forEach(btn => {
    btn.addEventListener('click', e => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        closeMobileNav();
    });
});

/* ── LINKS DE SECCIÓN — hide inmediato + bloquear scroll listener ── */
document.querySelectorAll('.nav-links a').forEach(btn => {
    btn.addEventListener('click', () => {
        peekActive  = false;
        navigating  = true;
        nav.style.setProperty('top', '-200px', 'important');
        peekTab.classList.add('visible');
        // Seguridad: liberar el flag después de 1.5s por si el scroll no dispara
        setTimeout(() => { navigating = false; }, 1500);
    });
});


/* ── HAMBURGUESA MOBILE ── */
function openMobileNav() {
    mobileNav?.classList.add('open');
    overlay?.classList.add('open');
    hamburger?.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeMobileNav() {
    mobileNav?.classList.remove('open');
    overlay?.classList.remove('open');
    hamburger?.classList.remove('open');
    document.body.style.overflow = '';
}

hamburger?.addEventListener('click', () => {
    mobileNav?.classList.contains('open') ? closeMobileNav() : openMobileNav();
});

overlay?.addEventListener('click', closeMobileNav);
closeBtn?.addEventListener('click', closeMobileNav);
mobileBtns.forEach(btn => btn.addEventListener('click', () => setTimeout(closeMobileNav, 300)));