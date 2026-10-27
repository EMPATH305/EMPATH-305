'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getCollectiveMoment, isSecondSunday, messageFor } = require('../collective-calendar.js');

test('recognizes fixed collective grief dates', () => {
  assert.equal(getCollectiveMoment(new Date(2026, 11, 31), { lunar:{ month:1, day:1 } }), 'yearEnd');
  assert.equal(getCollectiveMoment(new Date(2026, 3, 4), { lunar:{ month:2, day:17 } }), 'qingming');
  assert.equal(getCollectiveMoment(new Date(2026, 7, 8), { lunar:{ month:6, day:26 } }), 'father');
});

test('recognizes relational and lunar remembrance dates', () => {
  const mothersDay = new Date(2026, 4, 10);
  assert.equal(isSecondSunday(mothersDay), true);
  assert.equal(getCollectiveMoment(mothersDay, { lunar:{ month:3, day:24 } }), 'mother');
  assert.equal(getCollectiveMoment(new Date(2026, 7, 19), { lunar:{ month:7, day:7 } }), 'love');
  assert.equal(getCollectiveMoment(new Date(2026, 7, 27), { lunar:{ month:7, day:15 } }), 'remembrance');
});

test('stays silent on ordinary days and always has fallback copy', () => {
  assert.equal(getCollectiveMoment(new Date(2026, 9, 27), { lunar:{ month:9, day:18 } }), null);
  assert.match(messageFor('yearEnd', 'unknown'), /Not everyone/);
  assert.match(messageFor('qingming', 'zh'), /很多人/);
});
