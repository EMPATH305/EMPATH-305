// Pagination always uses the same visible records as the rendered feed.
export function createRoomTFeedModel({ isHidden = () => false } = {}) {
  let records = [];
  let limit = 6;

  function getPage() {
    const visible = records.filter(record => !isHidden(record.id));
    const count = Math.min(limit, visible.length);
    return { records:visible.slice(0, count), total:visible.length, count, hasMore:count < visible.length };
  }

  function setRecords(next) {
    records = (Array.isArray(next) ? next : []).filter(record => typeof record?.id === 'string' && record.id);
    // Do not carry an expanded limit through an empty or one-page feed.
    if (getPage().total <= 6) limit = 6;
  }

  function remove(id) {
    setRecords(records.filter(record => record.id !== id));
  }

  function togglePage() {
    limit = getPage().hasMore ? limit + 6 : 6;
    return getPage();
  }

  return Object.freeze({ getPage, getRecords:() => records, remove, setRecords, togglePage });
}
