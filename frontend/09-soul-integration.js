function nowStr(){ const d = new Date(); return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0'); }

function logJourney(type, text){ const time = nowStr(); journeyData.counters[type] = (journeyData.counters[type] || 0) + 1; journeyData.events.push({ type, text, time }); safeLocalStorage.setItem('empath_user_journey', JSON.stringify(journeyData)); state[type+'Count']++; renderTimelineHTML(type, text, time); autoBackupToCloud(); updateCountersUI(); }
const soulView = createSoulView({
    document,
    t,
    getLanguage:() => window.currentLang,
    getJourney:() => journeyData
});
const { renderTimelineHTML, initTimeline } = soulView;

const { readSoulBackup, writeSoulBackup, retireLegacySoulBackup } = createSoulBackupService({
    readRecord:id => getDoc(doc(db, 'user_journeys', id)),
    writeRecord:(id, record) => setDoc(doc(db, 'user_journeys', id), record),
    serverTimestamp,
    retireLegacy:retireLegacySoulJourneyRequest,
    onCleanupError:error => console.warn('Encrypted Soul backup saved, but legacy cleanup will be retried later:', error)
});

const soulActions = createSoulActions({
    getJourney:() => journeyData,
    applyJourney,
    setKey:key => safeLocalStorage.setItem('empath_soul_key', key),
    removeKey:() => safeLocalStorage.removeItem('empath_soul_key'),
    readSoulBackup,
    writeSoulBackup,
    retireLegacySoulBackup,
    deleteSoulJourney:deleteSoulJourneyRequest
});

function applyJourney(nextJourney) {
    journeyData = normalizeJourney(nextJourney);
    safeLocalStorage.setItem('empath_user_journey', JSON.stringify(journeyData));
    ['e','m','p','a','t'].forEach(type => { state[type + 'Count'] = journeyData.counters[type] || 0; });
    const timeline = document.getElementById('h-events');
    if (timeline) { timeline.innerHTML = ''; initTimeline(); }
    updateCountersUI();
}

function generateSoulKey() {
    // New keys use 128 bits of browser-generated entropy. Existing two-block
    // keys remain readable so no one loses a journey created before v20.3.
    const bytes = new Uint8Array(16);
    if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
    else bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256); });
    const token = Array.from(bytes, byte => byte.toString(36).toUpperCase().padStart(2, '0')).join('');
    return `EMP-${token.match(/.{1,8}/g).join('-')}`;
}

window.createSoulKey = async function() {
    const soulKey = generateSoulKey();
    safeLocalStorage.setItem('empath_soul_key', soulKey);
    await autoBackupToCloud();
    updateSyncUI();
    window.showToast(t('靈魂鑰匙已生成，請妥善保存 ✦', 'Key generated — keep it somewhere safe ✦', '鍵が生成されました ✦', '¡Llave generada!', 'Clé générée !', 'Schlüssel generiert!', '灵魂钥匙已生成，请妥善保存 ✦'));
    return soulKey;
}
window.copySoulKey = function() { const key = safeLocalStorage.getItem('empath_soul_key'); if (key) { navigator.clipboard.writeText(key).then(() => { const btn = document.getElementById('copy-key-btn'); const originalText = btn.innerHTML; btn.innerHTML = t('✓ 已複製', '✓ Copied', '✓ コピー済', '✓ Copiado', '✓ Copié', '✓ Kopiert', '✓ 已复制'); btn.style.color = '#fff'; btn.style.borderColor = '#fff'; window.showToast(t('🗝️ 鑰匙已複製到剪貼簿', '🗝️ Key copied', '🗝️ キーをコピーしました', '🗝️ Llave copiada', '🗝️ Clé copiée', '🗝️ Schlüssel kopiert', '🗝️ 钥匙已复制到剪贴板')); setTimeout(() => { btn.innerHTML = originalText; btn.style.color = 'var(--gold)'; btn.style.borderColor = 'var(--gold)'; }, 2000); }).catch(err => { window.showToast('複製失敗 / Copy failed'); }); } }
window.loadExistingSoulKey = async function() {
    const input = document.getElementById('sync-key-input');
    const key = input?.value.trim().toUpperCase() || '';
    const validLegacyKey = /^EMP-[A-Z0-9]{4,12}-[A-Z0-9]{4,12}$/.test(key);
    const validV203Key = /^EMP-(?:[A-Z0-9]{8}-){3}[A-Z0-9]{8}$/.test(key);
    if(!validLegacyKey && !validV203Key) {
        window.showToast(t('鑰匙格式不正確', 'That key format is not valid', '鍵の形式が正しくありません', 'Formato de llave inválido', 'Format de clé invalide', 'Ungültiges Schlüsselformat', '钥匙格式不正确'));
        return;
    }
    const lookupThrottle = window.EmpathSafety?.allowAction('soul-key-load', {
        cooldownMs:3000,
        dailyLimit:12
    }) || { allowed:true };
    if (!lookupThrottle.allowed) {
        window.showToast(t('嘗試次數較多，請稍後再同步。', 'Too many attempts. Please wait before syncing again.'));
        return;
    }
    try {
        const loaded = await soulActions.loadExistingKey(key);
        if(!loaded) {
            window.showToast(t('未找到此鑰匙', 'Key not found', '鍵が見つかりません', 'Llave no encontrada', 'Clé introuvable', 'Schlüssel nicht gefunden', '未找到此钥匙'));
            return;
        }
        updateSyncUI();
        window.showToast(t('足跡已安全合併，沒有覆蓋本機紀錄 ✦', 'Footprints merged without replacing this device ✦', '足跡が安全に統合されました ✦', 'Huellas combinadas con seguridad ✦', 'Empreintes fusionnées en sécurité ✦', 'Spuren wurden sicher zusammengeführt ✦', '足迹已安全合并，没有覆盖本机记录 ✦'));
        input.value='';
    } catch(err) {
        console.error("發生錯誤:", err);
        window.showToast(t('同步暫時失敗，原有足跡仍保留', 'Sync failed for now; your local footprints are still safe'));
    }
}
window.unlinkSoulKey = function() { if(confirm(t('確定要解除綁定嗎？', 'Unlink your device?', '連携を解除しますか？', '¿Desvincular tu dispositivo?', 'Dissocier votre appareil ?', 'Gerät entkoppeln?', '确定要解除绑定吗？'))) { safeLocalStorage.removeItem('empath_soul_key'); updateSyncUI(); } }
const autoBackupToCloud = createSoulAutoBackup({
    getKey:() => safeLocalStorage.getItem('empath_soul_key'),
    getJourney:() => journeyData,
    readSoulBackup,
    writeSoulBackup,
    retireLegacySoulBackup,
    onError:error => console.error('Encrypted Soul backup failed:', error)
});
const updateSyncUI = createSoulSyncUI({
    getElement:id => document.getElementById(id),
    getKey:() => safeLocalStorage.getItem('empath_soul_key'),
    checkFutureLetters:() => window.checkFutureLetters()
});

