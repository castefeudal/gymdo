import {test,expect} from '@playwright/test';
test.use({serviceWorkers:'block'});
test('header controls fit intermediate widths and mobile More retains tools and labs',async({page})=>{
 await page.setViewportSize({width:1920,height:900});await page.goto('/index.html#home');
 await expect(page.locator('#mmg-boot')).toHaveCount(0);await page.evaluate(()=>document.fonts.ready);
 for(const reading of ['balanced','large'])for(const language of ['ru','en']){
  await page.setViewportSize({width:1920,height:900});
  await page.locator(`.topbar [data-lang="${language}"]`).click();
  await page.evaluate(reading=>document.querySelector(`[data-v10-reading="${reading}"]`).click(),reading);
  await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('html')).toHaveAttribute('data-reading',reading);
  for(const width of [901,960,1024,1100,1152,1200,1280,1366,1400,1440,1600,1750,1920]){
   await page.setViewportSize({width,height:900});
   await page.evaluate(()=>{scrollTo(0,0);return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
   const geometry=await page.evaluate(()=>{
    const header=document.querySelector('.topbar').getBoundingClientRect();
    const selectors='.topbar .brand,.topbar #lang-switch,.topbar #theme-toggle,.topbar #cmdk-open,.topbar #nav-burger,.v7-primary-nav>.v7-nav-link,.v7-primary-nav>.nav-group>button';
    return {width:innerWidth,headerBottom:header.bottom,contextTop:document.querySelector('.v8-context-bar')?.getBoundingClientRect().top,controls:[...document.querySelectorAll(selectors)].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>{const box=el.getBoundingClientRect();return {name:el.id||el.textContent.trim(),left:box.left,right:box.right,top:box.top,bottom:box.bottom,textFits:!el.clientWidth||el.scrollWidth<=el.clientWidth+1};})};
   });
   for(const control of geometry.controls){
    const label=`${reading}/${language}/${width} (${geometry.width} CSS px): ${control.name}`;
    expect(control.left,label).toBeGreaterThanOrEqual(-1);expect(control.right,label).toBeLessThanOrEqual(geometry.width+1);
    expect(control.top,label).toBeGreaterThanOrEqual(-1);expect(control.bottom,label).toBeLessThanOrEqual(geometry.headerBottom+1);expect(control.textFits,label).toBe(true);
   }
   if(geometry.contextTop>0)expect(geometry.contextTop).toBeGreaterThanOrEqual(geometry.headerBottom-1);
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('#mobile-app-nav [data-mobile-dest="more"]').click();
 await page.locator('#v7-more-grid [data-v7-route="tools"]').click();
 await expect(page.locator('html')).toHaveAttribute('data-route-ready','tools');
 await expect(page.locator('[data-lab-form]').first()).toBeVisible();
 await page.locator('#mobile-app-nav [data-mobile-dest="more"]').click();
 await page.locator('#v7-more-grid [data-v7-route="labs"]').click();
 await expect(page.locator('.lab-result-form')).toBeVisible();
});
