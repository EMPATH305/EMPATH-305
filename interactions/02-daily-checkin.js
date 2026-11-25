/* v17 — private daily check-in and seven-day emotional sky */
(() => {
  const STORAGE_KEY = 'empath_daily_checkins_v1';
  const MOODS = {
    heavy: { icon: '🌧️', label: '很沉重', room: 'e', title: 'E 房 · 情緒黑洞', copy: '不必整理好才開口。先把重量放在這裡。' },
    confused: { icon: '🌫️', label: '有點混亂', room: 'p', title: 'P 房 · 金繼之室', copy: '裂痕不等於結束，也可能是重新理解自己的入口。' },
    missing: { icon: '🌙', label: '想念某個人', room: 'm', title: 'M 房 · 思念星海', copy: '讓沒有寄出的思念，成為一顆可以安放的星。' },
    stuck: { icon: '🩹', label: '有件事過不去', room: 'a', title: 'A 房 · 流沙之境', copy: '有些事不必帶到永遠。看著它慢慢離開。' },
    company: { icon: '🕯️', label: '想被陪一下', room: 'h', title: 'H 房 · 回家', copy: '不需要做任何事。先回到一個不必偽裝的地方。' },
    okay: { icon: '✦', label: '今天還不錯', room: 't', title: 'T 房 · 溫度交換所', copy: '把此刻多出來的一點光，留給另一個夜晚。' }
  };
  const ECHO_COPY = {
    e: '你不需要現在就整理好它。能說出來，已經讓重量有了出口。',
    m: '思念沒有消失，但它已經有了一顆可以安放的星。',
    p: '裂痕還在，但你已經開始決定，它不只代表破碎。',
    a: '你不需要再替這段重量保管到永遠。',
    t: '你交出去的溫暖，會在某個陌生人的夜裡留下光。'
  };
  let echoReturnFocus = null;

  // 留在同步載入的互動層，避免社群內建瀏覽器延遲 Firebase 時失去回聲。
  window.showTonightEcho = function(room) {
    if (window.empathSkipNextEcho || !document.getElementById('crisis-support-notice')?.hidden) {
      window.empathSkipNextEcho = false;
      return;
    }
    const dialog = document.getElementById('tonight-echo');
    const copy = document.getElementById('tonight-echo-copy');
    if (!dialog || !copy) return;
    echoReturnFocus = document.activeElement;
    copy.textContent = ECHO_COPY[room] || '能在這裡停一下，本身就是一種照顧。';
    dialog.classList.add('show');
    dialog.setAttribute('aria-hidden', 'false');
    document.body.classList.add('empath-dialog-open');
    window.setTimeout(() => document.getElementById('tonight-echo-close')?.focus({ preventScroll: true }), 40);
  };

  window.closeTonightEcho = function() {
    const dialog = document.getElementById('tonight-echo');
    if (!dialog) return;
    dialog.classList.remove('show');
    dialog.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.share-modal.show, #breathe-overlay.show, #nebula-overlay.show, #fortune-display.show, #onboarding-box.is-open, #crisis-support-notice:not([hidden])')) {
      document.body.classList.remove('empath-dialog-open');
    }
    if (echoReturnFocus?.isConnected) echoReturnFocus.focus({ preventScroll: true });
    echoReturnFocus = null;
  };

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.getElementById('tonight-echo')?.classList.contains('show')) {
      window.closeTonightEcho();
    }
  });

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function readEntries() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(value)) return [];
      return value.filter(item => item && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && MOODS[item.mood]);
    } catch (error) {
      return [];
    }
  }

  function writeEntry(mood) {
    const meta = MOODS[mood];
    if (!meta) return;
    const today = localDateKey();
    const entries = readEntries().filter(item => item.date !== today);
    entries.push({ date: today, mood, room: meta.room, at: Date.now() });
    entries.sort((a, b) => a.date.localeCompare(b.date));
    // Keep a little over one full year locally so Room H can draw a private
    // emotional calendar without uploading a person's daily history.
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-400))); } catch (error) {}
    window.dispatchEvent(new CustomEvent('empath:checkin-updated', { detail: { mood, room: meta.room } }));
  }

  function showRecommendation(mood) {
    const meta = MOODS[mood];
    const result = document.getElementById('daily-checkin-result');
    if (!meta || !result) return;
    document.querySelectorAll('.daily-mood').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.mood === mood));
    });
    const title = document.getElementById('daily-result-title');
    const copy = document.getElementById('daily-result-copy');
    const link = document.getElementById('daily-result-link');
    if (title) title.textContent = meta.title;
    if (copy) copy.textContent = meta.copy;
    if (link) {
      link.href = `room-${meta.room}.html`;
      link.setAttribute('aria-label', `走進${meta.title}`);
    }
    result.hidden = false;
  }

  function renderWeek() {
    const grid = document.getElementById('emotion-week-grid');
    const insight = document.getElementById('emotion-week-insight');
    if (!grid || !insight) return;
    const entries = readEntries();
    const byDate = new Map(entries.map(item => [item.date, item]));
    const days = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      days.push({ date, key: localDateKey(date), entry: byDate.get(localDateKey(date)) });
    }

    grid.replaceChildren();
    const counts = {};
    days.forEach(({ date, key, entry }) => {
      const meta = entry ? MOODS[entry.mood] : null;
      if (entry) counts[entry.mood] = (counts[entry.mood] || 0) + 1;
      const item = document.createElement('div');
      item.className = `emotion-day${key === localDateKey() ? ' is-today' : ''}${meta ? '' : ' is-empty'}`;
      item.setAttribute('aria-label', `${date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}，${meta ? meta.label : '尚未記錄'}`);
      const weekday = document.createElement('span');
      weekday.className = 'emotion-day-name';
      weekday.textContent = key === localDateKey() ? '今天' : date.toLocaleDateString('zh-TW', { weekday: 'short' });
      const icon = document.createElement('span');
      icon.className = 'emotion-day-icon';
      icon.setAttribute('aria-hidden', 'true');
      const readingGlyphs = { heavy:'雨', confused:'霧', missing:'月', stuck:'傷', company:'燭', okay:'晴' };
      icon.textContent = meta && grid.closest('.reading-surface') ? readingGlyphs[entry.mood] : (meta ? meta.icon : '·');
      const label = document.createElement('span');
      label.className = 'emotion-day-label';
      label.textContent = meta ? meta.label : '留白';
      const room = document.createElement('span');
      room.className = 'emotion-day-room';
      room.textContent = meta ? `${meta.room.toUpperCase()} ROOM` : '—';
      item.append(weekday, icon, label, room);
      grid.appendChild(item);
    });

    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    if (total === 0) {
      insight.textContent = '你的七日星圖會在每天停下來看見自己後，慢慢亮起。';
    } else if (total === 1) {
      insight.textContent = '你已經留下第一個座標。看見感受，本身就是一種回來。';
    } else {
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      insight.textContent = `這七天，你最常為「${MOODS[dominant].label}」停下來。這不是評分，只是你曾經照顧自己的證明。`;
    }
  }

  function renderYearCalendar() {
    const host = document.getElementById('emotion-year-grid');
    const yearLabel = document.getElementById('emotion-year-label');
    const insight = document.getElementById('emotion-year-insight');
    if (!host || !yearLabel || !insight) return;

    const year = new Date().getFullYear();
    const entries = readEntries().filter(item => Number(item.date.slice(0, 4)) === year);
    const byDate = new Map(entries.map(item => [item.date, item]));
    yearLabel.textContent = String(year);
    host.replaceChildren();

    const monthNames = Array.from({ length: 12 }, (_, month) =>
      new Date(year, month, 1).toLocaleDateString('zh-TW', { month: 'long' })
    );

    monthNames.forEach((monthName, month) => {
      const panel = document.createElement('section');
      panel.className = 'emotion-month';
      panel.setAttribute('aria-label', `${year} 年${monthName}`);

      const title = document.createElement('h4');
      title.textContent = monthName;
      const weekdays = document.createElement('div');
      weekdays.className = 'emotion-month-weekdays';
      ['日','一','二','三','四','五','六'].forEach(day => {
        const label = document.createElement('span');
        label.textContent = day;
        weekdays.appendChild(label);
      });

      const days = document.createElement('div');
      days.className = 'emotion-month-days';
      const firstWeekday = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let index = 0; index < firstWeekday; index += 1) {
        const blank = document.createElement('span');
        blank.className = 'emotion-date is-blank';
        blank.setAttribute('aria-hidden', 'true');
        days.appendChild(blank);
      }
      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day, 12);
        const key = localDateKey(date);
        const entry = byDate.get(key);
        const meta = entry ? MOODS[entry.mood] : null;
        const dot = document.createElement('span');
        dot.className = `emotion-date${meta ? ' has-entry' : ''}${key === localDateKey() ? ' is-today' : ''}`;
        dot.dataset.room = meta?.room || '';
        dot.textContent = String(day);
        dot.tabIndex = meta ? 0 : -1;
        const spokenDate = date.toLocaleDateString('zh-TW', { month:'long', day:'numeric' });
        const description = meta ? `${meta.label}，Room ${meta.room.toUpperCase()}` : '沒有記錄';
        dot.setAttribute('aria-label', `${spokenDate}，${description}`);
        dot.title = `${spokenDate} · ${description}`;
        days.appendChild(dot);
      }
      panel.append(title, weekdays, days);
      host.appendChild(panel);
    });

    insight.textContent = entries.length
      ? `今年已有 ${entries.length} 天，你曾停下來看見自己的感受。所有記錄只留在這台裝置。`
      : '當你在首頁留下每日感受，這張只有你看得懂的地圖就會慢慢亮起。';
  }

  function initDailyCheckin() {
    const buttons = document.querySelectorAll('.daily-mood');
    buttons.forEach(button => button.addEventListener('click', () => {
      const mood = button.dataset.mood;
      writeEntry(mood);
      showRecommendation(mood);
    }));
    const today = readEntries().find(item => item.date === localDateKey());
    if (today) showRecommendation(today.mood);
    renderWeek();
    renderYearCalendar();
    window.addEventListener('empath:checkin-updated', () => {
      renderWeek();
      renderYearCalendar();
    });
    window.addEventListener('storage', event => {
      if (event.key !== STORAGE_KEY) return;
      renderWeek();
      renderYearCalendar();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDailyCheckin, { once: true });
  else initDailyCheckin();
})();

;

