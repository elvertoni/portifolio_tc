/* ═══════════════════════════════════════════════════════════════════════
   TONI COIMBRA — PORTFÓLIO · Runtime
   ───────────────────────────────────────────────────────────────────────
   0  Utilities
   1  Reveal engine
   2  Preloader
   3  Header, drawer, nav highlighting
   4  Hero: dust, clock, dock bubble
   5  Wordwash (scroll-linked word reveal)
   6  Stat counters
   7  Ghost text field (CTA)
   8  Magnet buttons
   9  Marquee clone
   10 Contact form (Web3Forms)
   11 Footer: year, clock, to-top
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 0. Utilities ────────────────────────────────────────────────── */
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* single rAF loop */
  const ticks = [];
  function onTick(fn) { ticks.push(fn); }

  /* Every per-frame effect below is anchored to one section. Gating on
     intersection keeps the loop from burning frames on a canvas nobody
     is looking at — the difference is the whole page's idle cost. */
  function whenVisible(el, margin) {
    const state = { on: false };
    if (!el) return state;
    new IntersectionObserver(
      es => { state.on = es[0].isIntersecting; },
      { rootMargin: margin || '120px' }
    ).observe(el);
    return state;
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (let i = 0; i < ticks.length; i++) ticks[i](dt, now);
    requestAnimationFrame(frame);
  }
  if (!REDUCED) requestAnimationFrame(frame);

  /* ═══════════════════════════════════════════════════════════════════
     1. REVEAL ENGINE
     ═══════════════════════════════════════════════════════════════════ */
  const ioCallback = (entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      }
    });
  };
  const io = new IntersectionObserver(ioCallback, {
    threshold: 0.15,
    rootMargin: '0px 0px -8% 0px'
  });

  /* observe anything with data-io, data-rise, data-mask, .stagger, or sections */
  function initReveal() {
    $$('[data-io], [data-rise], [data-mask], .stagger, section').forEach(el => io.observe(el));
  }

  /* If the loader is missing or its rAF never lands, nothing would ever be
     revealed. Reveal on DOM ready as the floor; the loader path only ever
     brings it forward. */
  let revealed = false;
  function revealOnce() {
    if (revealed) return;
    revealed = true;
    initReveal();
  }

  /* ═══════════════════════════════════════════════════════════════════
     2. PRELOADER
     ═══════════════════════════════════════════════════════════════════ */
  function initLoader() {
    const loader = $('#loader');
    if (!loader) { revealOnce(); return; }
    const countEl = $('#loCount');
    const barEl = $('#loBar');
    const labelEl = $('#loLabel');
    const labels = ['Tipografia', 'Cores', 'Componentes', 'Layout', 'Motion', 'Pronto'];

    /* A returning visitor has already watched this once. Two seconds of
       locked scroll is a toll, not an entrance. */
    let seen = false;
    try { seen = sessionStorage.getItem('tc-seen') === '1'; } catch (_) {}
    try { sessionStorage.setItem('tc-seen', '1'); } catch (_) {}

    let progress = 0;
    const duration = REDUCED ? 200 : (seen ? 550 : 1500);
    const start = performance.now();

    /* Whatever happens to the rAF chain, the page is never left behind a
       black panel with the scroll locked. */
    setTimeout(() => {
      loader.classList.add('done');
      document.body.classList.remove('is-locked');
      revealOnce();
    }, duration + 1200);

    function tick(now) {
      const elapsed = now - start;
      const t = clamp(elapsed / duration, 0, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      progress = Math.floor(eased * 100);

      countEl.textContent = String(progress).padStart(3, '0');
      barEl.style.transform = 'scaleX(' + (progress / 100) + ')';

      const labelIdx = Math.min(Math.floor(eased * labels.length), labels.length - 1);
      labelEl.textContent = labels[labelIdx];

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          loader.classList.add('done');
          document.body.classList.remove('is-locked');
          revealOnce();
        }, 300);
      }
    }

    document.body.classList.add('is-locked');
    requestAnimationFrame(tick);
  }

  /* ═══════════════════════════════════════════════════════════════════
     3. HEADER, DRAWER, NAV HIGHLIGHTING
     ═══════════════════════════════════════════════════════════════════ */
  function initHeader() {
    const hdr = $('#hdr');
    const burger = $('#burger');
    const drawer = $('#drawer');

    if (!hdr) return;

    /* scroll → stuck class */
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          hdr.classList.toggle('stuck', scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    /* burger / drawer */
    if (burger && drawer) {
      const links = $$('a', drawer);

      function setDrawer(open, restoreFocus) {
        drawer.classList.toggle('open', open);
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
        drawer.setAttribute('aria-hidden', String(!open));
        document.body.classList.toggle('is-locked', open);
        if (open) {
          // the panel covers the page; focus has to follow it in
          setTimeout(() => { if (links[0]) links[0].focus(); }, 260);
        } else if (restoreFocus) {
          burger.focus();
        }
      }

      burger.addEventListener('click', () => setDrawer(!drawer.classList.contains('open')));
      links.forEach(a => a.addEventListener('click', () => setDrawer(false)));

      document.addEventListener('keydown', e => {
        if (!drawer.classList.contains('open')) return;

        if (e.key === 'Escape') { setDrawer(false, true); return; }

        /* Tab cycles inside the open panel instead of walking the page
           behind it. The burger stays in the loop so the close control is
           always one Tab away. */
        if (e.key === 'Tab') {
          const loop = [burger].concat(links);
          const i = loop.indexOf(document.activeElement);
          if (i === -1) return;
          const next = e.shiftKey
            ? (i - 1 + loop.length) % loop.length
            : (i + 1) % loop.length;
          e.preventDefault();
          loop[next].focus();
        }
      });
    }

    /* nav highlighting */
    const navLinks = $$('.navchain a');
    const sections = $$('section[id]');
    if (navLinks.length && sections.length) {
      const navIO = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(link => {
              link.classList.toggle('on', link.getAttribute('href') === '#' + id);
            });
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
      sections.forEach(s => navIO.observe(s));
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     4. HERO: DUST, CLOCK, DOCK BUBBLE
     ═══════════════════════════════════════════════════════════════════ */
  function initDust() {
    const canvas = $('#dust');
    const hero = $('#hero');
    if (!canvas || !hero || REDUCED) return;
    const ctx = canvas.getContext('2d');
    const particles = [];
    const COUNT = Math.min(80, Math.floor(innerWidth / 18));
    const DPR = Math.min(2, devicePixelRatio || 1);

    /* Back the canvas at device resolution and keep drawing in CSS pixels,
       or every dot lands on a half-pixel and reads as a smudge on retina. */
    function resize() {
      const w = innerWidth;
      const h = hero.offsetHeight;
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    const vis = whenVisible(hero, '0px');

    class Dot {
      constructor() { this.reset(true); }
      reset(rand) {
        const w = canvas.width / DPR, h = canvas.height / DPR;
        this.x = Math.random() * w;
        this.y = rand ? Math.random() * h : h + 5;
        this.r = Math.random() * 1.2 + 0.3;
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = -(Math.random() * 0.35 + 0.08);
        this.life = 0;
        this.max = Math.random() * 260 + 120;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;
        const w = canvas.width / DPR;
        if (this.life >= this.max || this.y < -5 || this.x < -5 || this.x > w + 5) this.reset();
      }
      draw() {
        const p = this.life / this.max;
        let a;
        if (p < 0.15) a = p / 0.15 * 0.45;
        else if (p > 0.7) a = (1 - (p - 0.7) / 0.3) * 0.45;
        else a = 0.45;
        ctx.fillStyle = `rgba(244,243,240,${a})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < COUNT; i++) particles.push(new Dot());

    onTick(() => {
      if (!vis.on) return;
      ctx.clearRect(0, 0, canvas.width / DPR, canvas.height / DPR);
      particles.forEach(p => { p.update(); p.draw(); });
    });
  }

  function initClock() {
    const c1 = $('#clock');
    const c2 = $('#clock2');
    function tick() {
      const now = new Date();
      const str = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Sao_Paulo' });
      if (c1) c1.textContent = str;
      if (c2) c2.textContent = str;
    }
    tick();
    let id = setInterval(tick, 1000);
    /* a background tab has no clock to read */
    document.addEventListener('visibilitychange', () => {
      clearInterval(id);
      if (!document.hidden) { tick(); id = setInterval(tick, 1000); }
    });
  }

  function initDock() {
    const bub = $('#heroBub');
    const dock = bub && bub.closest('.dock');
    if (!bub || !dock || REDUCED) return;

    /* The bubble greets someone who is looking at it. Firing it on a timer
       from page load means it plays to an empty hero and then keeps
       playing forever, three timers at a time. */
    let running = false;
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting || running) return;
        running = true;
        io.disconnect();
        const show = () => {
          bub.classList.add('show');
          setTimeout(() => bub.classList.remove('show'), 6000);
        };
        setTimeout(show, 2600);
        setInterval(() => { if (!document.hidden) show(); }, 15000);
      });
    }, { threshold: 0.3 });
    io.observe(dock);
  }

  /* ═══════════════════════════════════════════════════════════════════
     5. WORDWASH — scroll-linked word reveal
     ═══════════════════════════════════════════════════════════════════ */
  function initWordwash() {
    const els = $$('.wordwash');
    if (!els.length) return;

    els.forEach(el => {
      const text = el.textContent.trim();
      el.innerHTML = '';
      text.split(/\s+/).forEach(w => {
        const sp = document.createElement('span');
        sp.textContent = w + ' ';
        el.appendChild(sp);
      });
    });

    if (REDUCED) {
      $$('.wordwash span').forEach(s => s.classList.add('lit'));
      return;
    }

    /* Word positions inside the paragraph only change when the paragraph
       reflows. Cache the offsets and re-read them on resize instead of
       forcing a layout per word per frame. */
    const tracked = els.map(el => ({
      el,
      spans: $$('span', el),
      offsets: [],
      vis: whenVisible(el, '10%')
    }));

    function measure() {
      tracked.forEach(t => {
        const base = t.el.getBoundingClientRect().top + scrollY;
        t.offsets = t.spans.map(sp => {
          const r = sp.getBoundingClientRect();
          return r.top + scrollY - base + r.height / 2;
        });
      });
    }
    measure();
    let rid;
    window.addEventListener('resize', () => {
      clearTimeout(rid);
      rid = setTimeout(measure, 150);
    }, { passive: true });

    onTick(() => {
      const mid = innerHeight * 0.55;
      tracked.forEach(t => {
        if (!t.vis.on) return;
        const top = t.el.getBoundingClientRect().top;
        for (let i = 0; i < t.spans.length; i++) {
          t.spans[i].classList.toggle('lit', top + t.offsets[i] < mid);
        }
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     6. STAT COUNTERS
     ═══════════════════════════════════════════════════════════════════ */
  function initCounters() {
    const stats = $$('[data-count]');
    if (!stats.length) return;

    const counterIO = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const dec = parseInt(el.dataset.dec || '0', 10);
        const dur = 1500;
        const start = performance.now();

        /* The number and its unit are two different things; the stylesheet
           already has a rule for the unit (.stat b sup) that nothing was
           ever emitting. */
        const numNode = document.createTextNode('');
        el.textContent = '';
        el.appendChild(numNode);
        if (suffix) {
          const sup = document.createElement('sup');
          sup.textContent = suffix;
          el.appendChild(sup);
        }

        function tick(now) {
          const t = clamp((now - start) / dur, 0, 1);
          // ease out cubic
          const e = 1 - Math.pow(1 - t, 3);
          const val = e * target;
          numNode.nodeValue = dec ? val.toFixed(dec) : String(Math.floor(val));
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });

    stats.forEach(el => counterIO.observe(el));
  }

  /* ═══════════════════════════════════════════════════════════════════
     7. GHOST TEXT FIELD (CTA)
     ═══════════════════════════════════════════════════════════════════ */
  function initGhosts() {
    const container = $('#ghosts');
    if (!container || REDUCED) return;

    const words = ['AUTOMAÇÃO', 'IA', 'PYTHON', 'DADOS', 'CÓDIGO', 'DOCKER', 'LANGCHAIN', 'POSTGRESQL', 'CONTATO', 'PROFESSOR'];
    const count = 18;

    /* Inset from the edges and placed by centre so the field reads as
       depth rather than as words sliced in half by the section boundary. */
    for (let i = 0; i < count; i++) {
      const sp = document.createElement('span');
      sp.textContent = words[i % words.length];
      sp.style.left = (8 + Math.random() * 84) + '%';
      sp.style.top = (6 + Math.random() * 88) + '%';
      sp.style.fontSize = (Math.random() * 3.4 + 1.8) + 'rem';
      sp.style.rotate = (Math.random() * 30 - 15) + 'deg';
      container.appendChild(sp);
    }

    // slow drift
    const vis = whenVisible(container.parentElement, '0px');
    let angle = 0;
    onTick(dt => {
      if (!vis.on) return;
      angle += dt * 0.08;
      container.style.transform = `translate(${Math.sin(angle) * 12}px, ${Math.cos(angle * 0.7) * 8}px)`;
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     8. MAGNET BUTTONS
     ═══════════════════════════════════════════════════════════════════ */
  function initMagnets() {
    if (REDUCED || !matchMedia('(pointer: fine)').matches) return;

    const magnets = $$('.magnet');
    magnets.forEach(wrap => {
      let mx = 0, my = 0, cx = 0, cy = 0;
      let inside = false;

      wrap.addEventListener('mouseenter', () => { inside = true; });
      wrap.addEventListener('mouseleave', () => {
        inside = false;
        mx = 0; my = 0;
      });
      wrap.addEventListener('mousemove', e => {
        const r = wrap.getBoundingClientRect();
        mx = (e.clientX - r.left - r.width / 2) * 0.32;
        my = (e.clientY - r.top - r.height / 2) * 0.42;
      });

      let settled = true;
      onTick(() => {
        cx = lerp(cx, inside ? mx : 0, 0.16);
        cy = lerp(cy, inside ? my : 0, 0.16);
        const moving = Math.abs(cx) > 0.1 || Math.abs(cy) > 0.1;
        if (moving) {
          wrap.style.transform = `translate(${cx}px, ${cy}px)`;
          settled = false;
        } else if (!settled) {
          wrap.style.transform = '';
          settled = true;
        }
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     9. MARQUEE CLONE
     ═══════════════════════════════════════════════════════════════════ */
  function initMarquee() {
    $$('.marquee').forEach(track => {
      const ul = $('ul', track);
      if (!ul) return;

      /* One clone is only seamless while a single copy is wider than the
         viewport. On a wide desktop it is not, and a gap walks across the
         band. Clone until two copies cover the track, then once more. */
      function fill() {
        $$('ul[data-clone]', track).forEach(n => n.remove());
        const unit = ul.getBoundingClientRect().width;
        if (!unit) return;
        const needed = Math.max(1, Math.ceil(track.offsetWidth / unit) + 1);
        for (let i = 0; i < needed; i++) {
          const clone = ul.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          clone.setAttribute('data-clone', '');
          track.appendChild(clone);
        }
      }
      fill();
      let rid;
      window.addEventListener('resize', () => {
        clearTimeout(rid);
        rid = setTimeout(fill, 200);
      }, { passive: true });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     10. CONTACT FORM — Web3Forms
     ═══════════════════════════════════════════════════════════════════ */
  function initForm() {
    const form = $('#contact-form');
    const result = $('#form-result');
    const submitBtn = $('#submit-btn');
    if (!form || !result || !submitBtn) return;

    const fields = $$('.form-field', form);

    /* The form carries `novalidate` so the messages are ours and in
       Portuguese; that only works if we actually check the fields. */
    function problem(el) {
      const v = el.value.trim();
      if (!v) return true;
      if (el.type === 'email') return !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (el.id === 'message') return v.length < 10;
      return false;
    }

    function mark(el) {
      const bad = problem(el);
      el.setAttribute('aria-invalid', String(bad));
      return !bad;
    }

    fields.forEach(el => {
      // never scold while someone is still typing their first word
      el.addEventListener('blur', () => mark(el));
      el.addEventListener('input', () => {
        if (el.getAttribute('aria-invalid') === 'true') mark(el);
      });
    });

    function say(text, kind) {
      result.textContent = text;
      result.className = 'form-result form-result--' + kind;
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();

      const bad = fields.filter(el => !mark(el));
      if (bad.length) {
        say('Confira os campos destacados antes de enviar.', 'warn');
        bad[0].focus();
        return;
      }

      const original = submitBtn.textContent;
      submitBtn.textContent = 'Enviando';
      submitBtn.classList.add('is-busy');
      submitBtn.disabled = true;
      result.className = 'hidden';

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        });
        const json = await response.json().catch(() => ({}));

        if (!response.ok) throw new Error(json.message || 'HTTP ' + response.status);

        say('Mensagem enviada. Respondo pelo e-mail que você informou.', 'ok');
        form.reset();
        fields.forEach(el => el.removeAttribute('aria-invalid'));
      } catch (err) {
        say('Não consegui enviar agora. Me chame no LinkedIn ou tente de novo em instantes.', 'warn');
      } finally {
        submitBtn.textContent = original;
        submitBtn.classList.remove('is-busy');
        submitBtn.disabled = false;
      }
    });
  }


  /* ═══════════════════════════════════════════════════════════════════
     11. FOOTER: YEAR, TO-TOP
     ═══════════════════════════════════════════════════════════════════ */
  function initFooter() {
    const yearEl = $('#current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const toTop = $('#toTop');
    if (toTop) {
      toTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initHeader();
    initDust();
    initClock();
    initDock();
    initWordwash();
    initCounters();
    initGhosts();
    initMagnets();
    initMarquee();
    initForm();
    initFooter();
  });
})();
