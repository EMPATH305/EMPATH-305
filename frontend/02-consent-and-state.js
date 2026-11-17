// Analytics 預設關閉。只有使用者在「隱私與承諾」明確同意後才動態載入。
window.empathAnalytics = null;
window.empathLogEvent = () => {};
window.empathSetAnalyticsCollectionEnabled = () => {};
let analyticsInitPromise = null;
async function initializeConsentedAnalytics() {
    if (safeLocalStorage.getItem('empath_analytics_consent') !== 'granted') return null;
    if (window.empathAnalytics) {
        window.empathSetAnalyticsCollectionEnabled(window.empathAnalytics, true);
        return window.empathAnalytics;
    }
    if (!analyticsInitPromise) {
        analyticsInitPromise = import("https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js")
            .then(({ getAnalytics, logEvent, setAnalyticsCollectionEnabled }) => {
                window.empathAnalytics = getAnalytics(app);
                window.empathLogEvent = logEvent;
                window.empathSetAnalyticsCollectionEnabled = setAnalyticsCollectionEnabled;
                setAnalyticsCollectionEnabled(window.empathAnalytics, true);
                return window.empathAnalytics;
            })
            .catch(error => {
                console.warn('Analytics unavailable:', error);
                analyticsInitPromise = null;
                return null;
            });
    }
    return analyticsInitPromise;
}

window.setAnalyticsConsent = async function(granted) {
    safeLocalStorage.setItem('empath_analytics_consent', granted ? 'granted' : 'denied');
    if (granted) await initializeConsentedAnalytics();
    else if (window.empathAnalytics) window.empathSetAnalyticsCollectionEnabled(window.empathAnalytics, false);
    renderAnalyticsConsentControls();
    window.showToast?.(granted
        ? t('已啟用匿名使用分析 ✦', 'Anonymous usage analytics enabled ✦')
        : t('已關閉使用分析', 'Usage analytics disabled'));
};

window.addEventListener('empath:report-content', async event => {
    const collectionName = String(event.detail?.collection || '');
    const targetId = String(event.detail?.id || '');
    const reason = String(event.detail?.reason || '');
    const allowedCollections = new Set(['emotions','stars','shards','sand','warmth','drift_letters']);
    const allowedReasons = new Set(['harassment','hate','personal_info','spam','self_harm','other']);
    if (!allowedCollections.has(collectionName) || !allowedReasons.has(reason) || !targetId) return;
    const throttle = window.EmpathSafety?.allowAction('content-report', {
        cooldownMs:30000,
        dailyLimit:10
    }) || { allowed:true };
    if (!throttle.allowed) {
        window.showToast?.(t('檢舉送出得太快，請稍後再試。', 'Reports are being sent too quickly. Please try later.'));
        return;
    }
    try {
        await submitContentReport({
            targetCollection:collectionName,
            targetId,
            reason
        });
        window.EmpathSafety?.markReported(collectionName, targetId);
        window.showToast?.(t('已匿名送出檢舉，也在這台裝置隱藏內容。', 'Report sent anonymously and hidden on this device.'));
        window.EmpathSafety?.hideContent(collectionName, targetId);
        document.dispatchEvent(new CustomEvent('empath:content-hidden', {
            detail:{ collection:collectionName, id:targetId }
        }));
        if (collectionName === 'emotions') {
            roomEFeed.removeRecord(targetId);
        } else if (collectionName === 'stars') {
            roomMStars.remove(targetId);
            window.starMessages = roomMStars.getStars();
            document.getElementById('star-tooltip')?.classList.remove('active');
        } else if (collectionName === 'shards') {
            roomPShards.remove(targetId);
            syncRoomPLegacyState();
            window.renderPShards?.();
        } else if (collectionName === 'warmth') {
            roomTFeed.remove(targetId);
            window.tWarmthRecords = roomTFeed.getRecords();
            window.renderTWarmthFeed?.();
        } else if (collectionName === 'sand') {
            document.querySelectorAll('#a-feed .sand-msg').forEach(item => {
                if (item.dataset.contentId === targetId) item.remove();
            });
        } else if (collectionName === 'drift_letters') {
            const letter = document.getElementById('e-drift-letter');
            if (letter?.dataset.letterId === targetId) {
                letter.hidden = true;
                letter.removeAttribute('data-letter-id');
                document.getElementById('e-drift-letter-text')?.replaceChildren();
                document.getElementById('e-drift-letter-actions')?.replaceChildren();
            }
        }
    } catch(error) {
        console.error('Anonymous content report failed:', error);
        window.showToast?.(t('檢舉暫時無法送出，請稍後再試。', 'The report could not be sent. Please try later.'));
    }
});

