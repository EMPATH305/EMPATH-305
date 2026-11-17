function dataStateText(status) {
    const language = window.currentLang === 'en-uk' ? 'en' : (window.currentLang || 'zh');
    return DATA_STATE_COPY[status]?.[language] || DATA_STATE_COPY[status]?.en || '';
}

function applyDataStateTranslations(element,status) {
    if (!element || !DATA_STATE_COPY[status]) return;
    Object.entries(DATA_STATE_COPY[status]).forEach(([language,message]) => element.setAttribute(`data-${language}`,message));
    element.textContent = dataStateText(status);
}

function dataStateHost(room) {
    if (room === 'e') return document.querySelector('#room-e .e-feed-container');
    if (room === 'm') return document.getElementById('room-m');
    if (room === 'p') return document.getElementById('p-board')?.parentElement;
    if (room === 'a') return document.getElementById('a-feed-wrapper');
    if (room === 't') return document.getElementById('t-feed')?.parentElement;
    return null;
}

function setDataState(room,status,onRetry) {
    const host = dataStateHost(room); if (!host) return;
    let stateEl = host.querySelector(`:scope > .data-state[data-room="${room}"]`);
    if (!stateEl) {
        stateEl = document.createElement('div');
        stateEl.className = 'data-state';
        stateEl.dataset.room = room;
        stateEl.setAttribute('role','status');
        stateEl.setAttribute('aria-live','polite');
        host.appendChild(stateEl);
    }
    if (!status) { stateEl.hidden = true; delete stateEl.dataset.status; stateEl.replaceChildren(); return; }
    if (room === 'm') { const legacyLoading = document.getElementById('star-loading'); if (legacyLoading) legacyLoading.style.display = 'none'; }
    stateEl.hidden = false;
    stateEl.dataset.status = status;
    const message = document.createElement('span');
    applyDataStateTranslations(message,status);
    stateEl.replaceChildren(message);
    if (status === 'error' && runtimeProfile.isEmbedded) {
        const help = document.createElement('span');
        help.className = 'embedded-browser-help';
        applyDataStateTranslations(help,'embeddedHelp');
        stateEl.appendChild(help);
    }
    if (status === 'error' && typeof onRetry === 'function') {
        const retry = document.createElement('button');
        retry.type = 'button'; retry.className = 'data-state-retry'; applyDataStateTranslations(retry,'retry');
        retry.addEventListener('click',onRetry,{once:true});
        stateEl.appendChild(retry);
    }
}

function retryDataSubscriptions() {
    unsubscribeAll();
    ['e','m','p','a','t'].forEach(room => setDataState(room,'loading'));
    subscribeRealtimeData();
}

function handleDataError(room,error) {
    console.error(`Firestore ${room.toUpperCase()} feed failed:`,error);
    setDataState(room,'error',retryDataSubscriptions);
}

function fetchRealCounts() {
    // Durable totals arrive through metadata/public_room_stats. Keeping this
    // entry point avoids coupling room rendering to counter availability.
    updateCountersUI();
}

function updatePHealingProgress() {
    const { label } = roomPShards.getSummary();
    const bar = document.getElementById('global-healing-bar');
    const pctText = document.getElementById('global-healing-pct');
    if (bar) bar.style.width = label;
    if (pctText) pctText.textContent = label;
}

function refreshRoomCount(room) {
    // Public totals are server-owned and update in real time. Room A retains
    // its separate release aggregate subscription.
    if (room === 'm') window.updateMStats?.();
    updateCountersUI();
}
  
