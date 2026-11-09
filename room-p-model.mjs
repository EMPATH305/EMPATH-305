export const ROOM_P_BASE_TOTAL = 300;
export const ROOM_P_BASE_HEALED = 142;

function safeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
}

export function getRoomPHealingProgress(total, healed, { includeBaseline = true } = {}) {
  const safeTotal = safeCount(total);
  const safeHealed = Math.min(safeTotal, safeCount(healed));
  const progressTotal = safeTotal + (includeBaseline ? ROOM_P_BASE_TOTAL : 0);
  const progressHealed = safeHealed + (includeBaseline ? ROOM_P_BASE_HEALED : 0);
  const ratio = progressTotal ? Math.min(1, progressHealed / progressTotal) : 0;
  return Object.freeze({
    total:safeTotal,
    healed:safeHealed,
    ratio,
    percent:Number((ratio * 100).toFixed(1)),
    label:`${(ratio * 100).toFixed(1)}%`
  });
}

export function createRoomPShardModel() {
  let records = [];
  let total = 0;
  let healed = 0;
  let dataReady = false;

  function setRecords(nextRecords, isHidden = () => false) {
    records = (Array.isArray(nextRecords) ? nextRecords : [])
      .filter(record => typeof record?.id === 'string' && record.id && !isHidden(record.id))
      .map(record => ({
        id:record.id,
        data:{
          ...(record.data && typeof record.data === 'object' ? record.data : {}),
          text:typeof record.data?.text === 'string' ? record.data.text : '',
          healed:Boolean(record.data?.healed)
        }
      }));
    dataReady = true;
    const sampleHealed = records.reduce((count, record) => count + Number(record.data.healed), 0);
    total = Math.max(total, records.length, sampleHealed);
    healed = Math.max(healed, sampleHealed);
    return records;
  }

  function setTotals(next = {}) {
    total = safeCount(next.total);
    healed = Math.min(total, safeCount(next.healed));
    return getSummary();
  }

  function reconcileTotals(next = {}) {
    const sampleHealed = records.reduce((count, record) => count + Number(record.data.healed), 0);
    healed = Math.max(healed, safeCount(next.healed), sampleHealed);
    total = Math.max(total, safeCount(next.total), records.length, healed);
    return getSummary();
  }

  function markHealed(id, incrementTotal = false) {
    const record = records.find(item => item.id === id);
    if (record) record.data.healed = true;
    if (incrementTotal) {
      healed += 1;
      total = Math.max(total, healed);
    }
    return record || null;
  }

  function remove(id) {
    records = records.filter(record => record.id !== id);
    return records;
  }

  function getSummary() {
    return Object.freeze({ total, healed, dataReady, ...getRoomPHealingProgress(total, healed) });
  }

  return Object.freeze({
    getRecords:() => records,
    getSummary,
    markHealed,
    reconcileTotals,
    remove,
    setRecords,
    setTotals
  });
}
