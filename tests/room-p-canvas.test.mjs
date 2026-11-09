import test from 'node:test';
import assert from 'node:assert/strict';
import { getRoomPCanvasMetrics, getRoomPGoldVeinCount } from '../room-p-canvas.mjs';

test('Room P canvas keeps a usable size and caps backing density on mobile', () => {
  const canvas = { getBoundingClientRect:() => ({ width:360 }) };
  assert.deepEqual(getRoomPCanvasMetrics(canvas, 3), {
    cssWidth:360, cssHeight:380, dpr:2, width:720, height:760
  });
  assert.equal(getRoomPCanvasMetrics({ getBoundingClientRect:() => ({ width:0 }), offsetWidth:0 }, 1).cssWidth, 540);
});

test('Room P gold vein count is bounded by healing progress', () => {
  assert.equal(getRoomPGoldVeinCount(-1), 0);
  assert.equal(getRoomPGoldVeinCount(0.5), 3);
  assert.equal(getRoomPGoldVeinCount(5), 6);
});
