'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createAdminAccess } = require('../lib/admin-access');
class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
function fixture({ failure, claims = { reviewer:true } } = {}) {
  const calls = [], logs = [];
  const handler = createAdminAccess({
    HttpsError, ADMIN_EMAIL:{ value:() => ' Admin@example.test ' },
    logger:{ warn:(...args) => logs.push(['warn', ...args]), info:(...args) => logs.push(['info', ...args]) },
    auth:{
      async getUser(uid) { calls.push(['get', uid]); if (failure === 'get') throw new Error('get failed'); return { customClaims:claims }; },
      async setCustomUserClaims(uid, value) { if (failure === 'set') throw new Error('set failed'); calls.push(['set', uid, value]); }
    }
  });
  return { ...handler, calls, logs };
}
const authenticated = (email = 'ADMIN@example.test', verified = true) => ({ auth:{ uid:'admin-1', token:{ email, email_verified:verified } } });
test('admin claim requires authentication and verified allowlisted email', async () => {
  const f = fixture();
  await assert.rejects(f.claimAdminRole({}), { code:'unauthenticated' });
  for (const request of [authenticated('', true), authenticated('other@example.test'), authenticated('admin@example.test', false)]) {
    await assert.rejects(f.claimAdminRole(request), { code:'permission-denied' });
  }
  assert.deepEqual(f.calls, []);
  assert.equal(f.logs.length, 3);
  assert(f.logs.every(entry => entry[0] === 'warn'));
});
test('admin claim normalizes email and preserves unrelated claims', async () => {
  const f = fixture();
  assert.deepEqual(await f.claimAdminRole(authenticated()), { granted:true });
  assert.deepEqual(f.calls, [['get', 'admin-1'], ['set', 'admin-1', { reviewer:true, admin:true }]]);
  assert.deepEqual(f.logs, [['info', 'Granted EMPATH admin claim', { uid:'admin-1' }]]);
});
test('admin claim supports users without existing custom claims', async () => {
  const f = fixture({ claims:null });
  await f.claimAdminRole(authenticated());
  assert.deepEqual(f.calls[1][2], { admin:true });
});
test('admin auth failures propagate without success logs', async () => {
  for (const failure of ['get', 'set']) {
    const f = fixture({ failure });
    await assert.rejects(f.claimAdminRole(authenticated()), new RegExp(failure + ' failed'));
    assert.deepEqual(f.logs, []);
    assert(!f.calls.some(call => call[0] === 'set'));
  }
});