function subscribeAll() {
    if(realtimeLifecycle.getPrimaryCount() > 0) return;
    if (!ACTIVE_ROOM) {
        fetchRealCounts();
        return;
    }
    if (ACTIVE_ROOM === 'h') {
        fetchRealCounts();
        return;
    }
    setDataState(ACTIVE_ROOM,'loading');

    // 1. 監聽情緒出口：首頁只保留近期 30 筆，避免為初始 3 張卡下載整批歷史資料。
    if (ACTIVE_ROOM === 'e') realtimeLifecycle.track(onSnapshot(query(collection(db, "emotions"), where("createdAt", ">", publicContentCutoff()), orderBy("createdAt", "desc"), firestoreLimit(30)), (snapshot) => {
        const emotions = [];
        snapshot.forEach(docSnap => {
            if (!window.EmpathSafety?.isHidden('emotions', docSnap.id)) {
                emotions.push({ id:docSnap.id, data:docSnap.data() });
            }
        });
        roomEFeed.setRecords(emotions);
        setDataState('e',emotions.length ? null : 'empty');
        refreshRoomCount('e');
        updateCountersUI();
    },error => handleDataError('e',error)));

    if (ACTIVE_ROOM !== 'e') {
        otherRoomsSubscribed = true;
        subscribeOtherRooms();
    }
}

function scheduleOtherRoomSubscriptions() {
    if (otherRoomsSubscribed || otherRoomsObserver) return;
    const targets = ['room-m','room-p','room-a','room-t']
        .map(id => document.getElementById(id))
        .filter(Boolean);
    const start = () => {
        if (otherRoomsSubscribed) return;
        otherRoomsSubscribed = true;
        if (otherRoomsObserver) otherRoomsObserver.disconnect();
        otherRoomsObserver = null;
        ['m','p','a','t'].forEach(room => setDataState(room,'loading'));
        fetchRealCounts();
        subscribeOtherRooms();
    };
    if (!('IntersectionObserver' in window) || !targets.length) {
        start();
        return;
    }
    otherRoomsObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) start();
    }, { rootMargin: '900px 0px', threshold: 0.01 });
    targets.forEach(target => otherRoomsObserver.observe(target));
}

function syncRoomPLegacyState() {
    const summary = roomPShards.getSummary();
    window.pShardRecords = roomPShards.getRecords();
    window.pShardDataReady = summary.dataReady;
    window.pTotalShards = summary.total;
    window.pHealedTotal = summary.healed;
}
syncRoomPLegacyState();

// 深連結或站內房間導覽後，非同步資料可能改變前方房間高度。
// 暫時鎖定使用者最近選擇的房間，在首批資料安定後重新對齊。
let activeRoomTargetId = /^#room-[empath]$/.test(window.location.hash)
    ? window.location.hash.slice(1)
    : '';
let activeRoomTargetUntil = activeRoomTargetId ? performance.now() + 15000 : 0;
let deepLinkStabilizeTimer = null;
function alignActiveRoomTarget() {
    if (!activeRoomTargetId || performance.now() > activeRoomTargetUntil) return;
    const target = document.getElementById(activeRoomTargetId);
    if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
}
function scheduleRoomTargetStabilization() {
    if (!activeRoomTargetId || performance.now() > activeRoomTargetUntil) return;
    clearTimeout(deepLinkStabilizeTimer);
    deepLinkStabilizeTimer = setTimeout(alignActiveRoomTarget, 220);
}

document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href^="#room-"]');
    const hash = link?.getAttribute('href') || '';
    if (!/^#room-[empath]$/.test(hash)) return;
    activeRoomTargetId = hash.slice(1);
    activeRoomTargetUntil = performance.now() + 4000;
    const selectedTarget = activeRoomTargetId;
    // 房間轉場本身約 2.6 秒；分段校正可吸收 P/T 等資料造成的版面位移。
    [650, 1200, 2100].forEach(delay => setTimeout(() => {
        if (activeRoomTargetId === selectedTarget) alignActiveRoomTarget();
    }, delay));
}, true);