window.addEventListener('empath:delete-owned-content', async event => {
    const collectionName = String(event.detail?.collection || '');
    const targetId = String(event.detail?.id || '');
    const deletionToken = String(event.detail?.token || '');
    const allowedCollections = new Set(['emotions', 'stars', 'shards', 'warmth']);
    if (!allowedCollections.has(collectionName)
        || !/^[A-Za-z0-9_-]{1,160}$/.test(targetId)
        || !/^[A-Za-z0-9_-]{43}$/.test(deletionToken)) return;
    const throttle = window.EmpathSafety?.allowAction('owned-content-delete', {
        cooldownMs:5000,
        dailyLimit:20
    }) || { allowed:true };
    if (!throttle.allowed) {
        window.showToast?.(t('刪除要求送出得太快，請稍後再試。', 'Deletion requests are being sent too quickly. Please try later.'));
        return;
    }
    try {
        const response = await deleteRoomContentRequest({
            targetCollection:collectionName,
            targetId,
            deletionToken
        });
        if (!response?.data?.completed) throw new Error('Content deletion was not completed.');
        window.EmpathSafety?.forgetOwnedContent(collectionName, targetId);
        window.EmpathSafety?.hideContent(collectionName, targetId);
        event.detail?.onDeleted?.();
        window.showToast?.(t('這則內容已永久收回。', 'This content was permanently withdrawn.'));
    } catch (error) {
        console.error('Owned content deletion failed:', error);
        window.showToast?.(t('暫時無法收回，內容沒有變動。', 'Could not withdraw this yet; the content was not changed.'));
    }
});

const state = { eCount:0, mCount:0, pCount:0, aCount:0, tCount:0 };
const globalCounts = { v:0, e:0, m:0, p:0, a:0, t:0 };
let roomAReleasedTotal = 0;
// Keep the client query slightly ahead of Firestore request.time so the rules
// can prove every returned Room A document is still unexpired.
const roomAQueryCutoff = () => Timestamp.fromMillis(Date.now() + 10000);
const PUBLIC_CONTENT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;
// Keep the client cutoff slightly newer than the rules boundary so Firestore
// can prove every document returned by E/M/P/T is within the 180-day window.
const publicContentCutoff = () => Timestamp.fromMillis(Date.now() - PUBLIC_CONTENT_RETENTION_MS + 10000);
const ACTIVE_ROOM = ['e','m','p','a','t','h'].find(key =>
    document.documentElement.classList.contains(`empath-room-${key}`)
) || '';
try {
    const cachedCounts = JSON.parse(safeLocalStorage.getItem('empath_global_counts') || '{}');
    ['e','m','p','a','t'].forEach(key => {
        const value = Number(cachedCounts[key]);
        if(Number.isFinite(value) && value >= 0) globalCounts[key] = value;
    });
} catch(err) {}
let journeyData = { counters: {e:0, m:0, p:0, a:0, t:0}, events: [] };
const SUBMIT_COOLDOWN = 15000;
document.addEventListener('DOMContentLoaded', () => {
    if(typeof updateCountersUI === 'function') updateCountersUI();
}, { once:true }); 

function canSubmit(action = ACTIVE_ROOM || 'site') {
    const verdict = window.EmpathSafety?.allowAction(`submit:${action}`, {
        cooldownMs:SUBMIT_COOLDOWN,
        dailyLimit:20
    }) || { allowed:true };
    if (verdict.allowed) return true;
    const message = verdict.reason === 'daily-limit'
        ? t('今天已經送出很多次了，先讓這個空間休息一下。', 'You have shared many times today. Please let this space rest for now.')
        : t(`請再等 ${verdict.retrySeconds || 1} 秒後送出。`, `Please wait ${verdict.retrySeconds || 1} seconds before sending again.`);
    window.showToast(message);
    return false;
}
function playRitual(btnId, origText) { const btn = document.getElementById(btnId); if(!btn) return; btn.innerHTML = t('✨ 已接住', '✨ Caught', '✨ 受け止めました', '✨ Atrapado', '✨ Attrapé', '✨ Aufgefangen', '✨ 已接住'); btn.style.pointerEvents = 'none'; btn.style.opacity = '0.6'; setTimeout(() => { btn.innerHTML = origText; btn.style.pointerEvents = 'auto'; btn.style.opacity = '1'; }, 3000); }

