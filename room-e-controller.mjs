const CONTENT_MODES = new Set(['text', 'draw']);
const DELIVERY_MODES = new Set(['public', 'drift']);

export function createRoomEController({
  createPublicContent,
  sendDriftLetter,
  receiveDriftLetter,
  getClientId
}) {
  for (const dependency of [createPublicContent, sendDriftLetter, receiveDriftLetter, getClientId]) {
    if (typeof dependency !== 'function') throw new TypeError('Room E controller requires callable dependencies.');
  }

  let contentMode = 'text';
  let deliveryMode = 'public';

  function getState() {
    return Object.freeze({ contentMode, deliveryMode });
  }

  function setContentMode(nextMode) {
    if (!CONTENT_MODES.has(nextMode)) return false;
    contentMode = nextMode;
    if (contentMode === 'draw') deliveryMode = 'public';
    return true;
  }

  function setDeliveryMode(nextMode) {
    if (!DELIVERY_MODES.has(nextMode) || (nextMode === 'drift' && contentMode !== 'text')) return false;
    deliveryMode = nextMode;
    return true;
  }

  async function submitContent(payload) {
    if (deliveryMode === 'drift') {
      await sendDriftLetter({ text:payload.text, clientId:getClientId() });
      return 'drift';
    }
    await createPublicContent('e', payload);
    return 'public';
  }

  async function receivePrivateLetter() {
    const response = await receiveDriftLetter({ clientId:getClientId() });
    return response?.data;
  }

  return Object.freeze({
    getState,
    setContentMode,
    setDeliveryMode,
    submitContent,
    receivePrivateLetter
  });
}
