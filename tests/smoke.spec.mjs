import { test, expect } from '@playwright/test';

const pageUrl = new URL('../index.html', import.meta.url).href;

test('carrega o portfolio e expõe a navegação principal', async ({ page }) => {
  await page.goto(pageUrl);

  await expect(page).toHaveTitle(/Toni Coimbra/);
  await expect(page.locator('#loader')).toHaveClass(/done/, { timeout: 10_000 });
  await expect(page.locator('main h1')).toContainText('Toni');
  await expect(page.locator('nav[aria-label="Navegação principal"] a')).toHaveCount(5);
});

test('drawer mobile controla foco e fechamento por Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pageUrl);

  const burger = page.locator('#burger');
  const drawer = page.locator('#drawer');
  await burger.click();

  await expect(drawer).toHaveClass(/open/);
  await expect(drawer.locator('a').first()).toBeFocused();
  await expect(burger).toHaveAttribute('aria-label', 'Fechar menu');

  await page.keyboard.press('Escape');
  await expect(drawer).not.toHaveClass(/open/);
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await expect(burger).toBeFocused();
});

test('respeita prefers-reduced-motion sem bloquear o conteúdo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(pageUrl);

  await expect(page.locator('body')).not.toHaveClass(/is-locked/);
  await expect(page.locator('#loader')).toHaveClass(/done/);
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('[data-count="20"]')).toHaveText('20+');
  await expect(page.locator('[data-count="200"]')).toHaveText('200K+');
});

test('destaca o primeiro projeto e adapta a galeria ao celular', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${pageUrl}#projetos`);

  const desktopLayout = await page.locator('.projects-grid').evaluate((grid) => ({
    columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
    width: grid.getBoundingClientRect().width,
    featureWidth: grid.querySelector('.box--feature').getBoundingClientRect().width
  }));

  expect(desktopLayout.columns).toBe(2);
  expect(desktopLayout.featureWidth).toBeCloseTo(desktopLayout.width, 0);
  await expect(page.locator('.box--feature')).toHaveCSS('grid-column-end', '-1');

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileColumns = await page.locator('.projects-grid').evaluate((grid) =>
    getComputedStyle(grid).gridTemplateColumns.split(' ').length
  );
  expect(mobileColumns).toBe(1);
});

test('aplica o efeito de profundidade do design system ao collage central', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(pageUrl);
  await expect(page.locator('#loader')).toHaveClass(/done/, { timeout: 10_000 });

  await expect.poll(() => page.locator('.collage .tile').evaluateAll((tiles) =>
    tiles.length === 3 && tiles.every((tile) => tile.style.transform.includes('translate3d('))
  )).toBe(true);
  await expect(page.locator('.collage-in')).toHaveCSS('transform-style', 'preserve-3d');

  await page.mouse.move(720, 420);
  await page.waitForTimeout(350);
  const centered = await page.locator('.collage .tile').evaluateAll((tiles) =>
    tiles.map((tile) => getComputedStyle(tile).transform)
  );

  await page.mouse.move(80, 80);
  await page.waitForTimeout(350);
  const corner = await page.locator('.collage .tile').evaluateAll((tiles) =>
    tiles.map((tile) => getComputedStyle(tile).transform)
  );

  expect(centered).not.toEqual(corner);
});

test('carrega capas editoriais e mantém o drawer isolado', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pageUrl);

  await page.locator('#projetos').scrollIntoViewIfNeeded();
  const covers = page.locator('.project-cover img');
  await expect(covers).toHaveCount(4);
  await expect.poll(() => covers.evaluateAll((images) =>
    images.every((image) => image.complete && image.naturalWidth > 0)
  )).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await page.locator('#burger').click();
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await expect(page.locator('footer')).toHaveAttribute('inert', '');

  await page.keyboard.press('Escape');
  await expect(page.locator('main')).not.toHaveAttribute('inert');
  await expect(page.locator('footer')).not.toHaveAttribute('inert');
});

test('mantém título e ações dentro da tela em diferentes larguras', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(pageUrl);
  await page.evaluate(() => document.fonts.ready);

  for (const width of [320, 390, 600, 768, 900, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => {
      const name = document.querySelector('.hero-name');
      const actions = document.querySelector('.hero-actions');
      return {
        pageWidth: document.documentElement.scrollWidth,
        nameWidth: name.clientWidth,
        nameContent: name.scrollWidth,
        actionsWidth: actions.clientWidth,
        actionsContent: actions.scrollWidth
      };
    });
    expect(layout.pageWidth, 'largura ' + width).toBeLessThanOrEqual(width);
    expect(layout.nameContent, 'assinatura em ' + width).toBeLessThanOrEqual(layout.nameWidth + 1);
    expect(layout.actionsContent, 'ações em ' + width).toBeLessThanOrEqual(layout.actionsWidth + 1);
  }
});

