'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateRoomSubmissionInput,
  validateReportInput,
  validateModerationInput,
  validateListReportsInput,
  summarizeTarget
} = require('../lib/validation');

test('accepts only bounded room submissions with server-owned fields', () => {
  assert.deepEqual(validateRoomSubmissionInput({ room:'m', text:'  miss you  ', brightness:99 }), {
    room:'m', text:'miss you'
  });
  assert.deepEqual(validateRoomSubmissionInput({ room:'a', text:'let go', lifespan:3_600_000 }), {
    room:'a', text:'let go', lifespan:3_600_000
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
