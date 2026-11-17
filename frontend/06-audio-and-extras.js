// ==========================================
// 音訊引擎 (療癒頻率 432Hz + 平滑漸變)
// ==========================================
let audioCtx; let masterGain; let ambientGain; let brushGain; let isAudioEnabled = false;

window.toggleAudio = function() {
    const btn = document.getElementById('audio-btn');
    if(!audioCtx) initAudio();
    
    isAudioEnabled = !isAudioEnabled;
    const now = audioCtx.currentTime;
    
    if(isAudioEnabled) {
        audioCtx.resume();
        // 聲音漸入 (Fade-in)：花 2 秒鐘慢慢浮現，非常溫柔
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(1, now + 2);
        
        btn.innerHTML = `🔊<span class="audio-text">${t(' 聲音', ' Audio', ' 音声', ' Audio', ' Audio', ' Audio', ' 声音')}</span>`;
        btn.classList.add('active');
        window.showToast(t('🔊 療癒聲景已開啟', '🔊 Soundscape On', '🔊 環境音オン', '🔊 Sonido Activado', '🔊 Son Activé', '🔊 Ton An', '🔊 环境声景已开启'));
    } else {
        // 聲音漸出 (Fade-out)：花 2 秒鐘像沉入海底般消失
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(0, now + 2);
        
        setTimeout(() => { if(!isAudioEnabled) audioCtx.suspend(); }, 2100);
        
        btn.innerHTML = `🔇<span class="audio-text">${t(' 聲音', ' Audio', ' 音声', ' Audio', ' Audio', ' Audio', ' 声音')}</span>`;
        btn.classList.remove('active');
        window.showToast(t('🔇 聲音已緩緩關閉', '🔇 Audio Faded Out', '🔇 音声オフ', '🔇 Sonido Desactivado', '🔇 Son Désactivé', '🔇 Ton Aus', '🔇 声音已关闭'));
    }
}

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0; // 預設靜音，等待 fade-in
    masterGain.connect(audioCtx.destination);
    
    // 1. 溫暖和弦底噪 (取代原本讓人頭暈的低頻)
    // 使用 174Hz (減輕痛楚的頻率) 與 261Hz (溫暖的中頻)
    const osc1 = audioCtx.createOscillator(); const osc2 = audioCtx.createOscillator();
    ambientGain = audioCtx.createGain();
    osc1.type = 'sine'; osc1.frequency.value = 174; 
    osc2.type = 'sine'; osc2.frequency.value = 261; 
    osc1.connect(ambientGain); osc2.connect(ambientGain);
    ambientGain.connect(masterGain);
    
    ambientGain.gain.value = 0.015; // 聲音調得更微弱舒適
    osc1.start(); osc2.start();
    
    // 平緩的呼吸 LFO
    const lfo = audioCtx.createOscillator(); const lfoGain = audioCtx.createGain();
    lfo.type = 'sine'; lfo.frequency.value = 0.03; // 非常慢的起伏
    lfo.connect(lfoGain); lfoGain.connect(ambientGain.gain);
    lfoGain.gain.value = 0.005; lfo.start();

    // 2. 塗鴉白噪音
    const bufferSize = audioCtx.sampleRate * 2; 
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1; 
    const noiseSrc = audioCtx.createBufferSource();
    noiseSrc.buffer = noiseBuffer; noiseSrc.loop = true;
    
    const bandpass = audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass'; bandpass.frequency.value = 800; 
    brushGain = audioCtx.createGain(); brushGain.gain.value = 0; 
    noiseSrc.connect(bandpass); bandpass.connect(brushGain);
    brushGain.connect(masterGain); noiseSrc.start();
}

window.playChime = function() {
    if(!isAudioEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(432 + Math.random()*200, audioCtx.currentTime); // 改為 432Hz 療癒頻率基準
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3); 
    osc.connect(gain); gain.connect(masterGain);
    osc.start(); osc.stop(audioCtx.currentTime + 3);
}

window.setBrushVolume = function(speed) {
    if(!isAudioEnabled || !brushGain) return;
    const targetVol = Math.min(speed * 0.002, 0.05); 
    brushGain.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.05);
}

