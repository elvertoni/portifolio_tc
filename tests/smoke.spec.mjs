import { test, expect } from '@playwright/test';

const pageUrl = new URL('../index.html', import.meta.url).href;

test('carrega o portfolio e expõe a navegação principal', async ({ page }) => {
  await page.goto(pageUrl);

  await expect(page).toHaveTitle(/Toni Coimbra/);
  await expect(page.locator('#loader')).toHaveClass(/done/, { timeout: 5_000 });
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
});
