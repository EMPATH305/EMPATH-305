import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, serverTimestamp, query, orderBy, setDoc, getDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Note: To secure these credentials fully, you MUST configure Firestore Security Rules in your Firebase Console.
const firebaseConfig = {
  apiKey: "AIzaSyANaBq5vt8G5L2GJjzAAfVmHYFeKA9bF90",
  authDomain: "empath-62582.firebaseapp.com",
  projectId: "empath-62582",
  storageBucket: "empath-62582.firebasestorage.app",
  messagingSenderId: "945974527649",
  appId: "1:945974527649:web:552e236eff7809dfea52e0",
  measurementId: "G-9Z9X6E7WBZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const state = { eCount:0, mCount:0, pCount:0, aCount:0, tCount:0 };
const globalCounts = { v:0, e:0, m:0, p:0, a:0, t:0 };
let journeyData = { counters: {e:0, m:0, p:0, a:0, t:0}, events: [] };

/* 🌟 前端防洪機制 (Rate Limiting) */
let lastSubmitTime = 0;
const SUBMIT_COOLDOWN = 3000; 

function canSubmit() {
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
        window.showToast(t('請稍候再送出...', 'Please wait...', '少しお待ちください...', 'Espera un momento...', 'Veuillez patienter...', 'Bitte warten...', '请稍候再送出...'));
        return false;
    }
    lastSubmitTime = now;
    return true;
}

/* 🌟 儀式感反饋 */
function playRitual(btnId, origText) {
    const btn = document.getElementById(btnId);
    if(!btn) return;
    btn.innerHTML = t('✨ 已接住', '✨ Caught', '✨ 受け止めました', '✨ Atrapado', '✨ Attrapé', '✨ Aufgefangen', '✨ 已接住');
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.6';
    setTimeout(() => {
        btn.innerHTML = origText;
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
    }, SUBMIT_COOLDOWN);
}

function updateCountersUI() {
    if(document.getElementById('g-v-count')) document.getElementById('g-v-count').textContent = globalCounts.v;
    if(document.getElementById('g-e-count')) document.getElementById('g-e-count').textContent = globalCounts.e;
    if(document.getElementById('g-m-count')) document.getElementById('g-m-count').textContent = globalCounts.m;
    if(document.getElementById('g-p-count')) document.getElementById('g-p-count').textContent = globalCounts.p;
    if(document.getElementById('g-t-count')) document.getElementById('g-t-count').textContent = globalCounts.t;
    if(document.getElementById('h-e-count')) document.getElementById('h-e-count').textContent = state.eCount;
    if(document.getElementById('h-m-count')) document.getElementById('h-m-count').textContent = state.mCount;
    if(document.getElementById('h-p-count')) document.getElementById('h-p-count').textContent = state.pCount;
    if(document.getElementById('h-a-count')) document.getElementById('h-a-count').textContent = state.aCount;
    if(document.getElementById('h-t-count')) document.getElementById('h-t-count').textContent = state.tCount;
}

window.currentLang = 'zh';

function t(zh, en, ja, es, fr, de, zh_cn) {
    let target = window.currentLang;
    if(target === 'en-uk') target = 'en'; 
    if (target === 'en') return en || zh;
    if (target === 'ja') return ja || en || zh;
    if (target === 'es') return es || en || zh;
    if (target === 'fr') return fr || en || zh;
    if (target === 'de') return de || en || zh;
    if (target === 'zh-cn') return zh_cn || zh;
    return zh;
}

/* 🌟 手機版漢堡選單邏輯 */
window.toggleMobileNav = function() {
    document.getElementById('hamburger-btn').classList.toggle('open');
    document.getElementById('nav-menu').classList.toggle('show');
}
window.closeMobileNav = function() {
    document.getElementById('hamburger-btn').classList.remove('open');
    document.getElementById('nav-menu').classList.remove('show');
}

window.toggleLangDropdown = function() { document.getElementById('lang-dropdown-list').classList.toggle('show'); }
document.addEventListener('click', function(e) {
    if(!e.target.closest('.lang-dropdown-wrapper')) {
        const list = document.getElementById('lang-dropdown-list');
        if(list) list.classList.remove('show');
    }
});

