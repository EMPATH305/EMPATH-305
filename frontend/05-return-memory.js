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
    const rawPreviousVisit = safeLocalStorage.getItem(RETURN_MEMORY_LAST_VISIT_KEY);
    const parsedPreviousVisit = Number(rawPreviousVisit);
    const hasValidPreviousVisit = Number.isFinite(parsedPreviousVisit) && parsedPreviousVisit > 0 && parsedPreviousVisit <= now.getTime() + 300000;
    const previousVisit = hasValidPreviousVisit ? parsedPreviousVisit : null;
    const visitCount = Math.max(0,Number(journeyData.visitCount) || 0) + 1;

    journeyData.visitCount = visitCount;
    safeLocalStorage.setItem('empath_user_journey',JSON.stringify(journeyData));
    safeLocalStorage.setItem(RETURN_MEMORY_LAST_VISIT_KEY,String(now.getTime()));
    window.empathReturnMemory = { isReturning:Boolean(previousVisit), previousVisit, visitCount };

    const primaryEntry = document.getElementById('primary-entry-cta');
    const lastRoom = safeLocalStorage.getItem('empath_last_room');
    if (previousVisit && primaryEntry && ['e','m','p','a','t','h'].includes(lastRoom)) {
        primaryEntry.href = `room-${lastRoom}.html`;
        primaryEntry.textContent = t(`繼續上次的 Room ${lastRoom.toUpperCase()}`, `Continue Room ${lastRoom.toUpperCase()}`);
        primaryEntry.removeAttribute('data-zh');
        primaryEntry.removeAttribute('data-en');
    }

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
    const soulKey = safeLocalStorage.getItem('empath_soul_key');
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
        const route = JSON.parse(safeSessionStorage.getItem(SESSION_ROUTE_KEY) || '[]');
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
    safeSessionStorage.setItem(SESSION_ROUTE_KEY,JSON.stringify(route));
    window.renderSessionJourney();
}

window.storeSessionEcho = function(text) {
    if (!text) return;
    const fragments = text.split(/[，。！？!?；;、\n]+/).map(part => part.trim()).filter(Boolean);
    let fragment = fragments.find(part => Array.from(part).length >= 2) || '';
    if (/\s/.test(fragment)) fragment = fragment.split(/\s+/).find(word => word.length >= 3) || fragment;
    fragment = Array.from(fragment.replace(/[<>]/g,'')).slice(0,6).join('');
    if (!fragment) return;
    safeSessionStorage.setItem(SESSION_ECHO_KEY,fragment);
    const echo = document.getElementById('h-session-echo');
    if (echo) echo.textContent = fragment;
};

function initSessionNarrative() {
    window.renderSessionJourney();
    const echo = document.getElementById('h-session-echo');
    if (echo) echo.textContent = safeSessionStorage.getItem(SESSION_ECHO_KEY) || '';
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

