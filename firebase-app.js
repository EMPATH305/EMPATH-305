import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, addDoc, onSnapshot, doc, updateDoc, serverTimestamp, query, orderBy, setDoc, getDoc, increment, limit as firestoreLimit, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// 🌟 新增載入 GA4 引擎
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";

// ⚠️ 把最後面的 G-MW5GYM0H77 換成妳剛剛複製的新代碼！
const firebaseConfig = { apiKey: "AIzaSyANaBq5vt8G5L2GJjzAAfVmHYFeKA9bF90", authDomain: "empath-62582.firebaseapp.com", projectId: "empath-62582", storageBucket: "empath-62582.firebasestorage.app", messagingSenderId: "945974527649", appId: "1:945974527649:web:552e236eff7809dfea52e0", measurementId: "G-9Z9X6E7WBZ" };

const app = initializeApp(firebaseConfig);

// 自動偵測長輪詢可避開部分 iOS、校園網路與代理伺服器阻擋 WebChannel。
// IndexedDB 快取讓曾載入過的房間在短暫離線時仍能先顯示內容。
const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false,
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// Analytics 保留使用；Measurement ID 與 Firebase 後台實際設定一致。
window.empathAnalytics = getAnalytics(app);
window.empathLogEvent = logEvent;

const state = { eCount:0, mCount:0, pCount:0, aCount:0, tCount:0 };
const globalCounts = { v:0, e:0, m:0, p:0, a:0, t:0 };
try {
    const cachedCounts = JSON.parse(localStorage.getItem('empath_global_counts') || '{}');
    ['e','m','p','a','t'].forEach(key => {
        const value = Number(cachedCounts[key]);
        if(Number.isFinite(value) && value >= 0) globalCounts[key] = value;
    });
} catch(err) {}
let journeyData = { counters: {e:0, m:0, p:0, a:0, t:0}, events: [] };
let lastSubmitTime = 0; const SUBMIT_COOLDOWN = 3000;
document.addEventListener('DOMContentLoaded', () => {
    if(typeof updateCountersUI === 'function') updateCountersUI();
}, { once:true }); 

function canSubmit() { const now = Date.now(); if (now - lastSubmitTime < SUBMIT_COOLDOWN) { window.showToast(t('請稍候再送出...', 'Please wait...', '少しお待ちください...', 'Espera un momento...', 'Veuillez patienter...', 'Bitte warten...', '请稍候再送出...')); return false; } lastSubmitTime = now; return true; }
function playRitual(btnId, origText) { const btn = document.getElementById(btnId); if(!btn) return; btn.innerHTML = t('✨ 已接住', '✨ Caught', '✨ 受け止めました', '✨ Atrapado', '✨ Attrapé', '✨ Aufgefangen', '✨ 已接住'); btn.style.pointerEvents = 'none'; btn.style.opacity = '0.6'; setTimeout(() => { btn.innerHTML = origText; btn.style.pointerEvents = 'auto'; btn.style.opacity = '1'; }, SUBMIT_COOLDOWN); }

function updateCountersUI() {
    try {
        localStorage.setItem('empath_global_counts', JSON.stringify({
            e:globalCounts.e || 0, m:globalCounts.m || 0, p:globalCounts.p || 0,
            a:globalCounts.a || 0, t:globalCounts.t || 0, savedAt:Date.now()
        }));
    } catch(err) {}
    ['g-v-count','g-e-count','g-m-count','g-p-count','g-t-count'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = globalCounts[id.split('-')[1]]; });
    ['h-e-count','h-m-count','h-p-count','h-a-count','h-t-count'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = state[id.split('-')[1]+'Count']; });
    
    // 🌟 讓大腦學會記憶，實現 0 秒載入的視覺魔術
    localStorage.setItem('empath_global_counts', JSON.stringify(globalCounts));
    
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

// ==========================================
// 提案一：靈魂跟隨 (游標延遲光暈) - 終極效能優化版
// ==========================================
const cursorGlow = document.getElementById('cursor-glow');
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let glowX = mouseX, glowY = mouseY;
let glowVX = 0, glowVY = 0;
let glowLastFrame = 0;
const CURSOR_SPRING_STIFFNESS = 0.0046;
const CURSOR_SPRING_DAMPING = 0.84;
const CURSOR_MAX_SPEED = 14;
let isMoving = false;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isMoving) {
        isMoving = true;
        glowLastFrame = 0;
        if (cursorGlow) cursorGlow.style.opacity = '1';
        requestAnimationFrame(animateGlow);
    }
});

function animateGlow(timestamp) {
    if (!document.body.classList.contains('hsp-mode') && window.innerWidth > 768) {
        const elapsedScale = glowLastFrame
            ? Math.min((timestamp - glowLastFrame) / 16.667, 6)
            : 1;
        glowLastFrame = timestamp;

        // 掉幀時拆成數個小步，讓不同更新率仍保有相同重量與阻尼。
        const substeps = Math.max(1, Math.ceil(elapsedScale));
        const step = elapsedScale / substeps;
        for (let index = 0; index < substeps; index++) {
            const springDX = mouseX - glowX;
            const springDY = mouseY - glowY;
            glowVX += springDX * CURSOR_SPRING_STIFFNESS * step;
            glowVY += springDY * CURSOR_SPRING_STIFFNESS * step;
            const damping = Math.pow(CURSOR_SPRING_DAMPING, step);
            glowVX *= damping;
            glowVY *= damping;

            // 限制長距離移動時的追趕速度，保留可感知的精品漂移。
            const glowSpeed = Math.hypot(glowVX, glowVY);
            if (glowSpeed > CURSOR_MAX_SPEED) {
                const speedScale = CURSOR_MAX_SPEED / glowSpeed;
                glowVX *= speedScale;
                glowVY *= speedScale;
            }

            glowX += glowVX * step;
            glowY += glowVY * step;
        }

        const dx = mouseX - glowX;
        const dy = mouseY - glowY;

        if (cursorGlow) {
            cursorGlow.style.transform = `translate3d(calc(${glowX}px - 50%), calc(${glowY}px - 50%), 0)`;
        }

        const isSettled =
            Math.abs(dx) < 0.35 &&
            Math.abs(dy) < 0.35 &&
            Math.abs(glowVX) < 0.04 &&
            Math.abs(glowVY) < 0.04;

        if (isSettled) {
            glowX = mouseX;
            glowY = mouseY;
            glowVX = 0;
            glowVY = 0;
            glowLastFrame = 0;
            isMoving = false;
        } else {
            requestAnimationFrame(animateGlow);
        }
    } else {
        if (cursorGlow) cursorGlow.style.opacity = '0';
        glowVX = 0;
        glowVY = 0;
        glowLastFrame = 0;
        isMoving = false;
    }
}
  
// ==========================================
// 提案二：離站的詩意 (網頁標籤頁文字動態切換)
// ==========================================
let originalTitle = document.title;
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        document.title = t('🕯️ 宇宙會為你留一盞燈...', '🕯️ A light remains for you...', '🕯️ 宇宙はあなたのために灯りを残します...', '🕯️ Una luz permanece para ti...', '🕯️ Une lumière reste pour vous...', '🕯️ Ein Licht bleibt für dich...', '🕯️ 宇宙会为你留一盏灯...');
    } else {
        document.title = 'EMPATH — ' + t('歡迎回家', 'Welcome Home', 'おかえりなさい', 'Bienvenido a Casa', 'Bienvenue à la Maison', 'Willkommen Zuhause', '欢迎回家');
        setTimeout(() => { document.title = originalTitle; }, 3500); // 3.5秒後變回原標題
    }
});

// ==========================================
// 提案三：同步呼吸引導 (432Hz 視覺療癒)
// ==========================================
let breatheInterval;
window.startBreathe = function() {
    const overlay = document.getElementById('breathe-overlay');
    const textEl = document.getElementById('breathe-text');
    overlay.classList.add('show');
    
    // 如果有開啟音頻，觸發一聲水晶音
    if(typeof window.playChime === 'function') window.playChime();

    const cycle = () => {
        textEl.textContent = t('吸氣...', 'Inhale...', '吸って...', 'Inhala...', 'Inspirez...', 'Einatmen...', '吸气...');
        setTimeout(() => {
            textEl.textContent = t('吐氣...', 'Exhale...', '吐いて...', 'Exhala...', 'Expirez...', 'Ausatmen...', '吐气...');
        }, 4000); // 4秒後字體變成吐氣
    };
    
    cycle(); // 立刻執行第一次
    breatheInterval = setInterval(cycle, 10000); // 之後每10秒精準循環
};

window.stopBreathe = function() {
    const overlay = document.getElementById('breathe-overlay');
    overlay.classList.remove('show');
    clearInterval(breatheInterval);
};

window.currentLang = 'zh';
function t(zh, en, ja, es, fr, de, zh_cn, uk, pl) { let target = window.currentLang; if(target === 'en-uk') target = 'en'; if (target === 'en') return en || zh; if (target === 'ja') return ja || en || zh; if (target === 'es') return es || en || zh; if (target === 'fr') return fr || en || zh; if (target === 'de') return de || en || zh; if (target === 'zh-cn') return zh_cn || zh; if (target === 'uk') return uk || en || zh; if (target === 'pl') return pl || en || zh; return zh; }

window.toggleMobileNav = function() {
  const button = document.getElementById('hamburger-btn');
  const menu = document.getElementById('nav-menu');
  const open = !menu.classList.contains('show');
  button.classList.toggle('open', open);
  menu.classList.toggle('show', open);
  button.setAttribute('aria-expanded', String(open));
  button.setAttribute('aria-label', open ? '關閉導覽選單' : '開啟導覽選單');
}
window.closeMobileNav = function() {
  const button = document.getElementById('hamburger-btn');
  document.getElementById('nav-menu').classList.remove('show');
  button.classList.remove('open');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', '開啟導覽選單');
}
window.toggleLangDropdown = function() { document.getElementById('lang-dropdown-list').classList.toggle('show'); }
document.addEventListener('click', function(e) { if(!e.target.closest('.lang-dropdown-wrapper')) { const list = document.getElementById('lang-dropdown-list'); if(list) list.classList.remove('show'); } });

const guideData = {
    'E': { title: {zh: '房間 E — 情緒出口', en: 'Room E — Emotional Exit', ja: '部屋 E — 感情の出口', es: 'Habitación E — Salida Emocional', fr: 'Salle E — Sortie Émotionnelle', de: 'Raum E — Emotionaler Ausgang', 'zh-cn': '房间 E — 情绪出口', 'uk': 'Кімната E — Емоційний вихід', 'pl': 'Pokój E — Emocjonalne Wyjście'}, desc: {zh: '有些話堵在心口太久會生病。在這裡，你可以完全匿名地把那些沉重、憤怒或委屈倒出來，黑暗會安全地接住它們。', en: 'Words kept inside can make you sick. Here, you can pour out your heaviness anonymously. The dark will hold it safely.', ja: '胸に秘めた言葉を吐き出してください。暗闇がそれを安全に受け止めます。', es: 'Aquí puedes desahogarte de forma anónima. La oscuridad lo sostendrá.', fr: 'Ici, vous pouvez vous épancher anonymement. L\'obscurité le gardera en sécurité.', de: 'Hier kannst du dich anonym ausschütten. Die Dunkelheit wird es sicher halten.', 'zh-cn': '有些话堵在心口太久会生病。在这里，你可以完全匿名地把那些沉重、愤怒或委屈倒出来，黑暗会安全地接住它们。', 'uk': 'Слова, які ви тримаєте в собі, можуть зробити вас хворими. Темрява безпечно їх сховає.', 'pl': 'Słowa, które w sobie trzymasz, mogą sprawić, że zachorujesz. Ciemność bezpiecznie je przechowa.'}, link: '#room-e' },
    'M': { title: {zh: '房間 M — 思念映射', en: 'Room M — Memory Mapping', ja: '部屋 M — 想いの投影', es: 'Habitación M — Mapeo de Recuerdos', fr: 'Salle M — Cartographie des Souvenirs', de: 'Raum M — Erinnerungskartierung', 'zh-cn': '房间 M — 思念映射', 'uk': 'Кімната M — Картографія Пам\'яті', 'pl': 'Pokój M — Mapowanie Wspomnień'}, desc: {zh: '思念沒有實體，但可以有座標。來這裡點亮一顆星，讓那份想念在夜空裡被看見，或許對方也能感應得到。', en: 'Missing someone has no physical form, but it can have a coordinate. Light a star here.', ja: '想いを星に変えて夜空に灯しましょう。', es: 'Extrañar no tiene forma física, pero puede tener una coordenada. Enciende una estrella aquí.', fr: 'Le manque n\'a pas de forme physique, mais peut avoir une coordonnée. Allumez une étoile ici.', de: 'Vermissen hat keine physische Form, aber es kann eine Koordinate haben. Zünde hier einen Stern an.', 'zh-cn': '思念没有实体，但可以有坐标。来这里点亮一颗星，让那份想念在夜空里被看见。', 'uk': 'Засвіти тут зірку для тих, за ким сумуєш.', 'pl': 'Zapal tutaj gwiazdę dla tych, za którymi tęsknisz.'}, link: '#room-m' },
    'P': { title: {zh: '房間 P — 碎片修補', en: 'Room P — Kintsugi Repair', ja: '部屋 P — 欠片の修復', es: 'Habitación P — Reparación Kintsugi', fr: 'Salle P — Réparation Kintsugi', de: 'Raum P — Kintsugi-Reparatur', 'zh-cn': '房间 P — 碎片修补', 'uk': 'Кімната P — Зцілення Кінцуґі', 'pl': 'Pokój P — Naprawa Kintsugi'}, desc: {zh: '碎裂不是結束，而是光照進來的地方。用金繼（Kintsugi）的方式，將你心中的遺憾與傷痛重新修補，化為最美的紋理。', en: 'Brokenness is not the end. Use Kintsugi to mend your regrets into beautiful textures.', ja: '金継ぎのようにもう一度つなぎ合わせましょう。', es: 'La ruptura no es el fin. Usa Kintsugi para reparar tus arrepentimientos en texturas hermosas.', fr: 'La brisure n\'est pas la fin. Utilisez le Kintsugi pour réparer vos regrets en de belles textures.', de: 'Zerbrochenheit ist nicht das Ende. Verwende Kintsugi, um deine Reue in wunderschöne Texturen zu flicken.', 'zh-cn': '碎裂不是结束，而是光照进来的地方。用金继（Kintsugi）的方式，将你心中的遗憾与伤痛重新修补。', 'uk': 'Розбитість — це не кінець. Зціли свої жалі золотом.', 'pl': 'Rozbicie to nie koniec. Ulecz swoje żale złotem.'}, link: '#room-p' },
    'A': { title: {zh: '房間 A — 神聖避難所', en: 'Room A — Sacred Asylum', ja: '部屋 A — 神聖な避難所', es: 'Habitación A — Asilo Sagrado', fr: 'Salle A — Asile Sacré', de: 'Raum A — Heiliges Asyl', 'zh-cn': '房间 A — 神圣避难所', 'uk': 'Кімната A — Священний Прихисток', 'pl': 'Pokój A — Święty Azyl'}, desc: {zh: '有些痛苦太重，不該永遠背負。在這裡寫下的所有秘密，都會在 24 小時後像沙畫一樣被風吹散，不留痕跡。', en: 'Some pain is too heavy to carry forever. Secrets here will turn to sand and blow away in 24 hours.', ja: 'ここでの秘密は24時間後に砂のように消え去ります。', es: 'Cierto dolor es demasiado pesado. Los secretos aquí se convertirán en arena en 24 horas.', fr: 'Certaines douleurs sont trop lourdes. Les secrets ici se transformeront en sable dans 24 heures.', de: 'Mancher Schmerz ist zu schwer. Geheimnisse hier werden in 24 Stunden zu Sand.', 'zh-cn': '有些痛苦太重，不该永远背负。在这里写下的所有秘密，都会在 24 小时后像沙画一样被风吹散。', 'uk': 'Деякий біль занадто важкий. Секрети тут перетворяться на пісок.', 'pl': 'Niektóre bóle są zbyt ciężkie. Sekrety tutaj zmienią się w piasek.'}, link: '#room-a' },
    'T': { title: {zh: '房間 T — 能量共振', en: 'Room T — Energy Resonance', ja: '部屋 T — エネルギー共鳴', es: 'Habitación T — Resonancia de Energía', fr: 'Salle T — Résonance d\'Énergie', de: 'Raum T — Energieresonanz', 'zh-cn': '房间 T — 能量共振', 'uk': 'Кімната T — Енергетичний Резонанс', 'pl': 'Pokój T — Rezonans Energii'}, desc: {zh: '當你覺得自己有餘力時，來這裡給予他人一個無聲的擁抱吧。每一次共鳴，都會化作對方真實的心跳震動。', en: 'When you have the strength, give someone a silent hug here. Every resonance is a heartbeat.', ja: '余裕があるなら、誰かに無言の抱擁を贈りましょう。', es: 'Cuando tengas fuerza, dale a alguien un abrazo silencioso aquí.', fr: 'Quand vous avez la force, donnez un câlin silencieux ici.', de: 'Wenn du die Kraft hast, gib hier jemandem eine stille Umarmung.', 'zh-cn': '当你觉得自己有余力时，来这里给予他人一个无声的拥抱吧。每一次共鸣，都会化作对方真实的心跳震动。', 'uk': 'Подаруйте комусь мовчазні обійми тут. Кожен резонанс — це серцебиття.', 'pl': 'Podaruj tu komuś cichy uścisk. Każdy rezonans to bicie serca.'}, link: '#room-t' },
    'H': { title: {zh: '房間 H — 靈魂歸宿', en: 'Room H — Soul\'s Home', ja: '部屋 H — 魂の帰郷', es: 'Habitación H — Hogar del Alma', fr: 'Salle H — Foyer de l\'Âme', de: 'Raum H — Zuhause der Seele', 'zh-cn': '房间 H — 灵魂归宿', 'uk': 'Кімната H — Дім Душі', 'pl': 'Pokój H — Dom Duszy'}, desc: {zh: '回家，回到不需偽裝的地方。這裡記錄了全世界的靈魂足跡。你可以先在這裡安靜地待著。', en: 'Come home, to a place where no disguise is needed. You can just rest here quietly.', ja: 'おかえりなさい。偽りの必要がない場所へ。まずはここで静かに休んでください。', es: 'Vuelve a casa, a un lugar donde no necesitas fingir. Puedes descansar aquí tranquilamente.', fr: 'Rentrez chez vous, dans un endroit sans déguisement. Vous pouvez simplement vous reposer ici.', de: 'Komm nach Hause, an einen Ort ohne Verstellung. Du kannst hier einfach ruhig ausruhen.', 'zh-cn': '回家，回到不需伪装的地方。这里记录了全世界的灵魂足迹。你可以先在这里安静地待着。', 'uk': 'Повертайся додому. Ти можеш просто тихо відпочити тут.', 'pl': 'Wróć do domu. Możesz po prostu cicho tu odpocząć.'}, link: '#room-h' }
};

