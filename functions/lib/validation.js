'use strict';

const ALLOWED_COLLECTIONS = new Set(['emotions', 'stars', 'shards', 'sand', 'warmth', 'drift_letters']);
const ALLOWED_REASONS = new Set(['harassment', 'hate', 'personal_info', 'spam', 'self_harm', 'other']);
const ALLOWED_ACTIONS = new Set(['dismiss', 'remove']);
const ALLOWED_ROOMS = new Set(['e', 'm', 'p', 'a', 't']);
const ALLOWED_LIFESPANS = new Set([60_000, 3_600_000, 86_400_000]);

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

function validateRoomSubmissionInput(data) {
  const room = cleanString(data?.room, 1).toLowerCase();
  if (!ALLOWED_ROOMS.has(room)) return null;

  if (room === 'e' && typeof data?.image === 'string') {
    const image = data.image.trim();
    if (!/^data:image\/(?:webp|png|jpeg);base64,[a-z0-9+/=]+$/i.test(image)) return null;
    if (image.length === 0 || image.length > 700_000) return null;
    return { room, image };
  }

  if (typeof data?.text !== 'string') return null;
  const text = data.text.trim();
  if (!text || text.length > 500) return null;

  if (room === 'a') {
    const lifespan = Number(data.lifespan);
    if (!Number.isInteger(lifespan) || !ALLOWED_LIFESPANS.has(lifespan)) return null;
    return { room, text, lifespan };
  }
  return { room, text };
}

function validateDriftClientId(value) {
  const clientId = cleanString(value, 32).toLowerCase();
  return /^[a-f0-9]{32}$/.test(clientId) ? clientId : '';
}

function validateDriftLetterInput(data) {
  const clientId = validateDriftClientId(data?.clientId);
  if (!clientId || typeof data?.text !== 'string') return null;
  const text = data.text.trim();
  if (!text || text.length > 500) return null;
  return { clientId, text };
}

function validateDriftReceiveInput(data) {
  const clientId = validateDriftClientId(data?.clientId);
  return clientId ? { clientId } : null;
}

function containsCrisisSignal(text) {
  return /(想死|不想活|活不下去|結束生命|自殺|傷害自己|不想存在|死にたい|自殺|want\s+to\s+die|kill\s+myself|end\s+my\s+life|hurt\s+myself|suicid)/i.test(String(text || ''));
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
  validateRoomSubmissionInput,
  validateDriftLetterInput,
  validateDriftReceiveInput,
  containsCrisisSignal,
  validateReportInput,
  validateModerationInput,
  validateListReportsInput,
  summarizeTarget
};
