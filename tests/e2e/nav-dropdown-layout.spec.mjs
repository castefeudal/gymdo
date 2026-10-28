import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('More dropdown keeps icons clear of labels and remains reachable in short viewports', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop dropdown is replaced by the mobile More surface');
  await page.goto('/index.html#program', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#mmg-boot')).toHaveCount(0);
  const more = page.locator('.nav-group button[aria-controls="navmenu-more"]');
  await expect(more).toBeVisible();
  await more.click();
  await expect(more).toHaveAttribute('aria-expanded', 'true');

  for (const width of [980, 1024, 1152, 1280, 1440, 1920]) {
    if (width < 1200 && await page.locator('body[data-v8-returning="true"]').count()) continue;
    await page.setViewportSize({ width, height: 587 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(more).toBeVisible();
    const menu = page.locator('#navmenu-more');
    const geometry = await menu.evaluate(node => {
      const menuBox = node.getBoundingClientRect();
      return {
        viewport: { width: innerWidth, height: innerHeight },
        menu: { left: menuBox.left, right: menuBox.right, top: menuBox.top, bottom: menuBox.bottom, height: menuBox.height, scrollHeight: node.scrollHeight, overflowY: getComputedStyle(node).overflowY },
        items: [...node.querySelectorAll(':scope > a')].map(anchor => {
          const box = anchor.getBoundingClientRect();
          const title = anchor.querySelector('.nav-menu-copy > b').getBoundingClientRect();
          const description = anchor.querySelector('.nav-menu-copy > span').getBoundingClientRect();
          const icon = anchor.querySelector('.nav-menu-icon').getBoundingClientRect();
          return { left: box.left, right: box.right, titleLeft: title.left, titleRight: title.right, titleScroll: anchor.querySelector('b').scrollWidth, titleWidth: anchor.querySelector('b').clientWidth, descriptionLeft: description.left, iconRight: icon.right };
        }),
      };
    });
    expect(geometry.menu.left, `${width}px dropdown left edge`).toBeGreaterThanOrEqual(0);
    expect(geometry.menu.right, `${width}px dropdown right edge`).toBeLessThanOrEqual(geometry.viewport.width + 1);
    expect(geometry.menu.top, `${width}px dropdown top edge`).toBeGreaterThanOrEqual(-64);
    expect(geometry.menu.bottom, `${width}px dropdown bottom edge`).toBeLessThanOrEqual(geometry.viewport.height + 1);
    expect(['auto', 'scroll'], `${width}px short viewport scroll behavior`).toContain(geometry.menu.overflowY);
    for (const [index, item] of geometry.items.entries()) {
      expect(item.titleLeft, `${width}px item ${index} label/icon gap`).toBeGreaterThanOrEqual(item.iconRight + 6);
      expect(item.descriptionLeft, `${width}px item ${index} description alignment`).toBe(item.titleLeft);
      expect(item.titleRight, `${width}px item ${index} label bounds`).toBeLessThanOrEqual(geometry.menu.right);
      expect(item.titleScroll, `${width}px item ${index} title clipping`).toBeLessThanOrEqual(item.titleWidth + 1);
    }
    await menu.evaluate(node => { node.scrollTop = node.scrollHeight; });
    await expect(menu.locator(':scope > a').last()).toBeInViewport();
  }
});
