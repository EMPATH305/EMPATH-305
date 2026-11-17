// 提早載入語音庫，避免第一次點擊沒聲音
if ('speechSynthesis' in window) window.speechSynthesis.getVoices();

window.speakText = function(text) { 
    if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(text); 
        const langs = { 'zh': 'zh-TW', 'zh-cn': 'zh-CN', 'en': 'en-US', 'en-uk': 'en-GB', 'ja': 'ja-JP', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE' }; 
        utterance.lang = langs[window.currentLang] || 'zh-TW'; 
        
        // 降低語速與音調，聽起來更有溫度
        utterance.rate = 0.85; 
        utterance.pitch = 0.95; 

        // 強制尋找手機/電腦裡的高級(Premium)或自然人聲
        const voices = window.speechSynthesis.getVoices();
        const bestVoice = voices.find(v => v.lang.includes(utterance.lang) && (v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Google') || v.name.includes('Mei-Jia')));
        if (bestVoice) utterance.voice = bestVoice;

        window.speechSynthesis.speak(utterance); 
        window.showToast(t('🔉 語音導航朗讀中...', '🔉 Reading...', '🔉 読み上げ中...', '🔉 Leyendo...', '🔉 Lecture...', '🔉 Lesen...', '🔉 语音导航朗读中...')); 
    } 
};

window.triggerHeartbeat = function() { if ('vibrate' in navigator) { navigator.vibrate([40, 120, 40]); } };

window.shareSite = function() { 
    const text = t(
        '我發現了一個很溫暖的地方，可以在數位時代安放情緒。來這裡看看吧：', 
        'I found a beautiful emotional sanctuary. Come take a look:', 
        '温かい場所を見つけました。ここで感情を休めてみませんか：', 
        'Encontré un hermoso santuario emocional. Ven a echar un vistazo:', 
        'J\'ai trouvé un magnifique sanctuaire émotionnel.', 
        'Ich habe ein wunderschönes emotionales Heiligtum gefunden.', 
        '我发现了一个很温暖的地方，可以在数字时代安放情绪。来这里看看吧：'
    ); 
    
    if (navigator.share) { 
        navigator.share({ title: 'EMPATH', text: text, url: window.location.href }).catch(console.error); 
    } else { 
        // 絕對安全的備用剪貼簿方案
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text + " " + window.location.href;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            textArea.remove();
            window.showToast(t('網址已複製！快去傳給需要的人吧 ✦', 'Link copied! Pass it to someone in need ✦', 'リンクをコピーしました！', '¡Enlace copiado!', 'Lien copié !', 'Link kopiert!', '网址已复制！快去传给需要的人吧 ✦')); 
        } catch (err) {
            window.showToast('複製失敗，請手動分享網址 ✦');
        }
    } 
};
  
window.openShareCard = function(customQuote) {
    document.getElementById('sc-e').textContent = state.eCount;
    document.getElementById('sc-m').textContent = state.mCount;
    document.getElementById('sc-p').textContent = state.pCount;
    document.getElementById('sc-a').textContent = state.aCount;
    document.getElementById('sc-t').textContent = state.tCount;
    const quoteBox = document.getElementById('sc-quote-box');
    if (quoteBox) {
        if (customQuote && typeof customQuote === 'string' && customQuote.trim()) {
            quoteBox.textContent = `「${customQuote.trim()}」`;
            quoteBox.style.display = 'block';
        } else {
            quoteBox.style.display = 'none';
            quoteBox.textContent = '';
        }
    }
    const modal = document.getElementById('share-modal');
    modal.classList.add('show');
    activateEmpathDialog(modal, document.getElementById('download-card-btn'));
};

window.shareEchoAsCard = function() {
    const echoText = document.getElementById('tonight-echo-copy')?.textContent || '';
    window.closeTonightEcho?.();
    window.setTimeout(() => window.openShareCard(echoText), 180);
};

window.shareFortuneAsCard = function() {
    const rawText = document.getElementById('fortune-text')?.textContent || '';
    const cleaned = rawText.replace(/[「」]/g, '').trim();
    window.closeFortune?.();
    window.setTimeout(() => window.openShareCard(cleaned), 180);
};
  window.downloadShareCard = async function() { 
       if(window.empathAnalytics) window.empathLogEvent(window.empathAnalytics, 'generate_soul_card');
  const btn = document.getElementById('download-card-btn'); 
    const originalText = btn.textContent; 
    btn.textContent = t('圖片生成中 ⏳','Generating... ⏳','生成中 ⏳','Generando... ⏳','Génération... ⏳','Wird generiert... ⏳','图片生成中 ⏳'); 

    // ✨ 動態載入 html2canvas
    if (typeof window.html2canvas === 'undefined') { 
        window.showToast(t('圖片生成引擎載入中... ✦','Loading engine...','エンジンを読み込み中...','Cargando motor...','Chargement du moteur...','Lade Engine...','图片生成引擎载入中... ✦'));
        try {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        } catch (err) {
            console.error("html2canvas 載入失敗:", err);
            btn.textContent = originalText;
            window.showToast(t('載入失敗 ✦', 'Load failed', '失敗しました', 'Fallo al cargar', 'Échec', 'Fehlgeschlagen', '载入失败 ✦'));
            return;
        }
    } 

    const card = document.getElementById('wrapped-card-content'); 
    try {
        const canvas = await window.html2canvas(card, { backgroundColor: '#0a111a', scale: 2 });
        const imgData = canvas.toDataURL('image/png'); 
        card.style.display = 'none'; 
        
        let existingImg = document.getElementById('generated-card-img'); 
        if(existingImg) existingImg.remove(); 
        
        const imgEl = document.createElement('img'); 
        imgEl.src = imgData; 
        imgEl.id = 'generated-card-img'; 
        imgEl.style.cssText = 'width:100%; max-width:320px; border-radius:4px; box-shadow:0 10px 40px rgba(0,0,0,0.8);'; 
        card.parentNode.insertBefore(imgEl, document.querySelector('.share-modal-actions')); 
        btn.style.display = 'none'; 
        
        let hint = document.getElementById('save-hint'); 
        if(!hint) { 
            hint = document.createElement('p'); 
            hint.id = 'save-hint'; 
            hint.style.cssText = 'color:var(--gold); font-size:12px; margin-bottom:16px; font-weight:bold;'; 
            document.querySelector('.share-modal-actions').prepend(hint); 
        } 
        hint.textContent = t('✨ 圖片已洗出！請「長按上方圖片」儲存或分享', '✨ Image generated! Long press to save.', '✨ 画像が生成されました！長押しで保存', '✨ ¡Imagen generada! Mantén presionado para guardar.', '✨ Image générée ! Appui long pour enregistrer.', '✨ Bild generiert! Langes Drücken zum Speichern.', '✨ 图片已洗出！请「长按上方图片」储存或分享'); 
        hint.style.display = 'block'; 
        window.showToast(t('圖片已生成！請長按儲存 ✦', 'Success! Long press to save', '成功しました！', '¡Éxito!', 'Succès !', 'Erfolg!', '图片已成功生成！请长按储存 ✦')); 
        
    } catch(err) { 
        console.error("生成錯誤:", err);
        btn.textContent = originalText; 
        window.showToast('生成失敗'); 
    } 
}
  
window.closeShareModal = function() { const modal = document.getElementById('share-modal'); modal.classList.remove('show'); deactivateEmpathDialog(modal); setTimeout(() => { document.getElementById('wrapped-card-content').style.display = 'block'; const img = document.getElementById('generated-card-img'); if(img) img.remove(); document.getElementById('download-card-btn').style.display = 'inline-block'; document.getElementById('download-card-btn').textContent = t('⬇️ 下載為專屬圖片檔案', '⬇️ Download Exclusive Card', '⬇️ 専用画像としてダウンロード', '⬇️ Descargar Tarjeta Exclusiva', '⬇️ Télécharger la carte', '⬇️ Exklusive Karte herunterladen', '⬇️ 下载为专属图片档案'); const hint = document.getElementById('save-hint'); if(hint) hint.style.display = 'none'; }, 400); }
window.openPrivacy = function() { 
    const modal = document.getElementById('privacy-modal');
    modal.classList.add('show');
    activateEmpathDialog(modal, document.getElementById('privacy-close-btn'));
}
window.closePrivacy = function() { 
    const modal = document.getElementById('privacy-modal');
    modal.classList.remove('show');
    deactivateEmpathDialog(modal);
}

window.openCreator = function() { const modal = document.getElementById('creator-modal'); modal.classList.add('show'); activateEmpathDialog(modal); }
window.closeCreator = function() { const modal = document.getElementById('creator-modal'); modal.classList.remove('show'); deactivateEmpathDialog(modal); }

window.showCrisisSupportNotice = function() {
    const notice = document.getElementById('crisis-support-notice');
    if (!notice) return;
    notice.hidden = false;
    activateEmpathDialog(notice, document.getElementById('crisis-support-link'));
}
window.closeCrisisSupportNotice = function() {
    const notice = document.getElementById('crisis-support-notice');
    if (!notice) return;
    notice.hidden = true;
    deactivateEmpathDialog(notice);
}

const tonightEchoCopy = {
    e: '你不需要現在就整理好它。能說出來，已經讓重量有了出口。',
    m: '思念沒有消失，但它已經有了一顆可以安放的星。',
    p: '裂痕還在，但你已經開始決定，它不只代表破碎。',
    a: '你不需要再替這段重量保管到永遠。',
    t: '你交出去的溫暖，會在某個陌生人的夜裡留下光。'
};

window.showTonightEcho = function(room) {
    if (window.empathSkipNextEcho || !document.getElementById('crisis-support-notice')?.hidden) {
        window.empathSkipNextEcho = false;
        return;
    }
    const dialog = document.getElementById('tonight-echo');
    const copy = document.getElementById('tonight-echo-copy');
    if (!dialog || !copy) return;
    copy.textContent = tonightEchoCopy[room] || '能在這裡停一下，本身就是一種照顧。';
    dialog.classList.add('show');
    activateEmpathDialog(dialog, document.getElementById('tonight-echo-close'));
};

window.closeTonightEcho = function() {
    const dialog = document.getElementById('tonight-echo');
    if (!dialog) return;
    dialog.classList.remove('show');
    deactivateEmpathDialog(dialog);
};

function queueTonightEcho(room) {
    window.setTimeout(() => window.showTonightEcho?.(room), 850);
}

// ♿ 無障礙最高境界：全局監聽 ESC 鍵，一鍵關閉所有彈窗
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (document.getElementById('privacy-modal')?.classList.contains('show')) window.closePrivacy();
        if (document.getElementById('share-modal')?.classList.contains('show')) window.closeShareModal();
        if (document.getElementById('breathe-overlay')?.classList.contains('show')) window.stopBreathe();
        if (document.getElementById('nebula-overlay')?.classList.contains('show')) window.closeNebula();
        if (document.getElementById('creator-modal')?.classList.contains('show')) window.closeCreator(); // 👈 這裡就是新增的 ESC 關閉公告
        if (document.getElementById('fortune-display')?.classList.contains('show')) window.closeFortune();
        if (!document.getElementById('crisis-support-notice')?.hidden) window.closeCrisisSupportNotice();
        if (document.getElementById('tonight-echo')?.classList.contains('show')) window.closeTonightEcho();
        if (document.getElementById('silent-company-overlay')?.classList.contains('show')) window.stopSilentCompanionship();
        const langList = document.getElementById('lang-dropdown-list');
        if (langList?.classList.contains('show')) {
            langList.classList.remove('show');
            document.getElementById('lang-select-btn')?.setAttribute('aria-expanded', 'false');
        }
    }
});
  
window.showToast = function(msg, dur=2400){ const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), dur); }