function updateCountersUI() {
    try {
        safeLocalStorage.setItem('empath_global_counts', JSON.stringify({
            e:globalCounts.e || 0, m:globalCounts.m || 0, p:globalCounts.p || 0,
            a:globalCounts.a || 0, t:globalCounts.t || 0, savedAt:Date.now()
        }));
    } catch(err) {}
    ['g-v-count','g-e-count','g-m-count','g-p-count','g-t-count'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = globalCounts[id.split('-')[1]]; });
    ['h-e-count','h-m-count','h-p-count','h-a-count','h-t-count'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = state[id.split('-')[1]+'Count']; });
    
    // 🌟 讓大腦學會記憶，實現 0 秒載入的視覺魔術
    safeLocalStorage.setItem('empath_global_counts', JSON.stringify(globalCounts));
    
    updateSoulWeather();
    // 計算全站總留言數，並檢查是否觸發情緒脈衝
    const totalMsgs = (globalCounts.e || 0) + (globalCounts.m || 0) + (globalCounts.p || 0) + (globalCounts.a || 0) + (globalCounts.t || 0);
    if(typeof window.checkGlobalPulse === 'function') window.checkGlobalPulse(totalMsgs);
}

function updateSoulWeather() {
    const badgeText = document.getElementById('weather-text');
    const badgeDot = document.getElementById('weather-dot');
    if (!badgeText) return;

    // 權重演算：釋放組 (E+A) vs 溫暖修補組 (T+P) vs 思念組 (M)
    const releasePower = (globalCounts.e || 0) + (globalCounts.a || 0);
    const warmthPower = (globalCounts.t || 0) + (globalCounts.p || 0);
    const cosmicPower = (globalCounts.m || 0);

    const body = document.body;
    body.classList.remove('weather-release', 'weather-warmth', 'weather-cosmic');

    // 🌟 神奇小幫手：同時更新畫面文字，並自動綁上所有語言的 data 屬性供切換
    const setWeatherMsg = (zh, en, ja, es, fr, de, zh_cn) => {
        badgeText.setAttribute('data-zh', zh);
        badgeText.setAttribute('data-en', en);
        badgeText.setAttribute('data-ja', ja);
        badgeText.setAttribute('data-es', es);
        badgeText.setAttribute('data-fr', fr);
        badgeText.setAttribute('data-de', de);
        badgeText.setAttribute('data-zh-cn', zh_cn);
        // 立即顯示當前選擇的語言
        badgeText.textContent = t(zh, en, ja, es, fr, de, zh_cn);
    };

    // 判斷當前氣象型態，並餵給神奇小幫手
    if (warmthPower >= releasePower && warmthPower >= cosmicPower && warmthPower > 0) {
        body.classList.add('weather-warmth');
        if (badgeDot) badgeDot.style.background = 'var(--gold)';
        setWeatherMsg(
            '✦ 現正氣象：琥珀暖光 — 許多靈魂正在此處溫柔交會',
            '✦ Soul Weather: Amber Warmth — Souls intersecting warmly',
            '✦ 魂の気象：琥珀色の温もり — 多くの魂が優しく交わっています',
            '✦ Clima del Alma: Calidez Ámbar — Almas cruzándose cálidamente',
            '✦ Météo de l\'Âme : Chaleur d\'Ambre — Les âmes se croisent chaleureusement',
            '✦ Seelenwetter: Bernsteinwärme — Seelen überschneiden sich warm',
            '✦ 現正气象：琥珀暖光 — 许多灵魂正在此处温柔交会'
        );
    } else if (releasePower > warmthPower && releasePower >= cosmicPower) {
        body.classList.add('weather-release');
        if (badgeDot) badgeDot.style.background = 'var(--e)';
        setWeatherMsg(
            '🌧️ 現正氣象：深海靜雨 — 正在為這個世界接住破碎與重量',
            '🌧️ Soul Weather: Deep Ocean Rain — Holding weight for the world',
            '🌧️ 魂の気象：深海の静かな雨 — 世界の重みを受け止めています',
            '🌧️ Clima del Alma: Lluvia Profunda — Sosteniendo el peso del mundo',
            '🌧️ Météo de l\'Âme : Pluie Profonde — Gardant le poids du monde',
            '🌧️ Seelenwetter: Tiefseeregen — Das Gewicht der Welt haltend',
            '🌧️ 現正气象：深海静雨 — 正在为这个世界接住破碎与重量'
        );
    } else {
        body.classList.add('weather-cosmic');
        if (badgeDot) badgeDot.style.background = 'var(--m)';
        setWeatherMsg(
            '🌌 現正氣象：夜空微光 — 無數思念正在漫長的夜裡閃爍',
            '🌌 Soul Weather: Cosmic Starlight — Memories shimmering in the night',
            '🌌 魂の気象：夜空の微光 — 多くの思いが夜に輝いています',
            '🌌 Clima del Alma: Luz Cósmica — Recuerdos resplandeciendo en la noche',
            '🌌 Météo de l\'Âme : Lumière Cosmique — Des souvenirs scintillant dans la nuit',
            '🌌 Seelenwetter: Kosmisches Sternenlicht — Erinnerungen schimmern in der Nacht',
            '🌌 現正气象：夜空微光 — 无数思念正在漫长的夜里闪烁'
        );
    }
}

