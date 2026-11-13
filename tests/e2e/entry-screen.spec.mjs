import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ serviceWorkers:'block' });
async function ready(page, path='/index.html') {
  await page.goto(path,{waitUntil:'domcontentloaded'});
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
  await expect(page.locator('#mmg-boot')).toHaveCount(0);
}
for (const lang of ['ru','en']) test(`entry selects and persists ${lang}`, async ({page}) => {
  await ready(page,`/index.html?lang=${lang}`);
  await expect(page.locator('#entry-screen')).toBeVisible();
  const link = new URL(await page.locator('[data-entry-contact]').getAttribute('href'));
  expect(link.origin+link.pathname).toBe('https://t.me/markovmade');
  expect(link.searchParams.get('text')).toBe(lang==='en'?"Hello Pavel! I'm contacting you from MARKOV MADE GYM.":'Здравствуйте, Павел! Пишу вам с сайта MARKOV MADE GYM.');
  await expect(page.locator('.entry-footer a')).toHaveAttribute('href','https://t.me/markovmade');
  await page.locator(`[data-entry-lang="${lang}"]`).click();
  await expect(page.locator('#entry-screen')).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('lang',lang);
  expect(await page.evaluate(()=>localStorage.getItem('mmg.lang.v2'))).toBe(lang);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('html')).toHaveAttribute('lang',lang);
  await expect(page.locator('#entry-screen')).toBeHidden();
  await ready(page);
  await expect(page.locator('#entry-screen')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang',lang);
  const other=lang==='ru'?'en':'ru';
  await page.locator(`[data-entry-lang="${other}"]`).click();
  await expect(page.locator('html')).toHaveAttribute('lang',other);
  await page.locator(`.topbar [data-lang="${lang}"]`).evaluate(el=>el.click());
  await expect(page.locator('html')).toHaveAttribute('lang',lang);
});

test('entry bypasses every working route',async({page})=>{
 test.setTimeout(120000);
 const artRequests=[];
 page.on('request',request=>{if(request.url().includes('/entry-sculpture-v2-'))artRequests.push(request.url());});
 for(const route of ['home','workout','library','progress','program','nutrition','labs','tools','settings','knowledge','method','about','how','faq','contact','more']){
  await ready(page,`/index.html#${route}`);
  await expect(page.locator('#entry-screen')).toBeHidden();
 }
 expect(artRequests,'working routes must not fetch entrance artwork').toEqual([]);
});

test('entry responsive composition and reduced motion', async({page},testInfo)=>{
 test.setTimeout(120000);
 await page.emulateMedia({reducedMotion:'reduce'});
 await ready(page,'/');
 await page.locator('.entry-sculpture img').evaluate(image=>image.decode());
 for(const [width,height] of [[320,568],[360,640],[375,667],[390,844],[430,932],[768,1024],[1024,768],[1440,900],[1920,1080],[844,390]]){
  await page.setViewportSize({width,height});
  // Windows WebKit can map requested pixels through OS display scaling.
  // Calibrate against the CSS viewport so this is the requested size matrix.
  const actual = await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
  if(Math.abs(actual.width-width)>1||Math.abs(actual.height-height)>1){
   await page.setViewportSize({width:Math.round(width*width/actual.width),height:Math.round(height*height/actual.height)});
  }
  await page.evaluate(()=>document.fonts.ready);
  // WebKit acknowledges a resize before all media-query grid layout settles.
  // Retry the geometry assertions, rather than measuring the previous layout.
  await expect(async()=>{
  const result=await page.evaluate(()=>{
   const entry=document.querySelector('.entry');
   const controls=[...entry.querySelectorAll('a,button')].map(el=>{const r=el.getBoundingClientRect();return {text:el.textContent,width:r.width,height:r.height,left:r.left,right:r.right,bottom:r.bottom,fit:el.scrollWidth<=el.clientWidth+1};});
   const title=entry.querySelector('h1').getBoundingClientRect(),buttons=entry.querySelector('.entry-languages').getBoundingClientRect();
   return {overflow:document.documentElement.scrollWidth-innerWidth,controls,overlap:title.bottom>buttons.top&&title.top<buttons.bottom&&title.left<buttons.right&&title.right>buttons.left,animations:entry.getAnimations({subtree:true}).length};
  });
  expect(result.overflow).toBeLessThanOrEqual(1);
  expect(result.overlap).toBe(false);
  expect(result.animations).toBe(0);
  for(const c of result.controls){expect(c.height,c.text).toBeGreaterThanOrEqual(44);expect(c.width,c.text).toBeGreaterThanOrEqual(44);expect(c.left).toBeGreaterThanOrEqual(0);expect(c.right).toBeLessThanOrEqual(width+1);expect(c.fit,c.text).toBe(true);if(width<=430||height<=500)expect(c.bottom,c.text).toBeLessThanOrEqual(height+1);}
  }).toPass({timeout:10000});
  if(testInfo.project.name==='desktop')await page.screenshot({path:`artifacts/entry/${width}x${height}.png`,fullPage:true});
 }
});

test('entry keyboard navigation and accessibility',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await ready(page);
 await page.keyboard.press('Tab');
 await expect(page.locator('[data-entry-contact]')).toBeFocused();
 await page.keyboard.press('Tab');
 await expect(page.locator('[data-entry-lang="ru"]')).toBeFocused();
 const result=await new AxeBuilder({page}).include('#entry-screen').analyze();
 expect(result.violations.filter(v=>['serious','critical'].includes(v.impact))).toEqual([]);
 await page.keyboard.press('Tab');
 await page.keyboard.press('Enter');
 await expect(page.locator('#entry-screen')).toBeHidden();
 await expect(page.locator('html')).toHaveAttribute('lang','en');
});

test('entry keeps enlarged text and language controls inside narrow screens',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>localStorage.setItem('mmg.settings.v1',JSON.stringify({reading:'large'})));
 for(const width of [320,390]){
  await page.setViewportSize({width,height:844});
  await ready(page,'/');
  await expect(page.locator('html')).toHaveAttribute('data-reading','large');
  const audit=await page.evaluate(()=>{
   const range=document.createRange();range.selectNodeContents(document.querySelector('.entry h1'));
   const rects=[...range.getClientRects(),...[...document.querySelectorAll('.entry a,.entry button')].map(el=>el.getBoundingClientRect())];
   return {width:document.documentElement.clientWidth,edges:rects.map(r=>[r.left,r.right])};
  });
  for(const [left,right] of audit.edges){expect(left).toBeGreaterThanOrEqual(0);expect(right).toBeLessThanOrEqual(audit.width+1);}
 }
});

test('failed shell retains boot recovery instead of entry',async({page})=>{
 await page.route('**/ui.html',route=>route.abort());
 await page.goto('/index.html',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#mmg-boot')).toHaveAttribute('data-error','true');
 await expect(page.locator('#mmg-boot-retry')).toBeVisible();
 await expect(page.locator('#entry-screen')).toHaveCount(0);
 await page.unroute('**/ui.html');
 await page.locator('#mmg-boot-retry').click();
 await expect(page.locator('#entry-screen')).toBeVisible();
 await expect(page.locator('#mmg-boot')).toHaveCount(0);
});
