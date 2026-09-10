import { test, expect } from '@playwright/test';

const designSystemUrl = new URL('../design-system/design-system.html', import.meta.url).href;

test('monta o anel e anuncia a ficha da frente', async ({ page }) => {
  await page.goto(designSystemUrl);

  const galeria = page.locator('#galeria .gallery');
  await expect(galeria).toHaveClass(/is-live/);

  // Só a ficha da frente responde ao ponteiro e ao leitor de tela; as de trás
  // ficam inertes para que o arrasto nunca agarre um card invisível.
  await expect(page.locator('#galeria .gallery-item[aria-current="true"]')).toHaveCount(1);
  await expect(page.locator('#galeria .gallery-item.is-front')).toHaveCount(1);
  await expect(page.locator('#galeria .gallery-item:not(.is-front)').first()).toHaveAttribute('inert', '');

  const posicionadas = await page.locator('#galeria .gallery-item').evaluateAll((items) =>
    items.every((item) => item.style.transform.includes('translate3d('))
  );
  expect(posicionadas).toBe(true);

  await expect(page.locator('#galeria [data-gallery-status]')).toContainText(/de 8 —/);
});

test('avança pelas setas do teclado e pelos botões', async ({ page }) => {
  await page.goto(designSystemUrl);

  const status = page.locator('#galeria [data-gallery-status]');
  await expect(status).toContainText('1 de 8');

  await page.locator('#galeria [data-gallery-next]').click();
  await expect(status).toContainText('2 de 8');

  await page.locator('#galeria [data-gallery-stage]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(status).toContainText('3 de 8');

  await page.keyboard.press('ArrowLeft');
  await expect(status).toContainText('2 de 8');

  await page.keyboard.press('Home');
  await expect(status).toContainText('1 de 8');
});

test('mantém a galeria legível sem JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(designSystemUrl);

  // Sem script o bloco continua um trilho: nada de .is-live, nada inerte, e
  // toda imagem segue presente com alt real.
  await expect(page.locator('#galeria .gallery')).not.toHaveClass(/is-live/);
  await expect(page.locator('#galeria .gallery-item')).toHaveCount(8);
  await expect(page.locator('#galeria .gallery-item[inert]')).toHaveCount(0);

  const semAlt = await page.locator('#galeria .gcard img').evaluateAll((imgs) =>
    imgs.filter((img) => !img.alt || img.alt.trim().length < 20).length
  );
  expect(semAlt).toBe(0);

  await expect(page.locator('#galeria .gallery-stage')).toHaveCSS('overflow-x', 'auto');
  await context.close();
});

test('não agenda quadros sob movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    window.quadros = 0;
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback) => raf.call(window, (now) => {
      window.quadros++;
      callback(now);
    });
  });
  await page.goto(designSystemUrl);

  await expect(page.locator('#galeria .gallery')).not.toHaveClass(/is-live/);
  await expect(page.locator('#galeria [data-gallery-status]')).toContainText('1 de 8');
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.quadros)).toBe(0);

  // O trilho ainda navega: os botões passam a rolá-lo em vez de girar o anel.
  await page.locator('#galeria [data-gallery-next]').click();
  await expect(page.locator('#galeria [data-gallery-status]')).toContainText('2 de 8');
});

test('suspende o anel quando a galeria sai da tela', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    window.quadros = 0;
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback) => raf.call(window, (now) => {
      window.quadros++;
      callback(now);
    });
  });
  await page.goto(designSystemUrl);
  await expect(page.locator('#galeria .gallery')).toHaveClass(/is-live/);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(page.locator('#galeria')).not.toBeInViewport();
  await page.waitForTimeout(500);

  const parado = await page.evaluate(() => window.quadros);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.quadros)).toBe(parado);

  await page.locator('#galeria').scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => window.quadros)).toBeGreaterThan(parado);
});
