import { chromium, firefox, webkit, expect } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const base=process.env.MMG_LIVE_URL||'https://castefeudal.github.io/gymdo/';
const expected=process.env.MMG_LIVE_COMMIT;
const version='2026.10-r75-premium-fitness';
const release=await (await fetch(new URL('release.json?verify='+Date.now(),base),{cache:'no-store'})).json();
if(expected&&release.commit!==expected)throw Error(`Release mismatch: ${release.commit} != ${expected}`);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const runtime=JSON.parse(await readFile('assets/runtime-manifest.json','utf8'));
const paths=['index.html','ui.html','app.css','bootstrap.js','sw.js','src/app/entry.mjs','data/exercise-catalog.json','data/exercise-details.json','data/content.json','data/exercise-media.json','assets/fonts/inter-latin.woff2','assets/fonts/inter-cyrillic.woff2',...runtime.map(path=>path.replace(/^\.\//,''))];
for(let index=0;index<paths.length;index+=4)await Promise.all(paths.slice(index,index+4).map(async path=>{
 if(!/^[a-zA-Z0-9_./-]+$/.test(path)||path.split('/').includes('..'))throw Error('Invalid artifact path');
 const source=execFileSync('git',['show','HEAD:'+path],{maxBuffer:10*1024*1024});
 const response=await fetch(new URL(path,base),{cache:'no-store'});
 if(!response.ok||digest(Buffer.from(await response.arrayBuffer()))!==digest(source))throw Error('Published bytes differ: '+path);
}));
console.log(`${paths.length} published artifacts match Git blobs; release ${release.commit}`);
const routes=['home','library','workout','program','nutrition','progress','labs','tools','knowledge','method','about','how','faq','contact','more','settings'];
const configurations=[['chromium',chromium,1440],['mobile',chromium,390],['firefox',firefox,1440],['webkit',webkit,1440],['webkit-mobile',webkit,390]];
const results=[];
for(const [name,engine,width] of configurations){
 const browser=await engine.launch();
 try{
  for(const theme of ['obsidian','soft','ivory'])for(const lang of ['ru','en']){
   const context=await browser.newContext({viewport:{width,height:width<768?844:900},reducedMotion:'reduce'});
   try{
    await context.addInitScript(({theme,lang})=>{localStorage.setItem('mmg.theme.v2',theme);localStorage.setItem('mmg.lang.v2',lang);},{theme,lang});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(new URL('index.html?lang='+lang+'#home',base).href);
    await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
    await expect(page.locator('#mmg-boot')).toHaveCount(0);
    expect(await page.evaluate(()=>window.mmgDiagnostics.version)).toBe(version);
    await page.evaluate(()=>document.fonts.ready);
    for(const route of routes){
     await page.evaluate(route=>location.hash=route,route);
     await expect(page.locator('html')).toHaveAttribute('data-route-ready',route);
     if(route==='nutrition')await expect(page.locator('[data-food-add]')).toBeVisible();
     if(route==='labs')await expect(page.locator('.lab-result-form')).toBeVisible();
     if(route==='tools')await expect(page.locator('[data-lab-form]').first()).toBeVisible();
     if(route==='library')await expect(page.locator('#grid .card').first()).toBeVisible();
     if(route==='method')await expect(page.locator('#method-nav [role=tab]').first()).toBeVisible();
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
     expect(overflow,`${name}/${theme}/${lang}/${route}`).toBeLessThanOrEqual(1);
     results.push({name,theme,lang,route,width,overflow});
    }
    await page.locator('#data-export').click();
    const backup=JSON.parse(await page.locator('#data-io').inputValue());
    expect(backup.schemaVersion).toBe(12);
    expect(JSON.parse(backup.data.foodDiary).entries).toEqual([]);
    expect(JSON.parse(backup.data.labResults)).toEqual([]);
    await page.evaluate(()=>location.hash='library');
    await expect(page.locator('html')).toHaveAttribute('data-route-ready','library');
    await expect(page.locator('#grid .card').first()).toBeVisible();
    await page.locator('#search').fill('0025');
    try { await page.locator('#grid [data-open="0025"]').click(); }
    catch(error){
     await mkdir('artifacts/live-r75-failure',{recursive:true});
     const state=await page.evaluate(()=>({url:location.href,route:document.documentElement.dataset.routeReady,query:document.querySelector('#search')?.value,count:document.querySelector('#results-count')?.textContent,active:document.activeElement?.id}));
     await page.screenshot({path:'artifacts/live-r75-failure/search.png'});
     await writeFile('artifacts/live-r75-failure/search.json',JSON.stringify({name,theme,lang,state,error:String(error)},null,2));
     throw error;
    }
    await expect(page.locator('#modal-scroll')).toBeVisible();
    await expect(page.locator('#modal')).toHaveAttribute('aria-busy','false');
    await page.locator('#modal-close').click();
    if(name==='chromium'&&theme==='obsidian'&&lang==='ru'){
     await page.evaluate(()=>location.hash='labs');await page.locator('.lab-import summary').click();
     const bytes=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=1500;canvas.height=220;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1500,220);ctx.fillStyle='black';ctx.font='48px Arial';ctx.fillText('Total testosterone 13.1 nmol/L',40,110);return canvas.toDataURL('image/png').split(',')[1];});
     await page.locator('[data-report-ocr]').check();
     await page.locator('[data-report-file]').setInputFiles({name:'synthetic-local-scan.png',mimeType:'image/png',buffer:Buffer.from(bytes,'base64')});
     await page.locator('[data-report-read]').click();
     await expect(page.locator('[data-report-text]')).toHaveValue(/testosterone.*13[.,]1/i,{timeout:120000});
     await expect(page.locator('[data-report-use]')).toHaveCount(1);
     await page.evaluate(()=>navigator.serviceWorker.ready);
     await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
     await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
     await expect(page.locator('html')).toHaveAttribute('data-app-ready','true');
     await expect(page.locator('.lab-result-form')).toBeVisible();
     await context.setOffline(false);
    }
    expect(errors,`${name}/${theme}/${lang}: runtime errors`).toEqual([]);
    console.log(`${name} ${theme} ${lang}: ${routes.length} routes, backup and exercise instructions passed`);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
await mkdir('artifacts/live-r75',{recursive:true});
await writeFile('artifacts/live-r75/results.json',JSON.stringify({base,release,version,artifactMatches:paths.length,checks:results.length,results},null,2)+'\n');
console.log(`Live proof passed: ${results.length} route/theme/language/viewport combinations, real OCR and installed offline boot.`);
