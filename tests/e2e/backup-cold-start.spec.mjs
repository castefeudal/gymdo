import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

const backup = {
  app: 'markov-made-gym', schemaVersion: 10, kind: 'mmg-backup',
  data: {
    exercisePreferences: JSON.stringify({ '0025': 'discomfort' }),
    fav: JSON.stringify(['0025']),
    workout: JSON.stringify([{ id: '0025', sets: 2, reps: '10', weight: '60' }]),
  },
};

async function chooseBackup(page) {
  const choosing = page.waitForEvent('filechooser');
  await page.locator('#data-import').click();
  const chooser = await choosing;
  await chooser.setFiles({ name: 'cold-start.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
}

async function exportedState(page) {
  await page.locator('#data-export').click();
  const { data } = JSON.parse(await page.locator('#data-io').inputValue());
  return { workout: JSON.parse(data.workout || '[]'), exercisePreferences: JSON.parse(data.exercisePreferences || '{}'), favorites: JSON.parse(data.fav || '[]') };
}

test.beforeEach(async ({ page }) => {
  // Reproduce import before the optional idle catalog preload has run.
  await page.addInitScript(() => { window.requestIdleCallback = () => 0; });
});

test('a backup restores exercise references when Settings starts without the catalog', async ({ page }) => {
  await page.goto('/index.html#settings');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  expect(await page.evaluate(() => window.mmgDiagnostics.exerciseCount)).toBe(0);
  page.once('dialog', dialog => dialog.accept());
  const navigation = page.waitForNavigation();
  await chooseBackup(page);
  await navigation;
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect.poll(() => page.evaluate(() => window.mmgDiagnostics.exerciseCount)).toBe(1324);
  const restored = await exportedState(page);
  expect(restored.workout[0].id).toBe('0025');
  expect(restored.exercisePreferences['0025']).toBe('discomfort');
  expect(restored.favorites).toContain('0025');
});

test('a catalog error refuses import and keeps current data intact', async ({ page }) => {
  await page.goto('/index.html#settings');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  const previous = await exportedState(page);
  await page.route('**/data/exercise-catalog.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await chooseBackup(page);
  await expect(page.locator('#toast')).toContainText('Импорт не применён');
  const after = await exportedState(page);
  expect(after.workout).toEqual(previous.workout);
  expect(after.exercisePreferences).toEqual(previous.exercisePreferences);
  expect(after.favorites).toEqual(previous.favorites);
});

test('a failed rollback snapshot cancels import without changing stored data', async ({ page }) => {
  await page.goto('/index.html#settings');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  const previous = await exportedState(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'mmg.backup.rollback.v1') throw new DOMException('Quota exceeded', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  page.once('dialog', dialog => dialog.accept());
  await chooseBackup(page);
  await expect(page.locator('#toast')).toContainText('Импорт отменён');
  expect(await exportedState(page)).toEqual(previous);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  expect(await exportedState(page)).toEqual(previous);
});

test('an interrupted cross-store import is rolled back before startup reads user state', async ({ page }) => {
  await page.goto('/index.html#settings');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await page.locator('#data-export').click();
  const before = JSON.parse(await page.locator('#data-io').inputValue());
  const originalWorkout = before.data.workout;
  const interruptedWorkout = JSON.stringify([{ id: '0002', sets: 4, reps: '6', weight: '80' }]);
  await page.evaluate(async ({ originalWorkout, interruptedWorkout, before }) => {
    localStorage.setItem('mmg.backup.import-journal.v1', JSON.stringify({ version: 1, phase: 'prepared', before, touched: ['workout'], startedAt: Date.now() }));
    localStorage.setItem('mmg.workout.v2', interruptedWorkout);
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('markov-made-gym');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise((resolve, reject) => {
      const tx = db.transaction('userState', 'readwrite');
      tx.objectStore('userState').put({ key: 'mmg.workout.v2', value: interruptedWorkout });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  }, { originalWorkout, interruptedWorkout, before });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await page.locator('#data-export').click();
  const restored = JSON.parse(await page.locator('#data-io').inputValue());
  expect(restored.data.workout ?? null).toBe(originalWorkout ?? null);
  expect(await page.evaluate(() => localStorage.getItem('mmg.backup.import-journal.v1'))).toBeNull();
  const indexedValue = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('markov-made-gym');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const value = await new Promise((resolve, reject) => {
      const request = db.transaction('userState', 'readonly').objectStore('userState').get('mmg.workout.v2');
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return value;
  });
  expect(indexedValue).toBe(originalWorkout ?? null);
});
