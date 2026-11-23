import { createSafeStorage, getBrowserStorage } from './storage-resilience.mjs';
import { createPrivateWeather, summarizeWeather, WEATHER_KEY, WEATHER_ROOMS } from './private-weather-model.mjs';

const storage = createSafeStorage(getBrowserStorage('localStorage'));
const model = createPrivateWeather({ storage });
const panel = document.getElementById('private-weather');
const room = WEATHER_ROOMS.find(key => document.documentElement.classList.contains(`empath-room-${key}`));
const names = { e:['情緒出口','Emotional Exit'], m:['思念映射','Memory Mapping'], p:['碎片修補','Repair'], a:['神聖避難所','Sanctuary'], t:['能量共振','Resonance'], h:['靈魂歸宿','Home'] };
let days = 7;
let language = storage.getItem('empath_language') || document.documentElement.lang;
const copy = (zh,en) => /^zh/i.test(language) ? zh : en;

function render() {
  if (!panel) return;
  const state = model.snapshot();
  const summary = summarizeWeather(state, days);
  panel.querySelector('#weather-toggle').textContent = state.enabled
    ? copy('暫停記錄','Pause recording')
    : copy(state.entries.length ? '繼續記錄' : '開啟本機記錄', state.entries.length ? 'Resume recording' : 'Enable local recording');
  panel.querySelector('#weather-toggle').setAttribute('aria-pressed', String(state.enabled));
  panel.querySelector('#weather-status').textContent = state.deletionFailed
    ? copy('此頁已停止記錄，但瀏覽器拒絕刪除已保存的資料。請在瀏覽器設定清除此網站資料，否則重新開頁可能恢復原紀錄。','Recording stopped on this page, but the browser blocked deletion. Clear this site’s data in browser settings; reopening may otherwise restore the saved record.')
    : state.temporary
      ? copy('瀏覽器無法儲存：這次變更只在本頁生效。換頁後可能恢復原設定；若要確實關閉，請清除此網站資料。','Storage is unavailable: this change applies to this page only. Reopening may restore prior settings; clear site data to ensure recording stays off.')
      : state.enabled
        ? copy('已開啟 · 僅保存在這個瀏覽器','Enabled · Stored only in this browser')
        : copy(state.entries.length ? '已暫停 · 原有記錄仍保留' : '尚未開啟 · 不會記錄房間造訪', state.entries.length ? 'Paused · Previous records are kept' : 'Off · Room visits are not recorded');
  panel.querySelector('#weather-summary').textContent = summary.recordedDays
    ? copy(`近 ${days} 天，你在 ${summary.recordedDays} 天裡留下了房間足跡。這只呈現造訪，不代表心情好壞。`,`In the last ${days} days, you visited rooms on ${summary.recordedDays} days. Visits do not indicate how you feel.`)
    : copy(state.enabled ? '這段時間還沒有足跡。照自己的步調走走就好。' : '這裡還是一片留白。想留下足跡時，再開啟就好。', state.enabled ? 'No visits in this period yet. Take your own time.' : 'A quiet blank space. Enable recording only when you want to.');
  const list = panel.querySelector('#weather-rooms');
  list.replaceChildren();
  list.hidden = summary.recordedDays === 0;
  for (const item of summary.rooms) {
    const row = document.createElement('li');
    row.dataset.room = item.room;
    const label = document.createElement('span');
    label.textContent = `${item.room.toUpperCase()} · ${copy(...names[item.room])}`;
    const count = document.createElement('span');
    count.className = 'weather-room-days';
    count.textContent = copy(`${item.days} 天`,`${item.days} ${item.days === 1 ? 'day' : 'days'}`);
    const track = document.createElement('span');
    track.className = 'weather-track'; track.setAttribute('aria-hidden','true');
    const fill = document.createElement('span');
    fill.style.width = `${item.days / days * 100}%`;
    track.append(fill); row.append(label, count, track); list.append(row);
  }
  panel.querySelectorAll('[data-weather-days]').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.weatherDays) === days));
  });
}

function visit() {
  if (document.visibilityState !== 'visible' || !room) return;
  model.record(room);
  render();
}

if (panel) {
  panel.querySelector('#weather-toggle').addEventListener('click', () => {
    model.setEnabled(!model.snapshot().enabled);
    visit(); render();
  });
  panel.querySelectorAll('[data-weather-days]').forEach(button => button.addEventListener('click', () => {
    days = Number(button.dataset.weatherDays) === 30 ? 30 : 7; render();
  }));
  const confirmation = panel.querySelector('#weather-clear-confirm');
  panel.querySelector('#weather-clear').addEventListener('click', () => {
    confirmation.hidden = false;
    panel.querySelector('#weather-clear-cancel').focus();
  });
  panel.querySelector('#weather-clear-cancel').addEventListener('click', () => {
    confirmation.hidden = true; panel.querySelector('#weather-clear').focus();
  });
  panel.querySelector('#weather-clear-yes').addEventListener('click', () => {
    model.clear(); confirmation.hidden = true; render(); panel.querySelector('#weather-toggle').focus();
  });
}
window.addEventListener('empath:language-changed', event => {
  language = event.detail?.lang || document.documentElement.lang; render();
});
window.addEventListener('storage', event => {
  if (event.key === WEATHER_KEY || event.key === null) { model.refresh(); render(); }
});
window.addEventListener('pageshow', () => { render(); visit(); });
document.addEventListener('visibilitychange', visit);
render(); visit();