/* 🌟 互動式 Onboarding 導航邏輯 */
const guideData = {
    'E': {
        title: {zh: '房間 E — 情緒出口', en: 'Room E — Emotional Exit', ja: '部屋 E — 感情の出口', es: 'Habitación E — Salida Emocional', fr: 'Salle E — Sortie Émotionnelle', de: 'Raum E — Emotionaler Ausgang', 'zh-cn': '房间 E — 情绪出口'},
        desc: {zh: '有些話堵在心口太久會生病。在這裡，你可以完全匿名地把那些沉重、憤怒或委屈倒出來，黑暗會安全地接住它們。', en: 'Words kept inside can make you sick. Here, you can pour out your heaviness anonymously. The dark will hold it safely.', ja: '胸に秘めた言葉を吐き出してください。暗闇がそれを安全に受け止めます。', es: 'Aquí puedes desahogarte de forma anónima. La oscuridad lo sostendrá.', fr: 'Ici, vous pouvez vous épancher anonymement. L\'obscurité le gardera en sécurité.', de: 'Hier kannst du dich anonym ausschütten. Die Dunkelheit wird es sicher halten.', 'zh-cn': '有些话堵在心口太久会生病。在这里，你可以完全匿名地把那些沉重、愤怒或委屈倒出来，黑暗会安全地接住它们。'},
        link: '#room-e'
    },
    'M': {
        title: {zh: '房間 M — 思念映射', en: 'Room M — Memory Mapping', ja: '部屋 M — 想いの投影', es: 'Habitación M — Mapeo de Recuerdos', fr: 'Salle M — Cartographie des Souvenirs', de: 'Raum M — Erinnerungskartierung', 'zh-cn': '房间 M — 思念映射'},
        desc: {zh: '思念沒有實體，但可以有座標。來這裡點亮一顆星，讓那份想念在夜空裡被看見，或許對方也能感應得到。', en: 'Missing someone has no physical form, but it can have a coordinate. Light a star here.', ja: '想いを星に変えて夜空に灯しましょう。', es: 'Extrañar no tiene forma física, pero puede tener una coordenada. Enciende una estrella aquí.', fr: 'Le manque n\'a pas de forme physique, mais peut avoir une coordonnée. Allumez une étoile ici.', de: 'Vermissen hat keine physische Form, aber es kann eine Koordinate haben. Zünde hier einen Stern an.', 'zh-cn': '思念没有实体，但可以有坐标。来这里点亮一颗星，让那份想念在夜空里被看见。'},
        link: '#room-m'
    },
    'P': {
        title: {zh: '房間 P — 碎片修補', en: 'Room P — Kintsugi Repair', ja: '部屋 P — 欠片の修復', es: 'Habitación P — Reparación Kintsugi', fr: 'Salle P — Réparation Kintsugi', de: 'Raum P — Kintsugi-Reparatur', 'zh-cn': '房间 P — 碎片修补'},
        desc: {zh: '碎裂不是結束，而是光照進來的地方。用金繼（Kintsugi）的方式，將你心中的遺憾與傷痛重新修補，化為最美的紋理。', en: 'Brokenness is not the end. Use Kintsugi to mend your regrets into beautiful textures.', ja: '金継ぎのようにもう一度つなぎ合わせましょう。', es: 'La ruptura no es el fin. Usa Kintsugi para reparar tus arrepentimientos en texturas hermosas.', fr: 'La brisure n\'est pas la fin. Utilisez le Kintsugi pour réparer vos regrets en de belles textures.', de: 'Zerbrochenheit ist nicht das Ende. Verwende Kintsugi, um deine Reue in wunderschöne Texturen zu flicken.', 'zh-cn': '碎裂不是结束，而是光照进来的地方。用金继（Kintsugi）的方式，将你心中的遗憾与伤痛重新修补。'},
        link: '#room-p'
    },
    'A': {
        title: {zh: '房間 A — 神聖避難所', en: 'Room A — Sacred Asylum', ja: '部屋 A — 神聖な避難所', es: 'Habitación A — Asilo Sagrado', fr: 'Salle A — Asile Sacré', de: 'Raum A — Heiliges Asyl', 'zh-cn': '房间 A — 神圣避难所'},
        desc: {zh: '有些痛苦太重，不該永遠背負。在這裡寫下的所有秘密，都會在 24 小時後像沙畫一樣被風吹散，不留痕跡。', en: 'Some pain is too heavy to carry forever. Secrets here will turn to sand and blow away in 24 hours.', ja: 'ここでの秘密は24時間後に砂のように消え去ります。', es: 'Cierto dolor es demasiado pesado. Los secretos aquí se convertirán en arena en 24 horas.', fr: 'Certaines douleurs sont trop lourdes. Les secrets ici se transformeront en sable dans 24 heures.', de: 'Mancher Schmerz ist zu schwer. Geheimnisse hier werden in 24 Stunden zu Sand.', 'zh-cn': '有些痛苦太重，不该永远背负。在这里写下的所有秘密，都会在 24 小时后像沙画一样被风吹散。'},
        link: '#room-a'
    },
    'T': {
        title: {zh: '房間 T — 能量共振', en: 'Room T — Energy Resonance', ja: '部屋 T — エネルギー共鳴', es: 'Habitación T — Resonancia de Energía', fr: 'Salle T — Résonance d\'Énergie', de: 'Raum T — Energieresonanz', 'zh-cn': '房间 T — 能量共振'},
        desc: {zh: '當你覺得自己有餘力時，來這裡給予他人一個無聲的擁抱吧。每一次共鳴，都會化作對方真實的心跳震動。', en: 'When you have the strength, give someone a silent hug here. Every resonance is a heartbeat.', ja: '余裕があるなら、誰かに無言の抱擁を贈りましょう。', es: 'Cuando tengas fuerza, dale a alguien un abrazo silencioso aquí.', fr: 'Quand vous avez la force, donnez un câlin silencieux ici.', de: 'Wenn du die Kraft hast, gib hier jemandem eine stille Umarmung.', 'zh-cn': '当你觉得自己有余力时，来这里给予他人一个无声的拥抱吧。每一次共鸣，都会化作对方真实的心跳震动。'},
        link: '#room-t'
    }
};

window.startGuide = function() {
    document.getElementById('ob-state-0').style.display = 'none';
    document.getElementById('ob-state-2').style.display = 'none';
    document.getElementById('ob-state-1').style.display = 'block';
}

window.showGuideResult = function(roomKey) {
    document.getElementById('ob-state-1').style.display = 'none';
    document.getElementById('ob-state-2').style.display = 'block';
    
    const lang = (window.currentLang === 'en-uk') ? 'en' : window.currentLang;
    const data = guideData[roomKey];
    
    document.getElementById('ob-res-title').textContent = data.title[lang] || data.title['zh'];
    document.getElementById('ob-res-desc').textContent = data.desc[lang] || data.desc['zh'];
    
    const linkBtn = document.getElementById('ob-res-link');
    linkBtn.href = data.link;
    linkBtn.onclick = function() { window.closeMobileNav(); };
}

