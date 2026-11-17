// ==========================================
// 魔法一：3D 空間環繞聲景 (Spatial Audio)
// ==========================================
window.playSpatialChime = function(panValue) {
    if(!isAudioEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    let panner;
    if (audioCtx.createStereoPanner) {
        panner = audioCtx.createStereoPanner();
        panner.pan.value = panValue;
    } else {
        panner = audioCtx.createGain(); 
    }
    osc.type = 'sine'; osc.frequency.setValueAtTime(432 + Math.random()*200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3); 
    osc.connect(gain); gain.connect(panner); panner.connect(masterGain);
    osc.start(); osc.stop(audioCtx.currentTime + 3);
}

// ==========================================
// 魔法二：手機物理重力感測 (Device Orientation)
// ==========================================
let tiltX = 0, tiltY = 0;
window.enableGravity = async function() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                window.addEventListener('deviceorientation', handleOrientation);
                document.getElementById('gravity-btn').style.display = 'none';
                window.showToast(t('📳 重力已開啟，請輕輕傾斜手機', 'Gravity on. Tilt your phone.', '重力センサーをオンにしました', 'Gravedad activada', 'Gravité activée', 'Schwerkraft an', '📳 重力已开启'));
            }
        } catch (error) { console.error(error); }
    } else {
        window.addEventListener('deviceorientation', handleOrientation);
        document.getElementById('gravity-btn').style.display = 'none';
        window.showToast(t('📳 重力已開啟，請輕輕傾斜手機', 'Gravity on. Tilt your phone.', '重力センサーをオンにしました', 'Gravedad activada', 'Gravité activée', 'Schwerkraft an', '📳 重力已开启'));
    }
}

function handleOrientation(event) {
    tiltX = (event.gamma || 0) * 0.08; 
    tiltY = (event.beta || 0) * 0.08;  
}

// ==========================================
// 魔法四：麥克風物理吹息 (Breath Sensor)
// ==========================================
let micAnalyser = null;
let micDataArray = null;
let blowForce = 0;

window.enableBlow = async function() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        micAnalyser = audioCtx.createAnalyser();
        micAnalyser.fftSize = 256;
        source.connect(micAnalyser);
        micDataArray = new Uint8Array(micAnalyser.frequencyBinCount);
        
        document.getElementById('blow-btn').style.display = 'none';
        window.showToast(t('🌬️ 吹息感測已開啟，請對著麥克風輕輕吹氣', 'Breath sensor on. Blow gently.', '息を吹きかけてください', 'Sensor de soplo activado', 'Capteur de souffle activé', 'Blassensor an', '🌬️ 吹息感测已开启，请对著麦克风轻轻吹气'));
    } catch (err) {
        console.error(err);
        window.showToast(t('無法取得麥克風權限', 'Microphone access denied', 'マイクの権限がありません', 'Permiso denegado', 'Accès refusé', 'Zugriff verweigert', '无法取得麦克风权限'));
    }
}

window.drawSand = function() { 
    const c = document.getElementById('sand-canvas'); 
    if(!c || !c.width || !isAnimating || !roomAVisible) return; 
    if(!document.body.classList.contains('empath-motion-idle')) { sandRafId = null; return; }
    const ctx = c.getContext('2d'); const w = c.offsetWidth; const h = c.offsetHeight; 
    ctx.clearRect(0,0,w,h); 

    // 🌬️ 偵測麥克風音量 (風力)
    if (micAnalyser) {
        micAnalyser.getByteFrequencyData(micDataArray);
        let sum = 0;
        for(let i = 0; i < micDataArray.length; i++) sum += micDataArray[i];
        let avg = sum / micDataArray.length;
        if (avg > 30) {
            blowForce += (avg - 30) * 0.03; // 累積風力
        }
    }
    blowForce *= 0.85; // 風力自然衰減，創造滑順感

    sandParticles.forEach(p => { 
        p.y += p.speedY + tiltY; 
        p.swirlOffset += 0.02; 
        const drift = Math.sin(p.swirlOffset) * 0.6 + p.speedX; 
        
        // 套用吹氣物理學：將沙子往上、往外狂吹
        let windX = (p.x - w/2) * blowForce * 0.015;
        let windY = -blowForce * (1.5 + Math.random());
        
        p.x += drift + tiltX + windX; 
        p.y += windY;

        // 如果被吹到天上去或掉到底下，讓它溫柔地從另一端重新飄回來
        if(p.y > h + 20) { p.y = -10; p.x = Math.random() * w; } 
        if(p.y < -20) { p.y = h + 20; p.x = Math.random() * w; } 
        if(p.x > w + 20) { p.x = -10; } else if (p.x < -20) { p.x = w + 10; }
        
        ctx.globalAlpha = p.opacity; ctx.strokeStyle = p.color; 
        ctx.lineWidth = p.size; ctx.lineCap = 'round'; 
        ctx.beginPath(); ctx.moveTo(p.x, p.y); 
        ctx.lineTo(p.x - drift * 2 - tiltX - windX, p.y - p.speedY * 3 - tiltY - windY); 
        ctx.stroke(); 
    }); 
    ctx.globalAlpha = 1; sandRafId = requestAnimationFrame(window.drawSand); 
}

