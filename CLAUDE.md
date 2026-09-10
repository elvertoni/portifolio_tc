# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Framework-free static portfolio site (Toni Coimbra). Pure HTML5/CSS3/ES6+, no build step, no bundler, no runtime dependency. `index.html` loads `assets/css/style.css` and `assets/js/main.js` (defer), both with a `?v=YYYYMMDD` cache-busting query — bump it on both tags plus the favicon link when shipping a visual change. Design system: "Volta Atelier" — brutalist-editorial, dark warm background (`#141414`), signal red accent (`#fb3732`).

Companion docs, each with a distinct job: `CODEBASE.md` (architecture writeup), `AGENTS.md` (full contributor/PR guide), `README.md` (token tables + component inventory), `PRODUCT.md` (brand brief), `design-system/REVIEW.md` (design-decision log + verification notes). A behavior change usually needs one of them updated too. The repo holds only what the site ships plus its docs, tests and brand source — discarded brand studies and third-party agent tooling live in the git history, not the working tree.

## Commands

- `npm ci` — install the locked Playwright dev dependency.
- `npx playwright install chromium` — install the browser on a new machine.
- `python -m http.server 8080` — serve locally, no compile step.
- `npm test` / `npm run test:smoke` — run the full Playwright suite (currently equivalent aliases; both run every spec). 29 tests: 21 in `tests/smoke.spec.mjs`, 3 runtime-behavior tests in `tests/runtime.spec.mjs`, 5 gallery tests in `tests/gallery.spec.mjs`.
- `npx playwright test tests/smoke.spec.mjs -g "<nome do teste>"` — run a single test (test names are in Portuguese).
- `docker build -t portifolio-tc .` then `docker run --rm -p 8080:80 portifolio-tc` — build/verify the Nginx production image.

Tests open `index.html` and `design-system/design-system.html` through `file://` URLs (`new URL(..., import.meta.url)`), so **no dev server is needed to run them** and there is no `webServer` in `playwright.config.mjs`. Traces are retained on failure; output lands in the gitignored `test-results/`.

No linter/formatter is configured — match surrounding style exactly.

## Architecture

### Files

- **`index.html`** — single-page semantic structure. All DOM IDs that JS/tests query directly (`#hdr`, `#drawer`, `#burger`, `#contact-form`, `#form-result`, `#submit-btn`, `#clock`/`#clock2`, `#toTop`, `#current-year`, and the section ids `#hero`/`#projetos`/`#sobre`/`#stack`/`#experiencia`/`#contato`) must be preserved. There is no preloader: the page paints its content directly.
- **`assets/css/style.css`** — one unified stylesheet, in cascade order: tokens, reset, type scale, primitives, components, reveal system, section skins, responsive, reduced motion, and the design-system catalog styles at the end. Each selector is declared once; a component's final value lives in its own rule, not in a later override. Keep it that way — a trailing "fix-up" block is what this file was refactored out of.
- **`assets/js/main.js`** — single strict-mode IIFE. Continuous updates funnel through one `requestAnimationFrame` loop (`frame`/`onTick`) rather than scattered timers, and are skipped under `prefers-reduced-motion` (`REDUCED`). Each effect registers with the visibility state of its own section (`onTick(fn, whenVisible(el))`), and the loop stops itself whenever no registered effect is on screen or the tab is hidden — `requestTick()` is what restarts it, so a new per-frame effect must pass a visibility state or it will never run. Booted from `DOMContentLoaded`: `revealOnce`/`initReveal` (one IntersectionObserver adding `.is-in` to `[data-io]`/`[data-rise]`/`[data-mask]`/`.stagger`/`section`), `initHeader` (mobile drawer a11y + focus trap, and the nav scroll-spy that toggles `.on`/`aria-current="location"` on `.navchain a`), `initCollage` (pointer-parallax hero tiles; opts out under reduced motion or coarse pointer), `initClock` (São Paulo time, paused in a hidden tab), `initCounters` (`[data-count]`), `initForm`, `initFooter`.
- **`assets/js/gallery.js`** — the arc gallery, and the one script that is deliberately **not** part of `main.js`. It is a self-contained IIFE that boots on any `[data-gallery]` block, with its own reduced-motion branch, its own `requestAnimationFrame` loop and its own `IntersectionObserver` gating. It ships standalone so another project can take it plus the `GALERIA EM ARCO` block of `style.css` and nothing else; don't "consolidate" it into `main.js` — that coupling is what the component exists to avoid. Only the catalog loads it today; `index.html` does not.
- **`assets/logo.svg` / `assets/favicon.svg`** — the "ligadura TC" mark. `logo.svg` is the 200×128 wide lockup and uses an SVG `<mask>` so the gap between T and C stays transparent on any surface; `favicon.svg` is the separate 16px cut (larger counter, wider gap) on a rounded `#141414` field. Both are hand-drawn paths — don't regenerate them from a font. Source of truth and full spec: `design-system/marca-canvas/`.
- **`assets/img/`** — real product screenshots as `.webp` (1x/@2x), `loading="lazy"`.
- **`Dockerfile` / `nginx.conf`** — Nginx Alpine production image, deployed to VPS/EasyPanel.

### Cross-file contracts (what breaks silently)

