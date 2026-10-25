import {expect} from '@playwright/test';
export async function switchLocale(page,lang,route){
 const header=page.locator('#lang-switch [data-lang="'+lang+'"]');
 if(await header.isVisible())await header.click();
 else{await page.evaluate(()=>location.hash='settings');await page.locator('#v7-language-actions [data-lang="'+lang+'"]').click();await page.evaluate(route=>location.hash=route,route);}
 await expect(page.locator('html')).toHaveAttribute('lang',lang);
 await expect(page.locator('#'+(route==='nutrition'?'food-diary':'labs'))).toHaveAttribute(route==='nutrition'?'data-food-lang':'data-lab-lang',lang);
 await expect(page.locator(route==='nutrition'?'[data-food-add]':'.lab-result-form')).toBeVisible();
 await expect(page.locator(route==='nutrition'?'[data-food-create] [type=submit]':'.lab-result-form [type=submit]')).toHaveText(route==='nutrition'?(lang==='en'?'Save food':'Сохранить продукт'):(lang==='en'?'Save':'Сохранить'));
}
