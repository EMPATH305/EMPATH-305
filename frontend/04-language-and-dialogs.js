function t(zh, en, ja, es, fr, de, zh_cn, uk, pl) { let target = window.currentLang; if(target === 'en-uk') target = 'en'; if (target === 'en') return en || zh; if (target === 'ja') return ja || en || zh; if (target === 'es') return es || en || zh; if (target === 'fr') return fr || en || zh; if (target === 'de') return de || en || zh; if (target === 'zh-cn') return zh_cn || zh; if (target === 'uk') return uk || en || zh; if (target === 'pl') return pl || en || zh; return zh; }

const CRISIS_REGIONS = {
    global: { href:'https://findahelpline.com/', zh:'尋找所在地支援', en:'Find support where you are' },
    tw: { href:'tel:1925', zh:'撥打台灣安心專線 1925', en:'Call Taiwan Lifeline 1925' },
    ua: { href:'tel:7333', zh:'撥打烏克蘭 LifeLine 7333', en:'Call LifeLine Ukraine 7333' },
    pl: { href:'tel:116123', zh:'撥打波蘭危機支援 116 123', en:'Call Poland crisis support 116 123' }
};

function currentCrisisRegion() {
    try {
        const saved = safeLocalStorage.getItem('empath_crisis_region');
        return CRISIS_REGIONS[saved] ? saved : 'global';
    } catch (error) { return 'global'; }
}

function updateCrisisLinks() {
    const regionKey = currentCrisisRegion();
    const region = CRISIS_REGIONS[regionKey];
    const copy = window.currentLang === 'zh' || window.currentLang === 'zh-cn' ? region.zh : region.en;
    document.querySelectorAll('.crisis-link').forEach(link => {
        link.href = region.href;
        link.textContent = copy;
        if (regionKey === 'global') {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        } else {
            link.removeAttribute('target');
            link.removeAttribute('rel');
        }
    });
    const select = document.getElementById('crisis-region-select');
    if (select) select.value = regionKey;
}

window.setCrisisRegion = function(regionKey) {
    if (!CRISIS_REGIONS[regionKey]) return;
    safeLocalStorage.setItem('empath_crisis_region', regionKey);
    updateCrisisLinks();
};

function renderCrisisRegionControls() {
    const card = document.querySelector('#crisis-support-notice .crisis-support-card');
    const actions = card?.querySelector('.crisis-support-actions');
    if (!card || !actions || document.getElementById('crisis-region-select')) return;
    const field = document.createElement('label');
    field.className = 'crisis-region-field';
    const fieldLabel = document.createElement('span');
    fieldLabel.setAttribute('data-zh', '選擇你目前所在的地區');
    fieldLabel.setAttribute('data-en', 'Choose the region you are currently in');
    fieldLabel.textContent = t('選擇你目前所在的地區', 'Choose the region you are currently in');
    const select = document.createElement('select');
    select.id = 'crisis-region-select';
    select.innerHTML = `
        <option value="global">其他地區 / Other region</option>
        <option value="tw">台灣 / Taiwan</option>
        <option value="ua">烏克蘭 / Ukraine</option>
        <option value="pl">波蘭 / Poland</option>`;
    select.addEventListener('change', () => window.setCrisisRegion(select.value));
    field.append(fieldLabel, select);
    actions.before(field);
    updateCrisisLinks();
}

function renderAnalyticsConsentControls() {
    const privacyCard = document.querySelector('#privacy-modal .wrapped-card');
    if (!privacyCard) return;
    let panel = document.getElementById('analytics-consent-controls');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'analytics-consent-controls';
        panel.className = 'analytics-consent-controls';
        privacyCard.querySelector('#privacy-close-btn')?.parentElement?.before(panel);
    }
    const granted = safeLocalStorage.getItem('empath_analytics_consent') === 'granted';
    panel.replaceChildren();
    const status = document.createElement('p');
    status.textContent = granted
        ? t('匿名使用分析：已啟用', 'Anonymous usage analytics: enabled')
        : t('匿名使用分析：已關閉', 'Anonymous usage analytics: disabled');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'close-modal-btn';
    button.textContent = granted ? t('關閉使用分析', 'Disable analytics') : t('同意啟用分析', 'Allow analytics');
    button.addEventListener('click', () => window.setAnalyticsConsent(!granted));
    panel.append(status, button);
}

