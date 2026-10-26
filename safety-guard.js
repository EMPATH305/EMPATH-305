/* EMPATH v20.3 · client safety layer
 * Local safeguards reduce accidental abuse and give visitors control over
 * distressing content. Server-side App Check remains the enforcement layer.
 */
(() => {
  'use strict';
  if (window.EmpathSafety) return;

  const ACTION_KEY = 'empath_safety_actions_v1';
  const HIDDEN_KEY = 'empath_hidden_content_v1';
  const REPORTED_KEY = 'empath_reported_content_v1';
  const DAY_MS = 24 * 60 * 60 * 1000;
  const MAX_LOCAL_ITEMS = 500;

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value ?? fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function contentKey(collection, id) {
    return `${String(collection || '').slice(0, 32)}:${String(id || '').slice(0, 160)}`;
  }

  function allowAction(action, options = {}) {
    const now = Date.now();
    const cooldownMs = Math.max(0, Number(options.cooldownMs) || 15000);
    const dailyLimit = Math.max(1, Number(options.dailyLimit) || 20);
    const all = readJson(ACTION_KEY, {});
    const recent = (Array.isArray(all[action]) ? all[action] : [])
      .map(Number)
      .filter(timestamp => Number.isFinite(timestamp) && now - timestamp < DAY_MS)
      .slice(-dailyLimit);
    const retryMs = recent.length ? cooldownMs - (now - recent[recent.length - 1]) : 0;
    if (retryMs > 0) return { allowed:false, reason:'cooldown', retrySeconds:Math.ceil(retryMs / 1000) };
    if (recent.length >= dailyLimit) return { allowed:false, reason:'daily-limit', retrySeconds:0 };
    recent.push(now);
    all[action] = recent;
    writeJson(ACTION_KEY, all);
    return { allowed:true, reason:null, retrySeconds:0 };
  }

  function getStoredSet(key) {
    const value = readJson(key, []);
    return new Set(Array.isArray(value) ? value.filter(item => typeof item === 'string').slice(-MAX_LOCAL_ITEMS) : []);
  }

  function saveStoredSet(key, set) {
    writeJson(key, Array.from(set).slice(-MAX_LOCAL_ITEMS));
  }

  function isHidden(collection, id) {
    return getStoredSet(HIDDEN_KEY).has(contentKey(collection, id));
  }

  function hideContent(collection, id) {
    const hidden = getStoredSet(HIDDEN_KEY);
    hidden.add(contentKey(collection, id));
    saveStoredSet(HIDDEN_KEY, hidden);
  }

  function isReported(collection, id) {
    return getStoredSet(REPORTED_KEY).has(contentKey(collection, id));
  }

  function markReported(collection, id) {
    const reported = getStoredSet(REPORTED_KEY);
    reported.add(contentKey(collection, id));
    saveStoredSet(REPORTED_KEY, reported);
  }

  function closeReportDialog() {
    const dialog = document.getElementById('content-report-dialog');
    if (!dialog) return;
    dialog.classList.remove('show');
    dialog.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('content-report-open');
  }

  function ensureReportDialog() {
    if (document.getElementById('content-report-dialog')) return;
    const dialog = document.createElement('div');
    dialog.id = 'content-report-dialog';
    dialog.className = 'content-report-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-hidden', 'true');
    dialog.setAttribute('aria-labelledby', 'content-report-title');
    dialog.innerHTML = `
      <div class="content-report-card">
        <p class="content-report-kicker">COMMUNITY CARE · 匿名檢舉</p>
        <h2 id="content-report-title">這段內容讓你感到不安全嗎？</h2>
        <p>檢舉只會送出內容編號與原因，不會附上你的身分。</p>
        <div class="content-report-reasons">
          <button type="button" data-report-reason="harassment">攻擊或騷擾</button>
          <button type="button" data-report-reason="hate">仇恨內容</button>
          <button type="button" data-report-reason="personal_info">可識別個人資料</button>
          <button type="button" data-report-reason="spam">垃圾或重複內容</button>
          <button type="button" data-report-reason="self_harm">令人擔心的危機內容</button>
          <button type="button" data-report-reason="other">其他不適合內容</button>
        </div>
        <button type="button" class="content-report-cancel">先不檢舉</button>
      </div>`;
    dialog.addEventListener('click', event => {
      if (event.target === dialog || event.target.closest('.content-report-cancel')) closeReportDialog();
      const reasonButton = event.target.closest('[data-report-reason]');
      if (!reasonButton) return;
      const { collection, id } = dialog.dataset;
      const reason = reasonButton.dataset.reportReason;
      window.dispatchEvent(new CustomEvent('empath:report-content', {
        detail:{ collection, id, reason }
      }));
      closeReportDialog();
    });
    document.body.appendChild(dialog);
  }

  function requestReport(collection, id) {
    if (isReported(collection, id)) {
      window.showToast?.('這則內容已經檢舉過了');
      return;
    }
    ensureReportDialog();
    const dialog = document.getElementById('content-report-dialog');
    dialog.dataset.collection = collection;
    dialog.dataset.id = id;
    dialog.classList.add('show');
    dialog.setAttribute('aria-hidden', 'false');
    document.body.classList.add('content-report-open');
    dialog.querySelector('[data-report-reason]')?.focus({ preventScroll:true });
  }

  function createContentActions(collection, id, onHidden) {
    if (!collection || !id) return document.createDocumentFragment();
    const actions = document.createElement('div');
    actions.className = 'content-safety-actions';
    const hide = document.createElement('button');
    hide.type = 'button';
    hide.textContent = '隱藏';
    hide.setAttribute('aria-label', '只在這台裝置隱藏這則內容');
    const report = document.createElement('button');
    report.type = 'button';
    report.textContent = isReported(collection, id) ? '已檢舉' : '檢舉';
    report.disabled = isReported(collection, id);
    hide.addEventListener('click', event => {
      event.stopPropagation();
      hideContent(collection, id);
      onHidden?.();
      window.showToast?.('已在這台裝置隱藏');
    });
    report.addEventListener('click', event => {
      event.stopPropagation();
      requestReport(collection, id);
    });
    actions.append(hide, report);
    return actions;
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.getElementById('content-report-dialog')?.classList.contains('show')) {
      closeReportDialog();
    }
  });

  window.EmpathSafety = Object.freeze({
    allowAction,
    isHidden,
    hideContent,
    isReported,
    markReported,
    createContentActions,
    closeReportDialog
  });
})();