window.closeGuide = function() {}

window.switchLang = function(lang) {
  window.currentLang = lang;
  const langNames = {
      'zh': '繁體中文', 'zh-cn': '简体中文', 'en': 'English (US)', 'en-uk': 'English (UK)',
      'ja': '日本語', 'es': 'Español', 'fr': 'Français', 'de': 'Deutsch'
  };
  document.getElementById('current-lang-display').textContent = langNames[lang];
  document.getElementById('lang-dropdown-list').classList.remove('show');

  document.querySelectorAll('.lang-option').forEach(btn => {
    if(btn.dataset.lang === lang) btn.classList.add('active-lang');
    else btn.classList.remove('active-lang');
  });
  
  const targetLang = (lang === 'en-uk') ? 'en' : lang;

  document.querySelectorAll('[data-zh]').forEach(el => {
    el.innerHTML = el.getAttribute('data-' + targetLang) || el.getAttribute('data-en') || el.getAttribute('data-zh');
  });
  document.querySelectorAll('[data-zh-ph]').forEach(el => {
    el.setAttribute('placeholder', el.getAttribute('data-' + targetLang + '-ph') || el.getAttribute('data-en-ph') || el.getAttribute('data-zh-ph'));
  });
  
  document.querySelectorAll('[data-zh-title]').forEach(el => {
    el.setAttribute('title', el.getAttribute('data-' + targetLang + '-title') || el.getAttribute('data-en-title') || el.getAttribute('data-zh-title'));
  });

  const activeTitle = document.getElementById('ob-res-title').textContent;
  if(activeTitle !== "") {
      for(let key in guideData) {
          if(Object.values(guideData[key].title).includes(activeTitle)) {
             window.showGuideResult(key);
             break;
          }
      }
  }

  updateDynamicTexts();
  document.getElementById('h-events').innerHTML = '';
  initTimeline();
  if(typeof window.renderEFeed === 'function') window.renderEFeed();
  
  window.showToast(t('已切換語言 ✦', 'Language Switched ✨', '言語を切り替えました ✦', 'Idioma Cambiado ✨', 'Langue changée ✨', 'Sprache geändert ✨', '已切换语言 ✦'));
}

function updateDynamicTexts() {
  if(document.getElementById('p-healed-count')) {
    document.getElementById('p-healed-count').textContent = t(
        `已有 ${pHealedTotal} 道裂紋，以金修補。`, `${pHealedTotal} cracks mended with gold.`,
        `${pHealedTotal} 個のひび割れが金で修復されました。`, `${pHealedTotal} grietas reparadas con oro.`,
        `${pHealedTotal} fissures réparées avec de l'or.`, `${pHealedTotal} Risse mit Gold geflickt.`,
        `已有 ${pHealedTotal} 道裂纹，以金修补。`
    );
  }
  document.querySelectorAll('.shard-healed-tag').forEach(el => el.innerHTML = t('✦ 已修補', '✦ Healed', '✦ 修復済', '✦ Reparado', '✦ Réparé', '✦ Geheilt', '✦ 已修补'));
  document.querySelectorAll('.e-msg-anon').forEach(el => el.textContent = t('匿名 · ANONYMOUS', 'ANONYMOUS', '匿名 · ANONYMOUS', 'ANÓNIMO', 'ANONYME', 'ANONYM', '匿名 · ANONYMOUS'));
  document.querySelectorAll('.sand-timer-label').forEach(el => el.textContent = t('消散中', 'DISSOLVING', '消散中', 'DISOLVIENDO', 'DISSOLUTION', 'AUFLÖSEND', '消散中'));
  
  const toggleBtn = document.getElementById('timeline-toggle-btn');
  if(toggleBtn) {
     const isExpanded = document.getElementById('h-events').style.maxHeight === '5000px';
     toggleBtn.innerHTML = isExpanded ? t('收起旅程 ↑', 'Collapse ↑', '折りたたむ ↑', 'Ocultar ↑', 'Réduire ↑', 'Einklappen ↑', '收起旅程 ↑') : t('展開完整旅程 ↓', 'Show Full Journey ↓', 'すべての旅を見る ↓', 'Ver Viaje Completo ↓', 'Voir le parcours complet ↓', 'Gesamte Reise anzeigen ↓', '展开完整旅程 ↓');
  }
  
  const quotesBtn = document.getElementById('hero-quotes-toggle');
  if(quotesBtn) {
     const isExpandedQuotes = document.getElementById('hero-quotes').classList.contains('show-quotes');
     quotesBtn.innerHTML = isExpandedQuotes ? t('📖 收起理念 ↑', '📖 Collapse ↑', '📖 閉じる ↑', '📖 Ocultar ↑', '📖 Réduire ↑', '📖 Einklappen ↑', '📖 收起理念 ↑') : t('📖 閱讀設計理念 ↓', '📖 Read Philosophy ↓', '📖 コンセプトを読む ↓', '📖 Leer Filosofía ↓', '📖 Lire la philosophie ↓', '📖 Philosophie lesen ↓', '📖 阅读设计理念 ↓');
  }
}

function formatTimeLeft(secs){
  if(secs<=0) return t('即將消散', 'Fading', 'まもなく消散', 'Desvaneciendo', 'S\'efface', 'Verblasst', '即将消散'); 
  const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60); 
  const lang = window.currentLang;
  if(lang.startsWith('en')) return h>0 ? `${h}h ${m}m left` : `${m}m left`;
  if(lang === 'ja') return h>0 ? `残り ${h}時間 ${m}分` : `残り ${m}分`;
  if(lang === 'es') return h>0 ? `Faltan ${h}h ${m}m` : `Faltan ${m}m`;
  if(lang === 'fr') return h>0 ? `Reste ${h}h ${m}m` : `Reste ${m}m`;
  if(lang === 'de') return h>0 ? `Noch ${h}Std. ${m}Min.` : `Noch ${m}Min.`;
  if(lang === 'zh-cn') return h>0 ? `${h}小时 ${m}分钟 后消散` : `${m}分钟 后消散`;
  return h>0 ? `${h}小時 ${m}分鐘 後消散` : `${m}分鐘 後消散`;
}