test('apresenta os projetos imediatamente depois da abertura', async ({ page }) => {
  await page.goto(pageUrl);
  await expect(page.locator('main > section').nth(1)).toHaveAttribute('id', 'projetos');
  await page.locator('.hero-actions a[href="#projetos"]').click();
  await expect(page).toHaveURL(/#projetos$/);
  await expect(page.locator('#projetos h2')).toBeInViewport();
});

test('libera o conteúdo quando o menu aberto passa para desktop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pageUrl);
  await page.locator('#burger').click();
  await page.setViewportSize({ width: 1200, height: 900 });
  await expect(page.locator('#drawer')).not.toHaveClass(/open/);
  await expect(page.locator('main')).not.toHaveAttribute('inert');
  await expect(page.locator('body')).not.toHaveClass(/is-locked/);
});

test('limpa a seção ativa da navegação ao retornar à abertura', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(pageUrl);
  await page.locator('.navchain a[href="#experiencia"]').click();
  await expect(page.locator('.navchain a[href="#experiencia"]')).toHaveAttribute('aria-current', 'location');
  await page.locator('#hdr .mark').click();
  await expect(page.locator('.navchain [aria-current]')).toHaveCount(0);
});

test('mantém leitura e links disponíveis sem JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(pageUrl);
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('#loader')).toBeHidden();
  await expect(page.locator('.box--feature .plink')).toBeVisible();
  await expect(page.locator('#contact-form')).toBeVisible();
  await page.locator('.hero-actions a[href="#projetos"]').click();
  await expect(page).toHaveURL(/#projetos$/);
  await context.close();
});

test('respeita movimento reduzido também na composição de imagens', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(pageUrl);
  const transforms = () => page.locator('.tile').evaluateAll(tiles =>
    tiles.map(tile => getComputedStyle(tile).transform)
  );
  const before = await transforms();
  await page.mouse.move(80, 80);
  expect(await transforms()).toEqual(before);
  await expect(page.locator('.marquee ul').first()).toHaveCSS('animation-name', 'none');
});

test('permite pular para o conteúdo e mantém foco dentro do menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pageUrl);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.locator('#burger').click();
  await expect(page.locator('#drawer a').first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#burger')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#drawer a').last()).toBeFocused();
});

test('confirma o envio do formulário sem enviar mensagens reais', async ({ page }) => {
  await page.route('https://api.web3forms.com/submit', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
  );
  await page.goto(pageUrl);
  await page.locator('#name').fill('Teste de interface');
  await page.locator('#email').fill('teste@example.com');
  await page.locator('#message').fill('Mensagem interceptada pelo teste automatizado.');
  await page.locator('#submit-btn').click();
  await expect(page.locator('#form-result')).toContainText('Mensagem enviada');
  await expect(page.locator('#name')).toHaveValue('');
  await expect(page.locator('#submit-btn')).toBeEnabled();
});

test('preserva a mensagem e oferece recuperação quando o envio falha', async ({ page }) => {
  await page.route('https://api.web3forms.com/submit', route =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{"success":false}' })
  );
  await page.goto(pageUrl);
  await page.locator('#name').fill('Teste de interface');
  await page.locator('#email').fill('teste@example.com');
  await page.locator('#message').fill('Esta mensagem deve ser preservada.');
  await page.locator('#submit-btn').click();
  await expect(page.locator('#form-result')).toContainText('Não consegui enviar');
  await expect(page.locator('#message')).toHaveValue('Esta mensagem deve ser preservada.');
  await expect(page.locator('#submit-btn')).toBeEnabled();
});

test('preserva a mensagem quando a resposta do formulário é inválida', async ({ page }) => {
  await page.route('https://api.web3forms.com/submit', route =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<html>proxy error</html>' })
  );
  await page.goto(pageUrl);
  await page.locator('#name').fill('Teste de interface');
  await page.locator('#email').fill('teste@example.com');
  await page.locator('#message').fill('Esta mensagem não pode ser perdida.');
  await page.locator('#submit-btn').click();
  await expect(page.locator('#form-result')).toContainText('Não consegui enviar');
  await expect(page.locator('#message')).toHaveValue('Esta mensagem não pode ser perdida.');
});

test('mantém todos os links do menu visíveis em viewport baixa', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 320 });
  await page.goto(pageUrl);
  await page.locator('#burger').click();
  const boxes = await page.locator('#drawer a').evaluateAll(links =>
    links.map(link => {
      const box = link.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom };
    })
  );
  expect(boxes[0].top).toBeGreaterThanOrEqual(64);
  expect(boxes.every(box => box.bottom > 0 && box.top < 320)).toBe(true);
});
