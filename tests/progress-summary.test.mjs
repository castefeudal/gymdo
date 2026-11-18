import test from 'node:test';
import assert from 'node:assert/strict';
import { progressSummary, progressVerdictKey } from '../src/features/progress/summary.mjs';
import { trainingPeriods } from '../src/features/progress/progressintelligence-view.mjs';

test('training-period comparison counts each boundary once and excludes future sessions', () => {
  const history = [
    { date: '2026-11-19', sets: 100 },
    { date: '2026-11-18', sets: 5 },
    { date: '2026-10-22', sets: 3 },
    { date: '2026-10-21', sets: 7 },
    { date: '2026-09-23', sets: 100 },
  ];
  assert.deepEqual(trainingPeriods(history, '2026-11-18', row => row.sets), [
    { start: '2026-10-22', end: '2026-11-18', sessions: 2, sets: 8 },
    { start: '2026-09-24', end: '2026-10-21', sessions: 1, sets: 7 },
  ]);
});

test('Progress recommendation stays neutral without a comparable trend', () => {
  assert.equal(progressVerdictKey('fat', null, -2), 'diaryNoTrend');
  assert.equal(progressVerdictKey('fat', Number.NaN, -2), 'diaryNoTrend');
});

test('fat-loss feedback uses weight first and waist as a separate supporting signal', () => {
  assert.equal(progressVerdictKey('fat', -0.21, 0), 'diaryFatOk');
  assert.equal(progressVerdictKey('fat', -0.2, -1.01), 'diaryFatWaist');
  assert.equal(progressVerdictKey('fat', -0.2, -1), 'diaryFatFlat');
});

test('gain feedback uses the declared muscle or strength goal threshold', () => {
  assert.equal(progressVerdictKey('muscle', 0.11, null), 'diaryGainOk');
  assert.equal(progressVerdictKey('strength', 0.1, null), 'diaryGainFlat');
  assert.equal(progressVerdictKey('maintenance', 4, -4), 'diaryNeutral');
});

test('Progress summary combines recorded windows and a pure verdict key', () => {
  const entries = [
    { date: '2026-09-20', weight: 80, waist: 90 },
    { date: '2026-09-27', weight: 79.8, waist: 89.5 },
    { date: '2026-10-01', weight: 79.6, waist: 89 },
  ];
  const summary = progressSummary(entries, 'fat', Date.parse('2026-10-02T12:00:00Z'));

  assert.ok(Math.abs(summary.weightDelta7Kg + 0.4) < 1e-9);
  assert.ok(Math.abs(summary.weightDelta14Kg + 0.4) < 1e-9);
  assert.ok(Math.abs(summary.waistDelta30Cm + 1) < 1e-9);
  assert.ok(Math.abs(summary.averageWeight7Kg - 79.7) < 1e-9);
  assert.equal(summary.verdictKey, 'diaryFatOk');
});
