import {test,expect} from '@playwright/test';
test.use({serviceWorkers:'block'});
const frames=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function library(page){
 await page.goto('/index.html#home');await expect(page.locator('#mmg-boot')).toHaveCount(0);
 await page.evaluate(()=>location.hash='library');await expect(page.locator('#grid .card').first()).toBeVisible();await frames(page);
}

test('route heading focus never overrides a later field focus',async({page})=>{
 await library(page);
 await page.evaluate(()=>location.hash='settings');await expect(page.locator('html')).toHaveAttribute('data-route-ready','settings');await frames(page);
 await page.evaluate(()=>{
  window.addEventListener('hashchange',()=>document.getElementById('search').focus(),{once:true});
  location.hash='library';
 });
 await expect(page.locator('html')).toHaveAttribute('data-route-ready','library');await frames(page);
 await expect(page.locator('#search')).toBeFocused();
 await page.locator('#search').fill('0025');await expect(page.locator('#grid [data-open="0025"]')).toBeVisible();
 expect(await page.evaluate(()=>window.mmgDiagnostics.exerciseCount)).toBe(1324);
});

test('a pending search cannot resurrect cleared or Back-restored filters',async({page})=>{
 await library(page);await page.locator('#search').focus();await page.clock.install();
 await page.locator('#search').fill('0025');
 await page.locator('#search-clear').evaluate(button=>button.click());
 await page.clock.fastForward(500);
 await expect(page.locator('#search')).toHaveValue('');await expect(page.locator('#grid .card')).toHaveCount(12);
 expect(new URL(page.url()).searchParams.get('q')).toBeNull();
 await page.evaluate(()=>{history.pushState({mmgLibrary:true},'','?q=press#library');dispatchEvent(new PopStateEvent('popstate'));});
 await expect(page.locator('#search')).toHaveValue('press');
 await page.locator('#search').fill('0025');await page.goBack();
 await expect(page.locator('#search')).toHaveValue('');await page.clock.fastForward(500);
 await expect(page.locator('#grid .card')).toHaveCount(12);expect(new URL(page.url()).searchParams.get('q')).toBeNull();
});