function createPShardCard(record) {
    const { id, data } = record;
    const div = document.createElement('div');
    div.className = 'shard' + (data.healed ? ' healed' : '');
    if (!data.healed) {
        div.tabIndex = 0;
        div.setAttribute('role','button');
        div.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                div.click();
            }
        });
    }

    const text = document.createElement('div');
    text.className = 'shard-text';
    text.textContent = typeof data.text === 'string' ? data.text : '';
    const healedTag = document.createElement('div');
    healedTag.className = 'shard-healed-tag';
    healedTag.textContent = `✦ ${t('已修補', 'Healed', '修復済', 'Reparado', 'Réparé', 'Geheilt', '已修补')}`;
    const glow = document.createElement('div');
    glow.className = 'shard-glow';
    const actions = window.EmpathSafety?.createContentActions('shards', id, () => {
        roomPShards.remove(id);
        syncRoomPLegacyState();
        window.renderPShards();
    });
    div.append(text, healedTag, glow, actions || document.createDocumentFragment());

    if (!data.healed) {
        div.setAttribute('aria-label', t('修補這道裂紋', 'Mend this crack', 'このひび割れを修復', 'Reparar esta grieta', 'Réparer cette fissure', 'Diesen Riss flicken', '修补这道裂纹', 'Відновити цю тріщину', 'Napraw to pęknięcie'));
    }

    div.addEventListener('click', async () => {
        if (data.healed || div.dataset.healing === 'true') return;
        div.dataset.healing = 'true';
        div.setAttribute('aria-busy','true');
        try {
            const result = await reactToRoomContent('shard', id);
            data.healed = true;
            div.classList.add('healed');
            div.removeAttribute('tabindex');
            div.removeAttribute('role');
            if (result.changed) {
                roomPShards.markHealed(id, true);
                syncRoomPLegacyState();
                globalCounts.p = window.pHealedTotal;
                updatePHealingProgress();
                updateDynamicTexts();
                updateCountersUI();
                refreshRoomCount('p');
            }
            if (typeof window.playChime === 'function') window.playChime();
            logJourney('p', data.text);
            window.showToast(t('以金修補，裂縫成為了光 ✦', 'Mended with gold ✦', '金で修復しました ✦', 'Reparado con oro ✦', 'Réparé avec de l\'or ✦', 'Mit Gold geflickt ✦', '以金修补，裂缝成为了光 ✦'));
        } catch (error) {
            if (isDuplicateRoomReaction(error)) {
                roomPShards.markHealed(id, false);
                syncRoomPLegacyState();
                data.healed = true;
                div.classList.add('healed');
                div.removeAttribute('tabindex');
                div.removeAttribute('role');
                window.showToast(t('這道裂紋已被你的金光接住', 'You already mended this crack', 'このひびはすでに修復されています', 'Ya reparaste esta grieta', 'Vous avez déjà réparé cette fissure', 'Du hast diesen Riss bereits geflickt', '这道裂纹已被你的金光接住', 'Ви вже відновили цю тріщину', 'To pęknięcie zostało już przez ciebie naprawione'));
                return;
            }
            console.error('無法修補碎片:', error);
            window.showToast(t('暫時無法修補，請稍後再試', 'Could not mend this yet. Please try again.', '修復できませんでした。後でもう一度お試しください。', 'No se pudo reparar. Inténtalo de nuevo.', 'Réparation impossible. Réessayez plus tard.', 'Reparatur fehlgeschlagen. Bitte erneut versuchen.', '暂时无法修补，请稍后再试', 'Не вдалося відновити. Спробуйте ще раз.', 'Nie udało się naprawić. Spróbuj ponownie.'));
        } finally {
            delete div.dataset.healing;
            div.removeAttribute('aria-busy');
        }
    });
    return div;
}

window.renderPShards = function(limit = 12) {
    const board = document.getElementById('p-board');
    if (!board) return { rendered: 0, total: 0 };
    const records = roomPShards.getRecords();
    const count = Math.min(Math.max(0, Number(limit) || 0), records.length);
    const fragment = document.createDocumentFragment();
    records.slice(0,count).forEach(record => fragment.appendChild(createPShardCard(record)));
    board.replaceChildren(fragment);
    updateDynamicTexts();
    return { rendered: count, total: records.length };
};

