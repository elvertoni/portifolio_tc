/* ═══════════════════════════════════════════════════════════════════
   VOLTA ATELIER — GALERIA EM ARCO

   A standalone gallery for surfaces that carry many images. Drop this file
   next to any page, mark up a `[data-gallery]` block, and the cards lift off
   the page onto a ring the pointer can drag, throw with the wheel, or leave
   drifting on its own.

   It ships alone on purpose: no build step, no import, no dependency on
   main.js. A project that needs the gallery copies this file and the
   `.gallery` block of style.css, and nothing else follows it.

   The whole 3D layer is gated behind `.is-live`, which only this script can
   add. Without JavaScript — or under prefers-reduced-motion — the same markup
   stays a readable rail of figures, which is the state the CSS declares by
   default.
   ═══════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE_POINTER = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* Ring geometry. These are the values the design system documents: the
     falloff is cubic in cos, which is what gives the front card its authority
     — a linear depth ramp reads as a flat row, not as a ring. */
  const SPREAD = 26;      /* degrees between neighbours */
  const DEPTH_PULL = .55; /* how far back the ring bends */
  const LIFT = .15;       /* how much the far cards rise */
  const DRAG_DIVISOR = 190;
  const DRIFT_PER_SECOND = .16;
  const RESUME_DRIFT_MS = 2600;

  /* ═══════════════════════════════════════════════════════════════════
     1. FRAME LOOP

     One loop for every gallery on the page, awake only while at least one of
     them is on screen and the tab is visible. An idle ring still wakes the
     compositor sixty times a second if you let it.
     ═══════════════════════════════════════════════════════════════════ */
  const rings = [];
  let frameId = 0;
  let last = 0;

  function awake() {
    return rings.some(ring => ring.visible && !ring.paused);
  }

  function requestFrames() {
    if (REDUCED || document.hidden || frameId || !awake()) return;
    last = performance.now();
    frameId = requestAnimationFrame(frame);
  }

  function frame(now) {
    frameId = 0;
    if (document.hidden) return;
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    for (const ring of rings) {
      if (ring.visible && !ring.paused) ring.step(dt);
    }
    if (awake()) frameId = requestAnimationFrame(frame);
  }

  if (!REDUCED) document.addEventListener('visibilitychange', requestFrames);

  /* ═══════════════════════════════════════════════════════════════════
     2. CURSOR FOLLOWER

     A single shared element for the whole page — one gallery or six, the
     pointer only has one position. Fine pointers only: on touch there is no
     cursor to follow and the label would just sit in a corner lying.
     ═══════════════════════════════════════════════════════════════════ */
  let follower = null;
  let followerHost = null;
  const pointer = { x: 0, y: 0, ax: 0, ay: 0 };

  function ensureFollower(label) {
    if (follower || REDUCED || !FINE_POINTER) return follower;
    follower = document.createElement('div');
    follower.className = 'gallery-follower';
    follower.setAttribute('aria-hidden', 'true');
    follower.innerHTML = '<i></i><span></span>';
    follower.querySelector('span').textContent = label;
    document.body.appendChild(follower);
    pointer.ax = pointer.x = innerWidth / 2;
    pointer.ay = pointer.y = innerHeight / 2;
    addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
    return follower;
  }

  function followerStep() {
    if (!follower || !followerHost) return;
    pointer.ax = lerp(pointer.ax, pointer.x, .18);
    pointer.ay = lerp(pointer.ay, pointer.y, .18);
    follower.style.transform = `translate3d(${pointer.ax.toFixed(1)}px, ${pointer.ay.toFixed(1)}px, 0) translate(-50%, -50%)`;
  }

  /* ═══════════════════════════════════════════════════════════════════
     3. THE RING
     ═══════════════════════════════════════════════════════════════════ */
  function initGallery(root, index) {
    const stage = root.querySelector('[data-gallery-stage]');
    const track = root.querySelector('[data-gallery-track]');
    if (!stage || !track) return;

    const items = [...track.children];
    const total = items.length;
    if (total < 2) return;

    const prev = root.querySelector('[data-gallery-prev]');
    const next = root.querySelector('[data-gallery-next]');
    const status = root.querySelector('[data-gallery-status]');
    const followerLabel = root.dataset.galleryLabel || 'Ver';

    /* Reduced motion keeps the default rail: the buttons still work, they
       just scroll it. Nothing here registers a frame. */
    if (REDUCED) {
      /* O trilho conta em passos de rolagem, não em distância até o centro:
         assim a ficha 1 é a que está encostada na borda inicial, e o número
         anunciado bate com o que o botão acabou de fazer. */
      const pitch = () => {
        const first = items[0].getBoundingClientRect();
        return items.length > 1
          ? items[1].getBoundingClientRect().left - first.left
          : first.width;
      };
      const currentRailIndex = () => {
        const max = stage.scrollWidth - stage.clientWidth;
        if (max <= 0) return 0;
        /* no fim do trilho a última ficha aparece inteira mesmo com a rolagem
           parando antes do início dela */
        if (stage.scrollLeft >= max - 1) return total - 1;
        return clamp(Math.round(stage.scrollLeft / pitch()), 0, total - 1);
      };
      /* o índice é lido uma vez: rolar já muda a posição, e reler depois
         contaria o passo duas vezes */
      const scrollTo = step => {
        const idx = clamp(currentRailIndex() + step, 0, total - 1);
        stage.scrollTo({ left: idx * pitch(), behavior: 'auto' });
        announce(idx);
      };
      if (prev) prev.addEventListener('click', () => scrollTo(-1));
      if (next) next.addEventListener('click', () => scrollTo(1));
      stage.addEventListener('scroll', () => announce(currentRailIndex()), { passive: true });
      announce(0);
      return;
    }

    root.classList.add('is-live');
    stage.setAttribute('tabindex', '0');
    stage.setAttribute('role', 'group');
    stage.setAttribute('aria-roledescription', 'galeria em arco');
    if (!stage.hasAttribute('aria-label')) {
      stage.setAttribute('aria-label', `Galeria de imagens ${index + 1}`);
    }

    let pos = 0;        /* rendered index, continuous */
    let target = 0;     /* where the ring is heading */
    let dragging = false;
    let dragStartX = 0;
    let dragStartPos = 0;
    let driftAt = 0;    /* timestamp after which the ring drifts again */
    let shown = -1;

    const ring = {
      visible: false,
      paused: false,
      step(dt) {
        if (!dragging && performance.now() > driftAt) target += dt * DRIFT_PER_SECOND;
        pos = lerp(pos, target, .085);
        place();
        if (followerHost === root) followerStep();
      }
    };
    rings.push(ring);

    /* medido no palco, não na janela: a galeria costuma viver dentro de uma
       coluna, e um raio tirado da largura da janela espalha o anel para fora
       do recorte, deixando só três fichas visíveis */
    const radius = () => clamp((stage.clientWidth || innerWidth) * .46, 300, 560);

    function place() {
      const R = radius();
      items.forEach((item, i) => {
        /* shortest signed offset, so the ring wraps instead of unrolling */
        let d = i - pos;
        d = ((d % total) + total + total / 2) % total - total / 2;

        const a = d * SPREAD * Math.PI / 180;
        const ca = Math.cos(a);
        const x = Math.sin(a) * R;
        const z = (ca - 1) * R * DEPTH_PULL;
        const y = (1 - ca) * R * LIFT;
        const depth = Math.pow(Math.max(0, ca), 3);
        const scale = .4 + depth * .6;
        const front = Math.abs(d) < .5;

        item.style.transform =
          `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) scale(${scale.toFixed(3)})`;
        item.style.opacity = String(clamp(depth * 2.4, 0, 1));
        item.style.zIndex = String(Math.round(depth * 100));
        /* a queda de brilho precisa morder cedo: uma captura de tela clara em
           segundo plano rouba o olho da ficha da frente se só escurecer 12% */
        item.style.filter = depth < .92 ? `brightness(${(.34 + depth * .72).toFixed(2)})` : '';
        /* only the facing card answers the pointer, so a drag never grabs a
           card the reader cannot see */
        item.style.pointerEvents = front ? 'auto' : 'none';
        item.classList.toggle('is-front', front);
        item.toggleAttribute('inert', !front);
      });

      const idx = ((Math.round(pos) % total) + total) % total;
      if (idx !== shown) {
        shown = idx;
        items.forEach((item, i) => {
          if (i === idx) item.setAttribute('aria-current', 'true');
          else item.removeAttribute('aria-current');
        });
        announce(idx);
      }
    }

    function announce(idx) {
      if (!status) return;
      const safe = clamp(idx, 0, total - 1);
      const title = items[safe].dataset.galleryTitle || items[safe].querySelector('img')?.alt || '';
      status.textContent = title
        ? `${safe + 1} de ${total} — ${title}`
        : `${safe + 1} de ${total}`;
    }

    function go(step) {
      target = Math.round(target) + step;
      driftAt = performance.now() + RESUME_DRIFT_MS;
      requestFrames();
    }

    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));

    stage.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'Home') { e.preventDefault(); target = 0; driftAt = performance.now() + RESUME_DRIFT_MS; requestFrames(); }
      else if (e.key === 'End') { e.preventDefault(); target = total - 1; driftAt = performance.now() + RESUME_DRIFT_MS; requestFrames(); }
    });

    /* The drift is a background motion, not a slideshow: it stops while the
       reader is reading, which is what focus and hover tell us. */
    /* ao receber foco o anel encosta no rosto mais próximo em vez de congelar
       no meio do caminho: quem chegou pelo teclado precisa de uma ficha da
       frente definida, não de duas pela metade */
    stage.addEventListener('focusin', () => {
      driftAt = Infinity;
      target = Math.round(target);
      requestFrames();
    });
    stage.addEventListener('focusout', () => { driftAt = performance.now() + RESUME_DRIFT_MS; });

    stage.addEventListener('pointerdown', e => {
      dragging = true;
      dragStartX = e.clientX;
      dragStartPos = target;
      driftAt = Infinity;
      root.classList.add('is-dragging');
      stage.setPointerCapture(e.pointerId);
      requestFrames();
    });
    stage.addEventListener('pointermove', e => {
      if (dragging) target = dragStartPos - (e.clientX - dragStartX) / DRAG_DIVISOR;
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      root.classList.remove('is-dragging');
      target = Math.round(target);     /* snap to the nearest face */
      driftAt = performance.now() + RESUME_DRIFT_MS;
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    /* Horizontal intent only. Claiming vertical wheel would trap the page. */
    let wheelTimer = 0;
    stage.addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      target += e.deltaX / 240;
      driftAt = Infinity;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        target = Math.round(target);
        driftAt = performance.now();
      }, 700);
      requestFrames();
    }, { passive: false });

    if (FINE_POINTER) {
      ensureFollower(followerLabel);
      stage.addEventListener('pointerenter', () => {
        followerHost = root;
        if (follower) follower.classList.add('is-on');
      });
      stage.addEventListener('pointerleave', () => {
        if (followerHost === root) followerHost = null;
        if (follower) follower.classList.remove('is-on');
      });
      stage.addEventListener('pointerdown', () => follower && follower.classList.add('is-press'));
      stage.addEventListener('pointerup', () => follower && follower.classList.remove('is-press'));
    }

    new IntersectionObserver(entries => {
      ring.visible = entries[0].isIntersecting;
      requestFrames();
    }, { rootMargin: '160px' }).observe(root);

    addEventListener('resize', place);
    place();
    requestFrames();
  }

  function boot() {
    document.querySelectorAll('[data-gallery]').forEach(initGallery);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
