import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoomEFeedModel, isRoomEImage } from '../room-e-feed.mjs';

const records = Array.from({ length:8 }, (_, index) => ({ id:`emotion-${index + 1}`, data:{ text:`weight ${index + 1}` } }));

test('Room E feed begins with three records and expands in bounded pages', () => {
  const model = createRoomEFeedModel({ pageSize:3 });
  model.setRecords(records);
  assert.deepEqual(model.getState().visibleRecords.map(record => record.id), ['emotion-1', 'emotion-2', 'emotion-3']);
  assert.equal(model.getState().canExpand, true);

  model.toggle();
  assert.equal(model.getState().visibleRecords.length, 6);
  model.toggle();
  assert.equal(model.getState().visibleRecords.length, 8);
  assert.equal(model.getState().canExpand, false);

  model.toggle();
  assert.equal(model.getState().visibleRecords.length, 3);
  assert.equal(model.getState().expanded, false);
});

test('Room E feed removes hidden content without mutating the caller list', () => {
  const source = records.slice(0, 4);
  const model = createRoomEFeedModel();
  model.setRecords(source);
  model.removeRecord('emotion-2');
  assert.equal(source.length, 4);
  assert.deepEqual(model.getState().visibleRecords.map(record => record.id), ['emotion-1', 'emotion-3', 'emotion-4']);
});

test('Room E image records accept only supported inline image formats', () => {
  assert.equal(isRoomEImage('data:image/webp;base64,AAAA'), true);
  assert.equal(isRoomEImage('data:image/png;base64,AAAA'), true);
  assert.equal(isRoomEImage('data:image/svg+xml;base64,AAAA'), false);
  assert.equal(isRoomEImage('javascript:alert(1)'), false);
});
