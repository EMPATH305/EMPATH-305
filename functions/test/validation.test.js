'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateRoomSubmissionInput,
  validateDriftLetterInput,
  validateDriftReceiveInput,
  containsCrisisSignal,
  validateReportInput,
  validateModerationInput,
  validateListReportsInput,
  summarizeTarget
} = require('../lib/validation');

test('accepts only bounded room submissions with server-owned fields', () => {
  assert.deepEqual(validateRoomSubmissionInput({ room:'m', text:'  miss you  ', brightness:99 }), {
    room:'m', text:'miss you'
  });
  assert.deepEqual(validateRoomSubmissionInput({ room:'a', text:'let go', lifespan:3_600_000, weightKind:'loss' }), {
    room:'a', text:'let go', lifespan:3_600_000, weightKind:'loss'
  });
  assert.deepEqual(validateRoomSubmissionInput({ room:'a', text:'unnamed', lifespan:60_000, weightKind:'too-specific' }), {
    room:'a', text:'unnamed', lifespan:60_000, weightKind:'unnamed'
  });
  assert.deepEqual(validateRoomSubmissionInput({ room:'e', image:'data:image/webp;base64,AAAA' }), {
    room:'e', image:'data:image/webp;base64,AAAA'
  });
  assert.equal(validateRoomSubmissionInput({ room:'unknown', text:'hello' }), null);
  assert.equal(validateRoomSubmissionInput({ room:'t', text:'' }), null);
  assert.equal(validateRoomSubmissionInput({ room:'p', text:'x'.repeat(501) }), null);
  assert.equal(validateRoomSubmissionInput({ room:'a', text:'hello', lifespan:1234 }), null);
  assert.equal(validateRoomSubmissionInput({ room:'e', image:'javascript:alert(1)' }), null);
  assert.equal(validateRoomSubmissionInput({ room:'e', image:`data:image/webp;base64,${'A'.repeat(700_000)}` }), null);
});

test('accepts anonymous drift letters only with a bounded device identifier', () => {
  const clientId = 'a'.repeat(32);
  assert.deepEqual(validateDriftLetterInput({ clientId, text:'  a letter for someone  ' }), {
    clientId,
    text:'a letter for someone'
  });
  assert.deepEqual(validateDriftReceiveInput({ clientId }), { clientId });
  assert.equal(validateDriftLetterInput({ clientId:'short', text:'hello' }), null);
  assert.equal(validateDriftLetterInput({ clientId, text:'x'.repeat(501) }), null);
  assert.equal(validateDriftReceiveInput({ clientId:'not-a-client-id' }), null);
  assert.equal(containsCrisisSignal('I want to kill myself tonight'), true);
  assert.equal(containsCrisisSignal('I hope tomorrow feels lighter'), false);
});

test('accepts only known report targets and reasons', () => {
  assert.deepEqual(validateReportInput({ targetCollection:'warmth', targetId:'abc', reason:'spam' }), {
    targetCollection:'warmth', targetId:'abc', reason:'spam'
  });
  assert.equal(validateReportInput({ targetCollection:'private', targetId:'abc', reason:'spam' }), null);
  assert.equal(validateReportInput({ targetCollection:'warmth', targetId:'', reason:'spam' }), null);
  assert.equal(validateReportInput({ targetCollection:'warmth', targetId:'abc', reason:'invented' }), null);
});

test('accepts only explicit moderation actions', () => {
  assert.deepEqual(validateModerationInput({ reportId:'report-1', action:'remove' }), {
    reportId:'report-1', action:'remove'
  });
  assert.equal(validateModerationInput({ reportId:'report-1', action:'delete-everything' }), null);
});

test('never returns a full image payload as a moderation preview', () => {
  assert.equal(summarizeTarget({ image:'data:image/png;base64,large' }), '[image-only submission]');
  assert.equal(summarizeTarget({ text:'  a difficult day  ' }), 'a difficult day');
  assert.equal(summarizeTarget({ text:'x'.repeat(900) }).length, 500);
});

test('normalizes report pagination without trusting arbitrary cursors', () => {
  assert.deepEqual(validateListReportsInput({ limit:500 }), { limit:50, cursor:null });
  assert.deepEqual(validateListReportsInput({ limit:0 }), { limit:1, cursor:null });
  assert.deepEqual(validateListReportsInput({
    limit:20,
    cursor:{ id:'report-20', createdAt:1_800_000_000_000 }
  }), {
    limit:20,
    cursor:{ id:'report-20', createdAt:1_800_000_000_000 }
  });
  assert.equal(validateListReportsInput({ cursor:{ id:'', createdAt:'later' } }).cursor, null);
});