const empathDialogReturnFocus = new WeakMap();
const empathDialogSelector = '.share-modal.show, #breathe-overlay.show, #nebula-overlay.show, #fortune-display.show, #onboarding-box.is-open, #crisis-support-notice:not([hidden]), #tonight-echo.show';
const empathFocusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function activateEmpathDialog(dialog, preferredFocus) {
    if (!dialog) return;
    empathDialogReturnFocus.set(dialog, document.activeElement);
    dialog.setAttribute('aria-hidden', 'false');
    document.body.classList.add('empath-dialog-open');
    window.setTimeout(() => {
        const focusTarget = preferredFocus || Array.from(dialog.querySelectorAll(empathFocusableSelector)).find(el => el.getClientRects().length) || dialog;
        focusTarget?.focus?.({ preventScroll: true });
    }, 40);
}

function deactivateEmpathDialog(dialog) {
    if (!dialog) return;
    dialog.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => {
        if (!document.querySelector(empathDialogSelector)) document.body.classList.remove('empath-dialog-open');
    }, 0);
    const returnTarget = empathDialogReturnFocus.get(dialog);
    if (returnTarget?.isConnected) returnTarget.focus({ preventScroll: true });
    empathDialogReturnFocus.delete(dialog);
}

document.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const dialogs = Array.from(document.querySelectorAll(empathDialogSelector));
    const dialog = dialogs.at(-1);
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll(empathFocusableSelector)).filter(el => el.getClientRects().length);
    if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
    }
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});

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
window.toggleLangDropdown = function() {
  const list = document.getElementById('lang-dropdown-list');
  const button = document.getElementById('lang-select-btn');
  const open = list.classList.toggle('show');
  button?.setAttribute('aria-expanded', String(open));
  if (open) list.querySelector('.active-lang')?.focus();
}
document.addEventListener('click', function(e) {
  if(!e.target.closest('.lang-dropdown-wrapper')) {
    const list = document.getElementById('lang-dropdown-list');
    list?.classList.remove('show');
    document.getElementById('lang-select-btn')?.setAttribute('aria-expanded', 'false');
  }
});