function cleanText(text) {
  const badWords = ['去死', '智障', '白痴', '幹你娘', 'bitch', 'fuck', '賤人', '靠北', '垃圾', '殺', 'kill', 'suicide', 'rape'];
  let cleaned = text;
  badWords.forEach(word => {
    const regex = new RegExp(word.split('').join('\\s*'), 'gi');
    cleaned = cleaned.replace(regex, '***');
  });
  return cleaned;
}

window.toggleTimeline = function() {
  const wrapper = document.getElementById('h-events');
  const btn = document.getElementById('timeline-toggle-btn');
  const fade = document.getElementById('h-events-fade');
  if (wrapper.style.maxHeight === '280px' || wrapper.style.maxHeight === '') {
    wrapper.style.maxHeight = '5000px'; fade.style.opacity = '0'; 
    btn.innerHTML = t('收起旅程 ↑', 'Collapse ↑', '折りたたむ ↑', 'Ocultar ↑', 'Réduire ↑', 'Einklappen ↑', '收起旅程 ↑');
  } else {
    wrapper.style.maxHeight = '280px'; fade.style.opacity = '1'; 
    btn.innerHTML = t('展開完整旅程 ↓', 'Show Full Journey ↓', 'すべての旅を見る ↓', 'Ver Viaje Completo ↓', 'Voir le parcours complet ↓', 'Gesamte Reise anzeigen ↓', '展开完整旅程 ↓');
  }
}

window.toggleHeroQuotes = function() {
    const el = document.getElementById('hero-quotes');
    const btn = document.getElementById('hero-quotes-toggle');
    el.classList.toggle('show-quotes');
    if(el.classList.contains('show-quotes')){
        btn.innerHTML = t('📖 收起理念 ↑', '📖 Collapse ↑', '📖 閉じる ↑', '📖 Ocultar ↑', '📖 Réduire ↑', '📖 Einklappen ↑', '📖 收起理念 ↑');
    } else {
        btn.innerHTML = t('📖 閱讀設計理念 ↓', '📖 Read Philosophy ↓', '📖 コンセプトを読む ↓', '📖 Leer Filosofía ↓', '📖 Lire la philosophie ↓', '📖 Philosophie lesen ↓', '📖 阅读设计理念 ↓');
    }
}

window.addEventListener('scroll', () => {
    const btt = document.getElementById('btt-btn');
    if(window.scrollY > 500) { btt.style.display = 'flex'; } 
    else { btt.style.display = 'none'; }
});

function loadLocalJourney() {
  const savedJourney = localStorage.getItem('empath_user_journey');
  if(savedJourney){
    try {
      journeyData = JSON.parse(savedJourney);
      state.eCount = journeyData.counters.e || 0; state.mCount = journeyData.counters.m || 0;
      state.pCount = journeyData.counters.p || 0; state.aCount = journeyData.counters.a || 0; state.tCount = journeyData.counters.t || 0;
    } catch(err) {}
  }
}
loadLocalJourney();

let isAnimating = true;
let starsRafId = null;
let sandRafId = null;

let firestoreUnsubs = [];

