/* Toni Coimbra — framework-free portfolio runtime.
   Accessible navigation, reveal, counters and contact form. */
(function () {
  'use strict';

  /* ── 0. Utilities ────────────────────────────────────────────────── */
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Nothing on this page needs a frame every tick: the reveals are CSS
     transitions, the footer band is a CSS animation and the counters run a
     short rAF of their own that ends with them. A shared per-frame loop lived
     here for the old pointer parallax; it went with it. */

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

    /* The error text is linked only while it applies: aria-describedby
       reads a display:none target too, so a permanent link would greet an
       untouched field with "Preciso de um nome…". */
    function mark(el) {
      const bad = problem(el);
      el.setAttribute('aria-invalid', String(bad));
      if (bad) el.setAttribute('aria-describedby', el.id + '-error');
      else el.removeAttribute('aria-describedby');
      return !bad;
    }

    fields.forEach(el => {
      // never scold while someone is still typing their first word
      el.addEventListener('blur', () => mark(el));
      el.addEventListener('input', () => {
        if (el.getAttribute('aria-invalid') === 'true') mark(el);
      });
    });

    /* #form-result stays in the accessibility tree from load on, empty: a
       live region that appears and fills in the same tick is often not read. */
    function say(text, kind) {
      result.className = 'form-result form-result--' + kind;
      result.textContent = text;
    }
    function clearResult() {
      result.className = 'form-result';
      result.textContent = '';
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
      /* aria-disabled, not disabled: a disabled button drops the focus to
         <body>, and the next Tab would start from the top of the page. The
         aria-busy check above is what actually blocks a second send. */
      submitBtn.setAttribute('aria-disabled', 'true');
      form.setAttribute('aria-busy', 'true');
      clearResult();

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
        fields.forEach(el => {
          el.removeAttribute('aria-invalid');
          el.removeAttribute('aria-describedby');
        });
      } catch (err) {
        if (err.name === 'AbortError') {
          say('A tentativa demorou demais. Tente novamente ou me chame no LinkedIn.', 'warn');
          return;
        }
        say('Não consegui enviar agora. Tente de novo em instantes ou fale comigo no LinkedIn.', 'warn');
      } finally {
        clearTimeout(timeoutId);
        form.removeAttribute('aria-busy');
        submitBtn.textContent = original;
        submitBtn.classList.remove('is-busy');
        submitBtn.removeAttribute('aria-disabled');
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
        /* the view goes up, so the keyboard has to go with it */
        const main = $('#top');
        if (main) main.focus({ preventScroll: true });
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

    /* The band runs well past five seconds beside the footer links, so it
       needs a stop the reader controls (WCAG 2.2.2). Hover pauses it too,
       in CSS; this is the one a keyboard or a touch screen can reach. */
    const toggle = $('#marquee-toggle');
    if (!toggle) return;
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      const paused = toggle.getAttribute('aria-pressed') !== 'true';
      toggle.setAttribute('aria-pressed', String(paused));
      marquee.classList.toggle('is-paused', paused);
    });
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