// ==========================================
// EMPATH V2: 肌肉釋放 (塗鴉模式) 核心代碼 (強健修復版)
// ==========================================
function renderEDeliveryMode() {
    const { contentMode, deliveryMode } = roomEController.getState();
    const publicButton = document.getElementById('e-delivery-public');
    const driftButton = document.getElementById('e-delivery-drift');
    const hint = document.getElementById('e-delivery-hint');
    const submitButton = document.getElementById('e-submit-btn');
    publicButton?.classList.toggle('active', deliveryMode === 'public');
    driftButton?.classList.toggle('active', deliveryMode === 'drift');
    publicButton?.setAttribute('aria-pressed', String(deliveryMode === 'public'));
    driftButton?.setAttribute('aria-pressed', String(deliveryMode === 'drift'));
    if (hint) hint.textContent = deliveryMode === 'drift'
        ? t('這封信不會出現在公開牆，只會被一位陌生人拾起。', 'This letter will stay off the public wall and reach one stranger only.', 'この手紙は公開されず、ひとりの見知らぬ誰かだけに届きます。', 'Esta carta no aparecerá públicamente y llegará a una sola persona.', 'Cette lettre ne sera pas publique et n’atteindra qu’une seule personne.', 'Dieser Brief bleibt privat und erreicht nur eine fremde Person.', '这封信不会出现在公开墙，只会被一位陌生人拾起。')
        : t('公開牆上的文字會被房間訪客看見。', 'Words on the wall can be seen by Room E visitors.', '公開の壁の言葉は Room E の訪問者に表示されます。', 'Las palabras del muro son visibles para visitantes de Room E.', 'Les mots du mur sont visibles par les visiteurs de Room E.', 'Worte an der Wand sind für Besucher von Room E sichtbar.', '公开墙上的文字会被房间访客看见。');
    if (submitButton) submitButton.textContent = deliveryMode === 'drift' && contentMode === 'text'
        ? t('把信裝進瓶子', 'Seal the letter in a bottle', '手紙を瓶に入れる', 'Guardar la carta en una botella', 'Mettre la lettre en bouteille', 'Den Brief in eine Flasche legen', '把信装进瓶子')
        : t('把它留在這裡', 'Leave It Here', 'ここに置いていく', 'Déjalo Aquí', 'Le laisser ici', 'Lass es hier', '把它留在这里');
}

window.setEDelivery = function(mode) {
    if (!roomEController.setDeliveryMode(mode)) return;
    renderEDeliveryMode();
};

window.addEventListener('empath:language-changed', renderEDeliveryMode);

window.setEMode = function(mode) {
    if (!roomEController.setContentMode(mode)) return;
    const textBtn = document.getElementById('btn-mode-text');
    const drawBtn = document.getElementById('btn-mode-draw');
    const input = document.getElementById('e-input');
    const counter = document.getElementById('e-char');
    const drawWrap = document.getElementById('e-draw-wrap');
    const deliveryChoice = document.getElementById('e-delivery-choice');

    if(textBtn) textBtn.classList.toggle('active', mode === 'text');
    if(drawBtn) drawBtn.classList.toggle('active', mode === 'draw');
    if(input) input.style.display = mode === 'text' ? 'block' : 'none';
    if(counter) counter.style.display = mode === 'text' ? 'block' : 'none';
    if(drawWrap) drawWrap.style.display = mode === 'draw' ? 'block' : 'none';
    if(deliveryChoice) deliveryChoice.hidden = mode !== 'text';
    renderEDeliveryMode();

    // iPhone/Safari 需要等 display:block 真正完成排版後才能取得畫布寬度。
    if(mode === 'draw') {
        requestAnimationFrame(() => requestAnimationFrame(() => roomECanvas.init()));
    }
};

// ==========================================
// EMPATH V2: 星雲檔案館 (隱藏彩蛋) 核心代碼
// ==========================================
let nebulaRafId = null;
let nebulaParticles = [];

