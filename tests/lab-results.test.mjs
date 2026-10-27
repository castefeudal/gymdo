import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanLabResults, labCanonicalValue, labPosition } from '../src/features/lab/results-model.mjs';
import { estimateCkdEpi2021 } from '../src/features/lab/egfr-view.mjs';
import { validateBackupField, backupEnvelopeError } from '../src/features/backup/backup-fields.mjs';
const row = { id: 'one', marker: 'testosterone', date: '2026-10-25', value: 500, unit: 'ng/dL', low: 250, high: 800 };
test('laboratory results preserve original units and classify only supplied intervals', () => {
  const result = cleanLabResults([row])[0];
  assert.equal(result.value, 500);
  assert.equal(labCanonicalValue(result), 17.35);
  assert.equal(labPosition(result), 'within');
  assert.equal(labPosition({ ...result, low: null }), 'unknown');
  assert.equal(labPosition({ ...result, value: 801 }), 'high');
  assert.equal(labCanonicalValue({ ...row, marker: 'prolactin', unit: 'ng/mL' }), null);
});
test('malformed laboratory backups fail atomically', () => {
  for (const invalid of [{ ...row, time: '24:30' }, { ...row, date: '2026-99-10' }, { ...row, date: '2026-02-30' }, { ...row, value: -1 }, { ...row, low: 900 }, { ...row, unit: 'IU/L' }]) {
    assert.equal(cleanLabResults([row, { ...invalid, id: 'two' }]), null);
    assert.equal(validateBackupField('labResults', JSON.stringify([row, { ...invalid, id: 'two' }])), null);
  }
  assert.equal(JSON.parse(validateBackupField('labResults', JSON.stringify([row])))[0].value, 500);
});
test('race-free CKD-EPI 2021 adult creatinine equation matches reference vectors and rejects unsupported inputs', () => {
  const male = estimateCkdEpi2021(1, 'mg/dL', 50, 'male');
  const female = estimateCkdEpi2021(1, 'mg/dL', 50, 'female');
  assert.ok(Math.abs(male - 91.7) < 0.1);
  assert.ok(Math.abs(female - 68.6) < 0.1);
  assert.ok(Math.abs(estimateCkdEpi2021(88.4, 'µmol/L', 50, 'male') - male) < 1e-10);
  for (const args of [[1, 'mg/dL', 17, 'male'], [1, 'mg/dL', 50, 'unknown'], [0, 'mg/dL', 50, 'male'], [1, 'mmol/L', 50, 'male']]) {
    assert.equal(estimateCkdEpi2021(...args), null);
  }
});
test('schema 12 keeps older backups readable and protects new data from old readers', () => {
  const envelope = { kind: 'mmg-backup', schemaVersion: 12, data: {} };
  assert.equal(backupEnvelopeError(envelope, 11), 'future');
  assert.equal(backupEnvelopeError({ ...envelope, schemaVersion: 11 }, 12), null);
  assert.equal(backupEnvelopeError({ ...envelope, schemaVersion: 10 }, 12), null);
  assert.equal(backupEnvelopeError(envelope, 12), null);
});