function subscribeAll() {
    if(firestoreUnsubs.length > 0) return;

    firestoreUnsubs.push(
        onSnapshot(query(collection(db, "emotions"), orderBy("createdAt", "desc")), (snapshot) => {
            globalCounts.e = snapshot.size; allEmotions = [];
            snapshot.forEach(docSnap => allEmotions.push(docSnap.data()));
            if(typeof window.renderEFeed === 'function') window.renderEFeed(); updateCountersUI();
        })
    );

    firestoreUnsubs.push(
        onSnapshot(collection(db, "stars"), (snapshot) => { 
            globalCounts.m = snapshot.size; starMessages = []; 
            snapshot.forEach((docSnap) => { const data = docSnap.data(); starMessages.push({ id: docSnap.id, ...data }); }); 
            if(typeof updateMStats === 'function') updateMStats(); updateCountersUI(); 
        })
    );

    firestoreUnsubs.push(
        onSnapshot(collection(db, "shards"), (snapshot) => {
            const board = document.getElementById('p-board'); if(!board) return;
            board.innerHTML = ''; pHealedTotal = 0;
            snapshot.forEach(docSnap => {
                const data = docSnap.data(); const id = docSnap.id; if(data.healed) pHealedTotal++;
                const div = document.createElement('div'); div.className = 'shard' + (data.healed ? ' healed' : '');
                div.innerHTML = `<div class="shard-text">${data.text}</div><div class="shard-healed-tag">✦ ${t('已修補', 'Healed', '修復済', 'Reparado', 'Réparé', 'Geheilt', '已修补')}</div><div class="shard-glow"></div>`;
                div.addEventListener('click', async () => { if(data.healed) return; await updateDoc(doc(db, "shards", id), { healed: true }); logJourney('p', data.text); window.showToast(t('以金修補，裂縫成為了光 ✦', 'Mended with gold ✦', '金で修復しました ✦', 'Reparado con oro ✦', 'Réparé avec de l\'or ✦', 'Mit Gold geflickt ✦', '以金修补，裂缝成为了光 ✦')); }); board.appendChild(div);
            });
            globalCounts.p = pHealedTotal; if(typeof drawKintsugiVessel === 'function') drawKintsugiVessel(); updateDynamicTexts(); updateCountersUI();
        })
    );

    firestoreUnsubs.push(
        onSnapshot(collection(db, "sand"), (snapshot) => {
            globalCounts.a = snapshot.size; const feed = document.getElementById('a-feed'); if(!feed) return;
            feed.innerHTML = ''; const nowMs = Date.now();
            snapshot.forEach(docSnap => {
                const data = docSnap.data(); 
                const msgTime = data.absoluteTime || (data.createdAt ? data.createdAt.seconds * 1000 : nowMs);
                const expiresAt = msgTime + (24 * 60 * 60 * 1000);
                const leftSecs = (expiresAt - nowMs) / 1000; 
                
                if(leftSecs <= 0) return;
                
                const div = document.createElement('div'); div.className = 'sand-msg'; 
                div.dataset.expires = expiresAt; 
                const pct = (leftSecs / 86400) * 100;
                div.innerHTML = `<div class="sand-dissolve-overlay"></div><div class="sand-msg-text">${data.text}</div><div class="sand-timer-wrap"><div class="sand-timer-label">DISSOLVING</div><div class="sand-timer-bar"><div class="sand-timer-fill" style="width:${pct}%"></div></div><div class="sand-time-left">${formatTimeLeft(Math.floor(leftSecs))}</div></div>`;
                feed.appendChild(div); 
            });
            updateCountersUI();
        })
    );

    firestoreUnsubs.push(
        onSnapshot(collection(db, "warmth"), (snapshot) => {
            globalCounts.t = snapshot.size; const feed = document.getElementById('t-feed'); if(!feed) return;
            feed.innerHTML = '';
            snapshot.forEach(docSnap => {
                const data = docSnap.data(); const id = docSnap.id; const div = document.createElement('div'); div.className = 'warmth-item';
                div.innerHTML = `<div class="warmth-pulse"></div> <div>${data.text}</div> <button class="echo-btn ${localStorage.getItem('echoed_'+id)?'pulsed':''}" id="btn-${id}"> <span class="heart">🕯️</span> Echo Pulse </button>`;
                div.querySelector('.echo-btn').addEventListener('click', async function(){ if(this.classList.contains('pulsed')) return; this.classList.add('pulsed'); localStorage.setItem('echoed_'+id, 'true'); await updateDoc(doc(db, "warmth", id), { echos: (data.echos||0)+1 }); window.showToast('✦ Echo Pulse Sent'); window.triggerHeartbeat(); }); feed.appendChild(div);
            });
            updateCountersUI();
        })
    );
}

function unsubscribeAll() {
    firestoreUnsubs.forEach(unsub => unsub());
    firestoreUnsubs = [];
}

let sandGlobalTimer = null;
function startGlobalSandTimer() {
    if(sandGlobalTimer) clearInterval(sandGlobalTimer);
    sandGlobalTimer = setInterval(() => {
        if(document.hidden) return;
        const now = Date.now();
        document.querySelectorAll('.sand-msg:not(.dissolving)').forEach(div => {
            const expiresAt = parseInt(div.dataset.expires);
            const leftSecs = (expiresAt - now) / 1000;
            if(leftSecs <= 0) {
                div.classList.add('dissolving');
                setTimeout(()=> div.remove(), 4000);
                return;
            }
            const pct = (leftSecs / 86400) * 100;
            const fill = div.querySelector('.sand-timer-fill');
            const label = div.querySelector('.sand-time-left');
            if(fill) fill.style.width = pct + '%';
            if(label) label.textContent = formatTimeLeft(Math.floor(leftSecs));
        });
    }, 1000);
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        isAnimating = false;
        if(starsRafId) cancelAnimationFrame(starsRafId);
        if(sandRafId) cancelAnimationFrame(sandRafId);
        unsubscribeAll();
    } else {
        subscribeAll();
        if (!document.body.classList.contains('hsp-mode')) {
            isAnimating = true;
            if(typeof drawStars === 'function') drawStars();
            if(typeof drawSand === 'function') drawSand();
        }
    }
});

window.toggleHSP = function() {
  const body = document.body;
  const btn = document.getElementById('hsp-btn');
  body.classList.toggle('hsp-mode');
  if(body.classList.contains('hsp-mode')) {
    btn.classList.add('active');
    localStorage.setItem('empath_hsp_mode', 'true');
    isAnimating = false;
    if(starsRafId) cancelAnimationFrame(starsRafId);
    if(sandRafId) cancelAnimationFrame(sandRafId);
    window.showToast(t('👁️ 已開啟降噪模式：降低對比與暫停閃爍', '👁️ Calm mode activated', '👁️ 静寂モードをオンにしました', '👁️ Modo Calma activado', '👁️ Mode Calme activé', '👁️ Ruhemodus aktiviert', '👁️ 已开启降噪模式：降低对比与暂停闪烁'));
  } else {
    btn.classList.remove('active');
    localStorage.setItem('empath_hsp_mode', 'false');
    isAnimating = true;
    if(typeof drawStars === 'function') drawStars();
    if(typeof drawSand === 'function') drawSand();
    window.showToast(t('已關閉降噪模式', 'Calm mode deactivated', '静寂モードをオフにしました', 'Modo Calma desactivado', 'Mode Calme désactivé', 'Ruhemodus deaktiviert', '已关闭降噪模式'));
  }
}

