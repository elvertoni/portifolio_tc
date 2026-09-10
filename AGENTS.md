# Repository Guidelines

## Project Structure & Module Organization

This repository is a framework-free static portfolio. `index.html` defines the semantic page structure and loads the single stylesheet at `assets/css/style.css` and runtime at `assets/js/main.js`. Keep optimized project images in `assets/img/`, local fonts in `assets/fonts/`, and icons/social previews directly under `assets/`. Treat `design-system/design-system.html` as the visual reference for tokens and components; it is the only page that loads `assets/js/gallery.js`, the standalone arc gallery meant to be copied into other projects rather than folded into `main.js`. Playwright smoke tests live in `tests/`; production serving is defined by `Dockerfile` and `nginx.conf`. Do not commit generated `node_modules/`, `test-results/`, or `playwright-report/` content.

## Build, Test, and Development Commands

- `npm ci` installs the locked Playwright development dependency.
- `npx playwright install chromium` installs the browser needed on a new machine.
- `python -m http.server 8080` serves the site locally at `http://localhost:8080`; there is no compilation step.
- `npm test` runs the full Playwright smoke suite. `npm run test:smoke` is currently an equivalent alias.
- `docker build -t portifolio-tc .` builds the Nginx production image; use `docker run --rm -p 8080:80 portifolio-tc` to verify it.

## Coding Style & Naming Conventions

Use two-space indentation in HTML, CSS, JavaScript, and test files. Follow the existing ES6 style: single quotes, semicolons, `const`/`let`, arrow callbacks, and focused `initThing()` functions inside the strict IIFE. Name CSS classes in kebab-case and use existing modifier patterns such as `.box--feature`. Preserve existing DOM IDs because JavaScript and tests query them directly.

Use the CSS custom properties in `:root` instead of introducing arbitrary colors or spacing. Prefer fluid `clamp()` sizing and preserve semantic HTML, visible focus, ARIA state, 44px touch targets, and `prefers-reduced-motion` behavior. No formatter or linter is configured, so match surrounding code carefully.

## Testing Guidelines

Add browser-level regressions to `tests/*.spec.mjs` with descriptive behavior-oriented test names. Cover desktop and mobile layouts, keyboard/focus behavior, and reduced-motion paths when UI behavior changes. Playwright retains traces on failure. No coverage threshold is configured; all smoke tests must pass before review.

## Commit & Pull Request Guidelines

Recent history primarily follows Conventional Commits, for example `feat(projects): ...`, `fix(form): ...`, `perf(portfolio): ...`, and `refactor(design): ...`. Use a concise imperative subject and a relevant scope. Pull requests should explain the user-visible impact, list verification commands, link an issue when applicable, and include before/after screenshots for visual changes at desktop and mobile widths.