window.tWarmthRecords = roomTFeed.getRecords();

function createTWarmthItem(record) {
    const { id, data } = record;
    const div = document.createElement('div');
    div.className = 'warmth-item';
    const pulse = document.createElement('div'); pulse.className = 'warmth-pulse';
    const message = document.createElement('div'); message.textContent = typeof data.text === 'string' ? data.text : '';
    const echoButton = document.createElement('button'); echoButton.type = 'button'; echoButton.className = 'echo-btn'; echoButton.id = `btn-${id}`;
    echoButton.setAttribute('aria-label', t('為這則溫暖送出共鳴', 'Send an echo for this message', 'このメッセージに共鳴を送る', 'Enviar un eco para este mensaje', 'Envoyer un écho pour ce message', 'Ein Echo für diese Nachricht senden', '为这则温暖送出共鸣'));
    if (safeLocalStorage.getItem('echoed_'+id)) echoButton.classList.add('pulsed');
    const heart = document.createElement('span'); heart.className = 'heart'; heart.textContent = '🕯️';
    echoButton.append(heart, document.createTextNode(' Echo Pulse '));
    const actions = window.EmpathSafety?.createContentActions('warmth', id, () => {
        roomTFeed.remove(id);
        window.tWarmthRecords = roomTFeed.getRecords();
        window.renderTWarmthFeed();
    });
    div.append(pulse, message, echoButton, actions || document.createDocumentFragment());
    echoButton.addEventListener('click', async function(e){
        if(this.classList.contains('pulsed')) return;
        this.classList.add('pulsed'); safeLocalStorage.setItem('echoed_'+id, 'true');
        try {
            await reactToRoomContent('warmth', id);
            window.showToast('✦ Echo Pulse Sent'); window.triggerHeartbeat();
            if (typeof window.createEchoRipple === 'function') window.createEchoRipple(e);
            if (typeof window.playChime === 'function') window.playChime();
        } catch (error) {
            if (isDuplicateRoomReaction(error)) {
                window.showToast(t('這份共鳴已經送達', 'Your echo has already arrived', 'この共鳴はすでに届いています', 'Tu eco ya llegó', 'Votre écho est déjà arrivé', 'Dein Echo ist bereits angekommen', '这份共鸣已经送达', 'Ваш відгук уже надійшов', 'Twoje echo już dotarło'));
                return;
            }
            this.classList.remove('pulsed'); safeLocalStorage.removeItem('echoed_'+id);
            window.showToast(t('共鳴沒有送出，請稍後再試', 'Echo was not sent. Please try again.', '共鳴を送信できませんでした。', 'No se envió el eco. Inténtalo de nuevo.', "L'écho n'a pas été envoyé. Réessayez.", 'Echo wurde nicht gesendet. Bitte erneut versuchen.', '共鸣没有送出，请稍后再试'));
            console.error('Echo Pulse failed:', error);
        }
    });
    return div;
}

