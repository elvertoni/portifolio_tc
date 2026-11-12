/* Toni Coimbra — framework-free portfolio runtime.
   Accessible navigation, reveal, counters and contact form. */
(function () {
  'use strict';

  /* ── 0. Utilities ────────────────────────────────────────────────── */
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* single rAF loop, started only once something asks for a frame. On a
     phone every per-frame effect opts out, and an empty loop still wakes
     the compositor sixty times a second for nothing. */
  const ticks = [];
  function requestTick() {
    if (!REDUCED && !document.hidden && !frameId && ticks.some(tick => tick.visible.on)) {
      last = performance.now();
      frameId = requestAnimationFrame(frame);
    }
  }
  function onTick(fn, visible) {
    ticks.push({ fn, visible });
    requestTick();
  }

  /* Every per-frame effect below is anchored to one section. Gating on
     intersection keeps the loop from burning frames on a canvas nobody
     is looking at — the difference is the whole page's idle cost. */
  function whenVisible(el, margin) {
    const state = { on: false };
    if (!el) return state;
    new IntersectionObserver(
      es => {
        state.on = es[0].isIntersecting;
        requestTick();
      },
      { rootMargin: margin || '120px' }
    ).observe(el);
    return state;
  }
  let last = performance.now();
  let frameId = 0;
  function frame(now) {
    frameId = 0;
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (let i = 0; i < ticks.length; i++) {
      if (ticks[i].visible.on) ticks[i].fn(dt, now);
    }
    if (ticks.some(tick => tick.visible.on)) frameId = requestAnimationFrame(frame);
  }
  if (!REDUCED) {
    document.addEventListener('visibilitychange', () => {
      requestTick();
    });
  }

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

  /* Register entrances once after the runtime has initialized. */
  let revealed = false;
  function revealOnce() {
    if (revealed) return;
    revealed = true;
    initReveal();
  }


  /* ═══════════════════════════════════════════════════════════════════
     3. DRAWER, NAV HIGHLIGHTING

     The header bar is opaque at rest, so there is no scrolled state to track.
     ═══════════════════════════════════════════════════════════════════ */
  function initHeader() {
    const burger = $('#burger');
    const drawer = $('#drawer');

    /* burger / drawer */
    if (burger && drawer) {
      const links = $$('a', drawer);
      let focusTimer;

      function setDrawer(open, restoreFocus) {
        clearTimeout(focusTimer);
        drawer.classList.toggle('open', open);
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        drawer.setAttribute('aria-hidden', String(!open));
        drawer.toggleAttribute('inert', !open);
        const main = $('main');
        const footer = $('footer');
        if (main) main.toggleAttribute('inert', open);
        if (footer) footer.toggleAttribute('inert', open);
        document.body.classList.toggle('is-locked', open);
        if (open) {
          // the panel covers the page; focus has to follow it in
          focusTimer = setTimeout(() => { if (links[0]) links[0].focus(); }, 0);
        } else if (restoreFocus) {
          burger.focus();
        }
      }

      burger.addEventListener('click', () => setDrawer(!drawer.classList.contains('open')));
      links.forEach(a => a.addEventListener('click', () => {
        setDrawer(false, false);
        const target = document.getElementById(a.hash.slice(1));
        if (!target) return;
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
          target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
        }
        target.focus({ preventScroll: true });
      }));

      matchMedia('(min-width: 901px)').addEventListener('change', e => {
        if (e.matches && drawer.classList.contains('open')) setDrawer(false, false);
      });

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
      function activateNav(id) {
        navLinks.forEach(link => {
          const active = link.getAttribute('href') === '#' + id;
          link.classList.toggle('on', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
      const navIO = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            activateNav(id);
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
      sections.forEach(s => navIO.observe(s));
    }
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

        /* The number and its unit are two different things; the stylesheet
           styles the unit separately (.stat b sup). Reduced motion skips the
           count, not the typography. */
        const numNode = document.createTextNode('');
        el.textContent = '';
        el.appendChild(numNode);
        if (suffix) {
          const sup = document.createElement('sup');
          sup.textContent = suffix;
          el.appendChild(sup);
        }

        if (REDUCED) {
          numNode.nodeValue = dec ? target.toFixed(dec) : String(target);
          return;
        }
        const dur = 1500;
        const start = performance.now();

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
     10. CONTACT FORM — Web3Forms
     ═══════════════════════════════════════════════════════════════════ */
  function initForm() {
    const form = $('#contact-form');
    const result = $('#form-result');
    const submitBtn = $('#submit-btn');
    if (!form || !result || !submitBtn) return;

    /* Keep the native browser submission as a no-JS fallback; JS owns the
       Portuguese validation and async state only when it is available. */
    form.noValidate = true;

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
      if (form.getAttribute('aria-busy') === 'true') return;

      const bad = fields.filter(el => !mark(el));
      if (bad.length) {
        say('Confira os campos destacados antes de enviar.', 'warn');
        bad[0].focus();
        return;
      }

      const original = submitBtn.textContent;
      submitBtn.textContent = 'Enviando...';
      submitBtn.classList.add('is-busy');
      submitBtn.disabled = true;
      form.setAttribute('aria-busy', 'true');
      result.className = 'hidden';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
          signal: controller.signal
        });
        const json = await response.json().catch(() => ({}));

        // Only an explicit success from Web3Forms is a successful submission.
        // A proxy, error page, or malformed 200 response must keep the message.
        if (!response.ok || (json.success !== true && json.success !== 'true')) {
          throw new Error(json.message || 'HTTP ' + response.status);
        }

        say('Mensagem enviada. Respondo pelo e-mail que você informou.', 'ok');
        form.reset();
        fields.forEach(el => el.removeAttribute('aria-invalid'));
      } catch (err) {
        if (err.name === 'AbortError') {
          say('A tentativa demorou demais. Tente novamente ou me chame no LinkedIn.', 'warn');
          return;
        }
        say('Não consegui enviar agora. Me chame no LinkedIn ou tente de novo em instantes.', 'warn');
      } finally {
        clearTimeout(timeoutId);
        form.removeAttribute('aria-busy');
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
        window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
      });
    }
  }

  /* A faixa do rodapé anda por animação CSS, não pelo loop de rAF — mas uma
     animação fora da tela continua custando compositor. O observador só liga
     `.is-running` quando o rodapé aparece. */
  function initMarquee() {
    const marquee = $('.marquee');
    if (!marquee || REDUCED) return;
    new IntersectionObserver(entries => {
      marquee.classList.toggle('is-running', entries[0].isIntersecting);
    }, { rootMargin: '120px' }).observe(marquee);
  }

  /* ═══════════════════════════════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.classList.add('js');
    revealOnce();
    initHeader();
    initClock();
    initCounters();
    initForm();
    initFooter();
    initMarquee();
  });
})();
