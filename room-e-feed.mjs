const DEFAULT_VISIBLE_LIMIT = 3;
const DEFAULT_PAGE_SIZE = 30;

export function isRoomEImage(value) {
  return typeof value === 'string' && /^data:image\/(?:png|jpeg|webp);base64,/i.test(value);
}

export function createRoomEFeedModel({ initialLimit = DEFAULT_VISIBLE_LIMIT, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  let records = [];
  let visibleLimit = initialLimit;

  function setRecords(nextRecords) {
    records = Array.isArray(nextRecords) ? [...nextRecords] : [];
    return records.length;
  }

  function removeRecord(id) {
    records = records.filter(record => record?.id !== id);
    return records.length;
  }

  function toggle() {
    visibleLimit = visibleLimit < records.length ? visibleLimit + pageSize : initialLimit;
    return getState();
  }

  function getState() {
    return Object.freeze({
      total:records.length,
      visibleLimit,
      visibleRecords:Object.freeze(records.slice(0, visibleLimit)),
      expanded:visibleLimit > initialLimit,
      canExpand:visibleLimit < records.length
    });
  }

  return Object.freeze({ getState, removeRecord, setRecords, toggle });
}

export function createRoomEFeedView({
  document,
  translate,
  createContentActions,
  formatTime,
  model = createRoomEFeedModel()
}) {
  if (!document || typeof document.createElement !== 'function') throw new TypeError('Room E feed requires a document.');
  if (typeof translate !== 'function' || typeof formatTime !== 'function') throw new TypeError('Room E feed requires text and time formatters.');

  function renderRecord(record) {
    const id = typeof record?.id === 'string' ? record.id : '';
    const data = record?.data && typeof record.data === 'object' ? record.data : {};
    const card = document.createElement('div');
    card.className = 'e-msg';

    const anon = document.createElement('div');
    anon.className = 'e-msg-anon';
    anon.textContent = translate('匿名 · ANONYMOUS', 'ANONYMOUS', '匿名 · ANONYMOUS', 'ANÓNIMO', 'ANONYME', 'ANONYM', '匿名 · ANONYMOUS');
    card.appendChild(anon);

    if (typeof data.text === 'string' && data.text) {
      const message = document.createElement('div');
      message.textContent = data.text;
      card.appendChild(message);
    } else if (isRoomEImage(data.image)) {
      const image = document.createElement('img');
      image.src = data.image;
      image.className = 'e-msg-img';
      image.alt = 'Emotional Scribble';
      card.appendChild(image);
    }

    const time = document.createElement('div');
    time.className = 'e-msg-time';
    time.textContent = formatTime(data.createdAt);
    const actions = id && typeof createContentActions === 'function'
      ? createContentActions('emotions', id, () => {
          model.removeRecord(id);
          render();
        })
      : null;
    card.append(time, actions || document.createDocumentFragment());
    return card;
  }

  function render() {
    const feed = document.getElementById('e-feed');
    if (!feed) return false;
    const fade = document.getElementById('e-feed-fade');
    const button = document.getElementById('e-expand-btn');
    const container = document.querySelector('#room-e .e-feed-container');
    const state = model.getState();

    feed.replaceChildren(...state.visibleRecords.map(renderRecord));
    container?.classList.toggle('is-expanded', state.expanded);

    if (button) {
      button.style.display = state.total > DEFAULT_VISIBLE_LIMIT ? 'inline-flex' : 'none';
      button.textContent = state.canExpand
        ? translate('↓ 載入更多', '↓ Load More', '↓ もっと読み込む', '↓ Cargar más', '↓ Charger plus', '↓ Mehr laden', '↓ 载入更多')
        : translate('↑ 收起全部', '↑ Collapse All', '↑ すべて閉じる', '↑ Ocultar todo', '↑ Tout réduire', '↑ Alle einklappen', '↑ 收起全部');
    }
    if (fade) fade.style.display = state.total > DEFAULT_VISIBLE_LIMIT && state.canExpand ? 'block' : 'none';
    return true;
  }

  function setRecords(records) {
    const total = model.setRecords(records);
    render();
    return total;
  }

  function removeRecord(id) {
    const total = model.removeRecord(id);
    render();
    return total;
  }

  function toggle() {
    model.toggle();
    render();
  }

  return Object.freeze({ getState:model.getState, removeRecord, render, setRecords, toggle });
}