window.openGuide = function() {
    const obBox = document.getElementById('onboarding-box');
    if(!obBox) return;
    const backdrop = document.getElementById('guide-backdrop');
    obBox.style.display = '';
    obBox.style.opacity = '1';
    obBox.classList.add('is-open');
    if(backdrop) backdrop.classList.add('is-open');
    document.getElementById('hero')?.classList.add('guide-active');
    document.body.style.overflow = 'hidden';
    window.startGuide();
    setTimeout(() => obBox.querySelector('.guide-close')?.focus(), 50);
};
window.startGuide = function() { document.getElementById('ob-state-0').style.display = 'none'; document.getElementById('ob-state-2').style.display = 'none'; document.getElementById('ob-state-1').style.display = 'block'; }
window.showGuideResult = function(roomKey) {
    document.getElementById('ob-state-1').style.display = 'none'; document.getElementById('ob-state-2').style.display = 'block';
    const lang = (window.currentLang === 'en-uk') ? 'en' : window.currentLang; const data = guideData[roomKey];
    document.getElementById('ob-res-title').textContent = data.title[lang] || data.title['en'] || data.title['zh'];
    document.getElementById('ob-res-desc').textContent = data.desc[lang] || data.desc['en'] || data.desc['zh'];
    const linkBtn = document.getElementById('ob-res-link'); linkBtn.href = data.link; linkBtn.onclick = function() { window.closeGuide(); window.closeMobileNav(); };
}
window.closeGuide = function() {
    const obBox = document.getElementById('onboarding-box');
    const backdrop = document.getElementById('guide-backdrop');
    if(obBox) {
        obBox.style.opacity = '0';
        if(backdrop) backdrop.classList.remove('is-open');
        document.body.style.overflow = '';
        setTimeout(() => {
            obBox.classList.remove('is-open');
            document.getElementById('hero')?.classList.remove('guide-active');
            obBox.style.display = 'none';
            obBox.style.opacity = '1';
        }, 350);
    }
}

window.switchLang = function(lang) {
  window.currentLang = lang;
  const langNames = { 'zh': '繁體中文', 'zh-cn': '简体中文', 'en': 'English (US)', 'en-uk': 'English (UK)', 'ja': '日本語', 'es': 'Español', 'fr': 'Français', 'de': 'Deutsch', 'uk': 'Українська', 'pl': 'Polski' };
  document.getElementById('current-lang-display').textContent = langNames[lang];
  document.getElementById('lang-dropdown-list').classList.remove('show');
  document.querySelectorAll('.lang-option').forEach(btn => { if(btn.dataset.lang === lang) btn.classList.add('active-lang'); else btn.classList.remove('active-lang'); });
  const targetLang = (lang === 'en-uk') ? 'en' : lang;
  document.querySelectorAll('[data-zh]').forEach(el => { el.innerHTML = el.getAttribute('data-' + targetLang) || el.getAttribute('data-en') || el.getAttribute('data-zh'); });
  document.querySelectorAll('[data-zh-ph]').forEach(el => { el.setAttribute('placeholder', el.getAttribute('data-' + targetLang + '-ph') || el.getAttribute('data-en-ph') || el.getAttribute('data-zh-ph')); });
  document.querySelectorAll('[data-zh-title]').forEach(el => { el.setAttribute('title', el.getAttribute('data-' + targetLang + '-title') || el.getAttribute('data-en-title') || el.getAttribute('data-zh-title')); });
  const activeTitle = document.getElementById('ob-res-title').textContent;
  if(activeTitle !== "") { for(let key in guideData) { if(Object.values(guideData[key].title).includes(activeTitle)) { window.showGuideResult(key); break; } } }
  updateDynamicTexts(); document.getElementById('h-events').innerHTML = ''; initTimeline(); window.renderSessionJourney?.(); if(typeof window.renderEFeed === 'function') window.renderEFeed();
  let crisisTel = '1925';
  if (lang === 'uk') crisisTel = '7333';
  else if (lang === 'pl') crisisTel = '116123';
  document.querySelectorAll('.crisis-link').forEach(el => { el.href = 'tel:' + crisisTel; });
  // 🌍 【核彈級連動】觸發地下室的 Google 翻譯引擎，翻譯全部使用者留言！
  const googleSelect = document.querySelector(".goog-te-combo");
  if (googleSelect) {
      let googleLang = lang;
      if (lang === 'zh') googleLang = 'zh-TW';
      if (lang === 'zh-cn') googleLang = 'zh-CN';
      if (lang === 'en-uk') googleLang = 'en';
      
      googleSelect.value = googleLang;
      googleSelect.dispatchEvent(new Event('change'));

      // 🧹 終極白邊清道夫 (MutationObserver)：只要 Google 敢加白邊，瞬間摧毀！
      if (!window.empathGoogleObserver) {
          window.empathGoogleObserver = new MutationObserver(() => {
              if (document.body.style.top !== '0px' && document.body.style.top !== '') {
                  document.body.style.setProperty('top', '0px', 'important');
              }
              if (document.documentElement.style.top !== '0px' && document.documentElement.style.top !== '') {
                  document.documentElement.style.setProperty('top', '0px', 'important');
              }
              // 摧毀所有偷渡進來的白邊佔位符
              document.querySelectorAll('div.skiptranslate').forEach(el => {
                  if (el.id !== 'google_translate_element') el.style.display = 'none';
              });
          });
          // 啟動永久監控，至死方休
          window.empathGoogleObserver.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
      }
  }

  window.showToast(t('已切換語言 ✦', 'Language Switched ✨', '言語を切り替えました ✦', 'Idioma Cambiado ✨', 'Langue changée ✨', 'Sprache geändert ✨', '已切换语言 ✦', 'Мову змінено ✦', 'Język zmieniony ✦'));
}

function updateDynamicTexts() {
  if(document.getElementById('p-healed-count')) { document.getElementById('p-healed-count').textContent = t( `已有 ${pHealedTotal} 道裂紋，以金修補。`, `${pHealedTotal} cracks mended with gold.`, `${pHealedTotal} 個のひび割れが金で修復されました。`, `${pHealedTotal} grietas reparadas con oro.`, `${pHealedTotal} fissures réparées avec de l'or.`, `${pHealedTotal} Risse mit Gold geflickt.`, `已有 ${pHealedTotal} 道裂纹，以金修补。` ); }
  document.querySelectorAll('.shard-healed-tag').forEach(el => el.innerHTML = t('✦ 已修補', '✦ Healed', '✦ 修復済', '✦ Reparado', '✦ Réparé', '✦ Geheilt', '✦ 已修补'));
  document.querySelectorAll('.e-msg-anon').forEach(el => el.textContent = t('匿名 · ANONYMOUS', 'ANONYMOUS', '匿名 · ANONYMOUS', 'ANÓNIMO', 'ANONYME', 'ANONYM', '匿名 · ANONYMOUS'));
  document.querySelectorAll('.sand-timer-label').forEach(el => el.textContent = t('消散中', 'DISSOLVING', '消散中', 'DISOLVIENDO', 'DISSOLUTION', 'AUFLÖSEND', '消散中'));
  const toggleBtn = document.getElementById('timeline-toggle-btn');
  if(toggleBtn) { const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true'; toggleBtn.innerHTML = isExpanded ? t('收起旅程 ↑', 'Collapse ↑', '折りたたむ ↑', 'Ocultar ↑', 'Réduire ↑', 'Einklappen ↑', '收起旅程 ↑') : t('展開完整旅程 ↓', 'Show Full Journey ↓', 'すべての旅を見る ↓', 'Ver Viaje Completo ↓', 'Voir le parcours complet ↓', 'Gesamte Reise anzeigen ↓', '展开完整旅程 ↓'); }
  const quotesBtn = document.getElementById('hero-quotes-toggle');
  if(quotesBtn) { const isExpandedQuotes = document.getElementById('hero-quotes').classList.contains('show-quotes'); quotesBtn.innerHTML = isExpandedQuotes ? t('📖 收起理念 ↑', '📖 Collapse ↑', '📖 閉じる ↑', '📖 Ocultar ↑', '📖 Réduire ↑', '📖 Einklappen ↑', '📖 收起理念 ↑') : t('📖 閱讀設計理念 ↓', '📖 Read Philosophy ↓', '📖 コンセプトを読む ↓', '📖 Leer Filosofía ↓', '📖 Lire la philosophie ↓', '📖 Philosophie lesen ↓', '📖 阅读设计理念 ↓'); }
}

function formatTimeLeft(secs){
  if(secs<=0) return t('即將消散', 'Fading', 'まもなく消散', 'Desvaneciendo', 'S\'efface', 'Verblasst', '即将消散'); 
  const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60); const lang = window.currentLang;
  if(lang.startsWith('en')) return h>0 ? `${h}h ${m}m left` : `${m}m left`;
  if(lang === 'ja') return h>0 ? `残り ${h}時間 ${m}分` : `残り ${m}分`;
  if(lang === 'es') return h>0 ? `Faltan ${h}h ${m}m` : `Faltan ${m}m`;
  if(lang === 'fr') return h>0 ? `Reste ${h}h ${m}m` : `Reste ${m}m`;
  if(lang === 'de') return h>0 ? `Noch ${h}Std. ${m}Min.` : `Noch ${m}Min.`;
  if(lang === 'zh-cn') return h>0 ? `${h}小时 ${m}分钟 后消散` : `${m}分钟 后消散`;
  return h>0 ? `${h}小時 ${m}分鐘 後消散` : `${m}分鐘 後消散`;
}

function cleanText(text) { const badWords = ['去死', '智障', '白痴', '幹你娘', 'bitch', 'fuck', '賤人', '靠北', '垃圾', '死', '媽的', '幹你娘', '廢物', '破病', '做愛', '腦殘', '噁心', '滾', '外勞', '幹你']; let cleaned = text; badWords.forEach(word => { const regex = new RegExp(word.split('').join('\\s*'), 'gi'); cleaned = cleaned.replace(regex, '***'); }); return cleaned; }

window.toggleTimeline = function() {
  const wrapper = document.getElementById('h-events');
  const btn = document.getElementById('timeline-toggle-btn');
  const fade = document.getElementById('h-events-fade');
  if (!wrapper || !btn || !fade) return;
  const open = btn.getAttribute('aria-expanded') !== 'true';
  btn.setAttribute('aria-expanded', String(open));
  wrapper.classList.toggle('is-expanded', open);
  wrapper.style.maxHeight = open ? `${Math.max(280, wrapper.scrollHeight)}px` : '280px';
  fade.style.opacity = open ? '0' : '1';
  fade.hidden = open;
  btn.innerHTML = open
    ? t('收起旅程 ↑', 'Collapse ↑', '折りたたむ ↑', 'Ocultar ↑', 'Réduire ↑', 'Einklappen ↑', '收起旅程 ↑')
    : t('展開完整旅程 ↓', 'Show Full Journey ↓', 'すべての旅を見る ↓', 'Ver Viaje Completo ↓', 'Voir le parcours complet ↓', 'Gesamte Reise anzeigen ↓', '展开完整旅程 ↓');
}
window.toggleHeroQuotes = function() { const el = document.getElementById('hero-quotes'); const btn = document.getElementById('hero-quotes-toggle'); el.classList.toggle('show-quotes'); if(el.classList.contains('show-quotes')){ btn.innerHTML = t('📖 收起理念 ↑', '📖 Collapse ↑', '📖 閉じる ↑', '📖 Ocultar ↑', '📖 Réduire ↑', '📖 Einklappen ↑', '📖 收起理念 ↑'); } else { btn.innerHTML = t('📖 閱讀設計理念 ↓', '📖 Read Philosophy ↓', '📖 コンセプトを読む ↓', '📖 Leer Filosofía ↓', '📖 Lire la philosophie ↓', '📖 Philosophie lesen ↓', '📖 阅读设计理念 ↓'); } }

window.addEventListener('scroll', () => { const btt = document.getElementById('btt-btn'); if(window.scrollY > 500) { btt.style.display = 'flex'; } else { btt.style.display = 'none'; } });

