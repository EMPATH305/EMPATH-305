// ==========================================
// 改寫：E房間 送出與渲染邏輯 (支援文字與圖片)
// ==========================================
window.submitE = async function(){ 
    const { contentMode, deliveryMode } = roomEController.getState();
    let text = "";
    let imageData = null;

    if (contentMode === 'text') {
        const input = document.getElementById('e-input'); 
        text = input.value.trim(); 
        if(!text) return; 
        text = prepareSubmittedText(text); 
    } else {
        if(!roomECanvas.hasDrawing()) return;
        imageData = roomECanvas.toDataURL('image/webp', 0.8);
    }
    if (deliveryMode === 'drift' && text && containsCrisisSignal(text)) {
        window.showCrisisSupportNotice?.();
        window.showToast(t('這段重量不會被隨機交給陌生人；文字仍留在這裡，我們先陪你找到即時支持。', 'This weight will not be sent randomly to a stranger. Your words remain here while we help you find immediate support.'));
        return;
    }
    if(!canSubmit(deliveryMode === 'drift' ? 'e-drift-send' : 'e')) return;

    try { 
        const origText = document.getElementById('e-submit-btn').innerHTML; 
        if (deliveryMode === 'drift') {
            await roomEController.submitContent({ text });
            document.getElementById('e-input').value = '';
            document.getElementById('e-char').textContent = '0 / 500';
            if(window.empathAnalytics) window.empathLogEvent(window.empathAnalytics, 'room_e_drift_send');
            logJourney('e', text);
            window.storeSessionEcho?.(text);
            window.empathContrastMoment?.();
            playRitual('e-submit-btn', origText);
            window.showToast(t('信已裝進瓶子，開始漂流 ✦', 'Your letter is drifting now ✦', '手紙は瓶に入り、漂い始めました ✦', 'Tu carta ya está a la deriva ✦', 'Votre lettre dérive maintenant ✦', 'Dein Brief treibt jetzt davon ✦', '信已装进瓶子，开始漂流 ✦'));
            queueTonightEcho('e');
            return;
        }
        const payload = {};
        if (text) payload.text = text;
        if (imageData) payload.image = imageData;

        await roomEController.submitContent(payload);
        if (contentMode === 'text') {
            document.getElementById('e-input').value = '';
            document.getElementById('e-char').textContent = '0 / 500';
        } else {
            window.clearEDraw();
        }
        if(window.empathAnalytics) window.empathLogEvent(window.empathAnalytics, 'room_e_submit');
        
        logJourney('e', text ? text : '[已釋放的無言重量 / A silent weight released]');
        if (text) window.storeSessionEcho?.(text);
        window.empathContrastMoment?.();

        // --- 🌟 父親節溫柔彩蛋邏輯 開始 ---
        const checkText = text || '';
        const fatherKeywords = /爸爸|父親|老爸|爸|Dad|father|阿公|爺爺/i;
        
        if (fatherKeywords.test(checkText)) {
            // 🎬 1. 屏息瞬間：隱藏輸入框與按鈕，並加上平滑過渡
            const inputArea = document.querySelector('.input-area');
            const submitBtn = document.getElementById('e-submit-btn');
            if(inputArea) inputArea.style.opacity = '0';
            if(submitBtn) submitBtn.style.opacity = '0';
            
            // 🎬 2. 空間共振：觸發全畫面金色漣漪
            if(typeof window.createEchoRipple === 'function') {
                window.createEchoRipple({clientX: window.innerWidth / 2, clientY: window.innerHeight / 2});
            }

            // 🎬 3. 原音重現：讓使用者自己的文字化作星光
            const starText = document.createElement('div');
            starText.className = 'star-message';
            // 擷取前 30 個字，讓畫面保持詩意
            let showText = text.length > 30 ? text.substring(0, 30) + '...' : text;
            const received = document.createElement('span');
            received.style.cssText = 'font-size:12px; opacity:0.6; margin-top:16px; display:block; letter-spacing:4px;';
            received.textContent = '宇宙收到了 ✦';
            starText.append(document.createTextNode(`「 ${showText} 」`), document.createElement('br'), received);
            starText.style.textAlign = 'center';
            starText.style.lineHeight = '2';
            document.body.appendChild(starText);
            
            // 🎬 4. 蒲公英星火爆發 (80顆向外炸開)
            for(let i = 0; i < 80; i++) {
                let spark = document.createElement('div');
                spark.style.position = 'fixed';
                spark.style.top = '50%';
                spark.style.left = '50%';
                let size = Math.random() * 4 + 1.5; 
                spark.style.width = size + 'px';
                spark.style.height = size + 'px';
                // 混合深金與極亮白金，製造層次感
                spark.style.backgroundColor = Math.random() > 0.4 ? '#C9A84C' : '#FFF8DC'; 
                spark.style.borderRadius = '50%';
                spark.style.boxShadow = '0 0 15px #C9A84C';
                spark.style.pointerEvents = 'none';
                spark.style.zIndex = '9998'; 
                spark.style.mixBlendMode = 'screen'; // 讓光點疊加時更亮
                
                // 計算向四面八方炸開的軌跡
                let angle = Math.random() * Math.PI * 2;
                let distance = Math.random() * window.innerWidth * 0.4; 
                let tx = Math.cos(angle) * distance;
                let ty = Math.sin(angle) * distance - (Math.random() * window.innerHeight * 0.6);
                
                spark.animate([
                    { transform: `translate(-50%, -50%) scale(0)`, opacity: 1 },
                    { transform: `translate(calc(-50% + ${tx * 0.3}px), calc(-50% + ${Math.sin(angle)*150}px)) scale(1.5)`, opacity: 1, offset: 0.3 }, // 瞬間炸開
                    { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 } // 緩緩升空消失
                ], {
                    duration: 3500 + Math.random() * 4000, 
                    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', // 像煙火一樣，一開始快，後面慢
                    fill: 'forwards'
                });
                document.body.appendChild(spark);
                setTimeout(() => spark.remove(), 8000); 
            }

            // 🎵 5. 觸發水晶音效
            if(typeof window.playChime === 'function') window.playChime();
            
            // 6. 復原場景：5秒後清空文字，恢復原本的輸入框
            setTimeout(() => {
                if(starText.parentNode) starText.remove();
                if(inputArea) inputArea.style.opacity = '1';
                if(submitBtn) submitBtn.style.opacity = '1';
            }, 5500);

            if(window.empathAnalytics) window.empathLogEvent(window.empathAnalytics, 'fathers_day_egg_triggered');
            window.showToast("已化作星光，溫柔升空 ✦"); 
        } else {
            // 正常情況：播放原本的下墜動畫與提示
            playRitual('e-submit-btn', origText); 
            window.showToast(t('已投入黑暗', 'Cast into the dark', '闇に投じました', 'Lanzado a la oscuridad', 'Jeté dans l\'obscurité', 'In die Dunkelheit geworfen', '已投入黑暗')); 
        }
        // --- 🌟 父親節溫柔彩蛋邏輯 結束 ---
        queueTonightEcho('e');

    } catch(error) {
        if (deliveryMode === 'drift' && String(error?.code || '').endsWith('failed-precondition')) {
            window.showCrisisSupportNotice?.();
            window.showToast(t('這封信不適合隨機交給陌生人，文字仍為你保留。', 'This letter should not be delivered randomly to a stranger. Your words are still here.'));
        } else {
            showRoomSubmissionError(error);
        }
    }
}

