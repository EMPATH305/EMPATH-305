'use strict';

const ALLOWED_COLLECTIONS = new Set(['emotions', 'stars', 'shards', 'sand', 'warmth']);
const ALLOWED_REASONS = new Set(['harassment', 'hate', 'personal_info', 'spam', 'self_harm', 'other']);
const ALLOWED_ACTIONS = new Set(['dismiss', 'remove']);

function cleanString(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validateReportInput(data) {
  const targetCollection = cleanString(data?.targetCollection, 32);
  const targetId = cleanString(data?.targetId, 160);
  const reason = cleanString(data?.reason, 32);
  if (!ALLOWED_COLLECTIONS.has(targetCollection) || !targetId || !ALLOWED_REASONS.has(reason)) {
    return null;
  }
  return { targetCollection, targetId, reason };
}

function validateModerationInput(data) {
  const reportId = cleanString(data?.reportId, 160);
  const action = cleanString(data?.action, 16);
  if (!reportId || !ALLOWED_ACTIONS.has(action)) return null;
  return { reportId, action };
}

function validateListReportsInput(data) {
  const requestedLimit = Number(data?.limit ?? 30);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), 50)
    : 30;
  const cursorId = cleanString(data?.cursor?.id, 160);
  const cursorCreatedAt = Number(data?.cursor?.createdAt);
  const cursor = cursorId && Number.isFinite(cursorCreatedAt) && cursorCreatedAt > 0
    ? { id:cursorId, createdAt:cursorCreatedAt }
    : null;
  return { limit, cursor };
}

function summarizeTarget(data) {
  if (!data || typeof data !== 'object') return '';
  if (typeof data.text === 'string' && data.text.trim()) return data.text.trim().slice(0, 500);
  if (typeof data.image === 'string' && data.image) return '[image-only submission]';
  return '[content unavailable]';
}

module.exports = {
  ALLOWED_COLLECTIONS,
  validateReportInput,
  validateModerationInput,
  validateListReportsInput,
  summarizeTarget
};