function loadLocalJourney() { const savedJourney = localStorage.getItem('empath_user_journey'); if(savedJourney){ try { journeyData = JSON.parse(savedJourney); state.eCount = journeyData.counters.e || 0; state.mCount = journeyData.counters.m || 0; state.pCount = journeyData.counters.p || 0; state.aCount = journeyData.counters.a || 0; state.tCount = journeyData.counters.t || 0; } catch(err) { console.error("發生錯誤:", err); } } }
loadLocalJourney();

// ==========================================
// 這個空間記得你 · 僅存在此裝置的回訪記憶
// ==========================================
const RETURN_MEMORY_LAST_VISIT_KEY = 'empath_last_visit';

function setReturnMemoryTranslations(element, translations) {
    if (!element) return;
    Object.entries(translations).forEach(([language, message]) => {
        element.setAttribute(`data-${language}`, message);
    });
    const targetLanguage = window.currentLang === 'en-uk' ? 'en' : window.currentLang;
    element.textContent = translations[targetLanguage] || translations.en || translations.zh;
}

function revealReturnMemory(element) {
    if (!element) return;
    clearTimeout(element._empathMemoryTimer);
    element.classList.remove('is-fading');
    requestAnimationFrame(() => element.classList.add('is-visible'));
    element._empathMemoryTimer = setTimeout(() => {
        element.classList.remove('is-visible');
        element.classList.add('is-fading');
    }, 3000);
}

function returnVisitMessages(previousVisit, now) {
    if (!previousVisit) {
        return {
            zh:'你是第一次來。歡迎。', en:'This is your first visit. Welcome.', ja:'初めて来てくれたあなたへ。ようこそ。',
            es:'Es tu primera vez aquí. Bienvenido.', fr:'C’est votre première visite. Bienvenue.', de:'Du bist zum ersten Mal hier. Willkommen.',
            'zh-cn':'你是第一次来。欢迎。', uk:'Ви тут уперше. Ласкаво просимо.', pl:'Jesteś tu po raz pierwszy. Witaj.'
        };
    }
    const today = new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const previousDate = new Date(previousVisit);
    const previousDay = new Date(previousDate.getFullYear(),previousDate.getMonth(),previousDate.getDate());
    const days = Math.max(0,Math.round((today - previousDay) / 86400000));
    if (days === 0) {
        return {
            zh:'你今天已經來過這裡了。', en:'You have already been here today.', ja:'今日はもう、ここに来ています。',
            es:'Ya has estado aquí hoy.', fr:'Vous êtes déjà venu ici aujourd’hui.', de:'Du warst heute schon hier.',
            'zh-cn':'你今天已经来过这里了。', uk:'Ви вже були тут сьогодні.', pl:'Byłeś już tutaj dzisiaj.'
        };
    }
    return {
        zh:`你上次來這裡，是 ${days} 天前。`, en:`Your last visit was ${days} ${days === 1 ? 'day' : 'days'} ago.`, ja:`前にここへ来たのは、${days}日前です。`,
        es:`La última vez que estuviste aquí fue hace ${days} ${days === 1 ? 'día' : 'días'}.`, fr:`Votre dernière visite remonte à ${days} jour${days === 1 ? '' : 's'}.`, de:`Du warst zuletzt vor ${days} Tag${days === 1 ? '' : 'en'} hier.`,
        'zh-cn':`你上次来这里，是 ${days} 天前。`, uk:`Ви були тут востаннє ${days} дн. тому.`, pl:`Ostatnio byłeś tutaj ${days} dni temu.`
    };
}

function returnCountMessages(count) {
    return {
        zh:`你已經來過這裡 ${count} 次了。`, en:`You have been here ${count} ${count === 1 ? 'time' : 'times'}.`, ja:`あなたはここへ ${count} 回来ています。`,
        es:`Has estado aquí ${count} ${count === 1 ? 'vez' : 'veces'}.`, fr:`Vous êtes venu ici ${count} fois.`, de:`Du warst schon ${count}-mal hier.`,
        'zh-cn':`你已经来过这里 ${count} 次了。`, uk:`Ви вже приходили сюди ${count} раз(и).`, pl:`Byłeś tutaj już ${count} razy.`
    };
}

function applyReturningPlaceholder() {
    const input = document.getElementById('e-input');
    if (!input || !window.empathReturnMemory?.isReturning) return;
    const messages = {
        zh:'你又回來了。今晚帶著什麼？', en:'You came back. What are you carrying tonight?', ja:'また来てくれたのですね。今夜は何を抱えていますか？',
        es:'Has vuelto. ¿Qué traes contigo esta noche?', fr:'Vous êtes revenu. Qu’apportez-vous ce soir ?', de:'Du bist zurück. Was trägst du heute Abend mit dir?',
        'zh-cn':'你又回来了。今晚带着什么？', uk:'Ви повернулися. Що ви принесли із собою сьогодні ввечері?', pl:'Wróciłeś. Co przynosisz ze sobą tego wieczoru?'
    };
    Object.entries(messages).forEach(([language,message]) => input.setAttribute(`data-${language}-ph`,message));
    const targetLanguage = window.currentLang === 'en-uk' ? 'en' : window.currentLang;
    input.setAttribute('placeholder',messages[targetLanguage] || messages.en);
}

function initReturnMemory() {
    const now = new Date();
    const rawPreviousVisit = localStorage.getItem(RETURN_MEMORY_LAST_VISIT_KEY);
    const parsedPreviousVisit = Number(rawPreviousVisit);
    const hasValidPreviousVisit = Number.isFinite(parsedPreviousVisit) && parsedPreviousVisit > 0 && parsedPreviousVisit <= now.getTime() + 300000;
    const previousVisit = hasValidPreviousVisit ? parsedPreviousVisit : null;
    const visitCount = Math.max(0,Number(journeyData.visitCount) || 0) + 1;

    journeyData.visitCount = visitCount;
    localStorage.setItem('empath_user_journey',JSON.stringify(journeyData));
    localStorage.setItem(RETURN_MEMORY_LAST_VISIT_KEY,String(now.getTime()));
    window.empathReturnMemory = { isReturning:Boolean(previousVisit), previousVisit, visitCount };

    const heroMemory = document.getElementById('return-memory');
    setReturnMemoryTranslations(heroMemory,returnVisitMessages(previousVisit,now));
    const revealHeroMemory = () => revealReturnMemory(heroMemory);
    if (document.documentElement.classList.contains('empath-entry-pending')) {
        const entryObserver = new MutationObserver(() => {
            if (document.documentElement.classList.contains('empath-entry-pending')) return;
            entryObserver.disconnect();
            revealHeroMemory();
        });
        entryObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    } else {
        setTimeout(revealHeroMemory,180);
    }

    applyReturningPlaceholder();

    const hMemory = document.getElementById('h-return-memory');
    const soulKey = localStorage.getItem('empath_soul_key');
    if (hMemory && soulKey) {
        setReturnMemoryTranslations(hMemory,returnCountMessages(visitCount));
        const roomH = document.getElementById('room-h');
        if (roomH) {
            const hObserver = new IntersectionObserver(entries => {
                if (!entries.some(entry => entry.isIntersecting)) return;
                revealReturnMemory(hMemory);
                hObserver.disconnect();
            },{threshold:0,rootMargin:'-16px 0px -16px 0px'});
            hObserver.observe(roomH);
        }
    }
}

const SESSION_ROUTE_KEY = 'empath_session_route';
const SESSION_ECHO_KEY = 'empath_session_echo';
const sessionRoomNames = { E:'情緒出口', M:'思念映射', P:'碎片修補', A:'神聖避難所', T:'能量共振', H:'靈魂歸宿' };

function readSessionRoute() {
    try {
        const route = JSON.parse(sessionStorage.getItem(SESSION_ROUTE_KEY) || '[]');
        return Array.isArray(route) ? route.filter(room => sessionRoomNames[room]) : [];
    } catch(error) { return []; }
}

window.renderSessionJourney = function() {
    const host = document.getElementById('h-journey-arc-canvas');
    if (!host) return;
    const route = readSessionRoute();
    if (!route.length) {
        host.innerHTML = `<div class="h-arc-empty">${t('當你走進第一個房間，旅程會從這裡開始。','Your path will begin when you enter your first room.','最初の部屋に入ると、ここから旅が始まります。')}</div>`;
        return;
    }
    const width = 1000, height = 220;
    const points = route.map((room,index) => {
        const progress = route.length === 1 ? .5 : index / (route.length - 1);
        return { room, x:100 + progress * 800, y:142 - Math.sin(progress * Math.PI) * 66 };
    });
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let index=1; index<points.length; index++) {
        const previous = points[index-1], current = points[index], middle = (previous.x + current.x) / 2;
        path += ` C ${middle} ${previous.y}, ${middle} ${current.y}, ${current.x} ${current.y}`;
    }
    const nodes = points.map((point,index) => `
      <g class="h-arc-node" transform="translate(${point.x} ${point.y})">
        <circle class="h-arc-node-ring" r="25"></circle>
        <circle class="h-arc-node-core" r="2.5"></circle>
        <text class="h-arc-node-label" y="-38">${point.room}</text>
        <text class="h-arc-node-order" y="47">${String(index+1).padStart(2,'0')}</text>
        <title>${sessionRoomNames[point.room]}</title>
      </g>`).join('');
    host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${t('你今晚走過的房間路徑','The rooms you visited tonight','今夜訪れた部屋の道のり')}"><path class="h-arc-path" d="${path}"></path>${nodes}</svg>`;
};

function recordSessionRoom(room) {
    const route = readSessionRoute();
    if (route[route.length-1] === room || route.includes(room)) return;
    route.push(room);
    sessionStorage.setItem(SESSION_ROUTE_KEY,JSON.stringify(route));
    window.renderSessionJourney();
}

window.storeSessionEcho = function(text) {
    if (!text) return;
    const fragments = text.split(/[，。！？!?；;、\n]+/).map(part => part.trim()).filter(Boolean);
    let fragment = fragments.find(part => Array.from(part).length >= 2) || '';
    if (/\s/.test(fragment)) fragment = fragment.split(/\s+/).find(word => word.length >= 3) || fragment;
    fragment = Array.from(fragment.replace(/[<>]/g,'')).slice(0,6).join('');
    if (!fragment) return;
    sessionStorage.setItem(SESSION_ECHO_KEY,fragment);
    const echo = document.getElementById('h-session-echo');
    if (echo) echo.textContent = fragment;
};

function initSessionNarrative() {
    window.renderSessionJourney();
    const echo = document.getElementById('h-session-echo');
    if (echo) echo.textContent = sessionStorage.getItem(SESSION_ECHO_KEY) || '';
    // 以「房間確實進入視窗」判定，不再用房間總高度比例。
    // Room P 內容很長；舊 threshold:.32 會要求超過一個視窗的可見高度，
    // 因此在任何螢幕上都可能永遠無法觸發。固定像素內縮也避免
    // 百分比 rootMargin 在寬螢幕上把有效觀察區壓得過小。
    const roomObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            recordSessionRoom(entry.target.id.replace('room-','').toUpperCase());
        });
    },{threshold:0,rootMargin:'-16px 0px -16px 0px'});
    document.querySelectorAll('.room[id^="room-"]').forEach(room => roomObserver.observe(room));
    const footer = document.querySelector('footer');
    if (footer) new IntersectionObserver(entries => {
        footer.classList.toggle('is-farewell-visible',entries[0]?.isIntersecting ?? false);
    },{threshold:.28}).observe(footer);
}

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
let eMode = 'text';
let eDrawCanvas = null;
let eCtx = null;
let isDrawing = false;
let eCanvasHasDrawn = false;
let lastX = 0;
let lastY = 0;
let eDrawEventsBound = false;
let eDrawResizeTimer = null;

window.setEMode = function(mode) {
    eMode = mode;
    const textBtn = document.getElementById('btn-mode-text');
    const drawBtn = document.getElementById('btn-mode-draw');
    const input = document.getElementById('e-input');
    const counter = document.getElementById('e-char');
    const drawWrap = document.getElementById('e-draw-wrap');

    if(textBtn) textBtn.classList.toggle('active', mode === 'text');
    if(drawBtn) drawBtn.classList.toggle('active', mode === 'draw');
    if(input) input.style.display = mode === 'text' ? 'block' : 'none';
    if(counter) counter.style.display = mode === 'text' ? 'block' : 'none';
    if(drawWrap) drawWrap.style.display = mode === 'draw' ? 'block' : 'none';

    // iPhone/Safari 需要等 display:block 真正完成排版後才能取得畫布寬度。
    if(mode === 'draw') {
        requestAnimationFrame(() => requestAnimationFrame(() => initEDrawCanvas()));
    }
};

function resizeEDrawCanvas() {
    if(!eDrawCanvas || !eCtx) return;
    const rect = eDrawCanvas.getBoundingClientRect();
    const wrap = document.getElementById('e-draw-wrap');
    const cssWidth = Math.max(280, Math.round(rect.width || (wrap && wrap.clientWidth) || 600));
    const cssHeight = 220;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.round(cssWidth * dpr);
    const nextHeight = Math.round(cssHeight * dpr);

    if(eDrawCanvas.width !== nextWidth || eDrawCanvas.height !== nextHeight) {
        eDrawCanvas.width = nextWidth;
        eDrawCanvas.height = nextHeight;
        eDrawCanvas.style.height = cssHeight + 'px';
        eCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        eCtx.lineCap = 'round';
        eCtx.lineJoin = 'round';
        eCanvasHasDrawn = false;
    }
}

function initEDrawCanvas() {
    eDrawCanvas = document.getElementById('e-draw-canvas');
    if(!eDrawCanvas) return;
    eCtx = eDrawCanvas.getContext('2d', { alpha: true });
    if(!eCtx) return;
    resizeEDrawCanvas();

    if(!eDrawEventsBound) {
        const point = (e) => {
            const rect = eDrawCanvas.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left) * ((eDrawCanvas.width / Math.min(window.devicePixelRatio || 1, 2)) / rect.width),
                y: (e.clientY - rect.top) * ((eDrawCanvas.height / Math.min(window.devicePixelRatio || 1, 2)) / rect.height)
            };
        };

        const beginDraw = (e) => {
            if(e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            isDrawing = true;
            eCanvasHasDrawn = true;
            const pos = point(e);
            lastX = pos.x;
            lastY = pos.y;
            eCtx.beginPath();
            eCtx.arc(lastX, lastY, 1.8, 0, Math.PI * 2);
            eCtx.fillStyle = 'rgba(222,230,238,.9)';
            eCtx.fill();
            eCtx.beginPath();
            eCtx.moveTo(lastX, lastY);
            try { eDrawCanvas.setPointerCapture(e.pointerId); } catch(err) {}
        };

        const continueDraw = (e) => {
            if(!isDrawing) return;
            e.preventDefault();
            const pos = point(e);
            const dx = pos.x - lastX;
            const dy = pos.y - lastY;
            const dist = Math.hypot(dx, dy);
            eCtx.lineWidth = Math.max(1.4, 5.2 - dist * .09);
            eCtx.strokeStyle = 'rgba(222,230,238,.9)';
            eCtx.shadowBlur = 4;
            eCtx.shadowColor = 'rgba(123,143,161,.62)';
            eCtx.lineTo(pos.x, pos.y);
            eCtx.stroke();
            eCtx.beginPath();
            eCtx.moveTo(pos.x, pos.y);
            lastX = pos.x;
            lastY = pos.y;
            if(typeof window.setBrushVolume === 'function') window.setBrushVolume(dist);
        };

        const endDraw = (e) => {
            if(!isDrawing) return;
            e.preventDefault();
            isDrawing = false;
            if(typeof window.setBrushVolume === 'function') window.setBrushVolume(0);
            eCtx.beginPath();
            try {
                if(eDrawCanvas.hasPointerCapture(e.pointerId)) eDrawCanvas.releasePointerCapture(e.pointerId);
            } catch(err) {}
        };

        eDrawCanvas.addEventListener('pointerdown', beginDraw, { passive:false });
        eDrawCanvas.addEventListener('pointermove', continueDraw, { passive:false });
        eDrawCanvas.addEventListener('pointerup', endDraw, { passive:false });
        eDrawCanvas.addEventListener('pointercancel', endDraw, { passive:false });
        eDrawEventsBound = true;

        window.addEventListener('resize', () => {
            if(eMode !== 'draw') return;
            clearTimeout(eDrawResizeTimer);
            eDrawResizeTimer = setTimeout(resizeEDrawCanvas, 120);
        }, { passive:true });
    }
}

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

