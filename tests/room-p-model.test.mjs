import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoomPShardModel, getRoomPHealingProgress } from '../room-p-model.mjs';

test('Room P healing progress includes the established community baseline', () => {
  assert.deepEqual(getRoomPHealingProgress(0, 0), {
    total:0, healed:0, ratio:142 / 300, percent:47.3, label:'47.3%'
  });
  assert.equal(getRoomPHealingProgress(10, 99, { includeBaseline:false }).label, '100.0%');
});

test('Room P model owns filtering, healing and durable total reconciliation', () => {
  const model = createRoomPShardModel();
  model.setRecords([
    { id:'open', data:{ text:'裂痕', healed:false } },
    { id:'healed', data:{ text:'光', healed:true } },
    { id:'hidden', data:{ text:'hidden' } }
  ], id => id === 'hidden');
  assert.deepEqual(model.getRecords().map(record => record.id), ['open', 'healed']);
  assert.equal(model.getSummary().healed, 1);
  model.setTotals({ total:50, healed:20 });
  model.markHealed('open', true);
  assert.deepEqual(model.getSummary(), {
    total:50, healed:21, dataReady:true, ratio:163 / 350, percent:46.6, label:'46.6%'
  });
  model.remove('open');
  assert.deepEqual(model.getRecords().map(record => record.id), ['healed']);
});