window.openNebula = function() {
    const overlay = document.getElementById('nebula-overlay');
    const textEl = document.getElementById('nebula-text');
    const canvas = document.getElementById('nebula-canvas');
    const ctx = canvas.getContext('2d');
    
    // 抓取全站總數 (所有房間的數據總和)
    const totalSouls = (globalCounts.e || 0) + (globalCounts.m || 0) + (globalCounts.p || 0) + (globalCounts.a || 0) + (globalCounts.t || 0);
    
    // 支援多國語言的史詩級文案
    textEl.innerHTML = `${t('這裡曾經有過', 'There have been', 'ここには', 'Aquí ha habido', 'Il y a eu', 'Hier gab es', '这里曾经有过')} <span class="n-num">${totalSouls}</span> ${t('個破碎的靈魂<br>在此得到平靜，並回到生活。', 'shattered souls<br>who found peace here and returned to life.', 'の砕けた魂があり、<br>ここで平穏を得て生活に戻っていきました。', 'almas rotas<br>que encontraron paz aquí y regresaron a la vida.', 'âmes brisées<br>qui ont trouvé la paix ici et sont retournées à la vie.', 'zerbrochene Seelen,<br>die hier Frieden fanden und ins Leben zurückkehrten.', '个破碎的灵魂<br>在此得到平静，并回到生活。')}`;
    
    overlay.classList.add('show');
    activateEmpathDialog(overlay);
    setTimeout(() => textEl.classList.add('show'), 100); // 觸發文字淡入

    // 暫停背景原本的動畫與聲音，讓效能完全讓給星雲
    isAnimating = false;
    if (typeof audioCtx !== 'undefined' && isAudioEnabled) audioCtx.suspend();

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 產生粒子 (限制最高 1500 顆，避免效能卡頓)
    // 如果總數為 0（剛架設好），預設顯示 50 顆
    const pCount = Math.min(totalSouls === 0 ? 50 : totalSouls, 1500);
    nebulaParticles = [];
    // 使用 EMPATH 的品牌色庫：金、藍灰、霧灰、夕陽橘
    const colors = ['#C9A84C', '#7B8FA1', '#E8A87C', '#A8B8C8', '#7A9E9F'];
    
    for(let i=0; i < pCount; i++) {
        nebulaParticles.push({
            baseX: canvas.width / 2,
            baseY: canvas.height / 2,
            angle: Math.random() * Math.PI * 2, // 隨機初始角度
            radius: Math.random() * (canvas.width > 768 ? 500 : 250) + 20, // 散佈半徑
            speed: 0.0005 + Math.random() * 0.0015, // 極慢的旋轉速度
            size: Math.random() * 2 + 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            opacity: Math.random() * 0.5 + 0.1
        });
    }

    const drawNebula = () => {
        // 使用帶有 15% 透明度的極深藍黑填滿背景，製造美麗的「粒子拖影(Trail)」效果
        ctx.fillStyle = 'rgba(2, 4, 8, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        nebulaParticles.forEach(p => {
            p.angle += p.speed;
            
            // 讓粒子圍繞中心點緩慢旋轉，並加入一點潮汐般的縮放感
            const currentRadius = p.radius + Math.sin(p.angle * 3) * 20;
            const x = p.baseX + Math.cos(p.angle) * currentRadius;
            const y = p.baseY + Math.sin(p.angle) * (currentRadius * 0.6); // 乘以 0.6 讓星雲呈扁平的銀河狀
            
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity;
            ctx.shadowBlur = 12;
            ctx.shadowColor = p.color;
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        nebulaRafId = requestAnimationFrame(drawNebula);
    };
    drawNebula();
};