window.acceptARead = function() { document.getElementById('a-warning-mask').style.display = 'none'; const feed = document.getElementById('a-feed'); feed.style.display = 'flex'; setTimeout(() => feed.style.filter = 'blur(0px)', 50); safeSessionStorage.setItem('empath_a_accepted', 'true'); }
window.hideAFeed = function() { document.getElementById('a-warning-mask').innerHTML = `<p style="color:var(--muted); font-size:13px; line-height:2;">${t('已隱藏他人留言。<br>你的痛苦依然會被這裡安放。', 'Messages hidden.<br>Your pain will still be held here.', '他人のメッセージを非表示にしました。<br>あなたの痛みはここで大切に保管されます。', 'Mensajes ocultos.<br>Tu dolor seguirá siendo sostenido aquí.', 'Messages masqués.<br>Votre douleur sera toujours conservée ici.', 'Nachrichten ausgeblendet.<br>Dein Schmerz wird hier weiterhin bewahrt.', '已隐藏他人留言。<br>你的痛苦依然会被这里安放。')}</p>`; }

function renderRoomACollectiveCount(justReleased = false) {
    const target = document.getElementById('a-collective-count');
    if (!target || roomAReleasedTotal <= 0) return;
    const before = Math.max(0, roomAReleasedTotal - (justReleased ? 1 : 0));
    const zh = justReleased
        ? `在你之前，已有 ${before.toLocaleString()} 個人把一份重量交給了時間。這裡只留下數字，不留下原文。`
        : `至今已有 ${roomAReleasedTotal.toLocaleString()} 份重量被交給時間。這裡只留下數字，不留下原文。`;
    const en = justReleased
        ? `Before you, ${before.toLocaleString()} people gave a weight to time. Only the number remains, never their words.`
        : `${roomAReleasedTotal.toLocaleString()} weights have been given to time. Only the number remains, never the words.`;
    target.setAttribute('data-zh', zh);
    target.setAttribute('data-zh-cn', zh);
    target.setAttribute('data-en', en);
    target.textContent = t(zh, en, en, en, en, en, zh);
    target.classList.toggle('is-new-release', justReleased);
}

let lastRoomAWitness = null;

function roomAWeightKindLabel(kind) {
    const labels = {
        relationship:() => t('關係', 'relationships', '関係', 'relaciones', 'relations', 'Beziehungen', '关系', 'стосунки', 'relacje'),
        loss:() => t('失去', 'loss', '喪失', 'pérdida', 'perte', 'Verlust', '失去', 'втрата', 'strata'),
        self:() => t('自己', 'self', '自分', 'yo', 'soi', 'Selbst', '自己', 'я', 'ja'),
        future:() => t('未來', 'the future', '未来', 'futuro', 'avenir', 'Zukunft', '未来', 'майбутнє', 'przyszłość'),
        unnamed:() => t('先不命名', 'leave it unnamed', '名前をつけない', 'sin nombre', 'sans nom', 'ohne Namen', '先不命名', 'без назви', 'bez nazwy')
    };
    return (labels[kind] || labels.unnamed)();
}

