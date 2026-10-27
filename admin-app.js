import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app-check.js';

const firebaseConfig = { apiKey:'AIzaSyANaBq5vt8G5L2GJjzAAfVmHYFeKA9bF90', authDomain:'empath-62582.firebaseapp.com', projectId:'empath-62582', storageBucket:'empath-62582.firebasestorage.app', messagingSenderId:'945974527649', appId:'1:945974527649:web:552e236eff7809dfea52e0' };
const app = initializeApp(firebaseConfig);
initializeAppCheck(app, {
  provider:new ReCaptchaEnterpriseProvider('6LfIqgEuAAAAADuOmZVHbEizh5hw3GAKMcziAcXy'),
  isTokenAutoRefreshEnabled:true
});
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
const reportList = document.getElementById('report-list');
const reviewSummary = document.getElementById('review-summary');
const status = document.getElementById('admin-status');
const reasonCopy = {
  harassment:'攻擊或騷擾', hate:'仇恨內容', personal_info:'可識別個人資料',
  spam:'垃圾或重複內容', self_harm:'令人擔心的危機內容', other:'其他'
};
let statusTimer = null;

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
  if (code.includes('network')) return '網路暫時無法連線，請稍後再試。';
  return '操作暫時失敗，請稍後再試。';
}

function formatDate(milliseconds) {
  if (!milliseconds) return '舊資料／時間未知';
  return new Intl.DateTimeFormat('zh-TW', { dateStyle:'medium', timeStyle:'short' }).format(new Date(milliseconds));
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
  location.textContent = `${report.targetCollection || '未知'} · ${report.targetId || '無編號'}`;
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
  dismiss.addEventListener('click', () => review(report.id, 'dismiss', article));
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'report-action remove';
  remove.textContent = report.targetExists ? '移除內容' : '結束檢舉';
  remove.addEventListener('click', () => review(report.id, report.targetExists ? 'remove' : 'dismiss', article));
  actions.append(dismiss, remove);
  article.append(meta, preview, actions);
  return article;
}

async function review(reportId, action, card) {
  if (action === 'remove' && !window.confirm('確定要永久移除這則內容嗎？這個動作無法復原。')) return;
  const buttons = card.querySelectorAll('button');
  buttons.forEach(button => { button.disabled = true; });
  try {
    await moderateReport({ reportId, action });
    card.remove();
    const remaining = reportList.querySelectorAll('.report-card').length;
    reviewSummary.textContent = `目前有 ${remaining} 則待審核檢舉。`;
    if (!remaining) reportList.innerHTML = '<div class="empty-state">目前沒有待審核內容。<br>這裡安靜，通常是好消息。</div>';
    showStatus(action === 'remove' ? '內容已移除並留下稽核紀錄。' : '已保留內容並結束檢舉。');
  } catch (error) {
    console.error(error);
    buttons.forEach(button => { button.disabled = false; });
    showStatus(readableError(error));
  }
}

async function loadReports() {
  refreshButton.disabled = true;
  reviewSummary.textContent = '正在讀取待審核內容…';
  reportList.replaceChildren();
  try {
    const result = await listReports({ limit:50 });
    const reports = Array.isArray(result.data?.reports) ? result.data.reports : [];
    reviewSummary.textContent = `目前有 ${reports.length} 則待審核檢舉。`;
    if (!reports.length) {
      reportList.innerHTML = '<div class="empty-state">目前沒有待審核內容。<br>這裡安靜，通常是好消息。</div>';
      return;
    }
    reports.forEach(report => reportList.appendChild(createReportCard(report)));
  } catch (error) {
    console.error(error);
    reviewSummary.textContent = '無法讀取檢舉。';
    showStatus(readableError(error));
  } finally {
    refreshButton.disabled = false;
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
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt:'select_account' });
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error(error);
    showStatus(readableError(error));
    await signOut(auth).catch(() => {});
  } finally {
    signInButton.disabled = false;
  }
});

signOutButton.addEventListener('click', () => signOut(auth));
refreshButton.addEventListener('click', loadReports);
onAuthStateChanged(auth, async user => {
  if (!user) {
    authPanel.hidden = false;
    reviewPanel.hidden = true;
    signOutButton.hidden = true;
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