window.speakText = function(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langs = { 'zh': 'zh-TW', 'zh-cn': 'zh-CN', 'en': 'en-US', 'en-uk': 'en-GB', 'ja': 'ja-JP', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE' };
    utterance.lang = langs[window.currentLang] || 'zh-TW'; utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    window.showToast(t('🔉 語音導航朗讀中...', '🔉 Reading...', '🔉 読み上げ中...', '🔉 Leyendo...', '🔉 Lecture...', '🔉 Lesen...', '🔉 语音导航朗读中...'));
  }
};

window.triggerHeartbeat = function() { if ('vibrate' in navigator) { navigator.vibrate([40, 120, 40]); } };

window.shareSite = function() {
  if (navigator.share) {
    navigator.share({ title: 'EMPATH', text: t('我發現了一個很溫暖的地方，可以在數位時代安放情緒。來這裡看看吧：', 'I found a beautiful emotional sanctuary.', '温かい場所を見つけました。ここで感情を休めてみませんか：', 'Encontré un hermoso santuario emocional. Ven a echar un vistazo:', 'J\'ai trouvé un magnifique sanctuaire émotionnel.', 'Ich habe ein wunderschönes emotionales Heiligtum gefunden.', '我发现了一个很温暖的地方，可以在数字时代安放情绪。来这里看看吧：'), url: window.location.href }).catch(console.error);
  } else {
    navigator.clipboard.writeText(window.location.href); window.showToast(t('網址已複製！快去貼給朋友吧 ✦', 'Link copied!', 'リンクをコピーしました！', '¡Enlace copiado!', 'Lien copié !', 'Link kopiert!', '网址已复制！快去贴给朋友吧 ✦'));
  }
}

window.openShareCard = function() {
  document.getElementById('sc-e').textContent = state.eCount; document.getElementById('sc-m').textContent = state.mCount; document.getElementById('sc-p').textContent = state.pCount; document.getElementById('sc-a').textContent = state.aCount; document.getElementById('sc-t').textContent = state.tCount;
  document.getElementById('share-modal').classList.add('show');
}

window.downloadShareCard = function() {
  if(typeof html2canvas === 'undefined') { window.showToast(t('圖片生成引擎載入中，請稍後再試 ✦','Loading image engine...','画像エンジンを読み込み中...','Cargando motor de imágenes...','Chargement du moteur d\'images...','Lade Bild-Engine...','图片生成引擎载入中，请稍后再试 ✦')); return; }
  const card = document.getElementById('wrapped-card-content'); const btn = document.getElementById('download-card-btn');
  const originalText = btn.textContent; btn.textContent = t('圖片生成中 ⏳','Generating... ⏳','生成中 ⏳','Generando... ⏳','Génération... ⏳','Wird generiert... ⏳','图片生成中 ⏳');
  html2canvas(card, { backgroundColor: '#0a111a', scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL('image/png'); card.style.display = 'none';
    let existingImg = document.getElementById('generated-card-img'); if(existingImg) existingImg.remove();
    const imgEl = document.createElement('img'); imgEl.src = imgData; imgEl.id = 'generated-card-img';
    imgEl.style.width = '100%'; imgEl.style.maxWidth = '320px'; imgEl.style.borderRadius = '4px'; imgEl.style.boxShadow = '0 10px 40px rgba(0,0,0,0.8)';
    card.parentNode.insertBefore(imgEl, document.querySelector('.share-modal-actions')); btn.style.display = 'none';
    let hint = document.getElementById('save-hint');
    if(!hint) {
      hint = document.createElement('p'); hint.id = 'save-hint'; hint.style.color = 'var(--gold)'; hint.style.fontSize = '12px'; hint.style.marginBottom = '16px';
      document.querySelector('.share-modal-actions').prepend(hint);
    } 
    hint.textContent = t('✨ 圖片已洗出！請「長按上方圖片」儲存或分享', '✨ Image generated! Long press to save.', '✨ 画像が生成されました！長押しで保存', '✨ ¡Imagen generada! Mantén presionado para guardar.', '✨ Image générée ! Appui long pour enregistrer.', '✨ Bild generiert! Langes Drücken zum Speichern.', '✨ 图片已洗出！请「长按上方图片」储存或分享');
    hint.style.display = 'block'; window.showToast(t('圖片已成功生成！請長按儲存 ✦', 'Success! Long press to save', '成功しました！', '¡Éxito!', 'Succès !', 'Erfolg!', '图片已成功生成！请长按储存 ✦'));
  }).catch(err => { btn.textContent = originalText; window.showToast(t('生成失敗', 'Failed', '生成に失敗しました', 'Fallo al generar', 'Échoué', 'Fehlgeschlagen', '生成失败')); });
}
window.closeShareModal = function() { 
  document.getElementById('share-modal').classList.remove('show'); 
  setTimeout(() => { document.getElementById('wrapped-card-content').style.display = 'block'; const img = document.getElementById('generated-card-img'); if(img) img.remove(); document.getElementById('download-card-btn').style.display = 'inline-block'; document.getElementById('download-card-btn').textContent = t('⬇️ 下載為專屬圖片檔案', '⬇️ Download Exclusive Card', '⬇️ 専用画像としてダウンロード', '⬇️ Descargar Tarjeta Exclusiva', '⬇️ Télécharger la carte', '⬇️ Exklusive Karte herunterladen', '⬇️ 下载为专属图片档案'); const hint = document.getElementById('save-hint'); if(hint) hint.style.display = 'none'; }, 400);
}

