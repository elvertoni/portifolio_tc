import { test, expect } from '@playwright/test';

const pageUrl = new URL('../index.html', import.meta.url).href;

test('suspende os frames do collage fora da tela e retoma ao voltar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    window.framesMeasured = 0;
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = callback => raf.call(window, now => {
      window.framesMeasured++;
      callback(now);
    });
  });
  await page.goto(`${pageUrl}#contato`);
  await expect(page.locator('#contato')).toBeInViewport();
  // Let any entrance counters finish before measuring the idle page.
  await page.waitForTimeout(1800);
  const before = await page.evaluate(() => window.framesMeasured);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.framesMeasured)).toBe(before);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => window.framesMeasured)).toBeGreaterThan(before);
  await expect.poll(() => page.locator('.tile').first().evaluate(tile =>
    tile.style.transform.includes('translate3d(')
  )).toBe(true);
});

test('leva o foco do menu mobile para a seção escolhida', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(pageUrl);
  await page.locator('#burger').click();
  const link = page.locator('#drawer a[href="#projetos"]');
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#projetos')).toBeFocused();
  await expect(page.locator('#drawer')).toHaveAttribute('inert', '');
  await expect(page.locator('main')).not.toHaveAttribute('inert');
  await page.keyboard.press('Tab');
  await expect(page.locator('#projetos')).not.toHaveAttribute('tabindex');
  expect(await page.locator('#projetos').evaluate(section =>
    section.contains(document.activeElement)
  )).toBe(true);
});

test('ignora novo envio enquanto a primeira mensagem aguarda resposta', async ({ page }) => {
  let requests = 0;
  let releaseResponse;
  const responseReady = new Promise(resolve => { releaseResponse = resolve; });
  await page.route('https://api.web3forms.com/submit', async route => {
    requests++;
    await responseReady;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
  });
  await page.goto(pageUrl);
  await page.locator('#name').fill('Teste de interface');
  await page.locator('#email').fill('teste@example.com');
  await page.locator('#message').fill('Mensagem interceptada pelo teste automatizado.');
  await page.locator('#contact-form').evaluate(form => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect.poll(() => requests).toBe(1);
  await expect(page.locator('#submit-btn')).toBeDisabled();
  releaseResponse();
  await expect(page.locator('#form-result')).toContainText('Mensagem enviada');
  await expect(page.locator('#submit-btn')).toBeEnabled();
  expect(requests).toBe(1);
});

test('faz a faixa do rodapé andar para a esquerda só quando ela aparece', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(pageUrl);

  // O laço fecha porque o conteúdo está duplicado: sem a segunda cópia, a volta
  // mostraria uma faixa vazia entre um ciclo e outro.
  const copias = page.locator('.marquee ul');
  await expect(copias).toHaveCount(2);
  const larguras = await copias.evaluateAll((uls) => uls.map((ul) => Math.round(ul.getBoundingClientRect().width)));
  expect(larguras[0]).toBe(larguras[1]);

  // Longe do rodapé a animação não roda: uma faixa fora da tela ainda custa compositor.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(page.locator('.marquee')).not.toHaveClass(/is-running/);

  await page.locator('.marquee').scrollIntoViewIfNeeded();
  await expect(page.locator('.marquee')).toHaveClass(/is-running/);
  await expect(copias.first()).toHaveCSS('animation-name', 'marquee-drift');

  const antes = await copias.first().evaluate((ul) => getComputedStyle(ul).transform);
  await page.waitForTimeout(600);
  const depois = await copias.first().evaluate((ul) => getComputedStyle(ul).transform);
  expect(depois).not.toBe(antes);
  // matrix(a, b, c, d, tx, ty) — tx negativo é deslocamento para a esquerda.
  expect(Number(depois.split(',')[4])).toBeLessThan(0);
});

test('mantém a faixa do rodapé parada sob movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(pageUrl);
  await page.locator('.marquee').scrollIntoViewIfNeeded();

  await expect(page.locator('.marquee')).not.toHaveClass(/is-running/);
  await expect(page.locator('.marquee li').first()).toBeVisible();
});
