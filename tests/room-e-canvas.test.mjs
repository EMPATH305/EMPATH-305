import test from 'node:test';
import assert from 'node:assert/strict';
import { roomECanvasMetrics, roomECanvasPoint } from '../room-e-canvas.mjs';

test('Room E canvas keeps a usable CSS size and caps high-density backing pixels', () => {
  assert.deepEqual(roomECanvasMetrics(240, 250, 3), {
    cssWidth:280,
    cssHeight:220,
    dpr:2,
    width:560,
    height:440
  });
  assert.deepEqual(roomECanvasMetrics(390.4, 0, 1), {
    cssWidth:390,
    cssHeight:220,
    dpr:1,
    width:390,
    height:220
  });
});

test('Room E pointer coordinates follow the rendered canvas scale', () => {
  const metrics = roomECanvasMetrics(300, 0, 2);
  assert.deepEqual(roomECanvasPoint(
    { clientX:160, clientY:120 },
    { left:10, top:10, width:300, height:220 },
    metrics
  ), { x:150, y:110 });
});