window.showToast = function(msg, dur=2400){ const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), dur); }
function nowStr(){ const d = new Date(); return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0'); }

function logJourney(type, text){
  const time = nowStr(); journeyData.counters[type] = (journeyData.counters[type] || 0) + 1;
  journeyData.events.push({ type, text, time }); localStorage.setItem('empath_user_journey', JSON.stringify(journeyData));
  state[type+'Count']++; renderTimelineHTML(type, text, time); autoBackupToCloud(); updateCountersUI();
}

function renderTimelineHTML(type, text, time){
  const container = document.getElementById('h-events'); const div = document.createElement('div'); div.className = 'h-event ' + type + '-event';
  const labels = {
    'zh': {e:'情緒出口', m:'思念映射', p:'碎片修補', a:'避難所', t:'能量共振'},
    'en': {e:'Exit', m:'Stars', p:'Mended', a:'Asylum', t:'Resonance'},
    'ja': {e:'出口', m:'星空', p:'修復', a:'避難所', t:'共鳴'},
    'es': {e:'Salida', m:'Estrellas', p:'Reparado', a:'Asilo', t:'Resonancia'},
    'fr': {e:'Sortie', m:'Étoiles', p:'Réparé', a:'Asile', t:'Résonance'},
    'de': {e:'Ausgang', m:'Sterne', p:'Geflickt', a:'Asyl', t:'Resonanz'},
    'zh-cn': {e:'情绪出口', m:'思念映射', p:'碎片修补', a:'避难所', t:'能量共振'}
  };
  const currentKey = window.currentLang === 'en-uk' ? 'en' : window.currentLang;
  div.innerHTML = `<div><div class="h-event-label">${labels[currentKey][type]||''}</div><div class="h-event-text">${text.length>40?text.slice(0,40)+'…':text}</div><div class="h-event-time">${time}</div></div>`;
  container.appendChild(div);
}

function initTimeline(){
  const container = document.getElementById('h-events');
  container.innerHTML = `<div class="h-event" style="color:var(--muted);font-size:13px;padding-left:20px;border-left:1px solid rgba(255,255,255,.07);"><div><div style="font-size:11px;letter-spacing:2px;color:rgba(255,255,255,.4);margin-bottom:4px; font-weight:bold;">START</div><div>${t('你來到了這裡。這已經是一種勇氣。', 'You arrived here. That is already a form of courage.', 'あなたはここに来ました。それ自体が勇気です。', 'Has llegado aquí. Eso ya es una forma de valentía.', 'Vous êtes arrivé ici. C\'est déjà une forme de courage.', 'Du bist hier angekommen. Das ist bereits eine Form von Mut.', '你来到了这里。这已经是一种勇气。')}</div></div></div>`;
  journeyData.events.forEach(ev => renderTimelineHTML(ev.type, ev.text, ev.time));
}

window.createSoulKey = async function() { const soulKey = `EMP-${Math.random().toString(36).substring(2,6).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`; localStorage.setItem('empath_soul_key', soulKey); await autoBackupToCloud(); updateSyncUI(); window.showToast(t('靈魂鑰匙生成成功 ✦', 'Key generated!', '鍵が生成されました ✦', '¡Llave generada!', 'Clé générée !', 'Schlüssel generiert!', '灵魂钥匙生成成功 ✦')); }
window.copySoulKey = function() {
    const key = localStorage.getItem('empath_soul_key');
    if (key) {
        navigator.clipboard.writeText(key).then(() => {
            const btn = document.getElementById('copy-key-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = t('✓ 已複製', '✓ Copied', '✓ コピー済', '✓ Copiado', '✓ Copié', '✓ Kopiert', '✓ 已复制');
            btn.style.color = '#fff'; btn.style.borderColor = '#fff';
            window.showToast(t('🗝️ 鑰匙已複製到剪貼簿', '🗝️ Key copied', '🗝️ キーをコピーしました', '🗝️ Llave copiada', '🗝️ Clé copiée', '🗝️ Schlüssel kopiert', '🗝️ 钥匙已复制到剪贴板'));
            setTimeout(() => { btn.innerHTML = originalText; btn.style.color = 'var(--gold)'; btn.style.borderColor = 'var(--gold)'; }, 2000);
        }).catch(err => { window.showToast('複製失敗 / Copy failed'); });
    }
}

window.loadExistingSoulKey = async function() {
  const input = document.getElementById('sync-key-input'); const key = input.value.trim().toUpperCase();
  if(!key) return;
  try {
    const docSnap = await getDoc(doc(db, "user_journeys", key));
    if(docSnap.exists()) {
      const cd = docSnap.data(); journeyData = { counters: cd.counters || {e:0,m:0,p:0,a:0,t:0}, events: cd.events || [] };
      localStorage.setItem('empath_soul_key', key); localStorage.setItem('empath_user_journey', JSON.stringify(journeyData));
      state.eCount = journeyData.counters.e||0; state.mCount = journeyData.counters.m||0; state.pCount = journeyData.counters.p||0; state.aCount = journeyData.counters.a||0; state.tCount = journeyData.counters.t||0;
      document.getElementById('h-events').innerHTML = ''; initTimeline(); updateSyncUI(); updateCountersUI();
      window.showToast(t('靈魂共振成功！足跡已喚回 ✦', 'Sync successful!', '同期成功！足跡が復元されました ✦', '¡Sincronización exitosa!', 'Synchronisation réussie !', 'Synchronisierung erfolgreich!', '灵魂共振成功！足迹已唤回 ✦')); input.value='';
    } else { window.showToast(t('未找到此鑰匙', 'Key not found', '鍵が見つかりません', 'Llave no encontrada', 'Clé introuvable', 'Schlüssel nicht gefunden', '未找到此钥匙')); }
  } catch(err) {}
}
window.unlinkSoulKey = function() { if(confirm(t('確定要解除綁定嗎？', 'Unlink your device?', '連携を解除しますか？', '¿Desvincular tu dispositivo?', 'Dissocier votre appareil ?', 'Gerät entkoppeln?', '确定要解除绑定吗？'))) { localStorage.removeItem('empath_soul_key'); updateSyncUI(); } }
async function autoBackupToCloud() { const key = localStorage.getItem('empath_soul_key'); if(!key) return; try { await setDoc(doc(db, "user_journeys", key), { counters: journeyData.counters, events: journeyData.events, updatedAt: serverTimestamp() }); } catch(err){} }
function updateSyncUI() {
  const key = localStorage.getItem('empath_soul_key');
  if(key) { document.getElementById('sync-initial-actions').style.display='none'; document.getElementById('sync-active-actions').style.display='flex'; document.getElementById('active-key-display').textContent=key; }
  else { document.getElementById('sync-initial-actions').style.display='flex'; document.getElementById('sync-active-actions').style.display='none'; }
}

let allEmotions = [];
let eFeedExpanded = false;
window.renderEFeed = function() {
  const feed = document.getElementById('e-feed'); const fade = document.getElementById('e-feed-fade'); const btn = document.getElementById('e-expand-btn');
  if(!feed) return; feed.innerHTML = '';
  const limit = eFeedExpanded ? allEmotions.length : 3;
  allEmotions.slice(0, limit).forEach(data => {
    const timeStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : nowStr();
    const div = document.createElement('div'); div.className = 'e-msg'; 
    div.innerHTML = `<div class="e-msg-anon">${t('匿名 · ANONYMOUS', 'ANONYMOUS', '匿名 · ANONYMOUS', 'ANÓNIMO', 'ANONYME', 'ANONYM', '匿名 · ANONYMOUS')}</div><div>${data.text}</div><div class="e-msg-time">${timeStr}</div>`; 
    feed.appendChild(div);
  });
  if(allEmotions.length > 3) {
    btn.style.display = 'inline-flex';
    if(!eFeedExpanded) { fade.style.display = 'block'; btn.innerHTML = t('↓ 展開更多留言', '↓ Show More', '↓ もっと見る', '↓ Ver más', '↓ Voir plus', '↓ Mehr anzeigen', '↓ 展开更多留言'); } 
    else { fade.style.display = 'none'; btn.innerHTML = t('↑ 收起留言', '↑ Collapse', '↑ 閉じる', '↑ Ocultar', '↑ Réduire', '↑ Einklappen', '↑ 收起留言'); }
  } else { btn.style.display = 'none'; fade.style.display = 'none'; }
}
window.toggleEFeed = function() { eFeedExpanded = !eFeedExpanded; window.renderEFeed(); }

window.submitE = async function(){ 
  if(!canSubmit()) return;
  const input = document.getElementById('e-input'); let text = input.value.trim(); if(!text) return; 
  text = cleanText(text);
  try { 
      const origText = document.getElementById('e-submit-btn').innerHTML;
      await addDoc(collection(db, "emotions"), { text, createdAt: serverTimestamp() }); 
      input.value=''; document.getElementById('e-char').textContent = '0 / 500'; logJourney('e', text); 
      playRitual('e-submit-btn', origText);
      window.showToast(t('已投入黑暗', 'Cast into the dark', '闇に投じました', 'Lanzado a la oscuridad', 'Jeté dans l\'obscurité', 'In die Dunkelheit geworfen', '已投入黑暗')); 
  } catch(e){} 
}

const canvas = document.getElementById('star-canvas'); const ctx = canvas.getContext('2d'); const tooltip = document.getElementById('star-tooltip'); const roomM = document.getElementById('room-m');
let starMessages = [], bgStars=[]; let activeStarId = null; const STAR_COLORS = [ {r: 212, g: 228, b: 255}, {r: 255, g: 239, b: 213}, {r: 198, g: 216, b: 231}, {r: 247, g: 220, b: 200}, {r: 230, g: 230, b: 250}, {r: 255, g: 248, b: 231} ];
window.resizeCanvas = function(){ 
  const dpr = window.devicePixelRatio || 1;
  if(canvas && roomM) { const w = roomM.offsetWidth; const h = roomM.offsetHeight; canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); initBgStars(w, h); }
  const sCanvas = document.getElementById('sand-canvas'); const roomA = document.getElementById('room-a');
  if(sCanvas && roomA) { const sw = roomA.offsetWidth; const sh = roomA.offsetHeight; sCanvas.width = sw * dpr; sCanvas.height = sh * dpr; sCanvas.style.width = sw + 'px'; sCanvas.style.height = sh + 'px'; sCanvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); initSandBg(sw, sh); }
}
window.addEventListener('resize', window.resizeCanvas);
function initBgStars(w, h){ bgStars=[]; for(let i=0; i<100; i++){ bgStars.push({x:Math.random()*w, y:Math.random()*h, r:Math.random()*0.8+0.2, a:Math.random()*0.4+0.1, da:(Math.random()-.5)*0.003, c:STAR_COLORS[Math.floor(Math.random()*STAR_COLORS.length)]}); } }
window.updateMStats = function(){
  if(!document.getElementById('m-count')) return; document.getElementById('m-count').textContent = starMessages.length;
  if(starMessages.length === 0) { document.getElementById('m-brightest').textContent = '—'; return; }
  const brightest = starMessages.reduce((a, b) => b.brightness > a.brightness ? b : a); document.getElementById('m-brightest').textContent = brightest.text.length > 14 ? brightest.text.slice(0, 14) + '…' : brightest.text;
}
function drawSparkle(ctx, x, y, radius, r, g, b, alpha) { ctx.save(); ctx.translate(x, y);
