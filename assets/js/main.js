document.addEventListener('DOMContentLoaded', () => {
            // 1. Atualizar Ano no Footer
            document.getElementById('current-year').textContent = new Date().getFullYear();

            // 2. Menu Mobile Toggle
            const mobileBtn = document.getElementById('mobile-menu-btn');
            const mobileMenu = document.getElementById('mobile-menu');
            const mobileLinks = document.querySelectorAll('.mobile-link');

            mobileBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });

            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('hidden');
                });
            });

            // 3. Navbar Background alteração no Scroll
            const header = document.querySelector('header');
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    header.classList.add('shadow-lg');
                    header.classList.replace('bg-base/80', 'bg-base/95');
                } else {
                    header.classList.remove('shadow-lg');
                    header.classList.replace('bg-base/95', 'bg-base/80');
                }
            });

            // 4. Efeito Typewriter usando JS Puro
            const phrases = [
                "Especialista em IA & Automação",
                "Professor de Desenvolvimento",
                "Desenvolvedor Python"
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
                    typeDelay = 50; // Velocidade ao apagar
                } else {
                    typeText.textContent = currentPhrase.substring(0, charIndex + 1);
                    charIndex++;
                    typeDelay = 100; // Velocidade ao digitar
                }

                if (!isDeleting && charIndex === currentPhrase.length) {
                    typeDelay = 2000; // Tempo de pausa com a frase completa
                    isDeleting = true;
                } else if (isDeleting && charIndex === 0) {
                    isDeleting = false;
                    phraseIndex = (phraseIndex + 1) % phrases.length;
                    typeDelay = 500; // Tempo de pausa antes da próxima frase
                }

                setTimeout(typeWriter, typeDelay);
            }

            // Inicia o Typewriter após 1s (dando tempo para a animação CSS h1 terminar)
            setTimeout(typeWriter, 1000);

            // 5. Scroll Reveal Effect com Intersection Observer
            const revealElements = document.querySelectorAll('.reveal');

            const revealCallback = function (entries, observer) {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        // Optional: parar de observar após revelar uma vez
                        // observer.unobserve(entry.target); 
                    }
                });
            };

            const revealOptions = {
                threshold: 0.15, // Aciona quando 15% do elemento está visível
                rootMargin: "0px 0px -50px 0px"
            };

            const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

            revealElements.forEach(el => {
                revealObserver.observe(el);
            });

            // 6. Particle Background Animation simples para a seção Hero
            const canvas = document.getElementById('particle-canvas');
            const ctx = canvas.getContext('2d');
            let particles = [];

            function resizeCanvas() {
                canvas.width = window.innerWidth;
                canvas.height = document.getElementById('hero').offsetHeight;
            }

            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();

            class Particle {
                constructor() {
                    this.x = Math.random() * canvas.width;
                    this.y = Math.random() * canvas.height;
                    this.size = Math.random() * 2 + 0.5;
                    this.speedX = Math.random() * 0.5 - 0.25;
                    this.speedY = Math.random() * 0.5 - 0.25;
                }
                update() {
                    this.x += this.speedX;
                    this.y += this.speedY;
                    if (this.size > 0.2) this.size -= 0.01;

                    // re-spawn
                    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                        this.x = Math.random() * canvas.width;
                        this.y = Math.random() * canvas.height;
                        this.size = Math.random() * 2 + 0.5;
                    }
                }
                draw() {
                    ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            function initParticles() {
                particles = [];
                for (let i = 0; i < 50; i++) {
                    particles.push(new Particle());
                }
            }

            function animateParticles() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < particles.length; i++) {
                    particles[i].update();
                    particles[i].draw();
                }
                requestAnimationFrame(animateParticles);
            }

            initParticles();
            animateParticles();

            // 7. Configuração do Web3Forms
            const form = document.getElementById('contact-form');
            const result = document.getElementById('form-result');
            const submitBtn = document.getElementById('submit-btn');

            if (form) {
                form.addEventListener('submit', function (e) {
                    e.preventDefault();

                    // Modifica botão enquanto envia
                    const originalBtnContent = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span class="ml-2">Enviando...</span>';
                    submitBtn.disabled = true;
                    submitBtn.classList.add('opacity-75', 'cursor-not-allowed');

                    const formData = new FormData(form);
                    const object = Object.fromEntries(formData);
                    const json = JSON.stringify(object);

                    fetch('https://api.web3forms.com/submit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: json
                    })
                        .then(async (response) => {
                            let json = await response.json();
                            if (response.status == 200) {
                                result.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Mensagem enviada com sucesso! Em breve entrarei em contato.';
                                result.classList.remove('hidden', 'bg-red-500/20', 'text-red-400', 'bg-yellow-500/20', 'text-yellow-400', 'border-yellow-500/30');
                                result.classList.add('bg-green-500/20', 'text-green-400', 'border', 'border-green-500/30');
                            } else {
                                console.log(response);
                                result.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Erro: ' + json.message;
                                result.classList.remove('hidden', 'bg-green-500/20', 'text-green-400');
                                result.classList.add('bg-red-500/20', 'text-red-400', 'border', 'border-red-500/30');
                            }
                        })
                        .catch(error => {
                            console.log(error);
                            result.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i> Algo deu errado! Tente me contatar pelo LinkedIn/GitHub.';
                            result.classList.remove('hidden', 'bg-green-500/20', 'text-green-400');
                            result.classList.add('bg-red-500/20', 'text-red-400', 'border', 'border-red-500/30');
                        })
                        .then(function () {
                            form.reset();
                            submitBtn.innerHTML = originalBtnContent;
                            submitBtn.disabled = false;
                            submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');

                            setTimeout(() => {
                                result.classList.add('hidden');
                            }, 5000);
                        });
                });
            }
        });