// ==========================================
// EMPATH: 幸運微光 (隨機鼓勵彩蛋)
// ==========================================
window.crackFortune = function() {
    if(window.empathAnalytics) window.empathLogEvent(window.empathAnalytics, 'easter_egg_opened');
  
    // 這裡可以隨時擴充妳想對使用者說的話！
    const fortunes = [
        t('今天辛苦了，請為自己感到驕傲。', 'You worked hard today. Be proud of yourself.', '今日はお疲れ様。自分を誇りに思って。', 'Trabajaste duro hoy. Siéntete orgulloso.', 'Vous avez bien travaillé aujourd\'hui. Soyez fier.', 'Du hast heute hart gearbeitet. Sei stolz auf dich.', '今天辛苦了，请为自己感到骄傲。'),
        t('你的存在，本身就是一件美好的事。', 'Your existence is a beautiful thing.', 'あなたの存在そのものが美しい。', 'Tu existencia es algo hermoso.', 'Votre existence est une belle chose.', 'Deine Existenz ist etwas Wunderschönes.', '你的存在，本身就是一件美好的事。'),
        t('慢慢來，宇宙會接住你的每一次墜落。', 'Take your time. The universe will catch your every fall.', 'ゆっくりでいい。宇宙はあなたの落下を受け止めます。', 'Tómate tu tiempo. El universo atrapará cada caída.', 'Prenez votre temps. L\'univers rattrapera chaque chute.', 'Lass dir Zeit. Das Universum wird jeden Fall auffangen.', '慢慢来，宇宙会接住你的每一次坠落。'),
        t('即使有裂痕，那也是光照進來的地方。', 'Even with cracks, that is where the light enters.', 'ひび割れがあっても、そこから光が差し込みます。', 'Incluso con grietas, ahí es por donde entra la luz.', 'Même avec des fissures, c\'est là que la lumière entre.', 'Selbst mit Rissen, dort kommt das Licht herein.', '即使有裂痕，那也是光照进来的地方。'),
        t('允許自己今天什麼都不做，也是一種勇敢。', 'Allowing yourself to do nothing today is also brave.', '今日何もしないことを自分に許すのも、一つの勇気です。', 'Permitirte no hacer nada hoy también es valiente.', 'S\'autoriser à ne rien faire aujourd\'hui est aussi courageux.', 'Sich heute zu erlauben, nichts zu tun, ist auch mutig.', '允许自己今天什么都不做，也是一种勇敢。'),
        t('你不需要變得更好，才值得被愛。', 'You don’t have to be better to be worthy of love.', '愛されるために、より良くなる必要はありません。', 'No tienes que ser mejor para ser digno de amor.', 'Vous n\'avez pas besoin d\'être meilleur pour être digne d\'amour.', 'Du musst nicht besser sein, um es wert zu sein, geliebt zu werden.', '你不需要变得更好，才值得被爱。')
    ];
    
    const modal = document.getElementById('fortune-display');
    const textEl = document.getElementById('fortune-text');
    const spark = document.getElementById('fortune-spark');
    
    // 隨機抽取一句話
    const randomMsg = fortunes[Math.floor(Math.random() * fortunes.length)];
    textEl.innerHTML = `<span class="f-quote">「</span> ${randomMsg} <span class="f-quote">」</span>`;
    
    // 顯示全螢幕溫柔畫布
    modal.classList.add('show');
    activateEmpathDialog(modal);
    
    // 觸發音效與震動 (如果有的話)
    if(typeof window.playChime === 'function') window.playChime();
    if(typeof window.triggerHeartbeat === 'function') window.triggerHeartbeat();
    
    // 點過一次後讓左下角的微光暫時變暗，防止連點
    spark.style.opacity = '0.1';
    spark.style.pointerEvents = 'none';
    setTimeout(() => { 
        spark.style.opacity = ''; 
        spark.style.pointerEvents = 'auto'; 
    }, 10000); // 10秒後微光才會再次亮起
}

window.closeFortune = function() {
    const modal = document.getElementById('fortune-display');
    modal?.classList.remove('show');
    deactivateEmpathDialog(modal);
}

