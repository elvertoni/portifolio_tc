document.addEventListener('DOMContentLoaded', () => {

    // ─── 1. Footer Year ──────────────────────────────────────────────────────
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // ─── 2. Mobile Menu Toggle ───────────────────────────────────────────────
    const mobileBtn  = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function toggleMobileMenu(open) {
        const isOpen = open !== undefined ? open : mobileMenu.classList.contains('hidden');
        mobileMenu.classList.toggle('hidden', !isOpen);
        mobileBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

        // Swap icon
        const icon = mobileBtn.querySelector('i');
        if (isOpen) {
            icon.classList.replace('fa-bars', 'fa-times');
            mobileBtn.setAttribute('aria-label', 'Fechar menu de navegação');
        } else {
            icon.classList.replace('fa-times', 'fa-bars');
            mobileBtn.setAttribute('aria-label', 'Abrir menu de navegação');
        }
    }

    mobileBtn.addEventListener('click', () => {
        const isCurrentlyOpen = !mobileMenu.classList.contains('hidden');
        toggleMobileMenu(!isCurrentlyOpen);
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => toggleMobileMenu(false));
    });

    // Close mobile menu on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
            toggleMobileMenu(false);
            mobileBtn.focus();
        }
    });

    // ─── 3. Navbar Background on Scroll ─────────────────────────────────────
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('shadow-lg', 'shadow-black/30');
            header.style.backgroundColor = 'rgba(4, 4, 5, 0.95)';
        } else {
            header.classList.remove('shadow-lg', 'shadow-black/30');
            header.style.backgroundColor = 'rgba(4, 4, 5, 0.85)';
        }
    }, { passive: true });

    // ─── 4. Active Nav Link highlighting on scroll ───────────────────────────
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a[href^="#"]');

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('text-white');
                        link.classList.remove('text-soft');
                    } else {
                        link.classList.remove('text-white');
                        link.classList.add('text-soft');
                    }
                });
            }
        });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach(s => sectionObserver.observe(s));

    // ─── 5. Typewriter Effect ─────────────────────────────────────────────────
    const phrases = [
        'Especialista em IA & Automação',
        'Professor de Desenvolvimento',
        'Desenvolvedor Python'
    ];
    const typeText = document.getElementById('typewriter-text');
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeDelay = 100;

    function typeWriter() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            typeText.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typeDelay = 45;
        } else {
            typeText.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typeDelay = 95;
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            typeDelay = 2200;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeDelay = 450;
        }

        setTimeout(typeWriter, typeDelay);
    }

    // Respect reduced-motion — skip animation if user prefers
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
        setTimeout(typeWriter, 900);
    } else {
        typeText.textContent = phrases[0];
    }

    // ─── 6. Scroll Reveal with IntersectionObserver ──────────────────────────
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // ─── 7. Particle Background (Hero) ───────────────────────────────────────
    const canvas = document.getElementById('particle-canvas');
    const ctx    = canvas.getContext('2d');
    let particles = [];
    let animFrameId;

    function resizeCanvas() {
        canvas.width  = window.innerWidth;
        canvas.height = document.getElementById('hero').offsetHeight;
        // Re-init particles to fill new dimensions
        initParticles();
    }

    window.addEventListener('resize', resizeCanvas, { passive: true });
    resizeCanvas();

    // Colour palette: emerald + cyan + violet to match design system
    const particleColors = [
        'rgba(16, 185, 129,',   // emerald-500
        'rgba(5, 150, 105,',    // emerald-600
        'rgba(52, 211, 153,',   // emerald-400
        'rgba(6, 182, 212,',    // cyan-500
        'rgba(34, 211, 238,',   // cyan-400
        'rgba(139, 92, 246,',   // violet-500
        'rgba(167, 139, 250,',  // violet-400
    ];

    class Particle {
        constructor() {
            this.reset(true);
        }

        reset(randomY = false) {
            this.x      = Math.random() * canvas.width;
            this.y      = randomY ? Math.random() * canvas.height : canvas.height + 10;
            this.size   = Math.random() * 1.6 + 0.4;
            this.speedX = (Math.random() - 0.5) * 0.35;
            this.speedY = -(Math.random() * 0.4 + 0.1);
            this.life   = 0;
            this.maxLife = Math.random() * 200 + 100;
            this.colorBase = particleColors[Math.floor(Math.random() * particleColors.length)];
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life++;

            if (this.life >= this.maxLife ||
                this.x < -5 || this.x > canvas.width + 5 ||
                this.y < -5) {
                this.reset(false);
            }
        }

        draw() {
            const progress = this.life / this.maxLife;
            // Fade in for first 20% of life, fade out for last 30%
            let alpha;
            if (progress < 0.2) {
                alpha = progress / 0.2 * 0.75;
            } else if (progress > 0.7) {
                alpha = (1 - (progress - 0.7) / 0.3) * 0.75;
            } else {
                alpha = 0.75;
            }

            ctx.fillStyle = `${this.colorBase}${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        const count = prefersReducedMotion ? 0 : Math.min(60, Math.floor(canvas.width / 20));
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        animFrameId = requestAnimationFrame(animateParticles);
    }

    if (!prefersReducedMotion) {
        initParticles();
        animateParticles();
    }

    // ─── 8. Cursor Glow (desktop only) ───────────────────────────────────────
    if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
        const glow = document.createElement('div');
        glow.classList.add('cursor-glow');
        document.body.appendChild(glow);

        let mouseX = 0, mouseY = 0;
        let glowX  = 0, glowY  = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }, { passive: true });

        function updateGlow() {
            glowX += (mouseX - glowX) * 0.08;
            glowY += (mouseY - glowY) * 0.08;
            glow.style.left = glowX + 'px';
            glow.style.top  = glowY + 'px';
            requestAnimationFrame(updateGlow);
        }
        updateGlow();

        // Hide glow when mouse leaves window
        document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
        document.addEventListener('mouseenter', () => { glow.style.opacity = '1'; });
    }

    // ─── 9. Contact Form — Web3Forms ─────────────────────────────────────────
    const form      = document.getElementById('contact-form');
    const result    = document.getElementById('form-result');
    const submitBtn = document.getElementById('submit-btn');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const originalContent = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i><span class="ml-2">Enviando...</span>';
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

            const formData = new FormData(form);
            const payload  = JSON.stringify(Object.fromEntries(formData));

            try {
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: payload
                });

                const json = await response.json();

                if (response.status === 200) {
                    result.innerHTML = '<i class="fas fa-check-circle mr-2" aria-hidden="true"></i>Mensagem enviada com sucesso! Em breve entrarei em contato.';
                    result.className = 'mt-4 p-4 rounded-lg text-center text-sm font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
                    form.reset();
                } else {
                    throw new Error(json.message || 'Erro desconhecido');
                }
            } catch (err) {
                result.innerHTML = '<i class="fas fa-exclamation-circle mr-2" aria-hidden="true"></i>Algo deu errado. Tente me contatar pelo LinkedIn.';
                result.className = 'mt-4 p-4 rounded-lg text-center text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/25';
            } finally {
                submitBtn.innerHTML = originalContent;
                submitBtn.disabled  = false;
                submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');

                setTimeout(() => {
                    result.className = 'hidden';
                }, 6000);
            }
        });
    }

});