function renderRoomAReleaseWitness() {
    const witness = document.getElementById('a-release-witness');
    const title = document.getElementById('a-release-witness-title');
    const copy = document.getElementById('a-release-witness-copy');
    const boundary = document.getElementById('a-release-witness-boundary');
    if (!witness || !title || !copy || !boundary || !lastRoomAWitness) return;

    const { totalBefore, sameKindBefore, weightKind } = lastRoomAWitness;
    const label = roomAWeightKindLabel(weightKind);
    const total = totalBefore.toLocaleString();
    const same = Number.isInteger(sameKindBefore) ? sameKindBefore.toLocaleString() : '';
    title.textContent = totalBefore > 0
        ? t('你不是第一個', 'You are not the first', 'あなたが最初ではありません', 'No eres la primera persona', 'Vous n’êtes pas la première personne', 'Du bist nicht die erste Person', '你不是第一个', 'Ви не перші', 'Nie jesteś pierwszą osobą')
        : t('你在這裡留下了第一個匿名足跡', 'You left the first anonymous trace here', 'ここに最初の匿名の足跡を残しました', 'Dejaste aquí la primera huella anónima', 'Vous avez laissé ici la première trace anonyme', 'Du hast hier die erste anonyme Spur hinterlassen', '你在这里留下了第一个匿名足迹', 'Ви залишили тут перший анонімний слід', 'Zostawiasz tu pierwszy anonimowy ślad');

    const totalCopy = totalBefore > 0
        ? t(
            `在你之前，已有 ${total} 個人把一份重量交給了時間。`,
            `Before you, ${total} people gave a weight to time.`,
            `あなたより前に、${total}人が重さを時間に委ねました。`,
            `Antes que tú, ${total} personas entregaron un peso al tiempo.`,
            `Avant vous, ${total} personnes ont confié un poids au temps.`,
            `Vor dir haben ${total} Menschen eine Last der Zeit übergeben.`,
            `在你之前，已有 ${total} 个人把一份重量交给了时间。`,
            `До вас ${total} людей віддали свій тягар часу.`,
            `Przed tobą ${total} osób oddało swój ciężar czasowi.`
          )
        : t('這是這個匿名計數裡的第一份重量。', 'This is the first weight in this anonymous count.', 'これは、この匿名の記録で最初の重さです。', 'Este es el primer peso de este recuento anónimo.', 'C’est le premier poids de ce décompte anonyme.', 'Dies ist die erste Last in dieser anonymen Zählung.', '这是这个匿名计数里的第一份重量。', 'Це перший тягар у цьому анонімному підрахунку.', 'To pierwszy ciężar w tym anonimowym zestawieniu.');

    let kindCopy = '';
    if (Number.isInteger(sameKindBefore)) {
        kindCopy = sameKindBefore > 0
            ? t(
                `其中有 ${same} 個人也選擇把它稱作「${label}」。`,
                `${same} of them also chose to call it “${label}.”`,
                `そのうち${same}人も「${label}」と呼ぶことを選びました。`,
                `${same} también eligieron llamarlo «${label}».`,
                `${same} ont également choisi de l’appeler « ${label} »。`,
                `${same} davon nannten sie ebenfalls „${label}“。`,
                `其中有 ${same} 个人也选择把它称作「${label}」。`,
                `${same} з них також назвали це «${label}»。`,
                `${same} z nich również nazwało to „${label}”.`
              )
            : t(
                `在這份匿名分類裡，你是第一個選擇「${label}」的人。`,
                `In this anonymous count, you are the first to choose “${label}.”`,
                `この匿名の記録では、「${label}」を選んだ最初の人です。`,
                `En este recuento anónimo, eres la primera persona que elige «${label}».`,
                `Dans ce décompte anonyme, vous êtes la première personne à choisir « ${label} »。`,
                `In dieser anonymen Zählung wählst du als erste Person „${label}“。`,
                `在这份匿名分类里，你是第一个选择「${label}」的人。`,
                `У цьому анонімному підрахунку ви першими обрали «${label}»。`,
                `W tym anonimowym zestawieniu jako pierwsza osoba wybierasz „${label}”.`
              );
    }
    copy.textContent = `${totalCopy}${kindCopy ? ` ${kindCopy}` : ''}`;
    boundary.textContent = t(
        '這不是對文字的分析。系統只累加你主動選擇的分類數字，不保存分類與原文之間的連結。',
        'This is not text analysis. The system only counts the category you chose and stores no link between it and your words.',
        'これは文章分析ではありません。あなたが選んだ分類の数だけを加算し、言葉との結びつきは保存しません。',
        'Esto no analiza tu texto. Solo cuenta la categoría que elegiste y no guarda ningún vínculo con tus palabras.',
        'Il ne s’agit pas d’une analyse du texte. Seule la catégorie choisie est comptée, sans lien conservé avec vos mots.',
        'Dies ist keine Textanalyse. Gezählt wird nur deine gewählte Kategorie; eine Verbindung zu deinen Worten wird nicht gespeichert.',
        '这不是对文字的分析。系统只累加你主动选择的分类数字，不保存分类与原文之间的链接。',
        'Це не аналіз тексту. Система лише рахує обрану категорію й не зберігає зв’язок із вашими словами.',
        'To nie jest analiza tekstu. System liczy jedynie wybraną kategorię i nie zapisuje powiązania z twoimi słowami.'
    );
    witness.hidden = false;
    witness.classList.remove('is-visible');
    requestAnimationFrame(() => witness.classList.add('is-visible'));
}