window.renderTWarmthFeed = function() {
    const feed = document.getElementById('t-feed');
    if (!feed) return;
    const { records, total, count:visibleCount, hasMore } = roomTFeed.getPage();
    const fragment = document.createDocumentFragment();
    records.slice(0, visibleCount).forEach(record => fragment.appendChild(createTWarmthItem(record)));
    feed.replaceChildren(fragment);

    let pager = document.getElementById('t-pagination');
    if (!pager) {
        pager = document.createElement('div'); pager.id = 't-pagination'; pager.className = 't-pagination';
        const button = document.createElement('button'); button.type = 'button'; button.className = 't-load-more'; button.setAttribute('aria-controls','t-feed');
        const status = document.createElement('p'); status.className = 't-page-status'; status.setAttribute('aria-live','polite');
        pager.append(button, status); feed.insertAdjacentElement('afterend', pager);
        button.addEventListener('click', () => {
            roomTFeed.togglePage();
            window.renderTWarmthFeed();
        });
    }
    const button = pager.querySelector('.t-load-more');
    const status = pager.querySelector('.t-page-status');
    pager.hidden = total <= 6;
    if (button) button.textContent = hasMore
        ? t('再接住一些溫暖 ↓', 'Receive more warmth ↓', 'さらに温もりを受け取る ↓', 'Recibir más calidez ↓', 'Recevoir plus de chaleur ↓', 'Mehr Wärme empfangen ↓', '再接住一些温暖 ↓')
        : t('收起訊息 ↑', 'Collapse messages ↑', 'メッセージを閉じる ↑', 'Ocultar mensajes ↑', 'Réduire les messages ↑', 'Nachrichten einklappen ↑', '收起信息 ↑');
    if (status) status.textContent = t(`已看見 ${visibleCount}／${total} 則`, `Showing ${visibleCount} of ${total}`, `${total}件中${visibleCount}件を表示`, `Mostrando ${visibleCount} de ${total}`, `${visibleCount} sur ${total} affichés`, `${visibleCount} von ${total} angezeigt`, `已看见 ${visibleCount}／${total} 则`);
};

