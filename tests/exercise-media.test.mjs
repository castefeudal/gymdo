import { test } from 'node:test';
import assert from 'node:assert/strict';
import { licensedVideo } from '../src/features/exercise/media-model.mjs';

const record = { author: 'Owner', license: 'CC BY 4.0', attributionUrl: 'https://example.org/credit', sources: [{ src: 'videos/own.webm', type: 'video/webm', width: 1920, height: 1080 }] };
test('media requires provenance and playable, dimensioned sources', () => {
  assert.equal(licensedVideo({ ...record, license: '' }), null);
  assert.equal(licensedVideo({ ...record, sources: {} }), null);
  assert.equal(licensedVideo({ ...record, sources: [null] }), null);
  assert.equal(licensedVideo({ ...record, sources: [{ ...record.sources[0], src: 'javascript:alert(1)' }] }), null);
  assert.equal(licensedVideo({ ...record, sources: [{ ...record.sources[0], type: 'image/gif' }] }), null);
  assert.equal(licensedVideo(record).sources[0].width, 1920);
});