function clearDisplayedDriftLetter(message = '') {
    const letter = document.getElementById('e-drift-letter');
    const text = document.getElementById('e-drift-letter-text');
    const actions = document.getElementById('e-drift-letter-actions');
    if (letter) {
        letter.hidden = true;
        letter.removeAttribute('data-letter-id');
    }
    text?.replaceChildren();
    actions?.replaceChildren();
    const status = document.getElementById('e-drift-status');
    if (status) status.textContent = message;
}

window.receiveDriftLetter = async function() {
    const button = document.getElementById('e-drift-receive-btn');
    const status = document.getElementById('e-drift-status');
    const letter = document.getElementById('e-drift-letter');
    const text = document.getElementById('e-drift-letter-text');
    const actions = document.getElementById('e-drift-letter-actions');
    if (!button || !status || !letter || !text || !actions || button.disabled) return;
    const throttle = window.EmpathSafety?.allowAction('drift-receive', {
        cooldownMs:30000,
        dailyLimit:8
    }) || { allowed:true };
    if (!throttle.allowed) {
        status.textContent = throttle.reason === 'daily-limit'
            ? t('今天已經拾起許多信了，讓其他人也遇見一封吧。', 'You have picked up several letters today. Leave some encounters for others.')
            : t(`海浪還沒回來，請再等 ${throttle.retrySeconds || 1} 秒。`, `The tide has not returned. Please wait ${throttle.retrySeconds || 1} seconds.`);
        return;
    }
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    status.textContent = t('正在聽海面上的聲音……', 'Listening across the water…', '水面の声に耳を澄ませています……', 'Escuchando sobre el agua…', 'À l’écoute de l’eau…', 'Wir lauschen über dem Wasser…', '正在听海面上的声音……');
    try {
        const result = await roomEController.receivePrivateLetter();
        if (!result?.available || typeof result.id !== 'string' || typeof result.text !== 'string') {
            clearDisplayedDriftLetter(t('今天海面很安靜。也許下一封信還在路上。', 'The water is quiet today. Perhaps the next letter is still on its way.', '今日は水面が静かです。次の手紙はまだ旅の途中かもしれません。', 'Hoy el agua está tranquila. Quizá la próxima carta siga en camino.', 'L’eau est calme aujourd’hui. La prochaine lettre est peut-être encore en route.', 'Heute ist das Wasser still. Vielleicht ist der nächste Brief noch unterwegs.', '今天海面很安静。也许下一封信还在路上。'));
            return;
        }
        letter.dataset.letterId = result.id;
        text.textContent = result.text;
        const safetyActions = window.EmpathSafety?.createContentActions('drift_letters', result.id, () => {
            clearDisplayedDriftLetter(t('這封信已從你的眼前淡去。', 'The letter has faded from view.'));
        });
        actions.replaceChildren(safetyActions || document.createDocumentFragment());
        letter.hidden = false;
        status.textContent = '';
        if(window.empathAnalytics) window.empathLogEvent(window.empathAnalytics, 'room_e_drift_receive');
        letter.scrollIntoView({ behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center' });
    } catch (error) {
        console.error('Drift letter receive failed:', error);
        status.textContent = String(error?.code || '').endsWith('resource-exhausted')
            ? t('今天已經拾起許多信了，晚一點再回來。', 'You have picked up several letters today. Please return later.')
            : t('暫時聽不見海面上的信，請稍後再試。', 'No letter can be heard right now. Please try again later.');
    } finally {
        button.disabled = false;
        button.removeAttribute('aria-busy');
    }
};

const canvas = document.getElementById('star-canvas'); const ctx = canvas?.getContext('2d') || null; const tooltip = document.getElementById('star-tooltip'); const roomM = document.getElementById('room-m'); let bgStars=[]; let activeStarId = null; const STAR_COLORS = ROOM_M_STAR_COLORS;
window.resizeCanvas = function(target = 'all'){ 
    const dpr = window.devicePixelRatio || 1; 
    
    if((target === 'all' || target === 'm') && canvas && roomM) { 
        const w = roomM.clientWidth;
        const h = Math.max(roomM.scrollHeight, roomM.offsetHeight, 600);
        canvas.width = w * dpr; 
        canvas.height = h * dpr; 
        canvas.style.width = w + 'px'; 
        canvas.style.height = h + 'px'; 
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 
        initBgStars(w, h); 
        // 旋轉裝置或行動瀏覽器改變可視高度時，依新星空區重新定位。
        roomMStars.resetLayout();
    } 
    
    const sCanvas = document.getElementById('sand-canvas'); 
    const roomA = document.getElementById('room-a'); 
    if((target === 'all' || target === 'a') && sCanvas && roomA) { 
        const sw = roomA.scrollWidth; 
        const sh = roomA.scrollHeight; 
        sCanvas.width = sw * dpr; 
        sCanvas.height = sh * dpr; 
        sCanvas.style.width = sw + 'px'; 
        sCanvas.style.height = sh + 'px'; 
        sCanvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); 
        initSandBg(sw, sh); 
    } 
}
  