const guideData = {
    'E': { title: {zh: '房間 E — 情緒出口', en: 'Room E — Emotional Exit', ja: '部屋 E — 感情の出口', es: 'Habitación E — Salida Emocional', fr: 'Salle E — Sortie Émotionnelle', de: 'Raum E — Emotionaler Ausgang', 'zh-cn': '房间 E — 情绪出口', 'uk': 'Кімната E — Емоційний вихід', 'pl': 'Pokój E — Emocjonalne Wyjście'}, desc: {zh: '有些話堵在心口太久會生病。在這裡，你可以完全匿名地把那些沉重、憤怒或委屈倒出來，黑暗會安全地接住它們。', en: 'Words kept inside can make you sick. Here, you can pour out your heaviness anonymously. The dark will hold it safely.', ja: '胸に秘めた言葉を吐き出してください。暗闇がそれを安全に受け止めます。', es: 'Aquí puedes desahogarte de forma anónima. La oscuridad lo sostendrá.', fr: 'Ici, vous pouvez vous épancher anonymement. L\'obscurité le gardera en sécurité.', de: 'Hier kannst du dich anonym ausschütten. Die Dunkelheit wird es sicher halten.', 'zh-cn': '有些话堵在心口太久会生病。在这里，你可以完全匿名地把那些沉重、愤怒或委屈倒出来，黑暗会安全地接住它们。', 'uk': 'Слова, які ви тримаєте в собі, можуть зробити вас хворими. Темрява безпечно їх сховає.', 'pl': 'Słowa, które w sobie trzymasz, mogą sprawić, że zachorujesz. Ciemność bezpiecznie je przechowa.'}, link: 'room-e.html' },
    'M': { title: {zh: '房間 M — 思念映射', en: 'Room M — Memory Mapping', ja: '部屋 M — 想いの投影', es: 'Habitación M — Mapeo de Recuerdos', fr: 'Salle M — Cartographie des Souvenirs', de: 'Raum M — Erinnerungskartierung', 'zh-cn': '房间 M — 思念映射', 'uk': 'Кімната M — Картографія Пам\'яті', 'pl': 'Pokój M — Mapowanie Wspomnień'}, desc: {zh: '思念沒有實體，但可以有座標。來這裡點亮一顆星，讓那份想念在夜空裡被看見，或許對方也能感應得到。', en: 'Missing someone has no physical form, but it can have a coordinate. Light a star here.', ja: '想いを星に変えて夜空に灯しましょう。', es: 'Extrañar no tiene forma física, pero puede tener una coordenada. Enciende una estrella aquí.', fr: 'Le manque n\'a pas de forme physique, mais peut avoir une coordonnée. Allumez une étoile ici.', de: 'Vermissen hat keine physische Form, aber es kann eine Koordinate haben. Zünde hier einen Stern an.', 'zh-cn': '思念没有实体，但可以有坐标。来这里点亮一颗星，让那份想念在夜空里被看见。', 'uk': 'Засвіти тут зірку для тих, за ким сумуєш.', 'pl': 'Zapal tutaj gwiazdę dla tych, za którymi tęsknisz.'}, link: 'room-m.html' },
    'P': { title: {zh: '房間 P — 碎片修補', en: 'Room P — Kintsugi Repair', ja: '部屋 P — 欠片の修復', es: 'Habitación P — Reparación Kintsugi', fr: 'Salle P — Réparation Kintsugi', de: 'Raum P — Kintsugi-Reparatur', 'zh-cn': '房间 P — 碎片修补', 'uk': 'Кімната P — Зцілення Кінцуґі', 'pl': 'Pokój P — Naprawa Kintsugi'}, desc: {zh: '碎裂不是結束，而是光照進來的地方。用金繼（Kintsugi）的方式，將你心中的遺憾與傷痛重新修補，化為最美的紋理。', en: 'Brokenness is not the end. Use Kintsugi to mend your regrets into beautiful textures.', ja: '金継ぎのようにもう一度つなぎ合わせましょう。', es: 'La ruptura no es el fin. Usa Kintsugi para reparar tus arrepentimientos en texturas hermosas.', fr: 'La brisure n\'est pas la fin. Utilisez le Kintsugi pour réparer vos regrets en de belles textures.', de: 'Zerbrochenheit ist nicht das Ende. Verwende Kintsugi, um deine Reue in wunderschöne Texturen zu flicken.', 'zh-cn': '碎裂不是结束，而是光照进来的地方。用金继（Kintsugi）的方式，将你心中的遗憾与伤痛重新修补。', 'uk': 'Розбитість — це не кінець. Зціли свої жалі золотом.', 'pl': 'Rozbicie to nie koniec. Ulecz swoje żale złotem.'}, link: 'room-p.html' },
    'A': { title: {zh: '房間 A — 神聖避難所', en: 'Room A — Sacred Asylum', ja: '部屋 A — 神聖な避難所', es: 'Habitación A — Asilo Sagrado', fr: 'Salle A — Asile Sacré', de: 'Raum A — Heiliges Asyl', 'zh-cn': '房间 A — 神圣避难所', 'uk': 'Кімната A — Священний Прихисток', 'pl': 'Pokój A — Święty Azyl'}, desc: {zh: '有些痛苦太重，不該永遠背負。在這裡寫下的所有秘密，都會在 24 小時後像沙畫一樣被風吹散，不留痕跡。', en: 'Some pain is too heavy to carry forever. Secrets here will turn to sand and blow away in 24 hours.', ja: 'ここでの秘密は24時間後に砂のように消え去ります。', es: 'Cierto dolor es demasiado pesado. Los secretos aquí se convertirán en arena en 24 horas.', fr: 'Certaines douleurs sont trop lourdes. Les secrets ici se transformeront en sable dans 24 heures.', de: 'Mancher Schmerz ist zu schwer. Geheimnisse hier werden in 24 Stunden zu Sand.', 'zh-cn': '有些痛苦太重，不该永远背负。在这里写下的所有秘密，都会在 24 小时后像沙画一样被风吹散。', 'uk': 'Деякий біль занадто важкий. Секрети тут перетворяться на пісок.', 'pl': 'Niektóre bóle są zbyt ciężkie. Sekrety tutaj zmienią się w piasek.'}, link: 'room-a.html' },
    'T': { title: {zh: '房間 T — 能量共振', en: 'Room T — Energy Resonance', ja: '部屋 T — エネルギー共鳴', es: 'Habitación T — Resonancia de Energía', fr: 'Salle T — Résonance d\'Énergie', de: 'Raum T — Energieresonanz', 'zh-cn': '房间 T — 能量共振', 'uk': 'Кімната T — Енергетичний Резонанс', 'pl': 'Pokój T — Rezonans Energii'}, desc: {zh: '當你覺得自己有餘力時，來這裡給予他人一個無聲的擁抱吧。每一次共鳴，都會化作對方真實的心跳震動。', en: 'When you have the strength, give someone a silent hug here. Every resonance is a heartbeat.', ja: '余裕があるなら、誰かに無言の抱擁を贈りましょう。', es: 'Cuando tengas fuerza, dale a alguien un abrazo silencioso aquí.', fr: 'Quand vous avez la force, donnez un câlin silencieux ici.', de: 'Wenn du die Kraft hast, gib hier jemandem eine stille Umarmung.', 'zh-cn': '当你觉得自己有余力时，来这里给予他人一个无声的拥抱吧。每一次共鸣，都会化作对方真实的心跳震动。', 'uk': 'Подаруйте комусь мовчазні обійми тут. Кожен резонанс — це серцебиття.', 'pl': 'Podaruj tu komuś cichy uścisk. Każdy rezonans to bicie serca.'}, link: 'room-t.html' },
    'H': { title: {zh: '房間 H — 靈魂歸宿', en: 'Room H — Soul\'s Home', ja: '部屋 H — 魂の帰郷', es: 'Habitación H — Hogar del Alma', fr: 'Salle H — Foyer de l\'Âme', de: 'Raum H — Zuhause der Seele', 'zh-cn': '房间 H — 灵魂归宿', 'uk': 'Кімната H — Дім Душі', 'pl': 'Pokój H — Dom Duszy'}, desc: {zh: '回家，回到不需偽裝的地方。這裡記錄了全世界的靈魂足跡。你可以先在這裡安靜地待著。', en: 'Come home, to a place where no disguise is needed. You can just rest here quietly.', ja: 'おかえりなさい。偽りの必要がない場所へ。まずはここで静かに休んでください。', es: 'Vuelve a casa, a un lugar donde no necesitas fingir. Puedes descansar aquí tranquilamente.', fr: 'Rentrez chez vous, dans un endroit sans déguisement. Vous pouvez simplement vous reposer ici.', de: 'Komm nach Hause, an einen Ort ohne Verstellung. Du kannst hier einfach ruhig ausruhen.', 'zh-cn': '回家，回到不需伪装的地方。这里记录了全世界的灵魂足迹。你可以先在这里安静地待着。', 'uk': 'Повертайся додому. Ти можеш просто тихо відпочити тут.', 'pl': 'Wróć do domu. Możesz po prostu cicho tu odpocząć.'}, link: 'room-h.html' }
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
    activateEmpathDialog(obBox, obBox.querySelector('.guide-close'));
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
            deactivateEmpathDialog(obBox);
        }, 350);
    }
}