window.addEventListener('empath:language-changed', renderRoomAReleaseWitness);

function subscribeRoomAReleaseStats() {
    if (ACTIVE_ROOM !== 'a' || !document.getElementById('a-collective-count')) return;
    const statsRef = doc(db, 'metadata', 'room_a_stats');
    realtimeLifecycle.track(onSnapshot(statsRef, snapshot => {
        roomAReleasedTotal = Math.max(0, Number(snapshot.data()?.totalReleased) || 0);
        const justReleased = safeSessionStorage.getItem('empath_a_just_released') === 'true';
        renderRoomACollectiveCount(justReleased);
        if (justReleased) {
            safeSessionStorage.removeItem('empath_a_just_released');
            setTimeout(() => document.getElementById('a-collective-count')?.classList.remove('is-new-release'), 5000);
        }
    }, error => console.error('Room A anonymous total failed:', error)));
}

window.submitA = async function(){ 
    const input = document.getElementById('a-input'); 
    let text = input.value.trim(); 
    if(!text || !canSubmit()) return; 
    text = prepareSubmittedText(text); 
    const minutes = parseInt(document.getElementById('a-timer-select').value);
    const lifespan = minutes * 60 * 1000;
    const weightKind = document.querySelector('input[name="a-weight-kind"]:checked')?.value || 'unnamed';
    const origText = document.getElementById('a-submit-btn').innerHTML; 
    try {
        const result = await createRoomContent('a', { text, lifespan, weightKind }, true);
        const stats = result?.roomStats;
        if (Number.isFinite(Number(stats?.totalReleased))) {
            roomAReleasedTotal = Math.max(0, Number(stats.totalReleased));
        }
        lastRoomAWitness = {
            totalBefore:Math.max(0, (Number(stats?.totalReleased) || roomAReleasedTotal || 1) - 1),
            sameKindBefore:Number.isFinite(Number(stats?.sameKind)) ? Math.max(0, Number(stats.sameKind) - 1) : null,
            weightKind
        };
        renderRoomAReleaseWitness();
        safeSessionStorage.setItem('empath_a_just_released', 'true');
        // 🌟 記錄投遞時間，作為 24 小時後宇宙回聲的種子
        safeLocalStorage.setItem('empath_a_submit_time', Date.now());
        input.value='';
        const unnamedOption = document.querySelector('input[name="a-weight-kind"][value="unnamed"]');
        if (unnamedOption) unnamedOption.checked = true;
        logJourney('a', text); playRitual('a-submit-btn', origText);
        window.empathContrastMoment?.();
        window.showToast('放入沙畫 ✦');
        queueTonightEcho('a');
    } catch(error) { showRoomSubmissionError(error); }
}

window.submitT = async function(){ 
    const input = document.getElementById('t-input'); 
    let text = input.value.trim(); 
    if(!text || !canSubmit()) return; 
    text = prepareSubmittedText(text); 
    const origText = document.getElementById('t-submit-btn').innerHTML; 
    
    // 🌟 取得這則溫暖的專屬 ID，用來監聽它未來的命運
    try {
        const contentId = await createRoomContent('t', { text });
        safeLocalStorage.setItem('empath_my_warmth_id', contentId);
        safeLocalStorage.setItem('empath_my_warmth_echos', '0');
        window.checkRoomTWarmth();
        input.value=''; logJourney('t', text); playRitual('t-submit-btn', origText); window.empathContrastMoment?.(); window.showToast(t('溫暖已漂浮', 'Warmth floating', '温もりが漂いました', 'Calidez flotante', 'Chaleur flottante', 'Wärme schwebt', '温暖已漂浮')); queueTonightEcho('t');
    } catch(error) { showRoomSubmissionError(error); }
}
  
window.createEchoRipple = function(e) {
    let rippleContainer = document.getElementById('ripple-overlay');
    if (!rippleContainer) {
        rippleContainer = document.createElement('div');
        rippleContainer.id = 'ripple-overlay';
        rippleContainer.className = 'ripple-overlay';
        document.body.appendChild(rippleContainer);
    }
    const ripple = document.createElement('div');
    ripple.className = 'echo-ripple';
    const x = e && e.clientX ? e.clientX : window.innerWidth / 2;
    const y = e && e.clientY ? e.clientY : window.innerHeight / 2;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    rippleContainer.appendChild(ripple);
    setTimeout(() => { ripple.remove(); }, 1800);
};