// 📦 接近互動房間後才載入其即時資料
function subscribeOtherRooms() {
    // 2. 監聽星星 (修正全域變數綁定)
    if (ACTIVE_ROOM === 'm') realtimeLifecycle.track(onSnapshot(query(collection(db, "stars"), where("createdAt", ">", publicContentCutoff()), orderBy("createdAt", "desc"), firestoreLimit(80)), (snapshot) => {
        let tempStars = [];
        snapshot.forEach((docSnap) => { tempStars.push({ id: docSnap.id, ...docSnap.data() }); });
        
        roomMStars.setStars(tempStars, id => window.EmpathSafety?.isHidden('stars', id));
        window.starMessages = roomMStars.getStars();
        
        if(typeof window.updateMStats === 'function') window.updateMStats();
        refreshRoomCount('m');
        if(starsRafId) cancelAnimationFrame(starsRafId);
        starsRafId = null;
        const _sl = document.getElementById('star-loading'); if(_sl) _sl.style.display = 'none';
        setDataState('m',snapshot.empty ? 'empty' : null);
        if(typeof window.drawStars === 'function') window.drawStars();
        updateCountersUI();
    },error => { const _sl = document.getElementById('star-loading'); if(_sl) _sl.style.display = 'none'; handleDataError('m',error); }));

    // 3. 監聽星系金線
    if (ACTIVE_ROOM === 'm') realtimeLifecycle.track(onSnapshot(query(collection(db, "constellations"), orderBy("createdAt", "desc"), firestoreLimit(50)), (snapshot) => {
        const nowMs = Date.now();
        window.activeConstellations = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const createdAtMs = data.createdAt ? data.createdAt.seconds * 1000 : Date.now();
            const createdDate = new Date(createdAtMs);
            const today = new Date();
            if (createdDate.toDateString() !== today.toDateString()) return;
            window.activeConstellations.push({ s1Id: data.s1Id, s2Id: data.s2Id, createdAt: createdAtMs });
        });
    }));

    // 4. 監聽碎片與金繼進度；畫面只渲染目前需要的批次
    if (ACTIVE_ROOM === 'p') realtimeLifecycle.track(onSnapshot(query(collection(db, "shards"), where("createdAt", ">", publicContentCutoff()), orderBy("createdAt", "desc"), firestoreLimit(60)), (snapshot) => {
        const board = document.getElementById('p-board'); if(!board) return;
        const records = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data(); const id = docSnap.id; 
            records.push({ id, data });
        });
        roomPShards.setRecords(records, id => window.EmpathSafety?.isHidden('shards', id));
        roomPShards.reconcileTotals({ total:snapshot.size, healed:globalCounts.p });
        syncRoomPLegacyState();
        globalCounts.p = window.pHealedTotal;
        updatePHealingProgress();
        
        if(typeof window.drawKintsugiVessel === 'function') window.drawKintsugiVessel();
        updateDynamicTexts();
        updateCountersUI();

        document.dispatchEvent(new CustomEvent('empath:p-shards-updated', {
            detail: { total: roomPShards.getRecords().length }
        }));
        setDataState('p',snapshot.empty ? 'empty' : null);
        refreshRoomCount('p');
        scheduleRoomTargetStabilization();
    },error => handleDataError('p',error)));

    // 5. 監聽沙畫
    if (ACTIVE_ROOM === 'a') realtimeLifecycle.track(onSnapshot(query(
        collection(db, "sand"),
        where("expireAt", ">", roomAQueryCutoff()),
        orderBy("expireAt", "asc"),
        firestoreLimit(30)
    ), (snapshot) => {
        const feed = document.getElementById('a-feed'); if(!feed) return;
        feed.innerHTML = ''; const nowMs = Date.now();
        snapshot.forEach(docSnap => {
            if (window.EmpathSafety?.isHidden('sand', docSnap.id)) return;
            const data = docSnap.data();
            const msgTime = data.absoluteTime || (data.createdAt ? data.createdAt.seconds * 1000 : nowMs);
            const lifespanMs = data.lifespan || (24 * 60 * 60 * 1000);
            const expiresAt = data.expireAt?.toMillis?.() || (msgTime + lifespanMs);
            const leftSecs = (expiresAt - nowMs) / 1000;
            if(leftSecs <= 0) return;
            const div = document.createElement('div'); div.className = 'sand-msg';
            div.dataset.contentId = docSnap.id;
            div.dataset.expires = expiresAt; div.dataset.lifespan = lifespanMs;
            const pct = Math.max(0, Math.min(100, (leftSecs / (lifespanMs / 1000)) * 100));
            const overlay = document.createElement('div'); overlay.className = 'sand-dissolve-overlay';
            const message = document.createElement('div'); message.className = 'sand-msg-text';
            message.textContent = typeof data.text === 'string' ? data.text : '';
            const timer = document.createElement('div'); timer.className = 'sand-timer-wrap notranslate';
            const timerLabel = document.createElement('div'); timerLabel.className = 'sand-timer-label'; timerLabel.textContent = 'DISSOLVING';
            const timerBar = document.createElement('div'); timerBar.className = 'sand-timer-bar';
            const timerFill = document.createElement('div'); timerFill.className = 'sand-timer-fill'; timerFill.style.width = pct + '%';
            const timeLeft = document.createElement('div'); timeLeft.className = 'sand-time-left'; timeLeft.textContent = formatTimeLeft(Math.floor(leftSecs));
            const actions = window.EmpathSafety?.createContentActions('sand', docSnap.id, () => div.remove());
            timerBar.appendChild(timerFill); timer.append(timerLabel, timerBar, timeLeft); div.append(overlay, message, timer, actions || document.createDocumentFragment());
            feed.appendChild(div);
        });
        setDataState('a',feed.children.length ? null : 'empty');
        refreshRoomCount('a');
        updateCountersUI();
        scheduleRoomTargetStabilization();
    },error => handleDataError('a',error)));

    // 6. 監聽溫暖共振
    if (ACTIVE_ROOM === 't') realtimeLifecycle.track(onSnapshot(query(collection(db, "warmth"), where("createdAt", ">", publicContentCutoff()), orderBy("createdAt", "desc"), firestoreLimit(30)), (snapshot) => {
        const feed = document.getElementById('t-feed'); if(!feed) return;
        const records = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data(); const id = docSnap.id;
            records.push({ id, data });
        });
        roomTFeed.setRecords(records);
        window.tWarmthRecords = roomTFeed.getRecords();
        window.renderTWarmthFeed();
        setDataState('t',snapshot.empty ? 'empty' : null);
        refreshRoomCount('t');
        updateCountersUI();
        scheduleRoomTargetStabilization();
    },error => handleDataError('t',error)));
}
  