- **Two-layer CSS tokens.** `:root` declares semantic tokens (`--color-bg`, `--color-surface`, `--color-text-muted`, `--color-border-interactive`, `--color-accent`…) and then short compatibility aliases that the existing components actually use (`--ink`, `--panel`, `--muted`, `--line-ui`, `--signal`, `--bone`…). New work should reference the semantic names; never hardcode a color, space, radius or easing. Several token values carry WCAG contrast rationale in comments (`--color-border-interactive` at 3:1, `--color-text-subtle` for AA on `--panel-2`, `--color-accent-strong` for white-on-red fills) — don't "tidy" those values without redoing the math.
- **The catalog proves the mark with the shipped files.** Every `#marca` image loads `../assets/logo.svg` or `../assets/favicon.svg` — never a re-drawn copy — and a test asserts exactly that, so the documentation cannot drift from the asset. The reduction ladder is sized in CSS via `--mark-h` because the reset zeroes `width`/`height` attributes on `img`; the light-ground proof needs `color-scheme: light` on its container, since `logo.svg` swaps the T through `prefers-color-scheme`.
- **Project cards are not `.box` surfaces.** The articles in `.projects-grid` carry only `box--media` (+ `box--feature`); the panel skin (`.box`, `.box--card`) belongs to the formação cards and the catalog. `.box--media { position: relative }` is load-bearing — `.plink::after` stretches the title's hit area over the whole card against it.
- **Purple/violet is banned** by design-system convention. The only accents are `--signal` (red, plus `--signal-deep`/`--signal-text` for contrast-safe fills and type) and `--amber`.
- **Progressive-enhancement gate.** `main.js` adds `.js` to `<html>` at boot and every reveal/animation rule in the CSS is scoped under `.js`. That class is also the suite's boot signal (`expect(page.locator('html')).toHaveClass(/js/)`), and a test loads the page with `javaScriptEnabled: false` and asserts content and links stay available — so any new animated element must be readable by default and only hidden behind `.js`.
- **The form has a no-JS fallback.** `#contact-form` posts natively to `https://api.web3forms.com/submit` (hidden `access_key`, `subject`, and a `botcheck` honeypot). `initForm` sets `form.noValidate = true` and takes over with Portuguese validation plus `fetch`, reporting into the live region `#form-result`. Tests intercept that URL with `page.route` — never let a test hit the real endpoint.
- **900/901 breakpoint pair.** CSS shows the burger under `@media (max-width: 900px)`; JS closes the drawer via `matchMedia('(min-width: 901px)')`. Change one, change the other.
- **Catalog counts are asserted.** The smoke suite pins exact counts in `design-system/design-system.html` (`.ds-token-row` 11, `.ds-type-row` 8, `.ds-space-row` 8, `.ds-demo` 6, `.ds-spec-row` 7, seven nav links) and that it links `../assets/css/style.css`. Adding or removing a catalog row means updating `tests/smoke.spec.mjs`. The catalog has no `<style>` of its own — its styles live in the `DESIGN SYSTEM CATALOG` section of `style.css`. It does now carry one `<script>`, `../assets/js/gallery.js`, for the `#galeria` demo; the page still renders and reads completely without it.
- **The gallery is progressive in its own right.** `.gallery` is declared as a scroll-snap rail; `gallery.js` adds `.is-live` and only then do the cards leave the line for the 3D ring. Every 3D rule is scoped under `.gallery.is-live`, so no-JS and `prefers-reduced-motion` land on the same readable rail — under reduced motion the script schedules no frame at all and the prev/next buttons scroll the rail instead of turning the ring. Card captions sit over arbitrary images, so `.gcard::before` is a contrast scrim, not decoration: removing it puts bone text on whatever the screenshot happens to be. `.gcard figcaption .chip` intentionally repeats itself on `:hover` because it outranks `.chip:hover`, which would otherwise flip the label to ink-on-ink.
- **`nginx.conf` cache policy mirrors that asset coupling.** `index.html`, CSS, JS and SVG are `no-cache, must-revalidate` (they ship as one unit); `.woff2` is immutable for a year; other assets get one day. A new asset type may need its own `location` block.
- **`Dockerfile` does `COPY . /usr/share/nginx/html`.** Anything that must not be publicly served has to be listed in `.dockerignore` (tests, configs, `*.md` and source art are already excluded).

## Conventions

- Two-space indentation everywhere. Single quotes, semicolons, `const`/`let`, arrow callbacks, focused `initThing()` functions inside the strict IIFE (JS).
- CSS classes in kebab-case; existing modifier pattern is `.box--feature`.
- Preserve semantic HTML, visible focus states, ARIA attributes (`aria-expanded`, `aria-hidden`, `aria-current`, `inert` on the closed drawer), 44px touch targets (`--tap`), and `prefers-reduced-motion` fallbacks on any UI change.
- Use `clamp()` for fluid type sizing; the ready-made scale is `--size-display-*` / `--size-body-*` / `--size-meta`.
- UI copy, test names and error messages are pt-BR. Code comments follow whatever the surrounding file already uses (mixed pt/en) and explain *why*, not *what*.
- Don't commit `node_modules/`, `test-results/`, `playwright-report/`, or `graphify-out/`.
- Commits follow Conventional Commits (`feat(scope): ...`, `fix(scope): ...`, `perf(scope): ...`, `refactor(scope): ...`, `docs: ...`).

Full contributor guidelines (structure, testing, PR expectations) live in `AGENTS.md` — read it for anything not covered above.