window.switchLang = function(lang, options = {}) {
  if (!SUPPORTED_LANGUAGES.has(lang)) lang = 'zh';
  const { silent = false, persist = true } = options;
  window.currentLang = lang;
  if (persist) {
    try { safeLocalStorage.setItem('empath_language', lang); } catch (error) {}
  }
  const documentLanguages = { 'zh':'zh-Hant', 'zh-cn':'zh-Hans', 'en':'en', 'en-uk':'en-GB', 'ja':'ja', 'es':'es', 'fr':'fr', 'de':'de', 'uk':'uk', 'pl':'pl' };
  document.documentElement.lang = documentLanguages[lang] || 'zh-Hant';
  const langNames = { 'zh': '繁體中文', 'zh-cn': '简体中文', 'en': 'English (US)', 'en-uk': 'English (UK)', 'ja': '日本語', 'es': 'Español', 'fr': 'Français', 'de': 'Deutsch', 'uk': 'Українська', 'pl': 'Polski' };
  const currentLangDisplay = document.getElementById('current-lang-display');
  if (currentLangDisplay) currentLangDisplay.textContent = langNames[lang];
  document.getElementById('lang-dropdown-list')?.classList.remove('show');
  document.getElementById('lang-select-btn')?.setAttribute('aria-expanded', 'false');
  document.querySelectorAll('.lang-option').forEach(btn => {
    const selected = btn.dataset.lang === lang;
    btn.classList.toggle('active-lang', selected);
    btn.setAttribute('aria-selected', String(selected));
  });
  const targetLang = (lang === 'en-uk') ? 'en' : lang;
  document.querySelectorAll('[data-zh]').forEach(el => { el.innerHTML = el.getAttribute('data-' + targetLang) || el.getAttribute('data-en') || el.getAttribute('data-zh'); });
  document.querySelectorAll('[data-zh-ph]').forEach(el => { el.setAttribute('placeholder', el.getAttribute('data-' + targetLang + '-ph') || el.getAttribute('data-en-ph') || el.getAttribute('data-zh-ph')); });
  document.querySelectorAll('[data-zh-title]').forEach(el => { el.setAttribute('title', el.getAttribute('data-' + targetLang + '-title') || el.getAttribute('data-en-title') || el.getAttribute('data-zh-title')); });
  const activeTitle = document.getElementById('ob-res-title')?.textContent || '';
  if(activeTitle !== "") { for(let key in guideData) { if(Object.values(guideData[key].title).includes(activeTitle)) { window.showGuideResult(key); break; } } }
  updateDynamicTexts(); const timeline = document.getElementById('h-events'); if(timeline) { timeline.innerHTML = ''; initTimeline(); } window.renderSessionJourney?.(); if(typeof window.renderEFeed === 'function') window.renderEFeed(); if(typeof window.renderTWarmthFeed === 'function') window.renderTWarmthFeed();
  updateCrisisLinks();
  renderAnalyticsConsentControls();
  window.dispatchEvent(new CustomEvent('empath:language-changed', { detail:{ lang } }));
  const syncGoogleTranslation = () => {
    const googleSelect = document.querySelector('.goog-te-combo');
    if (!googleSelect) return;
      let googleLang = lang;
      if (lang === 'zh') googleLang = 'zh-TW';
      if (lang === 'zh-cn') googleLang = 'zh-CN';
      if (lang === 'en-uk') googleLang = 'en';

      googleSelect.value = googleLang;
      googleSelect.dispatchEvent(new Event('change'));

      if (!window.empathGoogleObserver) {
          window.empathGoogleObserver = new MutationObserver(() => {
              if (document.body.style.top !== '0px' && document.body.style.top !== '') {
                  document.body.style.setProperty('top', '0px', 'important');
              }
              if (document.documentElement.style.top !== '0px' && document.documentElement.style.top !== '') {
                  document.documentElement.style.setProperty('top', '0px', 'important');
              }
              document.querySelectorAll('div.skiptranslate').forEach(el => {
                  if (el.id !== 'google_translate_element') el.style.display = 'none';
              });
          });
          window.empathGoogleObserver.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
      }
  };

  if (document.querySelector('.goog-te-combo')) {
    syncGoogleTranslation();
  } else if (lang !== 'zh' && typeof window.ensureGoogleTranslate === 'function') {
    window.ensureGoogleTranslate()
      .then(() => window.setTimeout(syncGoogleTranslation, 0))
      .catch(error => console.warn('Google Translate unavailable:', error));
  }

  if (!silent) window.showToast(t('已切換語言 ✦', 'Language Switched ✨', '言語を切り替えました ✦', 'Idioma Cambiado ✨', 'Langue changée ✨', 'Sprache geändert ✨', '已切换语言 ✦', 'Мову змінено ✦', 'Język zmieniony ✦'));
}

