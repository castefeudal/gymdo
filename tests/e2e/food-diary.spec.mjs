import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {switchLocale} from './locale-support.mjs';
test('food catalog, servings, recipe, edit, history and analytics survive reload',async({page})=>{
 await page.goto('/index.html#nutrition');await expect(page.locator('#mmg-boot')).toHaveCount(0);
 const root=page.locator('#food-diary');await expect(root.locator('[data-food-create]')).toHaveCount(1);
 await expect(root.locator('[data-food-product]')).toHaveAttribute('open','');
 await expect(root.locator('[data-food-add] [type=submit]')).toBeDisabled();
 const create=root.locator('[data-food-create]');
 for(const [name,value] of Object.entries({name:'Test label oats',calories:'370',protein:'13',fat:'7',carbs:'60',portion:'50',source:'User-entered test label'}))await create.locator(`[name="${name}"]`).fill(value);
 await create.locator('[type=submit]').click();await expect(root.locator('[data-food-status]')).toContainText('Сохранено');
 await root.locator('[data-food-select]').click();const add=root.locator('[data-food-add]');
 await expect(add.locator('[name=amount]')).toHaveValue('1');await expect(root.locator('[data-food-preview]')).toContainText('185');
 await add.locator('[type=submit]').click();await expect(root.locator('.food-entry')).toHaveCount(1);
 await page.reload();await expect(root.locator('.food-entry')).toHaveCount(1);
 await root.locator('[data-entry-edit]').click();await add.locator('[name=amount]').fill('100');await add.locator('[type=submit]').click();await expect(root.locator('.food-entry')).toHaveCount(1);await expect(root.locator('.food-entry')).toContainText('370');
 page.once('dialog',dialog=>dialog.accept('Saved breakfast'));await root.locator('[data-food-recipe]').click();await expect(root.locator('[data-food-add] [name=food] option')).toHaveCount(2);
 page.once('dialog',dialog=>dialog.accept());await root.locator('[data-food-publish]').click();await expect(root.locator('[data-food-status]')).toContainText('аналитике');await expect(page.locator('#nutrition-log-list')).toContainText('370');
 await root.locator('[name=period]').selectOption('month');await expect(root.locator('[data-food-summary]')).toContainText('370');
 const scan=await new AxeBuilder({page}).include('#food-diary').analyze();expect(scan.violations).toEqual([]);
 await expect.poll(()=>page.evaluate(()=>document.fonts.check('16px Inter'))).toBe(true);
 await page.goto('/index.html#settings');await expect(page.locator('#mmg-boot')).toHaveCount(0);await page.locator('#data-export').click();
 const raw=await page.locator('#data-io').inputValue(),backup=JSON.parse(raw);expect(backup.schemaVersion).toBe(12);expect(JSON.parse(backup.data.foodDiary).entries).toHaveLength(1);
 const restored=await page.context().browser().newPage();
 try{
  await restored.goto(new URL('/index.html#settings',page.url()).href);await expect(restored.locator('#mmg-boot')).toHaveCount(0);
  restored.once('dialog',dialog=>dialog.accept());const choosing=restored.waitForEvent('filechooser');await restored.locator('#data-import').click();const chooser=await choosing;await chooser.setFiles({name:'food-backup.json',mimeType:'application/json',buffer:Buffer.from(raw)});await expect(restored.locator('#toast')).toContainText(/Восстановлено разделов|Sections restored/);
  await restored.evaluate(()=>location.hash='nutrition');await expect(restored.locator('#food-diary .food-entry')).toHaveCount(1);await expect(restored.locator('#food-diary .food-entry')).toContainText('370');
 }finally{await restored.close();}
});

test('language changes preserve food drafts and keep a single active catalog handler',async({page})=>{
 await page.goto('/index.html#nutrition');const root=page.locator('#food-diary');await expect(root.locator('[data-food-product]')).toHaveAttribute('open','');
 const form=root.locator('[data-food-create]');
 const fill=async name=>{for(const [key,value]of Object.entries({name,calories:'370',protein:'13',fat:'7',carbs:'60',portion:'50',source:'Original label'}))await form.locator(`[name="${key}"]`).fill(value);};
 await fill('Locale oats');await switchLocale(page,'en','nutrition');await expect(form.locator('[name=name]')).toHaveValue('Locale oats');await expect(form.locator('[name=source]')).toHaveValue('Original label');
 await form.locator('[type=submit]').click();await expect(root.locator('.food-item')).toHaveCount(1);await root.locator('[data-food-product] summary').click();
 await fill('Locale rice');await form.locator('[type=submit]').click();await expect(root.locator('.food-item')).toHaveCount(2);
 await switchLocale(page,'ru','nutrition');await switchLocale(page,'en','nutrition');
 await root.locator('[data-food-favorite]').first().click();await expect(root.locator('[data-food-favorite]').first()).toHaveAttribute('aria-pressed','true');
 let dialogs=0;page.on('dialog',async dialog=>{dialogs++;await dialog.accept();});
 await root.locator('[data-food-remove]').last().click();await expect(root.locator('.food-item')).toHaveCount(1);expect(dialogs).toBe(1);
 await page.reload();await expect(root.locator('.food-item')).toHaveCount(1);await expect(root.locator('.food-item')).toContainText('Locale oats');
});
