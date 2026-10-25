import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {switchLocale} from './locale-support.mjs';
test('laboratory measurements survive reload and support edit and history comparison', async ({ page }) => {
  await page.goto('/index.html#labs');
  await expect(page.locator('#mmg-boot')).toHaveCount(0);
  const form = page.locator('.lab-result-form');
  await expect(form).toBeVisible();
  await form.locator('[name=value]').fill('20');
  await form.locator('[name=low]').fill('10');
  await form.locator('[name=high]').fill('30');
  await form.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.locator('.lab-result-entry')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.lab-result-entry')).toContainText('20');
  await page.getByRole('button', { name: 'Изменить', exact: true }).click();
  await form.locator('[name=value]').fill('22');
  await form.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.locator('.lab-result-entry')).toHaveCount(1);
  await expect(page.locator('.lab-result-value')).toContainText('22');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.evaluate(() => { location.hash = 'tools'; });
  await expect(page.locator('[data-lab-form]').first()).toBeVisible();
  await page.evaluate(() => { location.hash = 'labs'; });
  await expect(form).toBeVisible();
  await page.goto('/index.html#settings');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await page.locator('#data-export').click();
  const raw = await page.locator('#data-io').inputValue();
  expect(JSON.parse(JSON.parse(raw).data.labResults)).toHaveLength(1);
  const restored = await page.context().browser().newPage();
  try {
    await restored.goto(new URL('/index.html#settings', page.url()).href);
    await expect(restored.locator('#mmg-boot')).toHaveCount(0);
    restored.once('dialog', dialog => dialog.accept());
    const choosing = restored.waitForEvent('filechooser');
    await restored.locator('#data-import').click();
    const chooser = await choosing;
    const navigation = restored.waitForNavigation();
    await chooser.setFiles({ name: 'laboratory-backup.json', mimeType: 'application/json', buffer: Buffer.from(raw) });
    await navigation;
    await restored.evaluate(() => { location.hash = 'labs'; });
    await expect(restored.locator('.lab-result-value')).toContainText('22');
  } finally { await restored.close(); }
});

test('a failed laboratory write retains input and does not claim durable success', async ({ page }) => {
  await page.goto('/index.html#labs', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#mmg-boot')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-storage-ready', 'true');
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (record, ...args) {
      if (record?.key === 'mmg.labResults.v1') throw new DOMException('Injected quota failure', 'QuotaExceededError');
      return put.call(this, record, ...args);
    };
    window.restoreLaboratoryWrite = () => { IDBObjectStore.prototype.put = put; };
  });
  const form = page.locator('.lab-result-form');
  await form.locator('[name=value]').fill('20');
  await form.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.locator('[data-lab-result-status]')).toContainText('Не удалось сохранить');
  await expect(page.locator('.lab-result-entry')).toHaveCount(0);
  await expect(form.locator('[name=value]')).toHaveValue('20');
  await switchLocale(page,'en','labs');await expect(form.locator('[name=value]')).toHaveValue('20');await expect(page.locator('.lab-result-entry')).toHaveCount(0);
  await switchLocale(page,'ru','labs');
  await page.evaluate(() => window.restoreLaboratoryWrite());
  await form.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.locator('.lab-result-entry')).toHaveCount(1);
});

test('laboratory language changes retain assay inputs, units and the edited record identity',async({page})=>{
 await page.goto('/index.html#labs');const form=page.locator('.lab-result-form');await expect(form).toBeVisible();
 await form.locator('[name=marker]').selectOption('albumin');await form.locator('[name=unit]').selectOption('g/dL');
 for(const[key,value]of Object.entries({value:'4.3',date:'2026-10-20',low:'3.5',high:'5',laboratory:'Original Lab',method:'Assay A'}))await form.locator(`[name="${key}"]`).fill(value);
 await switchLocale(page,'en','labs');await expect(form.locator('[name=unit]')).toHaveValue('g/dL');await expect(form.locator('[name=value]')).toHaveValue('4.3');await expect(form.locator('[name=date]')).toHaveValue('2026-10-20');
 await form.locator('[type=submit]').click();await expect(page.locator('.lab-result-entry')).toHaveCount(1);
 await switchLocale(page,'ru','labs');await form.locator('[name=value]').fill('4.5');await form.locator('[type=submit]').click();await expect(page.locator('.lab-result-entry')).toHaveCount(1);await expect(page.locator('.lab-result-value')).toContainText('4.5');
});
