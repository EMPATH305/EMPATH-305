/* EMPATH v20.4 · client safety layer */
(() => {
  'use strict';
  if (window.EmpathSafety) return;

  const ACTION_KEY = 'empath_safety_actions_v1';
  const HIDDEN_KEY = 'empath_hidden_content_v1';
  const REPORTED_KEY = 'empath_reported_content_v1';
  const DAY_MS = 24 * 60 * 60 * 1000;
  const MAX_LOCAL_ITEMS = 500;
  const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let reportReturnFocus = null;

  const COPY = {
    zh:{ kicker:'COMMUNITY CARE · 匿名檢舉', title:'這段內容讓你感到不安全嗎？', description:'檢舉只會送出內容編號與原因，不會附上你的身分。', harassment:'攻擊或騷擾', hate:'仇恨內容', personal_info:'可識別個人資料', spam:'垃圾或重複內容', self_harm:'令人擔心的危機內容', other:'其他不適合內容', cancel:'先不檢舉', hide:'隱藏', hideLabel:'只在這台裝置隱藏這則內容', report:'檢舉', reported:'已檢舉', alreadyReported:'這則內容已經檢舉過了', hidden:'已在這台裝置隱藏' },
    'zh-cn':{ kicker:'COMMUNITY CARE · 匿名举报', title:'这段内容让你感到不安全吗？', description:'举报只会送出内容编号与原因，不会附上你的身份。', harassment:'攻击或骚扰', hate:'仇恨内容', personal_info:'可识别个人资料', spam:'垃圾或重复内容', self_harm:'令人担心的危机内容', other:'其他不适合内容', cancel:'先不举报', hide:'隐藏', hideLabel:'只在这台设备隐藏这则内容', report:'举报', reported:'已举报', alreadyReported:'这则内容已经举报过了', hidden:'已在这台设备隐藏' },
    en:{ kicker:'COMMUNITY CARE · ANONYMOUS REPORT', title:'Does this content make you feel unsafe?', description:'Only the content ID and reason are sent. Your identity is not included.', harassment:'Harassment or abuse', hate:'Hateful content', personal_info:'Identifying personal information', spam:'Spam or repeated content', self_harm:'Concerning crisis content', other:'Other inappropriate content', cancel:'Not now', hide:'Hide', hideLabel:'Hide this content on this device only', report:'Report', reported:'Reported', alreadyReported:'You have already reported this content', hidden:'Hidden on this device' },
    ja:{ kicker:'COMMUNITY CARE · 匿名報告', title:'この内容に不安を感じますか？', description:'送信されるのは内容IDと理由のみで、あなたの身元は含まれません。', harassment:'攻撃・嫌がらせ', hate:'ヘイトコンテンツ', personal_info:'個人を特定できる情報', spam:'スパム・重複内容', self_harm:'心配な危機内容', other:'その他の不適切な内容', cancel:'報告しない', hide:'非表示', hideLabel:'この端末でのみ非表示にする', report:'報告', reported:'報告済み', alreadyReported:'この内容は報告済みです', hidden:'この端末で非表示にしました' },
    es:{ kicker:'CUIDADO COMUNITARIO · REPORTE ANÓNIMO', title:'¿Este contenido te hace sentir inseguro?', description:'Solo se envían el ID del contenido y el motivo, sin tu identidad.', harassment:'Ataque o acoso', hate:'Contenido de odio', personal_info:'Información personal identificable', spam:'Spam o contenido repetido', self_harm:'Contenido de crisis preocupante', other:'Otro contenido inapropiado', cancel:'No reportar ahora', hide:'Ocultar', hideLabel:'Ocultar este contenido solo en este dispositivo', report:'Reportar', reported:'Reportado', alreadyReported:'Ya reportaste este contenido', hidden:'Ocultado en este dispositivo' },
    fr:{ kicker:'SOIN COMMUNAUTAIRE · SIGNALEMENT ANONYME', title:'Ce contenu vous met-il mal à l’aise ?', description:'Seuls l’identifiant du contenu et le motif sont envoyés, jamais votre identité.', harassment:'Attaque ou harcèlement', hate:'Contenu haineux', personal_info:'Informations personnelles identifiables', spam:'Spam ou contenu répété', self_harm:'Contenu de crise préoccupant', other:'Autre contenu inapproprié', cancel:'Ne pas signaler', hide:'Masquer', hideLabel:'Masquer ce contenu uniquement sur cet appareil', report:'Signaler', reported:'Signalé', alreadyReported:'Vous avez déjà signalé ce contenu', hidden:'Masqué sur cet appareil' },
    de:{ kicker:'COMMUNITY CARE · ANONYME MELDUNG', title:'Fühlst du dich durch diesen Inhalt unsicher?', description:'Gesendet werden nur Inhalts-ID und Grund, nicht deine Identität.', harassment:'Angriff oder Belästigung', hate:'Hassinhalt', personal_info:'Identifizierbare persönliche Daten', spam:'Spam oder wiederholter Inhalt', self_harm:'Besorgniserregender Kriseninhalt', other:'Sonstiger unangemessener Inhalt', cancel:'Nicht melden', hide:'Ausblenden', hideLabel:'Diesen Inhalt nur auf diesem Gerät ausblenden', report:'Melden', reported:'Gemeldet', alreadyReported:'Du hast diesen Inhalt bereits gemeldet', hidden:'Auf diesem Gerät ausgeblendet' },
    uk:{ kicker:'ТУРБОТА СПІЛЬНОТИ · АНОНІМНА СКАРГА', title:'Цей вміст змушує вас почуватися небезпечно?', description:'Надсилаються лише ID вмісту та причина, без вашої особи.', harassment:'Напад або переслідування', hate:'Мова ненависті', personal_info:'Особисті дані', spam:'Спам або повтори', self_harm:'Тривожний кризовий вміст', other:'Інший неприйнятний вміст', cancel:'Не скаржитися', hide:'Сховати', hideLabel:'Сховати лише на цьому пристрої', report:'Поскаржитися', reported:'Надіслано', alreadyReported:'Ви вже поскаржилися на цей вміст', hidden:'Сховано на цьому пристрої' },
    pl:{ kicker:'TROSKA SPOŁECZNOŚCI · ANONIMOWE ZGŁOSZENIE', title:'Czy ta treść sprawia, że czujesz się niebezpiecznie?', description:'Wysyłamy tylko identyfikator treści i powód, bez twojej tożsamości.', harassment:'Atak lub nękanie', hate:'Treści szerzące nienawiść', personal_info:'Dane umożliwiające identyfikację', spam:'Spam lub powtarzająca się treść', self_harm:'Niepokojąca treść kryzysowa', other:'Inna niewłaściwa treść', cancel:'Nie zgłaszaj', hide:'Ukryj', hideLabel:'Ukryj tę treść tylko na tym urządzeniu', report:'Zgłoś', reported:'Zgłoszono', alreadyReported:'Ta treść została już przez ciebie zgłoszona', hidden:'Ukryto na tym urządzeniu' }
  };

  function currentLanguage() {
    let language = window.currentLang;
    if (!language) {
      try { language = localStorage.getItem('empath_language'); } catch (error) {}
    }
    if (language === 'en-uk') language = 'en';
    return COPY[language] ? language : 'zh';
  }

  function text(key) {
    return COPY[currentLanguage()][key] || COPY.en[key] || COPY.zh[key] || '';
  }

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

  function refreshLanguage(root = document) {
    root.querySelectorAll?.('[data-safety-copy]').forEach(element => {
      element.textContent = text(element.dataset.safetyCopy);
    });
    root.querySelectorAll?.('[data-safety-label]').forEach(element => {
      element.setAttribute('aria-label', text(element.dataset.safetyLabel));
    });
  }

  function closeReportDialog(options = {}) {
    const dialog = document.getElementById('content-report-dialog');
    if (!dialog) return;
    dialog.classList.remove('show');
    dialog.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('content-report-open');
    if (options.restoreFocus !== false && reportReturnFocus?.isConnected) {
      reportReturnFocus.focus({ preventScroll:true });
    }
    reportReturnFocus = null;
  }

  function ensureReportDialog() {
    if (document.getElementById('content-report-dialog')) return;
    const dialog = document.createElement('div');
    dialog.id = 'content-report-dialog';
    dialog.className = 'content-report-dialog';
    dialog.tabIndex = -1;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-hidden', 'true');
    dialog.setAttribute('aria-labelledby', 'content-report-title');
    dialog.setAttribute('aria-describedby', 'content-report-description');
    dialog.innerHTML = `
      <div class="content-report-card">
        <p class="content-report-kicker" data-safety-copy="kicker"></p>
        <h2 id="content-report-title" data-safety-copy="title"></h2>
        <p id="content-report-description" data-safety-copy="description"></p>
        <div class="content-report-reasons">
          <button type="button" data-report-reason="harassment" data-safety-copy="harassment"></button>
          <button type="button" data-report-reason="hate" data-safety-copy="hate"></button>
          <button type="button" data-report-reason="personal_info" data-safety-copy="personal_info"></button>
          <button type="button" data-report-reason="spam" data-safety-copy="spam"></button>
          <button type="button" data-report-reason="self_harm" data-safety-copy="self_harm"></button>
          <button type="button" data-report-reason="other" data-safety-copy="other"></button>
        </div>
        <button type="button" class="content-report-cancel" data-safety-copy="cancel"></button>
      </div>`;
    dialog.addEventListener('click', event => {
      if (event.target === dialog || event.target.closest('.content-report-cancel')) {
        closeReportDialog();
        return;
      }
      const reasonButton = event.target.closest('[data-report-reason]');
      if (!reasonButton) return;
      const { collection, id } = dialog.dataset;
      window.dispatchEvent(new CustomEvent('empath:report-content', {
        detail:{ collection, id, reason:reasonButton.dataset.reportReason }
      }));
      closeReportDialog();
    });
    document.body.appendChild(dialog);
    refreshLanguage(dialog);
  }

  function requestReport(collection, id) {
    if (isReported(collection, id)) {
      window.showToast?.(text('alreadyReported'));
      return;
    }
    ensureReportDialog();
    const dialog = document.getElementById('content-report-dialog');
    reportReturnFocus = document.activeElement;
    dialog.dataset.collection = collection;
    dialog.dataset.id = id;
    refreshLanguage(dialog);
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
    hide.dataset.safetyCopy = 'hide';
    hide.dataset.safetyLabel = 'hideLabel';
    const report = document.createElement('button');
    report.type = 'button';
    report.dataset.safetyCopy = isReported(collection, id) ? 'reported' : 'report';
    report.disabled = isReported(collection, id);
    hide.addEventListener('click', event => {
      event.stopPropagation();
      hideContent(collection, id);
      onHidden?.();
      window.showToast?.(text('hidden'));
    });
    report.addEventListener('click', event => {
      event.stopPropagation();
      requestReport(collection, id);
    });
    actions.append(hide, report);
    refreshLanguage(actions);
    return actions;
  }

  document.addEventListener('keydown', event => {
    const dialog = document.getElementById('content-report-dialog');
    if (!dialog?.classList.contains('show')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeReportDialog();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(element => element.getClientRects().length);
    if (!focusable.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('empath:language-changed', () => refreshLanguage());

  window.EmpathSafety = Object.freeze({
    allowAction,
    isHidden,
    hideContent,
    isReported,
    markReported,
    createContentActions,
    closeReportDialog,
    refreshLanguage
  });
})();
