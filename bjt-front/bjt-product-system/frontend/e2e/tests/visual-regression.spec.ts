import { test, expect, Page } from '@playwright/test';

const visualRoutes = [
  { name: 'home', path: '/' },
  { name: 'contact', path: '/contact' },
  { name: 'support', path: '/support' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
];

/** 机器族群：数据来自 sql-mock；卡片图若含外链随机图，像素容差略高于静态页 */
const machineVisualRoutes = [
  { name: 'machines-index', path: '/machines', maxDiffPixels: 2000 },
  { name: 'machines-product-line-1', path: '/machines/product-line-1', maxDiffPixels: 3500 },
];

async function prepareStableScreenshot(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });
}

async function gotoMachinesStable(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.machines-page', { timeout: 90_000 });
  if (path.includes('product-line')) {
    await page.waitForSelector('.ms-filter-card', { timeout: 90_000 });
  } else {
    await page.waitForSelector('.machines-index-page', { timeout: 90_000 });
  }
  await page.waitForFunction(
    () => document.querySelector('.machines-page main .loading-state') == null,
    { timeout: 90_000 }
  );
  await page.waitForFunction(
    () => document.querySelector('.machines-page .ant-spin-spinning') == null,
    { timeout: 90_000 }
  );
  await new Promise((r) => setTimeout(r, 500));
}

test.describe('Visual regression (Figma strict baseline)', () => {
  for (const route of visualRoutes) {
    test(`baseline snapshot - ${route.name}`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'networkidle' });
      await prepareStableScreenshot(page);
      await expect(page).toHaveScreenshot(`${route.name}.png`, {
        fullPage: true,
        maxDiffPixels: 120,
      });
    });
  }

  for (const route of machineVisualRoutes) {
    test(`baseline snapshot - ${route.name}`, async ({ page }) => {
      await gotoMachinesStable(page, route.path);
      await prepareStableScreenshot(page);
      await expect(page).toHaveScreenshot(`${route.name}.png`, {
        fullPage: true,
        maxDiffPixels: route.maxDiffPixels,
      });
    });
  }
});