window.closeNebula = function() {
    const overlay = document.getElementById('nebula-overlay');
    const textEl = document.getElementById('nebula-text');
    textEl.classList.remove('show');
    overlay.classList.remove('show');
    
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
  
window.clearEDraw = function() {
    if(eCtx) eCtx.clearRect(0, 0, eDrawCanvas.width, eDrawCanvas.height);
    eCanvasHasDrawn = false; // 清除畫布時，重置標記
}

let isAnimating = true; let starsRafId = null; let sandRafId = null; let firestoreUnsubs = []; let otherRoomsTimerId = 0;

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
    }
};

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
    subscribeAll();
}

function handleDataError(room,error) {
    console.error(`Firestore ${room.toUpperCase()} feed failed:`,error);
    setDataState(room,'error',retryDataSubscriptions);
}

async function fetchRealCounts() {
    try {
        const [eSnap, mSnap, pSnap, aSnap, tSnap] = await Promise.all([
            getCountFromServer(collection(db, "emotions")),
            getCountFromServer(collection(db, "stars")),
            getCountFromServer(collection(db, "shards")),
            getCountFromServer(collection(db, "sand")),
            getCountFromServer(collection(db, "warmth")),
        ]);
        globalCounts.e = eSnap.data().count;
        globalCounts.m = mSnap.data().count;
        globalCounts.p = pSnap.data().count;
        globalCounts.a = aSnap.data().count;
        globalCounts.t = tSnap.data().count;
        updateCountersUI();
    } catch(e) {
        console.error(e);
        // 計數失敗不覆寫已知數字，避免介面出現 undefined 或誤導性的 0。
        updateCountersUI();
    }
}
  
function subscribeAll() {
    if(firestoreUnsubs.length > 0) return;
    ['e','m','p','a','t'].forEach(room => setDataState(room,'loading'));
    fetchRealCounts();

    // 1. 監聽情緒出口 (Room E 優先載入，並將上限提高至 300)
    firestoreUnsubs.push(onSnapshot(query(collection(db, "emotions"), orderBy("createdAt", "desc"), firestoreLimit(300)), (snapshot) => {
        allEmotions = [];
        snapshot.forEach(docSnap => allEmotions.push(docSnap.data()));
        if(typeof window.renderEFeed === 'function') window.renderEFeed();
        setDataState('e',snapshot.empty ? 'empty' : null);
        updateCountersUI();
    },error => handleDataError('e',error)));

    // 神奇魔法：網頁載入 3 秒後，才在背景偷偷載入其他房間的資料
    clearTimeout(otherRoomsTimerId);
    otherRoomsTimerId = window.setTimeout(subscribeOtherRooms, 3000);
}

// 📦 負責載入其他房間的資料
function subscribeOtherRooms() {
    // 2. 監聽星星 (修正全域變數綁定)
    firestoreUnsubs.push(onSnapshot(query(collection(db, "stars"), orderBy("createdAt", "desc"), firestoreLimit(80)), (snapshot) => {
        let tempStars = [];
        snapshot.forEach((docSnap) => { tempStars.push({ id: docSnap.id, ...docSnap.data() }); });
        
        window.starMessages = tempStars.map(normalizeStar).sort((a,b) => b.brightness - a.brightness).slice(0, 80);
        try { localStorage.setItem('empath_stars_cache', JSON.stringify(window.starMessages.slice(0,80).map(s => ({id:s.id,text:s.text,brightness:s.brightness,clicks:s.clicks,colorIdx:s.colorIdx,relX:s.relX,relY:s.relY})))); } catch(e) {}
        starMessages = window.starMessages;
        
        if(typeof window.updateMStats === 'function') window.updateMStats();
        if(starsRafId) cancelAnimationFrame(starsRafId);
        starsRafId = null;
        const _sl = document.getElementById('star-loading'); if(_sl) _sl.style.display = 'none';
        setDataState('m',snapshot.empty ? 'empty' : null);
        if(typeof window.drawStars === 'function') window.drawStars();
        updateCountersUI();
    },error => { const _sl = document.getElementById('star-loading'); if(_sl) _sl.style.display = 'none'; handleDataError('m',error); }));

    // 3. 監聽星系金線
    firestoreUnsubs.push(onSnapshot(query(collection(db, "constellations"), orderBy("createdAt", "desc"), firestoreLimit(50)), (snapshot) => {
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

    // 4. 監聽碎片與金繼進度 (修正全域變數綁定)
    firestoreUnsubs.push(onSnapshot(query(collection(db, "shards"), orderBy("createdAt", "desc"), firestoreLimit(60)), (snapshot) => {
        const board = document.getElementById('p-board'); if(!board) return;
        board.innerHTML = ''; 
        window.pHealedTotal = 0; 
        window.pTotalShards = snapshot.size;
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data(); const id = docSnap.id; 
            if(data.healed) window.pHealedTotal++;
            
            const div = document.createElement('div');
            div.className = 'shard' + (data.healed ? ' healed' : '');
            if(!data.healed) { div.tabIndex = 0; div.addEventListener('keydown', e => { if(e.key === 'Enter') div.click(); }); }
            div.innerHTML = `<div class="shard-text">${data.text}</div><div class="shard-healed-tag">✦ ${t('已修補', 'Healed', '修復済', 'Reparado', 'Réparé', 'Geheilt', '已修补')}</div><div class="shard-glow"></div>`;
            div.addEventListener('click', async () => {
                if(data.healed) return; await updateDoc(doc(db, "shards", id), { healed: true });
                if(typeof window.playChime === 'function') window.playChime(); logJourney('p', data.text);
                window.showToast(t('以金修補，裂縫成為了光 ✦', 'Mended with gold ✦', '金で修復しました ✦', 'Reparado con oro ✦', 'Réparé avec de l\'or ✦', 'Mit Gold geflickt ✦', '以金修补，裂缝成为了光 ✦'));
            });
            board.appendChild(div);
        });
        
        globalCounts.p = window.pHealedTotal;
        pHealedTotal = window.pHealedTotal; 
        pTotalShards = window.pTotalShards;
        
        if(typeof window.drawKintsugiVessel === 'function') window.drawKintsugiVessel();
        updateDynamicTexts();
        updateCountersUI();

        const baseTotal = 300;
        const baseHealed = 142;
        const ratio = (window.pTotalShards + baseTotal) > 0 ? (window.pHealedTotal + baseHealed) / (window.pTotalShards + baseTotal) : 0;
        const pct = (ratio * 100).toFixed(1);
        const bar = document.getElementById('global-healing-bar');
        const pctText = document.getElementById('global-healing-pct');
        if (bar) bar.style.width = pct + '%';
        if (pctText) pctText.textContent = pct + '%';

        if (ratio >= 0.5 && !localStorage.getItem('empath_p_50_reached')) {
            localStorage.setItem('empath_p_50_reached', 'true');
            setTimeout(() => {
                window.showToast(t('✦ 世界上被修補的傷痛，已超過一半了', '✦ More than half of the world\'s pain has been mended', '✦ 世界の痛みの半分以上が修復されました', '✦ Más de la mitad del dolor ha sido reparado', '✦ Plus de la moitié de la douleur a été réparée', '✦ Mehr als die Hälfte des Schmerzes wurde geflickt', '✦ 世界上被修补的伤痛，已超过一半了'), 6000);
            }, 2000);
        }
        setDataState('p',snapshot.empty ? 'empty' : null);
    },error => handleDataError('p',error)));

    // 5. 監聽沙畫
    firestoreUnsubs.push(onSnapshot(query(collection(db, "sand"), orderBy("createdAt", "desc"), firestoreLimit(30)), (snapshot) => {
        globalCounts.a = snapshot.size; const feed = document.getElementById('a-feed'); if(!feed) return;
        feed.innerHTML = ''; const nowMs = Date.now();
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const msgTime = data.absoluteTime || (data.createdAt ? data.createdAt.seconds * 1000 : nowMs);
            const lifespanMs = data.lifespan || (24 * 60 * 60 * 1000);
            const expiresAt = msgTime + lifespanMs;
            const leftSecs = (expiresAt - nowMs) / 1000;
            if(leftSecs <= 0) return;
            const div = document.createElement('div'); div.className = 'sand-msg';
            div.dataset.expires = expiresAt; div.dataset.lifespan = lifespanMs;
            const pct = (leftSecs / (lifespanMs / 1000)) * 100;
            div.innerHTML = `<div class="sand-dissolve-overlay"></div><div class="sand-msg-text">${data.text}</div><div class="sand-timer-wrap notranslate"><div class="sand-timer-label">DISSOLVING</div><div class="sand-timer-bar"><div class="sand-timer-fill" style="width:${pct}%"></div></div><div class="sand-time-left">${formatTimeLeft(Math.floor(leftSecs))}</div></div>`;
            feed.appendChild(div);
        });
        setDataState('a',feed.children.length ? null : 'empty');
        updateCountersUI();
    },error => handleDataError('a',error)));

    // 6. 監聽溫暖共振
    firestoreUnsubs.push(onSnapshot(query(collection(db, "warmth"), orderBy("createdAt", "desc"), firestoreLimit(30)), (snapshot) => {
        globalCounts.t = snapshot.size; const feed = document.getElementById('t-feed'); if(!feed) return;
        feed.innerHTML = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data(); const id = docSnap.id;
            const div = document.createElement('div'); div.className = 'warmth-item';
            div.innerHTML = `<div class="warmth-pulse"></div> <div>${data.text}</div> <button type="button" class="echo-btn ${localStorage.getItem('echoed_'+id)?'pulsed':''}" id="btn-${id}"> <span class="heart">🕯️</span> Echo Pulse </button>`;
            div.querySelector('.echo-btn').addEventListener('click', async function(e){
                if(this.classList.contains('pulsed')) return;
                this.classList.add('pulsed'); localStorage.setItem('echoed_'+id, 'true');
                await updateDoc(doc(db, "warmth", id), { echos: (data.echos||0)+1 });
                window.showToast('✦ Echo Pulse Sent'); window.triggerHeartbeat();
                if (typeof window.createEchoRipple === 'function') window.createEchoRipple(e);
                if (typeof window.playChime === 'function') window.playChime();
            });
            feed.appendChild(div);
        });
        setDataState('t',snapshot.empty ? 'empty' : null);
        updateCountersUI();
    },error => handleDataError('t',error)));
}
  
function unsubscribeAll() { clearTimeout(otherRoomsTimerId); otherRoomsTimerId = 0; firestoreUnsubs.forEach(unsub => unsub()); firestoreUnsubs = []; }
document.addEventListener("visibilitychange", () => { if (document.hidden) { isAnimating = false; if(starsRafId) cancelAnimationFrame(starsRafId); if(sandRafId) cancelAnimationFrame(sandRafId); unsubscribeAll(); } else { subscribeAll(); if (!document.body.classList.contains('hsp-mode')) { isAnimating = true; if(typeof window.drawStars === 'function') window.drawStars(); if(typeof window.drawSand === 'function') window.drawSand(); } } });

window.toggleHSP = function() { const body = document.body; const btn = document.getElementById('hsp-btn'); body.classList.toggle('hsp-mode'); if(body.classList.contains('hsp-mode')) { btn.classList.add('active'); localStorage.setItem('empath_hsp_mode', 'true'); if (typeof audioCtx !== 'undefined' && isAudioEnabled) window.toggleAudio(); isAnimating = false; if(starsRafId) cancelAnimationFrame(starsRafId); if(sandRafId) cancelAnimationFrame(sandRafId); window.showToast(t('👁️ 已開啟降噪模式：降低對比與暫停閃爍', '👁️ Calm mode activated', '👁️ 静寂モードをオンにしました', '👁️ Modo Calma activado', '👁️ Mode Calme activé', '👁️ Ruhemodus aktiviert', '👁️ 已开启降噪模式：降低对比与暂停闪烁')); } else { btn.classList.remove('active'); localStorage.setItem('empath_hsp_mode', 'false'); isAnimating = true; if(typeof window.drawStars === 'function') window.drawStars(); if(typeof window.drawSand === 'function') window.drawSand(); window.showToast(t('已關閉降噪模式', 'Calm mode deactivated', '静寂モードをオフにしました', 'Modo Calma desactivado', 'Mode Calme désactivé', 'Ruhemodus deaktiviert', '已关闭降噪模式')); } }

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
  
window.openShareCard = function() { document.getElementById('sc-e').textContent = state.eCount; document.getElementById('sc-m').textContent = state.mCount; document.getElementById('sc-p').textContent = state.pCount; document.getElementById('sc-a').textContent = state.aCount; document.getElementById('sc-t').textContent = state.tCount; document.getElementById('share-modal').classList.add('show'); }
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
  
window.closeShareModal = function() { document.getElementById('share-modal').classList.remove('show'); setTimeout(() => { document.getElementById('wrapped-card-content').style.display = 'block'; const img = document.getElementById('generated-card-img'); if(img) img.remove(); document.getElementById('download-card-btn').style.display = 'inline-block'; document.getElementById('download-card-btn').textContent = t('⬇️ 下載為專屬圖片檔案', '⬇️ Download Exclusive Card', '⬇️ 専用画像としてダウンロード', '⬇️ Descargar Tarjeta Exclusiva', '⬇️ Télécharger la carte', '⬇️ Exklusive Karte herunterladen', '⬇️ 下载为专属图片档案'); const hint = document.getElementById('save-hint'); if(hint) hint.style.display = 'none'; }, 400); }
window.openPrivacy = function() { 
    window.lastFocusBeforePrivacy = document.activeElement; // 記錄點開前的按鈕
    document.getElementById('privacy-modal').classList.add('show'); 
    // 延遲一點點，將焦點移入「我明白了」按鈕
    setTimeout(() => { const btn = document.getElementById('privacy-close-btn'); if(btn) btn.focus(); }, 100); 
}
window.closePrivacy = function() { 
    document.getElementById('privacy-modal').classList.remove('show'); 
    // 關閉時，把焦點還給頁尾的隱私連結
    if(window.lastFocusBeforePrivacy) window.lastFocusBeforePrivacy.focus(); 
}

window.openCreator = function() { document.getElementById('creator-modal').classList.add('show'); }
window.closeCreator = function() { document.getElementById('creator-modal').classList.remove('show'); }

// ♿ 無障礙最高境界：全局監聽 ESC 鍵，一鍵關閉所有彈窗
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (document.getElementById('privacy-modal')?.classList.contains('show')) window.closePrivacy();
        if (document.getElementById('share-modal')?.classList.contains('show')) window.closeShareModal();
        if (document.getElementById('breathe-overlay')?.classList.contains('show')) window.stopBreathe();
        if (document.getElementById('nebula-overlay')?.classList.contains('show')) window.closeNebula();
        if (document.getElementById('creator-modal')?.classList.contains('show')) window.closeCreator(); // 👈 這裡就是新增的 ESC 關閉公告
        const fortune = document.getElementById('fortune-display');
        if (fortune?.classList.contains('show')) fortune.classList.remove('show');
    }
});
  
