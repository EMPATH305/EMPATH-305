import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoomMStarModel, normalizeRoomMStar } from '../room-m-model.mjs';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem:key => values.get(key) ?? null,
    setItem:(key, value) => values.set(key, value),
    removeItem:key => values.delete(key)
  };
}

test('Room M normalization is deterministic and bounds visual coordinates', () => {
  const first = normalizeRoomMStar({ id:'same', text:42, brightness:-3, relX:4, relY:-2 });
  const second = normalizeRoomMStar({ id:'same', text:42, brightness:-3, relX:4, relY:-2 });
  assert.equal(first.colorIdx, second.colorIdx);
  assert.equal(first.text, '');
  assert.equal(first.brightness, 1);
  assert.equal(first.relX, 0.95);
  assert.equal(first.relY, 0.05);
});

test('Room M model owns sorting, hidden filtering, reaction updates, and cache', () => {
  const storage = memoryStorage();
  const model = createRoomMStarModel({ storage });
  model.setStars([
    { id:'dim', text:'dim', brightness:1 },
    { id:'hidden', text:'hidden', brightness:9 },
    { id:'bright', text:'a very bright memory that is long', brightness:5 }
  ], id => id === 'hidden');
  assert.deepEqual(model.getStars().map(star => star.id), ['bright', 'dim']);
  model.applyReaction('dim', { brightness:7, clicks:3 });
  assert.equal(model.getStars().find(star => star.id === 'dim').brightness, 7);
  assert.deepEqual(model.getSummary(100), { total:100, brightest:'dim' });
  model.remove('dim');
  assert.equal(JSON.parse(storage.getItem('empath_stars_cache')).length, 1);
});