function unsubscribeAll() {
    if (otherRoomsObserver) otherRoomsObserver.disconnect();
    otherRoomsObserver = null;
    otherRoomsSubscribed = false;
    realtimeLifecycle.stop();
}

function subscribeSiteStats() {
    const metaRef = doc(db, 'metadata', 'site_stats');
    realtimeLifecycle.track(onSnapshot(metaRef, docSnap => {
        if (!docSnap.exists()) return;
        globalCounts.v = docSnap.data().totalVisitors || 0;
        updateCountersUI();
    }, error => console.error('Site visitor total failed:', error)));
}

function subscribePublicRoomStats() {
    const metaRef = doc(db, 'metadata', 'public_room_stats');
    realtimeLifecycle.track(onSnapshot(metaRef, docSnap => {
        if (!docSnap.exists()) return;
        const stats = docSnap.data();
        globalCounts.e = Number(stats.emotions) || 0;
        globalCounts.m = Number(stats.stars) || 0;
        roomPShards.setTotals({ total:stats.shards, healed:stats.healedShards });
        syncRoomPLegacyState();
        globalCounts.p = window.pHealedTotal;
        globalCounts.t = Number(stats.warmth) || 0;
        updatePHealingProgress();
        window.updateMStats?.();
        window.drawKintsugiVessel?.();
        updateDynamicTexts();
        updateCountersUI();
    }, error => console.error('Public room totals failed:', error)));
}

function subscribeRealtimeData() {
    realtimeLifecycle.start(() => {
        // Room feeds precede counters because subscribeAll guards tracked listeners.
        subscribeAll();
        subscribeRoomAReleaseStats();
        subscribePublicRoomStats();
        subscribeSiteStats();
    });
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        isAnimating = false;
        if (starsRafId) cancelAnimationFrame(starsRafId);
        if (sandRafId) cancelAnimationFrame(sandRafId);
        unsubscribeAll();
        return;
    }
    subscribeRealtimeData();
    if (!document.body.classList.contains('hsp-mode')) {
        isAnimating = true;
        if (typeof window.drawStars === 'function') window.drawStars();
        if (typeof window.drawSand === 'function') window.drawSand();
    }
});

window.addEventListener('pagehide', unsubscribeAll);
window.addEventListener('pageshow', event => {
    if (event.persisted) subscribeRealtimeData();
});

window.toggleHSP = function() { const body = document.body; const btn = document.getElementById('hsp-btn'); body.classList.toggle('hsp-mode'); if(body.classList.contains('hsp-mode')) { btn.classList.add('active'); safeLocalStorage.setItem('empath_hsp_mode', 'true'); if (typeof audioCtx !== 'undefined' && isAudioEnabled) window.toggleAudio(); isAnimating = false; if(starsRafId) cancelAnimationFrame(starsRafId); if(sandRafId) cancelAnimationFrame(sandRafId); window.showToast(t('👁️ 已開啟降噪模式：降低對比與暫停閃爍', '👁️ Calm mode activated', '👁️ 静寂モードをオンにしました', '👁️ Modo Calma activado', '👁️ Mode Calme activé', '👁️ Ruhemodus aktiviert', '👁️ 已开启降噪模式：降低对比与暂停闪烁')); } else { btn.classList.remove('active'); safeLocalStorage.setItem('empath_hsp_mode', 'false'); isAnimating = true; if(typeof window.drawStars === 'function') window.drawStars(); if(typeof window.drawSand === 'function') window.drawSand(); window.showToast(t('已關閉降噪模式', 'Calm mode deactivated', '静寂モードをオフにしました', 'Modo Calma desactivado', 'Mode Calme désactivé', 'Ruhemodus deaktiviert', '已关闭降噪模式')); } }