window.closeNebula = function() {
    const overlay = document.getElementById('nebula-overlay');
    const textEl = document.getElementById('nebula-text');
    textEl.classList.remove('show');
    overlay.classList.remove('show');
    deactivateEmpathDialog(overlay);
    
    // 停止星雲動畫並清空畫布 (等待淡出動畫 2.5 秒結束後)
    setTimeout(() => {
        if (nebulaRafId) cancelAnimationFrame(nebulaRafId);
        const canvas = document.getElementById('nebula-canvas');
        if(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, 2500); 

    // 恢復原本房間的背景動畫與聲音
    if (!document.body.classList.contains('hsp-mode')) {
        isAnimating = true;
        if (typeof window.drawStars === 'function') window.drawStars();
        if (typeof window.drawSand === 'function') window.drawSand();
    }
    if (typeof audioCtx !== 'undefined' && isAudioEnabled) audioCtx.resume();
};
  
window.clearEDraw = () => roomECanvas.clear();

let isAnimating = true;
let starsRafId = null;
let sandRafId = null;
let roomMVisible = false;
let roomAVisible = false;
const realtimeLifecycle = createRealtimeLifecycle({
    isHidden:() => document.hidden,
    onError:(error, key) => console.error(`Firestore subscription lifecycle failed (${key}):`, error)
});
let otherRoomsObserver = null;
let otherRoomsSubscribed = false;
const registerAuxiliarySubscription = realtimeLifecycle.register;
const removeAuxiliarySubscription = realtimeLifecycle.remove;

const DATA_STATE_COPY = {
    loading: {
        zh:'正在聽見遠方的聲音……', en:'Listening for distant voices…', ja:'遠くの声に耳を澄ませています……',
        es:'Escuchando voces lejanas…', fr:'À l’écoute des voix lointaines…', de:'Wir lauschen fernen Stimmen…',
        'zh-cn':'正在听见远方的声音……', uk:'Прислухаємося до далеких голосів…', pl:'Wsłuchujemy się w odległe głosy…'
    },
    empty: {
        zh:'今晚，這裡還沒有留下新的情緒。', en:'Nothing new has been left here tonight.', ja:'今夜、ここにはまだ新しい感情が残されていません。',
        es:'Esta noche aún no se ha dejado ninguna emoción aquí.', fr:'Ce soir, aucune nouvelle émotion n’a encore été déposée ici.', de:'Heute Abend wurde hier noch kein neues Gefühl hinterlassen.',
        'zh-cn':'今晚，这里还没有留下新的情绪。', uk:'Сьогодні тут ще не залишили нових почуттів.', pl:'Dziś wieczorem nie pozostawiono tu jeszcze nowych emocji.'
    },
    error: {
        zh:'這些文字暫時迷失在路上。', en:'These words are temporarily lost along the way.', ja:'これらの言葉は、今だけ道に迷っています。',
        es:'Estas palabras se han perdido temporalmente en el camino.', fr:'Ces mots se sont momentanément égarés en chemin.', de:'Diese Worte haben sich vorübergehend verirrt.',
        'zh-cn':'这些文字暂时迷失在路上。', uk:'Ці слова тимчасово загубилися в дорозі.', pl:'Te słowa chwilowo zgubiły się po drodze.'
    },
    retry: {
        zh:'再試著呼喚一次', en:'CALL ONCE MORE', ja:'もう一度呼びかける', es:'VOLVER A LLAMAR', fr:'RAPPELER ENCORE', de:'NOCH EINMAL RUFEN',
        'zh-cn':'再试着呼唤一次', uk:'ПОКЛИКАТИ ЩЕ РАЗ', pl:'ZAWOŁAJ JESZCZE RAZ'
    },
    embeddedHelp: {
        zh:'App 內建瀏覽器可能擋住即時資料。請點選 ⋯，改用 Safari 或預設瀏覽器開啟。',
        en:'The in-app browser may be blocking live data. Tap ⋯ and open this page in Safari or your default browser.',
        ja:'アプリ内ブラウザがリアルタイムデータを遮断している可能性があります。⋯ をタップし、Safari または既定のブラウザで開いてください。',
        es:'El navegador de la aplicación puede estar bloqueando los datos en vivo. Toca ⋯ y abre la página en Safari o en tu navegador predeterminado.',
        fr:'Le navigateur intégré bloque peut-être les données en direct. Touchez ⋯ puis ouvrez la page dans Safari ou votre navigateur par défaut.',
        de:'Der In-App-Browser blockiert möglicherweise Live-Daten. Tippe auf ⋯ und öffne die Seite in Safari oder im Standardbrowser.',
        'zh-cn':'App 内置浏览器可能挡住即时资料。请点选 ⋯，改用 Safari 或默认浏览器开启。',
        uk:'Вбудований браузер застосунку може блокувати дані. Натисніть ⋯ і відкрийте сторінку в Safari або типовому браузері.',
        pl:'Przeglądarka w aplikacji może blokować dane na żywo. Dotknij ⋯ i otwórz stronę w Safari lub domyślnej przeglądarce.'
    }
};

