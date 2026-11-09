import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoomTFeedModel } from '../room-t-feed.mjs';

const records = count => Array.from({ length:count }, (_, i) => ({ id:String(i), data:{ text:`Message ${i}` } }));

test('collapse uses visible records even when most snapshot records are hidden', () => {
  const model = createRoomTFeedModel({ isHidden:id => Number(id) >= 8 });
  model.setRecords(records(30));
  assert.equal(model.getPage().count, 6);
  assert.equal(model.togglePage().count, 8);
  assert.equal(model.getPage().hasMore, false);
  assert.equal(model.togglePage().count, 6);
});

test('newly hidden records immediately affect both rendering and the next action', () => {
  const hidden = new Set();
  const model = createRoomTFeedModel({ isHidden:id => hidden.has(id) });
  model.setRecords(records(20));
  model.togglePage();
  for (let i = 8; i < 20; i++) hidden.add(String(i));
  assert.equal(model.getPage().total, 8);
  assert.equal(model.getPage().count, 8);
  assert.equal(model.togglePage().count, 6);
  assert(model.getPage().records.every(record => !hidden.has(record.id)));
});

test('snapshot refresh preserves expansion and removal does not restore hidden content', () => {
  const model = createRoomTFeedModel();
  model.setRecords(records(20));
  model.togglePage();
  model.setRecords(records(21));
  assert.equal(model.getPage().count, 12);
  model.remove('0');
  assert.equal(model.getPage().total, 20);
  assert(!model.getPage().records.some(record => record.id === '0'));
  model.setRecords([]);
  model.setRecords(records(20));
  assert.equal(model.getPage().count, 6);
});