function updateDynamicTexts() {
  if(document.getElementById('p-healed-count')) { const healed = window.pHealedTotal || globalCounts.p || 0; document.getElementById('p-healed-count').textContent = t( `已有 ${healed} 道裂紋，以金修補。`, `${healed} cracks mended with gold.`, `${healed} 個のひび割れが金で修復されました。`, `${healed} grietas reparadas con oro.`, `${healed} fissures réparées avec de l'or.`, `${healed} Risse mit Gold geflickt.`, `已有 ${healed} 道裂纹，以金修补。` ); }
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

function cleanText(text) {
  const targetedAbuse = ['去死', '智障', '白痴', '幹你娘', '幹你', '賤人', '腦殘', 'bitch'];
  let cleaned = text;
  targetedAbuse.forEach(word => {
    const regex = new RegExp(word.split('').join('\\s*'), 'gi');
    cleaned = cleaned.replace(regex, '***');
  });
  return cleaned;
}

function containsCrisisSignal(text) {
  return /(想死|不想活|活不下去|結束生命|自殺|傷害自己|不想存在|死にたい|自殺|want\s+to\s+die|kill\s+myself|end\s+my\s+life|hurt\s+myself|suicid)/i.test(text);
}

function prepareSubmittedText(text) {
  if (containsCrisisSignal(text)) {
    window.empathSkipNextEcho = true;
    window.setTimeout(() => window.showCrisisSupportNotice?.(), 450);
    window.setTimeout(() => { window.empathSkipNextEcho = false; }, 12000);
  }
  return cleanText(text);
}

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

function loadLocalJourney() { const savedJourney = safeLocalStorage.getItem('empath_user_journey'); if(savedJourney){ try { journeyData = normalizeJourney(JSON.parse(savedJourney)); state.eCount = journeyData.counters.e || 0; state.mCount = journeyData.counters.m || 0; state.pCount = journeyData.counters.p || 0; state.aCount = journeyData.counters.a || 0; state.tCount = journeyData.counters.t || 0; } catch(err) { console.error("發生錯誤:", err); journeyData = normalizeJourney(); } } }
loadLocalJourney();

