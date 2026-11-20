// ==========================================
// 魔法三：匿名的微同步共現 (Live Micro-Presence 通用版)
// ==========================================
const mySessionId = Math.random().toString(36).substr(2, 9);

function setupRoomPresence(roomKey, inputId) {
    const inputBox = document.getElementById(inputId); 
    if (!inputBox) return;
    
    // 動態插入微光標籤
    let sparkEl = document.createElement('div'); 
    sparkEl.className = 'presence-spark'; 
    sparkEl.innerHTML = `<span class="spark-icon">✦</span><span data-zh="此刻，世界某處也有人正與你一起傾吐..." data-en="Someone else is typing right now..." data-ja="誰かが今、入力をしています..." data-es="Alguien más está escribiendo ahora..." data-fr="Quelqu'un d'autre écrit en ce moment..." data-de="Jemand anderes tippt gerade..." data-zh-cn="此刻，世界某处也有人正与你一起倾吐...">此刻，世界某處也有人正與你一起傾吐...</span>`;
    inputBox.parentNode.insertBefore(sparkEl, inputBox.nextSibling);

    const presenceRef = doc(db, 'presence', roomKey); 
    let typingTimer; 
    let isTyping = false;

    inputBox.addEventListener('input', () => {
        if (document.hidden || !presencePageActive) return;
        if (!isTyping) { 
            isTyping = true; 
            setDoc(presenceRef, { by: mySessionId }, { merge: true }).catch(e=>{}); 
        }
        clearTimeout(typingTimer); 
        typingTimer = setTimeout(() => { 
            isTyping = false; 
            setDoc(presenceRef, { by: 'none' }, { merge: true }).catch(e=>{}); 
        }, 3000);
    });

    let presenceHideTimer;
    registerAuxiliarySubscription(`presence:${roomKey}`, () => {
        const unsubscribe = onSnapshot(presenceRef, (docSnap) => {
            if(docSnap.exists()) {
                const data = docSnap.data();
                if (data.by !== mySessionId && data.by !== 'none') {
                    sparkEl.classList.add('show');
                    clearTimeout(presenceHideTimer);
                    presenceHideTimer = setTimeout(() => { sparkEl.classList.remove('show'); }, 4000);
                } else if (data.by === 'none') {
                    sparkEl.classList.remove('show');
                    clearTimeout(presenceHideTimer);
                }
            }
        }, error => console.error(`Room presence failed (${roomKey}):`, error));
        return () => {
            clearTimeout(typingTimer);
            typingTimer = null;
            isTyping = false;
            clearTimeout(presenceHideTimer);
            unsubscribe();
            sparkEl.classList.remove('show');
        };
    });
}

// ==========================================
// Room H：五分鐘無聲陪伴
// 使用五分鐘時間桶記錄「這段時間選擇進來的人數」，不儲存文字、IP 或個人資料。
// ==========================================
const SILENT_COMPANY_SECONDS = 5 * 60;
const SILENT_BUCKET_MS = SILENT_COMPANY_SECONDS * 1000;
let silentCompanyTimer = null;
let silentCompanyGeneration = 0;
let pendingSilentCompanyStart = null;
let presencePageActive = true;
function resumePendingSilentCompany() {
    if (presencePageActive && !document.hidden) pendingSilentCompanyStart?.();
}
window.addEventListener('pagehide', () => { presencePageActive = false; });
window.addEventListener('pageshow', () => {
    presencePageActive = true;
    resumePendingSilentCompany();
});
document.addEventListener('visibilitychange', resumePendingSilentCompany);

