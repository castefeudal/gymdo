import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('all navigation dropdowns stay anchored and reachable in short viewports', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop dropdown is replaced by the mobile More surface');
  await page.goto('/index.html#program', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#mmg-boot')).toHaveCount(0);
  const groups = ['training', 'progress', 'more'];

  for (const width of [980, 1024, 1152, 1280, 1440, 1920]) {
    if (width < 1200 && await page.locator('body[data-v8-returning="true"]').count()) continue;
    await page.setViewportSize({ width, height: 587 });
    await page.evaluate(() => window.scrollTo(0, 0));
    for (const groupName of groups) {
      const group = page.locator(`.nav-group[data-navgroup="${groupName}"]`);
      const button = group.locator(':scope > button');
      await expect(button).toBeVisible();
      await button.click();
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      const menu = group.locator('.nav-menu');
      const geometry = await menu.evaluate(node => {
        const menuBox = node.getBoundingClientRect();
        const groupBox = node.parentElement.getBoundingClientRect();
        const buttonBox = node.parentElement.querySelector(':scope > button').getBoundingClientRect();
        return {
          viewport: { width: innerWidth, height: innerHeight },
          group: { left: groupBox.left, right: groupBox.right },
          button: { bottom: buttonBox.bottom },
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
      const label = `${width}px ${groupName} dropdown`;
      expect(geometry.menu.left, `${label} left edge`).toBeGreaterThanOrEqual(0);
      expect(geometry.menu.right, `${label} right edge`).toBeLessThanOrEqual(geometry.viewport.width + 1);
      expect(geometry.menu.top, `${label} vertical anchor`).toBeGreaterThanOrEqual(geometry.button.bottom + 5);
      expect(geometry.menu.top, `${label} vertical anchor`).toBeLessThanOrEqual(geometry.button.bottom + 17);
      if (groupName === 'more') {
        expect(geometry.menu.right, `${label} right alignment`).toBeCloseTo(geometry.group.right, 0);
      } else {
        expect(geometry.menu.left, `${label} left alignment`).toBeCloseTo(geometry.group.left, 0);
      }
      expect(geometry.menu.bottom, `${label} bottom edge`).toBeLessThanOrEqual(geometry.viewport.height + 1);
      expect(['auto', 'scroll'], `${label} short viewport scroll behavior`).toContain(geometry.menu.overflowY);
      for (const [index, item] of geometry.items.entries()) {
        expect(item.titleLeft, `${label} item ${index} label/icon gap`).toBeGreaterThanOrEqual(item.iconRight + 6);
        expect(item.descriptionLeft, `${label} item ${index} description alignment`).toBe(item.titleLeft);
        expect(item.titleRight, `${label} item ${index} label bounds`).toBeLessThanOrEqual(geometry.menu.right);
        expect(item.titleScroll, `${label} item ${index} title clipping`).toBeLessThanOrEqual(item.titleWidth + 1);
      }
      await menu.evaluate(node => { node.scrollTop = node.scrollHeight; });
      await expect(menu.locator(':scope > a').last()).toBeInViewport();
      await button.click();
    }
  }
});
