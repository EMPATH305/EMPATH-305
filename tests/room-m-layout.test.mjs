import test from 'node:test';
import assert from 'node:assert/strict';
import { findRoomMStarAt, layoutRoomMStars, nearestRoomMStars, visibleRoomMStars } from '../room-m-layout.mjs';

const stars = Array.from({ length:40 }, (_, index) => ({ id:`s-${index}`, brightness:1, relX:0.5, relY:0.5, x:index * 10, y:0 }));

test('Room M uses representative star limits on narrow screens', () => {
  assert.equal(visibleRoomMStars(stars, 390).length, 18);
  assert.equal(visibleRoomMStars(stars, 768).length, 32);
  assert.equal(visibleRoomMStars(stars, 1200).length, 40);
});

test('Room M hit testing and neighbor selection use laid out stars', () => {
  assert.equal(findRoomMStarAt(stars, 1, 1)?.id, 's-0');
  assert.deepEqual(nearestRoomMStars(stars, 's-0', 0, 0).map(star => star.id), ['s-1', 's-2']);
});

test('Room M layout keeps stars inside the safe stage', () => {
  const sample = [{ id:'a', brightness:1, relX:0.2, relY:0.3 }, { id:'b', brightness:1, relX:0.2, relY:0.3 }];
  layoutRoomMStars(sample, { x:10, y:20, width:200, height:100 });
  sample.forEach(star => {
    assert(star.x >= 10 && star.x <= 210);
    assert(star.y >= 20 && star.y <= 120);
  });
});