window.showToast = function(msg, dur=2400){ const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), dur); }
function nowStr(){ const d = new Date(); return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0'); }

function logJourney(type, text){ const time = nowStr(); journeyData.counters[type] = (journeyData.counters[type] || 0) + 1; journeyData.events.push({ type, text, time }); localStorage.setItem('empath_user_journey', JSON.stringify(journeyData)); state[type+'Count']++; renderTimelineHTML(type, text, time); autoBackupToCloud(); updateCountersUI(); }
function renderTimelineHTML(type, text, time){ const container = document.getElementById('h-events'); const div = document.createElement('div'); div.className = 'h-event ' + type + '-event'; const labels = { 'zh': {e:'情緒出口', m:'思念映射', p:'碎片修補', a:'避難所', t:'能量共振'}, 'en': {e:'Exit', m:'Stars', p:'Mended', a:'Asylum', t:'Resonance'}, 'ja': {e:'出口', m:'星空', p:'修復', a:'避難所', t:'共鳴'}, 'es': {e:'Salida', m:'Estrellas', p:'Reparado', a:'Asilo', t:'Resonancia'}, 'fr': {e:'Sortie', m:'Étoiles', p:'Réparé', a:'Asile', t:'Résonance'}, 'de': {e:'Ausgang', m:'Sterne', p:'Geflickt', a:'Asyl', t:'Resenz'}, 'zh-cn': {e:'情绪出口', m:'思念映射', p:'碎片修补', a:'避难所', t:'能量共振'} }; const currentKey = window.currentLang === 'en-uk' ? 'en' : window.currentLang; div.innerHTML = `<div><div class="h-event-label">${labels[currentKey]?.[type]||''}</div><div class="h-event-text">${text.length>40?text.slice(0,40)+'…':text}</div><div class="h-event-time">${time}</div></div>`; container.appendChild(div); }
function initTimeline(){ 
    const container = document.getElementById('h-events'); 
    container.innerHTML = `<div class="h-event" style="color:var(--muted);font-size:13px;padding-left:20px;border-left:1px solid rgba(255,255,255,.07);"><div><div style="font-size:11px;letter-spacing:2px;color:rgba(255,255,255,.4);margin-bottom:4px; font-weight:bold;">START</div><div>${t('你來到了這裡。這已經是一種勇氣。', 'You arrived here. That is already a form of courage.', 'あなたはここに来ました。それ自体が勇気です。', 'Has llegado aquí. Eso ya es una forma de valentía.', 'Vous êtes arrivé ici. C\'est déjà une forme de courage.', 'Du bist hier angekommen. Das ist bereits eine Form von Mut.', '你来到了这里。这已经是一种勇气。')}</div></div></div>`; 
    
    if (journeyData.events.length === 0) {
        // 如果除了 START 以外什麼都沒有，就顯示溫柔的提示
        container.innerHTML += `<div class="h-event" style="color:rgba(255,255,255,0.3);font-size:13px;padding-left:20px;border-left:1px dashed rgba(255,255,255,.1);"><div><div style="font-style:italic;">${t('你的旅程足跡會在這裡慢慢浮現...', 'Your journey footprints will slowly appear here...', 'あなたの旅の足跡がここに少しずつ現れます...', 'Tus huellas del viaje aparecerán lentamente aquí...', 'Vos empreintes de voyage apparaîtront lentement ici...', 'Deine Fußspuren werden hier langsam erscheinen...', '你的旅程足迹会在这里慢慢浮现...')}</div></div></div>`;
    } else {
        journeyData.events.forEach(ev => renderTimelineHTML(ev.type, ev.text, ev.time)); 
    }
}
  
window.createSoulKey = async function() { const soulKey = `EMP-${Math.random().toString(36).substring(2,6).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`; localStorage.setItem('empath_soul_key', soulKey); await autoBackupToCloud(); updateSyncUI(); window.showToast(t('靈魂鑰匙生成成功 ✦', 'Key generated!', '鍵が生成されました ✦', '¡Llave generada!', 'Clé générée !', 'Schlüssel generiert!', '灵魂钥匙生成成功 ✦')); }
window.copySoulKey = function() { const key = localStorage.getItem('empath_soul_key'); if (key) { navigator.clipboard.writeText(key).then(() => { const btn = document.getElementById('copy-key-btn'); const originalText = btn.innerHTML; btn.innerHTML = t('✓ 已複製', '✓ Copied', '✓ コピー済', '✓ Copiado', '✓ Copié', '✓ Kopiert', '✓ 已复制'); btn.style.color = '#fff'; btn.style.borderColor = '#fff'; window.showToast(t('🗝️ 鑰匙已複製到剪貼簿', '🗝️ Key copied', '🗝️ キーをコピーしました', '🗝️ Llave copiada', '🗝️ Clé copiée', '🗝️ Schlüssel kopiert', '🗝️ 钥匙已复制到剪贴板')); setTimeout(() => { btn.innerHTML = originalText; btn.style.color = 'var(--gold)'; btn.style.borderColor = 'var(--gold)'; }, 2000); }).catch(err => { window.showToast('複製失敗 / Copy failed'); }); } }
window.loadExistingSoulKey = async function() { const input = document.getElementById('sync-key-input'); const key = input.value.trim().toUpperCase(); if(!key) return; try { const docSnap = await getDoc(doc(db, "user_journeys", key)); if(docSnap.exists()) { const cd = docSnap.data(); const localVisitCount = Math.max(0,Number(journeyData.visitCount) || 0); journeyData = { counters: cd.counters || {e:0,m:0,p:0,a:0,t:0}, events: cd.events || [], visitCount:localVisitCount }; localStorage.setItem('empath_soul_key', key); localStorage.setItem('empath_user_journey', JSON.stringify(journeyData)); state.eCount = journeyData.counters.e||0; state.mCount = journeyData.counters.m||0; state.pCount = journeyData.counters.p||0; state.aCount = journeyData.counters.a||0; state.tCount = journeyData.counters.t||0; document.getElementById('h-events').innerHTML = ''; initTimeline(); updateSyncUI(); updateCountersUI(); window.showToast(t('靈魂共振成功！足跡已喚回 ✦', 'Sync successful!', '同期成功！足跡が復元されました ✦', '¡Sincronización exitosa!', 'Synchronisation réussie !', 'Synchronisierung erfolgreich!', '灵魂共振成功！足迹已唤回 ✦')); input.value=''; } else { window.showToast(t('未找到此鑰匙', 'Key not found', '鍵が見つかりません', 'Llave no encontrada', 'Clé introuvable', 'Schlüssel nicht gefunden', '未找到此钥匙')); } } catch(err) { console.error("發生錯誤:", err); } }
window.unlinkSoulKey = function() { if(confirm(t('確定要解除綁定嗎？', 'Unlink your device?', '連携を解除しますか？', '¿Desvincular tu dispositivo?', 'Dissocier votre appareil ?', 'Gerät entkoppeln?', '确定要解除绑定吗？'))) { localStorage.removeItem('empath_soul_key'); updateSyncUI(); } }
async function autoBackupToCloud() { const key = localStorage.getItem('empath_soul_key'); if(!key) return; try { await setDoc(doc(db, "user_journeys", key), { counters: journeyData.counters, events: journeyData.events, updatedAt: serverTimestamp() }, { merge: true }); } catch(err) { console.error("發生錯誤:", err); } }
function updateSyncUI() { const key = localStorage.getItem('empath_soul_key'); if(key) { document.getElementById('sync-initial-actions').style.display='none'; document.getElementById('sync-active-actions').style.display='flex';
const fb = document.getElementById('future-letter-box'); if(fb) fb.style.display='block'; window.checkFutureLetters(); document.getElementById('active-key-display').textContent=key; } else { document.getElementById('sync-initial-actions').style.display='flex'; document.getElementById('sync-active-actions').style.display='none'; } }

let allEmotions = []; let eFeedExpanded = false;

// ==========================================
// 改寫：E房間 送出與渲染邏輯 (支援文字與圖片)
// ==========================================
window.submitE = async function(){ 
    if(!canSubmit()) return; 
    
    let text = "";
    let imageData = null;

    if (eMode === 'text') {
        const input = document.getElementById('e-input'); 
        text = input.value.trim(); 
        if(!text) return; 
        text = cleanText(text); 
        input.value = '';
        document.getElementById('e-char').textContent = '0 / 500';
    } else {
        if(!eDrawCanvas || !eCanvasHasDrawn) return;
        imageData = eDrawCanvas.toDataURL('image/webp', 0.8); 
        window.clearEDraw();
    }

    try { 
        const origText = document.getElementById('e-submit-btn').innerHTML; 
        const docData = { createdAt: serverTimestamp() };
        if (text) docData.text = text;
        if (imageData) docData.image = imageData;
        
        await addDoc(collection(db, "emotions"), docData); 
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
            starText.innerHTML = `「 ${showText} 」<br><span style="font-size:12px; opacity:0.6; margin-top:16px; display:block; letter-spacing:4px;">宇宙收到了 ✦</span>`; 
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

    } catch(e) { 
        console.error("Firestore 寫入失敗：", e); 
        window.showToast('傳送失敗，請稍後再試 ✦');
    }
}

let currentEFeedLimit = 3; // 初始只顯示 3 筆

window.renderEFeed = function() { 
    const feed = document.getElementById('e-feed'); 
    const fade = document.getElementById('e-feed-fade'); 
    const btn = document.getElementById('e-expand-btn'); 
    const container = document.querySelector('#room-e .e-feed-container');
    if(!feed) return; 
    
    // 每次渲染前清空
    feed.innerHTML = ''; 
    
    // 根據目前的顯示上限來切出要顯示的資料
    const dataToShow = allEmotions.slice(0, currentEFeedLimit);
    
    dataToShow.forEach(data => { 
        const timeStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : nowStr(); 
        const div = document.createElement('div'); 
        div.className = 'e-msg'; 
        
        let contentHtml = '';
        if (data.text) {
            contentHtml = `<div>${data.text}</div>`;
        } else if (data.image) {
            contentHtml = `<img src="${data.image}" class="e-msg-img" alt="Emotional Scribble">`;
        }

        div.innerHTML = `<div class="e-msg-anon">${t('匿名 · ANONYMOUS', 'ANONYMOUS', '匿名 · ANONYMOUS', 'ANÓNIMO', 'ANONYME', 'ANONYM', '匿名 · ANONYMOUS')}</div>${contentHtml}<div class="e-msg-time">${timeStr}</div>`; 
        feed.appendChild(div); 
    }); 
    
    // 展開時同步解除外層裁切，否則新增的留言仍會被固定高度藏住。
    if (container) container.classList.toggle('is-expanded', currentEFeedLimit > 3);

    // 按鈕與漸層的顯示邏輯
    if(allEmotions.length > 3) { 
        btn.style.display = 'inline-flex'; 
        
        if(currentEFeedLimit < allEmotions.length) { 
            // 如果還沒顯示完所有抓下來的資料
            fade.style.display = 'block'; 
            btn.innerHTML = t('↓ 載入更多', '↓ Load More', '↓ もっと読み込む', '↓ Cargar más', '↓ Charger plus', '↓ Mehr laden', '↓ 载入更多'); 
        } else { 
            // 已經顯示到極限了
            fade.style.display = 'none'; 
            btn.innerHTML = t('↑ 收起全部', '↑ Collapse All', '↑ すべて閉じる', '↑ Ocultar todo', '↑ Tout réduire', '↑ Alle einklappen', '↑ 收起全部'); 
        } 
    } else { 
        btn.style.display = 'none'; fade.style.display = 'none'; 
    } 
}

window.toggleEFeed = function() { 
    if (currentEFeedLimit < allEmotions.length) {
        // 如果還沒到底，每次點擊多顯示 30 筆 (這樣保證滑順，絕對不會當機)
        currentEFeedLimit += 30;
    } else {
        // 如果已經到底了，再點一次就會收回到只剩 3 筆
        currentEFeedLimit = 3;
    }
    window.renderEFeed(); 
}

const canvas = document.getElementById('star-canvas'); const ctx = canvas.getContext('2d'); const tooltip = document.getElementById('star-tooltip'); const roomM = document.getElementById('room-m'); let bgStars=[]; let activeStarId = null; const STAR_COLORS = [ {r: 212, g: 228, b: 255}, {r: 255, g: 239, b: 213}, {r: 198, g: 216, b: 231}, {r: 247, g: 220, b: 200}, {r: 230, g: 230, b: 250}, {r: 255, g: 248, b: 231} ];

function normalizeStar(star, index = 0) {
    const safeStar = star && typeof star === 'object' ? star : {};
    const seed = String(safeStar.id || safeStar.text || index);
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    const seeded = (offset) => {
        const value = Math.sin(hash + offset) * 10000;
        return value - Math.floor(value);
    };

    return {
        ...safeStar,
        text: typeof safeStar.text === 'string' ? safeStar.text : '',
        brightness: Number.isFinite(Number(safeStar.brightness)) ? Math.max(1, Number(safeStar.brightness)) : 1,
        clicks: Number.isFinite(Number(safeStar.clicks)) ? Number(safeStar.clicks) : 0,
        colorIdx: Number.isInteger(Number(safeStar.colorIdx))
            ? Math.abs(Number(safeStar.colorIdx)) % STAR_COLORS.length
            : Math.floor(seeded(17) * STAR_COLORS.length),
        relX: Number.isFinite(Number(safeStar.relX))
            ? Math.min(0.95, Math.max(0.05, Number(safeStar.relX)))
            : 0.05 + seeded(31) * 0.9,
        relY: Number.isFinite(Number(safeStar.relY))
            ? Math.min(0.95, Math.max(0.05, Number(safeStar.relY)))
            : 0.05 + seeded(47) * 0.9
    };
}

try {
    const _c = localStorage.getItem('empath_stars_cache');
    const cachedStars = _c ? JSON.parse(_c) : [];
    window.starMessages = Array.isArray(cachedStars) ? cachedStars.map(normalizeStar) : [];
} catch(e) {
    window.starMessages = [];
    localStorage.removeItem('empath_stars_cache');
}
window.resizeCanvas = function(){ 
    const dpr = window.devicePixelRatio || 1; 
    
    if(canvas && roomM) { 
        const w = roomM.clientWidth;
        const h = Math.max(roomM.scrollHeight, roomM.offsetHeight, 600);
        canvas.width = w * dpr; 
        canvas.height = h * dpr; 
        canvas.style.width = w + 'px'; 
        canvas.style.height = h + 'px'; 
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 
        initBgStars(w, h); 
        // 旋轉裝置或行動瀏覽器改變可視高度時，依新星空區重新定位。
        if(Array.isArray(window.starMessages)) {
            window.starMessages.forEach(star => { star.x = undefined; star.y = undefined; });
        }
    } 
    
    const sCanvas = document.getElementById('sand-canvas'); 
    const roomA = document.getElementById('room-a'); 
    if(sCanvas && roomA) { 
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
  
// 終極防護：加入防抖 (Debounce) 機制，並忽略手機上下滑動時的網址列縮放
let resizeTimer = null;
let lastWidth = window.innerWidth;

window.addEventListener('resize', () => {
    // 核心關鍵：如果只是上下滑動導致網址列縮放（寬度沒變），就絕對不要重繪畫布！
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    
    clearTimeout(resizeTimer); // 踩煞車，取消前一次的倒數
    resizeTimer = setTimeout(window.resizeCanvas, 300);
});

window.addEventListener('orientationchange', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(window.resizeCanvas, 300);
});
  
function initBgStars(w, h){ 
    bgStars=[]; 
    // 動態計算：電腦給 100 顆，手機寬度小於 768px 時只給 35 顆
    const starCount = w < 768 ? 35 : 100;
    for(let i=0; i<starCount; i++){ 
        bgStars.push({
            x: Math.random()*w, 
            y: Math.random()*h, 
            r: Math.random()*0.8+0.2, 
            a: Math.random()*0.4+0.1, 
            da: (Math.random()-.5)*0.003, 
            c: STAR_COLORS[Math.floor(Math.random()*STAR_COLORS.length)]
        }); 
    } 
}

window.updateMStats = function() { 
    if(!document.getElementById('m-count')) return; 
    // 顯示兩千多顆的真實數據
    document.getElementById('m-count').textContent = globalCounts.m || starMessages.length; 
    
    // 計算最亮的那顆星
    if(starMessages.length === 0) { 
        document.getElementById('m-brightest').textContent = '—'; return; 
    } 
    const brightest = starMessages.reduce((a, b) => b.brightness > a.brightness ? b : a); 
    document.getElementById('m-brightest').textContent = brightest.text.length > 14 ? brightest.text.slice(0, 14) + '…' : brightest.text; 
}

function drawSparkle(ctx, x, y, radius, r, g, b, alpha) { ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.moveTo(0, -radius); ctx.quadraticCurveTo(0, 0, radius, 0); ctx.quadraticCurveTo(0, 0, 0, radius); ctx.quadraticCurveTo(0, 0, -radius, 0); ctx.quadraticCurveTo(0, 0, 0, -radius); ctx.closePath(); ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`; ctx.shadowBlur = radius; ctx.shadowColor = `rgba(${r},${g},${b},${alpha})`; ctx.fill(); ctx.restore(); }
window.drawStars = function(){ 
    if(!canvas || !ctx || !roomM || !isAnimating) return;
    const ambientMotion = document.body.classList.contains('empath-motion-idle');
    if(!canvas.width || !canvas.height) {
        if(typeof window.resizeCanvas === 'function') window.resizeCanvas();
        if(!canvas.width || !canvas.height) return;
    }
    const allStarMessages = Array.isArray(window.starMessages)
        ? window.starMessages.map(normalizeStar)
        : [];
    window.starMessages = allStarMessages;
    // 必須和 resizeCanvas 使用同一組 CSS 像素尺寸；手機上 scrollHeight
    // 往往大於 offsetHeight，混用會讓星星被畫到房間邊界之外。
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const canvasRect = canvas.getBoundingClientRect();
    // 依照介面實際位置建立星星禁入區，避免星星被文字或數據面板蓋住。
    const uiSafeRects = [...roomM.querySelectorAll('.room-title-wrap, .desc-wrap, .m-input-wrap, .m-stats')]
        .filter(el => getComputedStyle(el).display !== 'none')
        .map(el => {
            const r = el.getBoundingClientRect();
            const pad = 22;
            return {
                left: r.left - canvasRect.left - pad,
                right: r.right - canvasRect.left + pad,
                top: r.top - canvasRect.top - pad,
                bottom: r.bottom - canvasRect.top + pad
            };
        });
    const insideUiSafeRect = (x, y) => uiSafeRects.some(r => x > r.left && x < r.right && y > r.top && y < r.bottom);
    // 窄視窗採代表性抽樣，避免大量星星在有限空間持續互相排斥。
    // 手機保留較少的代表星，完整資料仍存在；避免小螢幕把星系壓成一團。
    const visibleLimit = w < 600 ? 18 : (w < 900 ? 32 : allStarMessages.length);
    const starMessages = allStarMessages.slice(0, visibleLimit);
    ctx.clearRect(0,0,w,h); 

    // 1. 畫背景星星
    bgStars.forEach(s => {
        if (insideUiSafeRect(s.x, s.y)) return;
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); 
        ctx.fillStyle=`rgba(${s.c.r},${s.c.g},${s.c.b},${s.a})`; 
        if(s.r > 0.7) { ctx.shadowBlur = 4; ctx.shadowColor = `rgba(${s.c.r},${s.c.g},${s.c.b},0.8)`; } 
        ctx.fill(); ctx.shadowBlur = 0; 
    }); 

    // 🌕 1.5 滿月夜專屬：渲染真實滿月
    if (window.isFullMoon) {
        ctx.beginPath();
        // 將滿月掛在右上方
        ctx.arc(w > 768 ? w - 200 : w - 80, 150, w > 768 ? 45 : 30, 0, Math.PI * 2);
        // 月亮的微黃光暈
        ctx.fillStyle = 'rgba(255, 252, 230, 0.9)';
        ctx.shadowBlur = 80;
        ctx.shadowColor = 'rgba(255, 252, 230, 0.7)';
        ctx.fill();
        ctx.shadowBlur = 0;
    }
  
    // 2. 抓取安全區
    let safeX = 0, safeY = 0, safeW = w, safeH = h;
    if (w > 768) {
        safeX = 580; safeW = w - 620; safeY = 120; safeH = h - 200;
    } else {
        // 手機的星空舞台位於說明與輸入區之間，不能放在統計資料之後；
        // 後者已接近 section 底部，舊寫法會把星星推到下一個房間並被裁切。
        const roomRect = roomM.getBoundingClientRect();
        const descEl = roomM.querySelector('.desc-wrap');
        const inputEl = roomM.querySelector('.m-input-wrap');
        const descBottom = descEl ? descEl.getBoundingClientRect().bottom - roomRect.top : 220;
        const inputTop = inputEl ? inputEl.getBoundingClientRect().top - roomRect.top : descBottom + 300;
        safeX = 30;
        safeW = Math.max(w - 60, 100);
        safeY = Math.max(24, descBottom + 26);
        const safeBottom = Math.min(h - 32, inputTop - 26);
        safeH = Math.max(80, safeBottom - safeY);
    }
    safeW = Math.max(safeW, 100);

    const needsStarLayout = starMessages.some(s => !Number.isFinite(s.x) || !Number.isFinite(s.y));
    if (needsStarLayout) {
    // 3.1 首次定位；完成後所有次要星星保持靜止
    starMessages.forEach(s => { 
        let targetX = safeX + (s.relX * safeW); 
        let targetY = safeY + (s.relY * safeH); 
        if (s.x === undefined || isNaN(s.x) || s.y === undefined || isNaN(s.y)) {
            s.x = targetX; s.y = targetY;
        }
    });

    // 3.2 排斥力 & 橡皮筋軟邊界
    for(let i=0; i<starMessages.length; i++) {
        for(let j=i+1; j<starMessages.length; j++) {
            let s1 = starMessages[i];
            let s2 = starMessages[j];
            let dx = s2.x - s1.x; let dy = s2.y - s1.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist === 0) { dx = 1; dy = 1; dist = 1.414; }
            // 依目前可用面積動態調整間距；畫面越窄，安全距離越小。
            const availableArea = Math.max(safeW * safeH, 1);
            const dynamicMinDist = Math.max(28, Math.min(85, Math.sqrt(availableArea / Math.max(starMessages.length, 1)) * 0.72));
            if (dist < dynamicMinDist) {
                const push = Math.min(2.2, (dynamicMinDist - dist) * 0.12);
                const nx = dx / dist; const ny = dy / dist;
                s1.x -= nx * push; s1.y -= ny * push;
                s2.x += nx * push; s2.y += ny * push;
            }
        }
        let s1 = starMessages[i];
        if(s1.x < safeX) s1.x += (safeX - s1.x) * 0.2;
        if(s1.x > safeX + safeW) s1.x -= (s1.x - (safeX + safeW)) * 0.2;
        if(s1.y < safeY) s1.y += (safeY - s1.y) * 0.2;
        if(s1.y > safeY + safeH) s1.y -= (s1.y - (safeY + safeH)) * 0.2;

        // 若排斥後進入介面禁區，推向距離最近的邊緣，而不是把星星藏在霧幕下。
        uiSafeRects.forEach(r => {
            if (s1.x <= r.left || s1.x >= r.right || s1.y <= r.top || s1.y >= r.bottom) return;
            const distances = [
                { edge: 'left', value: s1.x - r.left },
                { edge: 'right', value: r.right - s1.x },
                { edge: 'top', value: s1.y - r.top },
                { edge: 'bottom', value: r.bottom - s1.y }
            ].sort((a,b) => a.value - b.value);
            if (distances[0].edge === 'left') s1.x = r.left;
            else if (distances[0].edge === 'right') s1.x = r.right;
            else if (distances[0].edge === 'top') s1.y = r.top;
            else s1.y = r.bottom;
        });
    }
    }

    // 🌟 4. 先畫出全網 24 小時共振星系連線 (放在星星背後)
    if (window.activeConstellations && window.activeConstellations.length > 0) {
        const nowMs = Date.now();
        window.activeConstellations.forEach(c => {
            const star1 = starMessages.find(s => s.id === c.s1Id);
            const star2 = starMessages.find(s => s.id === c.s2Id);
            if (star1 && star2 && star1.x !== undefined && star2.x !== undefined) {
                const ageHours = (nowMs - c.createdAt) / (1000 * 60 * 60);
                const alpha = Math.max(0.1, 0.85 - (ageHours / 24) * 0.5); 
                ctx.beginPath();
                ctx.moveTo(star1.x, star1.y);
                ctx.lineTo(star2.x, star2.y);
                ctx.strokeStyle = `rgba(201, 168, 76, ${alpha})`; 
                ctx.lineWidth = 1.5; 
                ctx.shadowBlur = 10;
                ctx.shadowColor = `rgba(201, 168, 76, ${alpha})`;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        });
    }

    // 5. 再畫出留言星星本體
    const brightestStar = starMessages.reduce((best,s) => !best || s.brightness > best.brightness ? s : best,null);
    const pulse = ambientMotion ? (1 + Math.sin(performance.now() / 760) * .085) : 1;
    starMessages.forEach(s => { 
        const b = s.brightness; const c = STAR_COLORS[s.colorIdx]; const focusScale = s === brightestStar ? pulse : 1; const coreR = (1.5 + (b * 0.4)) * focusScale; const glowR = coreR * 5; 
        const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR); 
        grd.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, 0.9)`); grd.addColorStop(0.3, `rgba(${c.r}, ${c.g}, ${c.b}, 0.3)`); grd.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`); 
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(s.x, s.y, glowR, 0, Math.PI*2); ctx.fill(); 
        drawSparkle(ctx, s.x, s.y, coreR * 3 + b * 2.5, c.r, c.g, c.b, 0.95); 
    }); 

    starsRafId = ambientMotion ? requestAnimationFrame(window.drawStars) : null; 
}

function getStarAt(x, y){ return starMessages.find(s => { if(!s.x) return false; const dx = s.x-x, dy = s.y-y; return Math.sqrt(dx*dx+dy*dy) < (20 + s.brightness*2); }); }
window.activeConstellations = window.activeConstellations || [];

roomM.addEventListener('click', async e => { 
    if (e.target.closest('.m-input-wrap') || e.target.tagName==='TEXTAREA' || e.target.tagName==='BUTTON') return; 
    const rect = canvas.getBoundingClientRect(); 
    const x = e.clientX-rect.left, y = e.clientY-rect.top; 
    const star = getStarAt(x, y); 
    
    if(star){ 
        if(activeStarId !== star.id) { 
            activeStarId = star.id; 
            tooltip.classList.add('active'); 
            if(window.innerWidth > 768) { 
                tooltip.style.transform = 'none'; 
                let tx = e.clientX + 16; let ty = e.clientY - 16; 
                if (tx + 260 > window.innerWidth) tx = e.clientX - 280; 
                tooltip.style.left = tx + 'px'; tooltip.style.top = ty + 'px'; tooltip.style.bottom = 'auto'; 
            } 
            tooltip.innerHTML = `${t('思念', 'Memory', '想い', 'Recuerdo', 'Souvenir', 'Erinnerung', '思念')}<br>${star.text}<br><span style="font-size:10px;color:var(--gold);margin-top:10px;display:block;">✦ ${t('再次點擊以共鳴點亮', 'Click again to resonate', 'もう一度クリックして共鳴', 'Haz clic de nuevo para resonar', 'Cliquez à nouveau pour résonner', 'Klicken Sie erneut, um mitzuschwingen', '再次点击以共鸣点亮')}</span>`; 
        } else { 
            try { 
                await updateDoc(doc(db, "stars", star.id), { brightness: Math.min(star.brightness + 1, 12), clicks: star.clicks + 1 }); 
                window.showToast(t('這顆思念更亮了 ✦', 'Resonated ✦', '星が輝きました ✦', 'Resonó ✦', 'A résonné ✦', 'Hat mitgeschwungen ✦', '这颗思念更亮了 ✦')); 
                window.triggerHeartbeat(); 
                
                // 🎧 觸發 3D 空間水晶音
                const panValue = (x / window.innerWidth) * 2 - 1;
                if(typeof window.playSpatialChime === 'function') window.playSpatialChime(panValue);
                
                // ✨ 觸發全網星系連線魔法 (強制牽起最近的兩顆星，無視距離)
                let distances = starMessages
                    .map(s => ({ star: s, d: Math.hypot(s.x - x, s.y - y) }))
                    .filter(s => s.star.id !== star.id);
                distances.sort((a,b) => a.d - b.d);
                let nearest = distances.slice(0, 2).map(d => d.star);
                
                nearest.forEach(async n => {
                    // 將這條金線同步到 Firebase，讓全網看見，並設定 24 小時後消失
                    await addDoc(collection(db, "constellations"), {
                        s1Id: star.id,
                        s2Id: n.id,
                        createdAt: serverTimestamp()
                    });
                });
                
                tooltip.classList.remove('active'); 
                activeStarId = null; 
            } catch (err) {} 
        } 
    } else { 
        tooltip.classList.remove('active'); activeStarId = null; 
    } 
});
  
window.submitM = async function(){ if(!canSubmit()) return; const input = document.getElementById('m-input'); let text = input.value.trim(); if(!text) return; text = cleanText(text); try { const origText = document.getElementById('m-submit-btn').innerHTML; await addDoc(collection(db, "stars"), { text, brightness: 1, clicks: 0, colorIdx: Math.floor(Math.random()*STAR_COLORS.length), relX: 0.05+Math.random()*0.9, relY: 0.05+Math.random()*0.9, createdAt: serverTimestamp() }); input.value=''; logJourney('m', text); playRitual('m-submit-btn', origText); window.empathContrastMoment?.(); window.showToast(t('你的思念成為了一顆星 ✦', 'Added to the sky ✦', '星になりました ✦', 'Añadido al cielo ✦', 'Ajouté au ciel ✦', 'Zum Himmel hinzugefügt ✦', '你的思念成为了一颗星 ✦')); } catch(err) { console.error("發生錯誤:", err); } }

let pCanvas, pCtx;
window.pHealedTotal = 0;
window.pTotalShards = 0;
window.addEventListener('load', () => { pCanvas = document.getElementById('p-canvas'); pCtx = pCanvas.getContext('2d'); const dpr = window.devicePixelRatio || 1; const cw = pCanvas.offsetWidth || 540; const ch = 380; pCanvas.width = cw * dpr; pCanvas.height = ch * dpr; pCanvas.style.width = cw + 'px'; pCanvas.style.height = ch + 'px'; pCtx.setTransform(dpr, 0, 0, dpr, 0, 0); window.drawKintsugiVessel(); });
window.drawKintsugiVessel = function(){
    const healed = window.pHealedTotal || 0;
    const total = window.pTotalShards || 0;
    if(!pCtx || !pCanvas) return;

    const c = pCtx;
    const w = pCanvas.offsetWidth || 620;
    const h = 380;
    c.clearRect(0, 0, w, h);
    c.save();
    c.translate(w / 2, h / 2 + 18);
    const scale = Math.min(1, w / 620);
    c.scale(scale, scale);

    // 樂茶碗的手捏輪廓：低、厚、偏心，避免完美橢圓與花盆感。
    const body = new Path2D();
    body.moveTo(-164, -55);
    body.bezierCurveTo(-151, -15, -139, 38, -102, 77);
    body.bezierCurveTo(-72, 107, -31, 118, 8, 116);
    body.bezierCurveTo(55, 116, 97, 98, 125, 65);
    body.bezierCurveTo(151, 33, 160, -13, 157, -50);
    body.bezierCurveTo(88, -30, -92, -27, -164, -55);
    body.closePath();

    c.save();
    c.filter = 'blur(15px)';
    c.fillStyle = 'rgba(0,0,0,.58)';
    c.beginPath();
    c.ellipse(-2, 128, 130, 17, -.015, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // 溫潤象牙白釉，保留土色陰影，不再使用沉重的水泥灰。
    const clay = c.createLinearGradient(-150, -75, 125, 120);
    clay.addColorStop(0, '#d5c9b4');
    clay.addColorStop(.22, '#b9aa91');
    clay.addColorStop(.54, '#897a65');
    clay.addColorStop(.78, '#5b5042');
    clay.addColorStop(1, '#302a23');
    c.fillStyle = clay;
    c.shadowBlur = 30;
    c.shadowColor = 'rgba(203,171,91,.09)';
    c.fill(body);
    c.shadowBlur = 0;

    c.save();
    c.clip(body);

    // 焼きむら：左側柔亮、右下帶火痕，紋理保持安靜而不髒亂。
    const glaze = c.createRadialGradient(-92, -59, 5, -40, -5, 220);
    glaze.addColorStop(0, 'rgba(255,250,232,.48)');
    glaze.addColorStop(.34, 'rgba(239,226,198,.17)');
    glaze.addColorStop(.72, 'rgba(92,74,56,.05)');
    glaze.addColorStop(1, 'rgba(24,19,15,.28)');
    c.fillStyle = glaze;
    c.fillRect(-180, -90, 360, 240);

    const fireMark = c.createRadialGradient(92, 56, 2, 88, 56, 82);
    fireMark.addColorStop(0, 'rgba(126,72,45,.18)');
    fireMark.addColorStop(.55, 'rgba(91,52,35,.07)');
    fireMark.addColorStop(1, 'rgba(60,35,24,0)');
    c.fillStyle = fireMark;
    c.fillRect(5, -20, 165, 160);

    // 少量固定鐵斑與釉縮孔，避免每次重繪閃動。
    for(let i=0;i<58;i++){
        const x=-145+((i*83)%292);
        const y=-44+((i*53)%147);
        const r=.28+((i*17)%9)/13;
        c.beginPath();
        c.arc(x,y,r,0,Math.PI*2);
        c.fillStyle=i%5===0?'rgba(82,54,36,.24)':'rgba(255,248,225,.12)';
        c.fill();
    }

    // 手指修坯留下的極淡橫紋。
    c.strokeStyle='rgba(255,245,220,.055)';
    c.lineWidth=1;
    for(let y=10;y<90;y+=18){
        c.beginPath();
        c.moveTo(-128+y*.12,y);
        c.bezierCurveTo(-55,y+4,52,y-4,118-y*.08,y+1);
        c.stroke();
    }
    c.restore();

    // 厚而不規則的口沿，以及幽深茶湯般的內釉。
    const inner = new Path2D();
    inner.moveTo(-164,-55);
    inner.bezierCurveTo(-101,-83,79,-82,157,-50);
    inner.bezierCurveTo(95,-16,-96,-15,-164,-55);
    inner.closePath();
    const inside = c.createRadialGradient(-36,-51,8,5,-48,172);
    inside.addColorStop(0,'#4a4033');
    inside.addColorStop(.58,'#29231d');
    inside.addColorStop(1,'#120f0c');
    c.fillStyle=inside;
    c.fill(inner);

    c.beginPath();
    c.moveTo(-164,-55);
    c.bezierCurveTo(-101,-83,79,-82,157,-50);
    c.strokeStyle='rgba(255,242,210,.52)';
    c.lineWidth=2.2;
    c.stroke();

    c.beginPath();
    c.moveTo(-158,-51);
    c.bezierCurveTo(-91,-27,88,-25,151,-48);
    c.strokeStyle='rgba(18,14,11,.72)';
    c.lineWidth=2.4;
    c.stroke();

    // 小而略偏的高台足。
    const foot = new Path2D();
    foot.moveTo(-47,108);
    foot.bezierCurveTo(-33,119,36,120,52,105);
    foot.lineTo(43,121);
    foot.bezierCurveTo(18,132,-25,131,-42,120);
    foot.closePath();
    c.fillStyle='#272019';
    c.fill(foot);
    c.strokeStyle='rgba(222,202,162,.25)';
    c.lineWidth=1.2;
    c.stroke(foot);

    // 裂紋以一條主脈帶細小支線構成；分布偏側，保留留白。
    const veins=[
      {p:[[-18,112],[-19,79],[-4,51],[-12,24],[8,-4],[3,-35],[19,-66]],w:3.1},
      {p:[[-5,50],[-35,38],[-53,18],[-78,9]],w:1.7},
      {p:[[-12,24],[18,30],[38,20],[61,24]],w:1.35},
      {p:[[7,-4],[34,-16],[49,-38]],w:1.5},
      {p:[[34,-16],[62,-7],[79,8]],w:1.05},
      {p:[[-53,18],[-70,35],[-75,55]],w:.95}
    ];
    const ratio=total>0?healed/total:0;
    const goldCount=Math.round(ratio*veins.length);

    const pathFor=(points)=>{
      c.beginPath();
      c.moveTo(points[0][0],points[0][1]);
      for(let i=1;i<points.length;i++){
        const prev=points[i-1],cur=points[i];
        const mx=(prev[0]+cur[0])/2,my=(prev[1]+cur[1])/2;
        c.quadraticCurveTo(prev[0],prev[1],mx,my);
        if(i===points.length-1)c.lineTo(cur[0],cur[1]);
      }
    };

    veins.forEach((v,i)=>{
      pathFor(v.p);
      c.lineCap='round';
      c.lineJoin='round';
      c.strokeStyle='rgba(25,16,10,.72)';
      c.lineWidth=v.w+1.8;
      c.shadowBlur=0;
      c.stroke();

      pathFor(v.p);
      if(i<goldCount){
        const g=c.createLinearGradient(v.p[0][0],v.p[0][1],v.p[v.p.length-1][0],v.p[v.p.length-1][1]);
        g.addColorStop(0,'#7c5415');
        g.addColorStop(.28,'#d6ad45');
        g.addColorStop(.5,'#fff0a5');
        g.addColorStop(.72,'#c08a25');
        g.addColorStop(1,'#68420c');
        c.strokeStyle=g;
        c.lineWidth=v.w;
        c.shadowBlur=3;
        c.shadowColor='rgba(235,190,75,.28)';
      }else{
        c.strokeStyle='rgba(34,24,17,.82)';
        c.lineWidth=Math.max(.8,v.w);
      }
      c.stroke();
      c.shadowBlur=0;
    });

    c.restore();
};
  
window.submitP = async function(){ if(!canSubmit()) return; const input = document.getElementById('p-input'); let text = input.value.trim(); if(!text) return; text = cleanText(text); const origText = document.getElementById('p-submit-btn').innerHTML; await addDoc(collection(db, "shards"), { text, healed: false, createdAt: serverTimestamp() }); input.value = ''; logJourney('p', text); playRitual('p-submit-btn', origText); window.empathContrastMoment?.(); window.showToast(t('碎片已放入', 'Added to vessel', '欠片を入れました', 'Añadido a la vasija', 'Ajouté au récipient', 'Zum Gefäß hinzugefügt', '碎片已放入')); }

let sandParticles = []; const SAND_COLORS = ['#7A9E9F', '#6B9091', '#9AC2C3', '#5D7C7D']; 
function initSandBg(w, h) { sandParticles = []; for(let i=0; i<250; i++){ sandParticles.push({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 1.5 + 0.5, speedY: Math.random() * 1.5 + 0.5, speedX: (Math.random() - 0.5) * 0.5, opacity: Math.random() * 0.4 + 0.1, color: SAND_COLORS[Math.floor(Math.random()*SAND_COLORS.length)], swirlOffset: Math.random() * Math.PI * 2 }); } }

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
    if(!c || !c.width || !isAnimating) return; 
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

window.acceptARead = function() { document.getElementById('a-warning-mask').style.display = 'none'; const feed = document.getElementById('a-feed'); feed.style.display = 'flex'; setTimeout(() => feed.style.filter = 'blur(0px)', 50); sessionStorage.setItem('empath_a_accepted', 'true'); }
window.hideAFeed = function() { document.getElementById('a-warning-mask').innerHTML = `<p style="color:var(--muted); font-size:13px; line-height:2;">${t('已隱藏他人留言。<br>你的痛苦依然會被這裡安放。', 'Messages hidden.<br>Your pain will still be held here.', '他人のメッセージを非表示にしました。<br>あなたの痛みはここで大切に保管されます。', 'Mensajes ocultos.<br>Tu dolor seguirá siendo sostenido aquí.', 'Messages masqués.<br>Votre douleur sera toujours conservée ici.', 'Nachrichten ausgeblendet.<br>Dein Schmerz wird hier weiterhin bewahrt.', '已隐藏他人留言。<br>你的痛苦依然会被这里安放。')}</p>`; }
window.submitA = async function(){ 
    if(!canSubmit()) return; 
    const input = document.getElementById('a-input'); 
    let text = input.value.trim(); 
    if(!text) return; 
    text = cleanText(text); 
    const minutes = parseInt(document.getElementById('a-timer-select').value);
    const lifespan = minutes * 60 * 1000;
    const origText = document.getElementById('a-submit-btn').innerHTML; 
    await addDoc(collection(db, "sand"), { text, absoluteTime: Date.now(), lifespan: lifespan, createdAt: serverTimestamp() }); 
    
    // 🌟 記錄投遞時間，作為 24 小時後宇宙回聲的種子
    localStorage.setItem('empath_a_submit_time', Date.now());

    input.value=''; logJourney('a', text); playRitual('a-submit-btn', origText); 
    window.empathContrastMoment?.();
    window.showToast('放入沙畫 ✦'); 
}

window.submitT = async function(){ 
    if(!canSubmit()) return; 
    const input = document.getElementById('t-input'); 
    let text = input.value.trim(); 
    if(!text) return; 
    text = cleanText(text); 
    const origText = document.getElementById('t-submit-btn').innerHTML; 
    
    // 🌟 取得這則溫暖的專屬 ID，用來監聽它未來的命運
    const docRef = await addDoc(collection(db, "warmth"), { text, echos: 0, createdAt: serverTimestamp() }); 
    localStorage.setItem('empath_my_warmth_id', docRef.id);
    localStorage.setItem('empath_my_warmth_echos', '0');

    input.value=''; logJourney('t', text); playRitual('t-submit-btn', origText); window.empathContrastMoment?.(); window.showToast(t('溫暖已漂浮', 'Warmth floating', '温もりが漂いました', 'Calidez flotante', 'Chaleur flottante', 'Wärme schwebt', '温暖已漂浮')); 
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
    onSnapshot(presenceRef, (docSnap) => {
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
    });
}

// 🌟 拔掉原本的 load 煞車，改用 DOMContentLoaded 讓它瞬間起跑

// ==========================================
// 🌌 魔法五：時間維度引擎 (時刻感知、月相、紀念日)
// ==========================================
window.initTimeAndCosmic = function() {
    const now = new Date();
    const hour = now.getHours();
    
    // 🌙 1. 深夜與破曉感知
    const body = document.body;
    const eInput = document.getElementById('e-input');
    if (hour >= 0 && hour <= 4) {
        body.classList.add('night-mode');
        if(eInput) {
            eInput.setAttribute('data-zh-ph', '深夜了，是什麼讓你無法入睡？\n把這份重量放在這裡，沒有人知道是你。');
            eInput.setAttribute('data-en-ph', 'Late at night, what keeps you awake?\nLeave the weight here, no one knows it is you.');
            // 強制更新當下 placeholder
            const targetLang = (window.currentLang === 'en-uk') ? 'en' : window.currentLang;
            eInput.setAttribute('placeholder', eInput.getAttribute('data-' + targetLang + '-ph') || eInput.getAttribute('data-zh-ph'));
        }
    } else if (hour >= 5 && hour <= 8) {
        body.classList.add('dawn-mode');
    }

    // 🌕 2. 月相感知 (純數學計算，無須 API)
    // 週期約為 29.53 天 (轉換成秒數)，基準點為千禧年的一個已知新月
    const lunarPeriod = 2551443; 
    const newMoon1970 = 947182440;
    const currentUnix = now.getTime() / 1000;
    const phase = ((currentUnix - newMoon1970) % lunarPeriod) / lunarPeriod;
    const normalizedPhase = (phase + 1) % 1;
    const phaseIndex = Math.floor(normalizedPhase * 8 + 0.5) % 8;
    const moonPhases = [
        { icon:'●', zh:'新月', en:'new moon', ja:'新月' },
        { icon:'◔', zh:'眉月', en:'waxing crescent', ja:'三日月' },
        { icon:'◐', zh:'上弦月', en:'first-quarter moon', ja:'上弦の月' },
        { icon:'◕', zh:'盈凸月', en:'waxing gibbous moon', ja:'満ちてゆく月' },
        { icon:'○', zh:'滿月', en:'full moon', ja:'満月' },
        { icon:'◕', zh:'虧凸月', en:'waning gibbous moon', ja:'欠けてゆく月' },
        { icon:'◑', zh:'下弦月', en:'last-quarter moon', ja:'下弦の月' },
        { icon:'◔', zh:'殘月', en:'waning crescent', ja:'有明の月' }
    ];
    const moon = moonPhases[phaseIndex];
    window.empathMoonPhase = { phase:normalizedPhase, index:phaseIndex, ...moon };
    
    // 判斷是否為滿月 (月相落在 0.47 到 0.53 之間)
    window.isFullMoon = (phase > 0.47 && phase < 0.53);

    const presence = document.getElementById('cosmic-presence');
    if (presence) {
        const hhmm = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', hour12:false });
        const periodZh = hour < 5 ? '深夜' : hour < 9 ? '清晨' : hour < 12 ? '上午' : hour < 17 ? '午後' : hour < 20 ? '傍晚' : '夜晚';
        const zh = `現在是${periodZh} ${hhmm}。你不孤單。 · ${moon.icon} 今晚是${moon.zh}`;
        const en = `It is ${hhmm}. You are not alone. · ${moon.icon} Tonight: ${moon.en}`;
        const ja = `今は ${hhmm}。あなたはひとりではありません。 · ${moon.icon} 今夜は${moon.ja}`;
        presence.setAttribute('data-zh',zh);
        presence.setAttribute('data-zh-cn',zh);
        presence.setAttribute('data-en',en);
        presence.setAttribute('data-ja',ja);
        presence.textContent = t(zh,en,ja,en,en,en,zh);
    }
    
    if (window.isFullMoon) {
        const mDesc = document.querySelector('#room-m .room-desc');
        if (mDesc) {
            mDesc.setAttribute('data-zh', '今夜是滿月，思念傳得更遠。<br>點亮一顆星星，聽見別人藏在夜空裡的心事。');
            mDesc.setAttribute('data-en', 'Tonight is a full moon. Memories travel further.<br>Click a star to hear the night\'s secrets.');
            const targetLang = (window.currentLang === 'en-uk') ? 'en' : window.currentLang;
            mDesc.innerHTML = mDesc.getAttribute('data-' + targetLang) || mDesc.getAttribute('data-zh');
        }
    }

    // 🎂 3. 週年紀念日感知
    // 💡 我先幫妳設定為 8 月 3 日 (今天)，讓妳一打開就能測試！測試完可改成妳實際上線的日期
    const launchMonth = 7; // JS的月份是 0-11，所以 7 代表 8 月
    const launchDay = 3;
    const launchYear = 2026;
    
    if (now.getMonth() === launchMonth && now.getDate() === launchDay) {
        body.classList.add('anniversary-mode');
        const years = now.getFullYear() - launchYear;
        // 延遲 3 秒後，在左下角跳出隱藏的極美吐司提示
        setTimeout(() => {
            let msg = years === 0 ? '✦ EMPATH 誕生了，謝謝你成為第一批在這裡的靈魂 ✦' : `✦ EMPATH 今天 ${years} 歲了，謝謝你也在這裡 ✦`;
            window.showToast(msg, 6000);
        }, 3000);
    }
};

  // ==========================================
// 🌌 魔法七：情感閉環引擎 (時空信箱、溫暖回聲、延遲沙畫)
// ==========================================

// 1. Room H：給未來的自己
window.submitFutureLetter = async function() {
    const key = localStorage.getItem('empath_soul_key');
    const text = document.getElementById('future-letter-input').value.trim();
    if(!key || !text) return;
    const unlockDate = Date.now() + (90 * 24 * 60 * 60 * 1000); // 預設 90 天後解鎖
    try {
        const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        const docRef = doc(db, "user_journeys", key);
        const docSnap = await getDoc(docRef);
        let letters = [];
        if(docSnap.exists() && docSnap.data().letters) letters = docSnap.data().letters;
        letters.push({ content: text, unlockDate: unlockDate, createdAt: Date.now() });
        await updateDoc(docRef, { letters: letters });
        document.getElementById('future-letter-input').value = '';
        window.showToast('✉️ 信件已封存。三個月後，帶著鑰匙回來這裡。', 4000);
    } catch(e) { console.error(e); }
};

window.checkFutureLetters = async function() {
    const key = localStorage.getItem('empath_soul_key');
    if(!key) return;
    try {
        const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        const docSnap = await getDoc(doc(db, "user_journeys", key));
        if(docSnap.exists() && docSnap.data().letters) {
            const letters = docSnap.data().letters;
            const container = document.getElementById('unlocked-letters');
            container.innerHTML = '';
            const now = Date.now();
            letters.forEach(l => {
                // 如果時間到了，或開啟了穿越密技
                if(now >= l.unlockDate || window.isTestingLetter) {
                    container.innerHTML += `<div style="padding:20px; background:rgba(255,255,255,0.03); border-left:2px solid var(--gold); border-radius:0 4px 4px 0; margin-bottom:16px; font-size:15px; color:var(--fog); line-height:2; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                        <span style="font-size:11px; color:var(--gold); display:block; margin-bottom:12px; letter-spacing:3px; font-weight:bold;">✉️ 來自 ${new Date(l.createdAt).toLocaleDateString()} 的信</span>
                        ${l.content}
                    </div>`;
                }
            });
        }
    } catch(e) {}
};

// 2. Room A：24小時宇宙回聲
window.checkRoomAEcho = async function() {
    const aSubmitTime = localStorage.getItem('empath_a_submit_time');
    // 如果距離上次投遞超過 24 小時，或開啟了穿越密技
    if (aSubmitTime && (Date.now() - parseInt(aSubmitTime) > 24 * 60 * 60 * 1000 || window.isTestingEcho)) {
        try {
            const { getDocs, query, limit } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
            const q = query(collection(db, "sand"), firestoreLimit(10));
            const querySnapshot = await getDocs(q);
            const msgs = [];
            querySnapshot.forEach((doc) => msgs.push(doc.data().text));
            if(msgs.length > 0) {
                const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
                setTimeout(() => {
                    window.showToast(`✦ 來自宇宙的回聲 ✦\n「${randomMsg.slice(0, 30)}...」\n有人與你同時在這裡，留下了這句話。`, 8000);
                }, 4000);
                localStorage.removeItem('empath_a_submit_time'); // 聽過一次就清掉
            }
        } catch(e) {}
    }
};

// 3. Room T：溫暖抵達了
window.checkRoomTWarmth = function() {
    const myWarmthId = localStorage.getItem('empath_my_warmth_id');
    if(myWarmthId) {
        onSnapshot(doc(db, "warmth", myWarmthId), (docSnap) => {
            if(docSnap.exists()){
                const echos = docSnap.data().echos || 0;
                const lastEchos = parseInt(localStorage.getItem('empath_my_warmth_echos') || '0');
                if(echos > lastEchos) {
                    localStorage.setItem('empath_my_warmth_echos', echos);
                    // 讓 Room T 門口微微發光
                    const tDoor = document.querySelector('.door-btn[data-d="T"]');
                    if(tDoor) { tDoor.style.boxShadow = '0 0 25px rgba(232,168,124,0.6)'; tDoor.style.borderColor = 'var(--amber)'; }
                    
                    // 在面板內顯示靜靜的通知
                    let msgBox = document.getElementById('my-warmth-echo-msg');
                    if(!msgBox) {
                        msgBox = document.createElement('div');
                        msgBox.id = 'my-warmth-echo-msg';
                        msgBox.style.cssText = 'color:var(--amber); font-size:13px; margin-top:24px; text-align:center; font-weight:bold; letter-spacing:1px; border-top:1px dashed rgba(232,168,124,0.3); padding-top:16px; animation: pulse-spark 3s infinite;';
                        document.querySelector('.t-send-panel').appendChild(msgBox);
                    }
                    msgBox.innerHTML = `✦ 宇宙回聲：你上次送出的溫暖，已被陌生人共鳴了 ${echos} 次。`;
                }
            }
        });
    }
};
  
  // Cinematic pointer light and restrained reveal motion
document.addEventListener('DOMContentLoaded', () => {
    const sky = document.querySelector('.cinematic-sky');
    const heroOpening = document.querySelector('.hero-opening');
    if(sky && heroOpening && window.matchMedia('(pointer:fine)').matches) {
        heroOpening.addEventListener('pointermove', (event) => {
            const rect = heroOpening.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            sky.style.setProperty('--lens-x', x + '%');
            sky.style.setProperty('--lens-y', y + '%');
            sky.style.setProperty('--depth-x', ((x - 50) * -0.18) + 'px');
            sky.style.setProperty('--depth-y', ((y - 50) * -0.12) + 'px');
        }, { passive: true });
    }

    document.querySelectorAll('#hero .door-btn').forEach(card => {
        card.addEventListener('pointermove', (event) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--card-x', (event.clientX - rect.left) + 'px');
            card.style.setProperty('--card-y', (event.clientY - rect.top) + 'px');
        }, { passive: true });
    });

    const revealRoomHeader = (hash) => {
        if(!hash || !hash.startsWith('#room-')) return;
        document.querySelectorAll(hash + ' .room-tag, ' + hash + ' .room-title-wrap, ' + hash + ' .desc-wrap')
            .forEach(element => element.classList.add('is-revealed'));
    };
    document.querySelectorAll('a[href^="#room-"]').forEach(link => {
        link.addEventListener('click', () => revealRoomHeader(link.getAttribute('href')));
    });
    revealRoomHeader(window.location.hash);

    const revealTargets = document.querySelectorAll('.journey-heading, .journey-act, .hero-manifesto > *, .room .room-tag, .room .room-title-wrap, .room .desc-wrap');
    if('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('visual-ready');
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
        revealTargets.forEach(target => revealObserver.observe(target));
    }
});

// Premium navigation and quiet hero utilities
window.addEventListener('scroll', () => {
    document.body.classList.toggle('page-scrolled', window.scrollY > 90);
}, { passive: true });
document.addEventListener('keydown', (event) => {
    if(event.key === 'Escape' && document.getElementById('onboarding-box')?.classList.contains('is-open')) {
        window.closeGuide();
    }
});

document.addEventListener('DOMContentLoaded', async () => {
  setupRoomPresence('roomE', 'e-input');
  setupRoomPresence('roomM', 'm-input');
  setupRoomPresence('roomP', 'p-input');
  setupRoomPresence('roomA', 'a-input');
  setupRoomPresence('roomT', 't-input');
    
  // 啟動時間與宇宙感知
  window.initTimeAndCosmic();
  initReturnMemory();
  initSessionNarrative();

  // 啟動情感閉環引擎
  window.checkRoomAEcho();
  window.checkRoomTWarmth();

  // ==========================================
  // 🌍 魔法六：全站情緒脈衝與集體靜默引擎
  // ==========================================
  
  // 動態生成 HTML 結構
  document.body.insertAdjacentHTML('beforeend', `
    <div id="global-pulse-overlay"><div class="pulse-text" id="pulse-text"></div></div>
    <div id="silence-overlay">
        <div class="silence-text" id="silence-text">此刻，世界某處的靈魂，正與你一起安靜。</div>
        <div class="silence-timer" id="silence-timer">60</div>
    </div>
  `);

  // 1. 全站情緒脈衝觸發器
  window.checkGlobalPulse = function(totalMsgs) {
      const currentThousand = Math.floor(totalMsgs / 1000) * 1000;
      const lastPulse = parseInt(localStorage.getItem('empath_last_pulse') || '0');
      
      // 當跨越一個新的 1000 門檻時觸發 (例如從 999 變成 1000)
      if (currentThousand > 0 && currentThousand > lastPulse) {
          localStorage.setItem('empath_last_pulse', currentThousand);
          
          const overlay = document.getElementById('global-pulse-overlay');
          const textEl = document.getElementById('pulse-text');
          textEl.innerHTML = `✦<br>${t(`全世界第 ${currentThousand} 則傾訴，已被接住`, `The world's ${currentThousand}th message has been caught`, `世界で ${currentThousand} 番目の想いが受け止められました`, `El mensaje ${currentThousand} del mundo ha sido atrapado`, `Le ${currentThousand}ème message a été attrapé`, `Die ${currentThousand}. Nachricht wurde aufgefangen`, `全世界第 ${currentThousand} 则倾诉，已被接住`)}`;
          
          overlay.style.opacity = '1';
          setTimeout(() => { textEl.style.opacity = '1'; textEl.style.transform = 'translateY(0)'; }, 500);
          if(typeof window.playChime === 'function') window.playChime();
          
          setTimeout(() => {
              textEl.style.opacity = '0';
              textEl.style.transform = 'translateY(20px)';
              overlay.style.opacity = '0';
          }, 6000);
      }
  };

  // 2. 集體靜默時刻系統 (每天 UTC 00:00 觸發 60 秒)
  let silenceInterval = setInterval(() => {
      const now = new Date();
      // 判斷是否為 UTC 00:00 (台灣時間早上 8:00) 的前 60 秒內
      const isSilenceMoment = (now.getUTCHours() === 0 && now.getUTCMinutes() === 0 && now.getUTCSeconds() < 60);
      
      // 開放一個手動測試開關 window.isTestingSilence
      if (isSilenceMoment || window.isTestingSilence) {
          if (!document.getElementById('silence-overlay').classList.contains('active')) {
              document.getElementById('silence-overlay').classList.add('active');
              if (typeof audioCtx !== 'undefined' && isAudioEnabled) audioCtx.suspend(); // 暫停所有音樂
          }
          // 倒數計時器
          const left = 60 - now.getUTCSeconds();
          document.getElementById('silence-timer').innerText = left > 0 ? left : '0';
      } else {
          if (document.getElementById('silence-overlay').classList.contains('active')) {
              document.getElementById('silence-overlay').classList.remove('active');
              if (typeof audioCtx !== 'undefined' && isAudioEnabled) audioCtx.resume(); // 恢復音樂
          }
      }
  }, 1000);
    
  // 🌟 瞬間視覺魔法：在 Firebase 還沒連上之前，先用快取數據填滿畫面！
  const cached = localStorage.getItem('empath_global_counts');
  if (cached) {
      Object.assign(globalCounts, JSON.parse(cached));
      updateCountersUI();
  }

  subscribeAll();
  
  const metaRef = doc(db, "metadata", "site_stats"); const hasVisited = localStorage.getItem('empath_visited');
  firestoreUnsubs.push(onSnapshot(metaRef, (docSnap) => { if(docSnap.exists()){ globalCounts.v = docSnap.data().totalVisitors || 0; updateCountersUI(); } }));
  if (!hasVisited) { try { await setDoc(metaRef, { totalVisitors: increment(1) }, { merge: true }); localStorage.setItem('empath_visited', 'true'); } catch(e) { console.error("發生錯誤:", e); } }
  if(!localStorage.getItem('empath_hsp_hint_shown')) { setTimeout(() => { const ttip = document.getElementById('hsp-tooltip'); if(ttip) { ttip.classList.add('show'); setTimeout(() => { ttip.classList.remove('show'); }, 8000); localStorage.setItem('empath_hsp_hint_shown', 'true'); } }, 1000); }
  if(sessionStorage.getItem('empath_a_accepted') === 'true') { const mask = document.getElementById('a-warning-mask'); const feed = document.getElementById('a-feed'); if(mask && feed) { mask.style.display = 'none'; feed.style.display = 'flex'; feed.style.filter = 'blur(0px)'; } }
  initTimeline(); updateSyncUI(); 
  const existingKey = localStorage.getItem('empath_soul_key');
  if(existingKey) { try { const docSnap = await getDoc(doc(db, "user_journeys", existingKey)); if(docSnap.exists()) { const cloudData = docSnap.data(); const localVisitCount = Math.max(0,Number(journeyData.visitCount) || 0); journeyData = { counters: cloudData.counters || {e:0, m:0, p:0, a:0, t:0}, events: cloudData.events || [], visitCount:localVisitCount }; localStorage.setItem('empath_user_journey', JSON.stringify(journeyData)); state.eCount=journeyData.counters.e||0; state.mCount=journeyData.counters.m||0; state.pCount=journeyData.counters.p||0; state.aCount=journeyData.counters.a||0; state.tCount=journeyData.counters.t||0; document.getElementById('h-events').innerHTML = ''; initTimeline(); updateCountersUI(); } } catch(err) { console.error("發生錯誤:", err); } }
  const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
          if (!document.body.classList.contains('hsp-mode')) {
              if (entry.target.id === 'room-m') { 
                  if (entry.isIntersecting && isAnimating) { 
                      if (!starsRafId) window.drawStars(); 
                  } else if (!entry.isIntersecting) { 
                      if (starsRafId) { cancelAnimationFrame(starsRafId); starsRafId = null; } 
                  } 
              }
              if (entry.target.id === 'room-a') { 
                  if (entry.isIntersecting && isAnimating) { 
                      if (!sandRafId) window.drawSand(); 
                  } else if (!entry.isIntersecting) { 
                      if (sandRafId) { cancelAnimationFrame(sandRafId); sandRafId = null; } 
                  } 
              }
          }
          if (entry.isIntersecting) { 
              if (entry.target.id === 'hero') { document.title = 'EMPATH — Every Moment As Truth Heals'; } 
              else { const roomLetter = entry.target.querySelector('.room-letter')?.textContent; if (roomLetter) document.title = `Room ${roomLetter} — EMPATH`; } 
          }
      });
  }, { threshold: 0.15 });

  document.querySelectorAll('.room, #hero').forEach(el => observer.observe(el));
  observer.observe(document.getElementById('room-m'));
  observer.observe(document.getElementById('room-a'));
  setTimeout(() => { window.resizeCanvas(); window.drawStars(); window.drawSand(); updateCountersUI(); }, 800);
});
