# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Framework-free static portfolio site (Toni Coimbra). Pure HTML5/CSS3/ES6+, no build step, no bundler. `index.html` loads `assets/css/style.css` and `assets/js/main.js` (defer). Design system: "Volta Atelier" — brutalist-editorial, dark warm background (`#141414`), signal red accent (`#fb3732`). See `design-system/design-system.html` for the token/component source of truth, `design-system/marca-canvas/` for the brand mark (the "ligadura TC"), and `CODEBASE.md` for a full architectural writeup (file map, JS module breakdown, deploy flow).

## Commands

- `npm ci` — install Playwright dev dependency (locked).
- `npx playwright install chromium` — install browser on a new machine.
- `python -m http.server 8080` — serve locally, no compile step.
- `npm test` / `npm run test:smoke` — run the full Playwright smoke suite (currently equivalent aliases).
- `npx playwright test tests/smoke.spec.mjs -g "<test name>"` — run a single test by name.
- `docker build -t portifolio-tc .` then `docker run --rm -p 8080:80 portifolio-tc` — build/verify the Nginx production image.

No linter/formatter is configured — match surrounding style exactly.

## Architecture

- **`index.html`** — single-page semantic structure; all sections and DOM IDs that JS/tests query directly (`#loader`, `#hdr`, `#drawer`, `#burger`, `#contact-form`, `#form-result`, `#submit-btn`, `#clock`/`#clock2`, `#toTop`, etc.). Preserve these IDs.
- **`assets/css/style.css`** — one unified stylesheet: design tokens in `:root`, reset, layout/grid, components. Never hardcode colors/spacing — always use the CSS custom properties (`var(--bone)`, `var(--signal)`, `var(--panel)`...). Purple/violet accents are banned by design-system convention; the only accents are `--signal` (red) and `--amber`. Use `clamp()` for fluid type sizing.
- **`assets/js/main.js`** — single strict-mode IIFE. Continuous updates funnel through one `requestAnimationFrame` loop (`frame`/`onTick`) rather than scattered timers, and are skipped under `prefers-reduced-motion`. Booted from `DOMContentLoaded`: `revealOnce`/`initReveal` (IntersectionObserver-driven `.is-in` reveals via `[data-rise]`/`[data-mask]`/`.stagger`), `initHeader` (scroll `.stuck` state + mobile drawer a11y), `initCollage` (pointer-parallax hero tiles; opt-out under reduced motion or coarse pointer), `initClock` (São Paulo time in `#clock`/`#clock2`, paused in a hidden tab), `initCounters` (`[data-count]` number animation), `initForm` (Web3Forms JSON submit to `https://api.web3forms.com/submit`, with honeypot anti-spam), `initFooter` (current year + back-to-top). The `#loader` element is kept in the DOM and marked `done` on boot — there is no preloader animation.
- **`assets/logo.svg` / `assets/favicon.svg`** — the "ligadura TC" mark. `logo.svg` is the 200×128 wide lockup and uses an SVG `<mask>` so the gap between T and C stays transparent on any surface; `favicon.svg` is the separate 16px cut (larger counter, wider gap) on a rounded `#141414` field. Both are hand-drawn paths — don't regenerate them from a font. Source of truth and full spec: `design-system/marca-canvas/`.
- **`assets/img/`** — real product screenshots as `.webp` (1x/@2x), `loading="lazy"`.
- **`tests/*.spec.mjs`** — Playwright smoke tests: page load, mobile drawer focus/Escape handling, `prefers-reduced-motion` behavior, responsive project grid. Traces retained on failure (`playwright.config.mjs`).
- **`Dockerfile` / `nginx.conf`** — Nginx Alpine production image, deployed to VPS/EasyPanel.

## Conventions

- Two-space indentation everywhere. Single quotes, semicolons, `const`/`let`, arrow callbacks, focused `initThing()` functions inside the strict IIFE (JS).
- CSS classes in kebab-case; existing modifier pattern is `.box--feature`.
- Preserve semantic HTML, visible focus states, ARIA attributes (`aria-expanded`, `aria-hidden`, `aria-label`), 44px touch targets (`--tap`), and `prefers-reduced-motion` fallbacks on any UI change.
- Don't commit `node_modules/`, `test-results/`, or `playwright-report/`.
- Commits follow Conventional Commits (`feat(scope): ...`, `fix(scope): ...`, `perf(scope): ...`, `refactor(scope): ...`).

Full contributor guidelines (structure, testing, PR expectations) live in `AGENTS.md` — read it for anything not covered above.