function ensureSilentCompanyOverlay() {
    if (document.getElementById('silent-company-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="silent-company-overlay" id="silent-company-overlay" role="dialog" aria-modal="true" aria-labelledby="silent-company-title" aria-hidden="true">
        <div class="silent-company-inner">
          <p class="silent-company-kicker">SILENT COMPANY · EMPATH</p>
          <h2 id="silent-company-title" data-zh="現在，不必說任何話" data-en="No words are needed now">現在，不必說任何話</h2>
          <div class="silent-breathing-light" aria-hidden="true"><span></span></div>
          <p class="silent-company-count" id="silent-company-count" aria-live="polite">此刻，你正在這裡安靜著。</p>
          <p class="silent-company-note" data-zh="這裡不記錄你的內容。五分鐘後，空間會溫柔地送你回去。" data-en="Nothing you say is recorded here. In five minutes, this space will gently return you.">這裡不記錄你的內容。五分鐘後，空間會溫柔地送你回去。</p>
          <div class="silent-company-progress" aria-hidden="true"><span id="silent-company-progress"></span></div>
          <p class="silent-company-time" id="silent-company-time">05:00</p>
          <button type="button" class="silent-exit-btn" id="silent-company-exit" onclick="window.stopSilentCompanionship()" data-zh="我想先離開" data-en="Leave quietly">我想先離開</button>
        </div>
      </div>
    `);
}

function renderSilentCompanyCount(count) {
    const target = document.getElementById('silent-company-count');
    if (!target) return;
    const safeCount = Math.max(1, Math.min(100000, Number(count) || 1));
    const zh = `這五分鐘，已有 ${safeCount.toLocaleString()} 個人選擇在這裡安靜。`;
    const en = `In these five minutes, ${safeCount.toLocaleString()} people chose to be quiet here.`;
    target.setAttribute('data-zh', zh);
    target.setAttribute('data-zh-cn', zh);
    target.setAttribute('data-en', en);
    target.textContent = t(zh, en, en, en, en, en, zh);
}

window.startSilentCompanionship = async function() {
    ensureSilentCompanyOverlay();
    const overlay = document.getElementById('silent-company-overlay');
    if (!overlay || overlay.classList.contains('show')) return;
    const generation = ++silentCompanyGeneration;
    const startedAt = Date.now();
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('empath-dialog-open', 'silent-company-active');
    document.getElementById('silent-company-exit')?.focus({ preventScroll:true });

    let bucket = Math.floor(Date.now() / SILENT_BUCKET_MS);
    let bucketKey = String(bucket);
    const joinedKey = 'empath_silent_company_bucket';
    const presenceRef = doc(db, 'metadata', 'silent_presence');
    if (safeSessionStorage.getItem(joinedKey) !== bucketKey) {
        try {
            const response = await joinSilentCompanionshipRequest({ clientId:getDriftClientId() });
            const result = response?.data;
            if (!result?.accepted) throw new Error('Silent companionship join was not accepted.');
            bucket = Number(result.bucket) || bucket;
            bucketKey = String(bucket);
            if (generation === silentCompanyGeneration) renderSilentCompanyCount(result.count);
            safeSessionStorage.setItem(joinedKey, bucketKey);
        } catch(error) {
            console.error('Silent company count failed:', error);
            if (generation === silentCompanyGeneration) renderSilentCompanyCount(1);
        }
    }

    if (generation !== silentCompanyGeneration || !overlay.classList.contains('show')) return;
    const tick = () => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = Math.max(0, SILENT_COMPANY_SECONDS - elapsed);
        const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
        const seconds = String(remaining % 60).padStart(2, '0');
        const time = document.getElementById('silent-company-time');
        const progress = document.getElementById('silent-company-progress');
        if (time) time.textContent = `${minutes}:${seconds}`;
        if (progress) progress.style.width = `${(remaining / SILENT_COMPANY_SECONDS) * 100}%`;
        if (remaining === 0) {
            window.stopSilentCompanionship(true);
            window.showToast(t('五分鐘到了。謝謝你陪自己停在這裡。', 'Five minutes have passed. Thank you for staying with yourself.'));
        }
    };
    pendingSilentCompanyStart = () => {
        pendingSilentCompanyStart = null;
        if (generation !== silentCompanyGeneration) return;
        registerAuxiliarySubscription('silent-company', () => {
            tick();
            if (generation !== silentCompanyGeneration) return;
            const unsubscribe = onSnapshot(presenceRef, snapshot => {
                const data = snapshot.data() || {};
                renderSilentCompanyCount(Number(data.bucket) === bucket ? data.count : 1);
            }, error => console.error('Silent company presence failed:', error));
            silentCompanyTimer = setInterval(tick, 1000);
            return () => {
                clearInterval(silentCompanyTimer);
                silentCompanyTimer = null;
                unsubscribe();
            };
        });
    };
    resumePendingSilentCompany();
};

window.stopSilentCompanionship = function() {
    silentCompanyGeneration++;
    pendingSilentCompanyStart = null;
    removeAuxiliarySubscription('silent-company');
    clearInterval(silentCompanyTimer);
    silentCompanyTimer = null;
    const overlay = document.getElementById('silent-company-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('silent-company-active');
    if (!document.querySelector('.share-modal.show, #breathe-overlay.show, #nebula-overlay.show, #fortune-display.show, #onboarding-box.is-open, #crisis-support-notice:not([hidden]), #tonight-echo.show')) {
        document.body.classList.remove('empath-dialog-open');
    }
    clearInterval(silentCompanyTimer);
    silentCompanyTimer = null;
    document.querySelector('.silent-enter-btn')?.focus({ preventScroll:true });
};

// 🌟 拔掉原本的 load 煞車，改用 DOMContentLoaded 讓它瞬間起跑

