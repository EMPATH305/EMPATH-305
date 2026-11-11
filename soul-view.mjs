// Rendering only: no storage, encryption or network access.
export function createSoulView({ document, t, getLanguage, getJourney }) {
    function renderTimelineHTML(type, text, time){
        const container = document.getElementById('h-events');
        if (!container) return;
        const safeType = ['e','m','p','a','t'].includes(type) ? type : 'e';
        const div = document.createElement('div'); div.className = 'h-event ' + safeType + '-event';
        const labels = { 'zh': {e:'情緒出口', m:'思念映射', p:'碎片修補', a:'避難所', t:'能量共振'}, 'en': {e:'Exit', m:'Stars', p:'Mended', a:'Asylum', t:'Resonance'}, 'ja': {e:'出口', m:'星空', p:'修復', a:'避難所', t:'共鳴'}, 'es': {e:'Salida', m:'Estrellas', p:'Reparado', a:'Asilo', t:'Resonancia'}, 'fr': {e:'Sortie', m:'Étoiles', p:'Réparé', a:'Asile', t:'Résonance'}, 'de': {e:'Ausgang', m:'Sterne', p:'Geflickt', a:'Asyl', t:'Resonanz'}, 'zh-cn': {e:'情绪出口', m:'思念映射', p:'碎片修补', a:'避难所', t:'能量共振'} };
        const currentKey = getLanguage() === 'en-uk' ? 'en' : getLanguage();
        const body = document.createElement('div');
        const label = document.createElement('div'); label.className = 'h-event-label'; label.textContent = labels[currentKey]?.[safeType] || '';
        const eventText = document.createElement('div'); eventText.className = 'h-event-text';
        const safeText = typeof text === 'string' ? text : '';
        eventText.textContent = safeText.length > 40 ? safeText.slice(0,40) + '…' : safeText;
        const eventTime = document.createElement('div'); eventTime.className = 'h-event-time'; eventTime.textContent = typeof time === 'string' ? time : '';
        body.append(label, eventText, eventTime); div.appendChild(body); container.appendChild(div);
    }
    function initTimeline(){
        const container = document.getElementById('h-events');
        if (!container) return;
        container.innerHTML = `<div class="h-event" style="color:var(--muted);font-size:13px;padding-left:20px;border-left:1px solid rgba(255,255,255,.07);"><div><div style="font-size:11px;letter-spacing:2px;color:rgba(255,255,255,.4);margin-bottom:4px; font-weight:bold;">START</div><div>${t('你來到了這裡。這已經是一種勇氣。', 'You arrived here. That is already a form of courage.', 'あなたはここに来ました。それ自体が勇気です。', 'Has llegado aquí. Eso ya es una forma de valentía.', 'Vous êtes arrivé ici. C\'est déjà une forme de courage.', 'Du bist hier angekommen. Das ist bereits eine Form von Mut.', '你来到了这里。这已经是一种勇气。')}</div></div></div>`;

        if (getJourney().events.length === 0) {
            // 如果除了 START 以外什麼都沒有，就顯示溫柔的提示
            container.innerHTML += `<div class="h-event" style="color:rgba(255,255,255,0.3);font-size:13px;padding-left:20px;border-left:1px dashed rgba(255,255,255,.1);"><div><div style="font-style:italic;">${t('你的旅程足跡會在這裡慢慢浮現...', 'Your journey footprints will slowly appear here...', 'あなたの旅の足跡がここに少しずつ現れます...', 'Tus huellas del viaje aparecerán lentamente aquí...', 'Vos empreintes de voyage apparaîtront lentement ici...', 'Deine Fußspuren werden hier langsam erscheinen...', '你的旅程足迹会在这里慢慢浮现...')}</div></div></div>`;
        } else {
            getJourney().events.forEach(ev => renderTimelineHTML(ev.type, ev.text, ev.time));
        }
    }

    function renderFutureLetters(letters, now, testing = false) {
        const container = document.getElementById('unlocked-letters');
        if (!container) return;
        container.innerHTML = '';
        letters.forEach(l => {
            // 如果時間到了，或開啟了穿越密技
            if(now >= l.unlockDate || testing) {
                const letterDiv = document.createElement('div');
                letterDiv.style.cssText = 'padding:20px; background:rgba(255,255,255,0.03); border-left:2px solid var(--gold); border-radius:0 4px 4px 0; margin-bottom:16px; font-size:15px; color:var(--fog); line-height:2; box-shadow: 0 4px 15px rgba(0,0,0,0.3);';

                const dateSpan = document.createElement('span');
                dateSpan.style.cssText = 'font-size:11px; color:var(--gold); display:block; margin-bottom:12px; letter-spacing:3px; font-weight:bold;';
                dateSpan.textContent = `✉️ 來自 ${new Date(l.createdAt).toLocaleDateString()} 的信`;

                const contentDiv = document.createElement('div');
                contentDiv.style.whiteSpace = 'pre-wrap';
                contentDiv.textContent = l.content;

                letterDiv.appendChild(dateSpan);
                letterDiv.appendChild(contentDiv);
                container.appendChild(letterDiv);
            }
        });
    }

    return Object.freeze({ renderTimelineHTML, initTimeline, renderFutureLetters });
}
