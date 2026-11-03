import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoomEController } from '../room-e-controller.mjs';

function createHarness() {
  const calls = [];
  const controller = createRoomEController({
    createPublicContent:async (room, payload) => calls.push({ kind:'public', room, payload }),
    sendDriftLetter:async payload => calls.push({ kind:'drift', payload }),
    receiveDriftLetter:async payload => {
      calls.push({ kind:'receive', payload });
      return { data:{ available:true, id:'letter-1', text:'hello' } };
    },
    getClientId:() => 'client-1'
  });
  return { calls, controller };
}

test('Room E begins in public text mode and rejects unknown states', () => {
  const { controller } = createHarness();
  assert.deepEqual(controller.getState(), { contentMode:'text', deliveryMode:'public' });
  assert.equal(controller.setContentMode('video'), false);
  assert.equal(controller.setDeliveryMode('broadcast'), false);
  assert.deepEqual(controller.getState(), { contentMode:'text', deliveryMode:'public' });
});

test('drawing always returns delivery to the public wall', () => {
  const { controller } = createHarness();
  assert.equal(controller.setDeliveryMode('drift'), true);
  assert.equal(controller.setContentMode('draw'), true);
  assert.deepEqual(controller.getState(), { contentMode:'draw', deliveryMode:'public' });
  assert.equal(controller.setDeliveryMode('drift'), false);
});

test('public Room E content keeps the existing room submission contract', async () => {
  const { calls, controller } = createHarness();
  await controller.submitContent({ text:'a weight' });
  assert.deepEqual(calls, [{ kind:'public', room:'e', payload:{ text:'a weight' } }]);
});

test('private letters use the anonymous client identity and stay off the public path', async () => {
  const { calls, controller } = createHarness();
  controller.setDeliveryMode('drift');
  assert.equal(await controller.submitContent({ text:'a private weight' }), 'drift');
  assert.deepEqual(calls, [{ kind:'drift', payload:{ text:'a private weight', clientId:'client-1' } }]);
});

test('received private letters unwrap callable data for the view layer', async () => {
  const { calls, controller } = createHarness();
  const result = await controller.receivePrivateLetter();
  assert.deepEqual(result, { available:true, id:'letter-1', text:'hello' });
  assert.deepEqual(calls, [{ kind:'receive', payload:{ clientId:'client-1' } }]);
});
