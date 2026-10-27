import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import {
  getAuth, getRedirectResult, GoogleAuthProvider, onAuthStateChanged,
  signInWithPopup, signInWithRedirect, signOut
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app-check.js';

const firebaseConfig = { apiKey:'AIzaSyANaBq5vt8G5L2GJjzAAfVmHYFeKA9bF90', authDomain:'empath-62582.firebaseapp.com', projectId:'empath-62582', storageBucket:'empath-62582.firebasestorage.app', messagingSenderId:'945974527649', appId:'1:945974527649:web:552e236eff7809dfea52e0' };
const app = initializeApp(firebaseConfig);
try {
  initializeAppCheck(app, {
    provider:new ReCaptchaEnterpriseProvider('6LfIqgEuAAAAADuOmZVHbEizh5hw3GAKMcziAcXy'),
    isTokenAutoRefreshEnabled:true
  });
} catch (error) {
  console.error('App Check could not initialize:', error);
}

const auth = getAuth(app);
const functions = getFunctions(app, 'asia-east1');
const claimAdminRole = httpsCallable(functions, 'claimAdminRole');
const listReports = httpsCallable(functions, 'listReports');
const moderateReport = httpsCallable(functions, 'moderateReport');

const authPanel = document.getElementById('auth-panel');
const reviewPanel = document.getElementById('review-panel');
const signInButton = document.getElementById('google-sign-in');
const signOutButton = document.getElementById('sign-out');
const refreshButton = document.getElementById('refresh-reports');
const loadMoreButton = document.getElementById('load-more-reports');
const clearFiltersButton = document.getElementById('clear-filters');
const reportList = document.getElementById('report-list');
const reviewSummary = document.getElementById('review-summary');
const status = document.getElementById('admin-status');
const appCheckHealth = document.getElementById('app-check-health');
const collectionFilter = document.getElementById('collection-filter');
const reasonFilter = document.getElementById('reason-filter');
const verificationFilter = document.getElementById('verification-filter');

const reasonCopy = {
  harassment:'攻擊或騷擾', hate:'仇恨內容', personal_info:'可識別個人資料',
  spam:'垃圾或重複內容', self_harm:'令人擔心的危機內容', other:'其他'
};
const roomCopy = {
  emotions:'Room E · 情緒留言', stars:'Room M · 星星', shards:'Room P · 金繼碎片',
  sand:'Room A · 流沙', warmth:'Room T · 溫暖留言'
};

let statusTimer = null;
let allReports = [];
let nextCursor = null;
let hasMore = false;
let loading = false;

function showStatus(message) {
  clearTimeout(statusTimer);
  status.textContent = message;
  status.classList.add('show');
  statusTimer = setTimeout(() => status.classList.remove('show'), 4200);
}

function readableError(error) {
  const code = String(error?.code || '');
  if (code.includes('permission-denied')) return '這個 Google 帳號沒有 EMPATH 管理員權限。';
  if (code.includes('popup-closed')) return '登入視窗已關閉。';
  if (code.includes('resource-exhausted')) return '操作太頻繁，請稍後再試。';
  if (code.includes('failed-precondition')) return '這則檢舉已處理，正在重新整理。';
  if (code.includes('network')) return '網路暫時無法連線，請稍後再試。';
  return '操作暫時失敗，請稍後再試。';
}

function formatDate(milliseconds) {
  if (!milliseconds) return '舊資料／時間未知';
  return new Intl.DateTimeFormat('zh-TW', { dateStyle:'medium', timeStyle:'short' }).format(new Date(milliseconds));
}

function renderEmptyState(message = '目前沒有待審核內容。', detail = '這裡安靜，通常是好消息。') {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.append(document.createTextNode(message), document.createElement('br'), document.createTextNode(detail));
  reportList.replaceChildren(empty);
}

function visibleReports() {
  return allReports.filter(report => {
    if (collectionFilter.value && report.targetCollection !== collectionFilter.value) return false;
    if (reasonFilter.value && report.reason !== reasonFilter.value) return false;
    if (verificationFilter.value === 'verified' && !report.appVerified) return false;
    if (verificationFilter.value === 'unverified' && report.appVerified) return false;
    return true;
  });
}

function updateSummary(visibleCount = visibleReports().length) {
  const filtered = Boolean(collectionFilter.value || reasonFilter.value || verificationFilter.value);
  reviewSummary.textContent = filtered
    ? `顯示 ${visibleCount} 則；目前已載入 ${allReports.length} 則待審核檢舉。`
    : `目前已載入 ${allReports.length} 則待審核檢舉${hasMore ? '，還有更多資料' : ''}。`;
}

function createReportCard(report) {
  const article = document.createElement('article');
  article.className = 'report-card';
  article.dataset.reportId = report.id;

  const meta = document.createElement('div');
  meta.className = 'report-meta';
  const reason = document.createElement('span');
  reason.className = 'report-reason';
  reason.textContent = reasonCopy[report.reason] || '其他';
  const location = document.createElement('span');
  location.className = 'report-location';
  location.textContent = roomCopy[report.targetCollection] || '未知房間';
  const time = document.createElement('time');
  time.textContent = formatDate(report.createdAt);
  if (report.createdAt) time.dateTime = new Date(report.createdAt).toISOString();
  const check = document.createElement('span');
  check.textContent = report.appVerified ? 'App Check 已驗證' : '未驗證／舊資料';
  meta.append(reason, location, time, check);

  const preview = document.createElement('p');
  preview.className = 'report-preview';
  preview.textContent = report.preview || '內容無法預覽';

  const actions = document.createElement('div');
  actions.className = 'report-actions';
  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'report-action';
  dismiss.textContent = '保留內容';
  dismiss.addEventListener('click', () => review(report, 'dismiss', article));
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'report-action remove';
  remove.textContent = report.targetExists ? '移除內容' : '結束檢舉';
  remove.addEventListener('click', () => review(report, report.targetExists ? 'remove' : 'dismiss', article));
  actions.append(dismiss, remove);
  article.append(meta, preview, actions);
  return article;
}

function renderReports() {
  const reports = visibleReports();
  reportList.replaceChildren(...reports.map(createReportCard));
  if (!reports.length) {
    renderEmptyState(
      allReports.length ? '目前沒有符合篩選條件的檢舉。' : '目前沒有待審核內容。',
      allReports.length ? '可以清除篩選或載入更多資料。' : '這裡安靜，通常是好消息。'
    );
  }
  loadMoreButton.hidden = !hasMore;
  updateSummary(reports.length);
}

async function review(report, action, card) {
  if (action === 'remove' && !window.confirm('確定要永久移除這則內容嗎？這個動作無法復原。')) return;
  const buttons = card.querySelectorAll('button');
  buttons.forEach(button => { button.disabled = true; });
  card.setAttribute('aria-busy', 'true');
  try {
    await moderateReport({ reportId:report.id, action });
    allReports = allReports.filter(item => item.id !== report.id);
    renderReports();
    showStatus(action === 'remove' ? '內容已移除並留下稽核紀錄。' : '已保留內容並結束檢舉。');
  } catch (error) {
    console.error(error);
    buttons.forEach(button => { button.disabled = false; });
    card.removeAttribute('aria-busy');
    showStatus(readableError(error));
    if (String(error?.code || '').includes('failed-precondition')) await loadReports();
  }
}

function updateAppCheckStatus(verified) {
  appCheckHealth.className = `health-chip ${verified ? 'ready' : 'warning'}`;
  appCheckHealth.textContent = verified ? 'App Check 權杖有效' : 'App Check 尚未驗證';
}

async function loadReports({ append = false } = {}) {
  if (loading) return;
  loading = true;
  refreshButton.disabled = true;
  loadMoreButton.disabled = true;
  reportList.setAttribute('aria-busy', 'true');
  if (!append) reviewSummary.textContent = '正在讀取待審核內容…';
  try {
    const result = await listReports({ limit:30, cursor:append ? nextCursor : null });
    const reports = Array.isArray(result.data?.reports) ? result.data.reports : [];
    const existing = append ? new Map(allReports.map(report => [report.id, report])) : new Map();
    reports.forEach(report => existing.set(report.id, report));
    allReports = [...existing.values()];
    hasMore = result.data?.hasMore === true;
    nextCursor = result.data?.nextCursor || null;
    updateAppCheckStatus(result.data?.security?.appCheckVerified === true);
    renderReports();
  } catch (error) {
    console.error(error);
    if (!append) {
      reviewSummary.textContent = '無法讀取檢舉。';
      renderEmptyState('無法讀取待審核內容。', readableError(error));
    }
    showStatus(readableError(error));
  } finally {
    loading = false;
    refreshButton.disabled = false;
    loadMoreButton.disabled = false;
    reportList.removeAttribute('aria-busy');
  }
}

async function activateAdmin(user) {
  await claimAdminRole();
  await user.getIdToken(true);
  const token = await user.getIdTokenResult();
  if (token.claims.admin !== true) throw new Error('permission-denied');
  authPanel.hidden = true;
  reviewPanel.hidden = false;
  signOutButton.hidden = false;
  await loadReports();
}

signInButton.addEventListener('click', async () => {
  signInButton.disabled = true;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt:'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    const code = String(error?.code || '');
    if (code.includes('popup-blocked') || code.includes('operation-not-supported-in-this-environment')) {
      await signInWithRedirect(auth, provider);
      return;
    }
    console.error(error);
    showStatus(readableError(error));
    await signOut(auth).catch(() => {});
  } finally {
    signInButton.disabled = false;
  }
});

signOutButton.addEventListener('click', () => signOut(auth));
refreshButton.addEventListener('click', () => loadReports());
loadMoreButton.addEventListener('click', () => loadReports({ append:true }));
[collectionFilter, reasonFilter, verificationFilter].forEach(filter => filter.addEventListener('change', renderReports));
clearFiltersButton.addEventListener('click', () => {
  collectionFilter.value = '';
  reasonFilter.value = '';
  verificationFilter.value = '';
  renderReports();
});

getRedirectResult(auth).catch(error => {
  console.error(error);
  showStatus(readableError(error));
});

onAuthStateChanged(auth, async user => {
  if (!user) {
    authPanel.hidden = false;
    reviewPanel.hidden = true;
    signOutButton.hidden = true;
    allReports = [];
    nextCursor = null;
    hasMore = false;
    return;
  }
  try {
    await activateAdmin(user);
  } catch (error) {
    console.error(error);
    showStatus(readableError(error));
    await signOut(auth);
  }
});
