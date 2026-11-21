// 終極防護：加入防抖 (Debounce) 機制，並忽略手機上下滑動時的網址列縮放
let resizeTimer = null;
let lastWidth = window.innerWidth;
let lastMStage = '';
let renderedMStars = [];

window.addEventListener('resize', () => {
    // 核心關鍵：如果只是上下滑動導致網址列縮放（寬度沒變），就絕對不要重繪畫布！
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    
    clearTimeout(resizeTimer); // 踩煞車，取消前一次的倒數
    resizeTimer = setTimeout(() => {
        if (roomMVisible) {
            if (starsRafId) cancelAnimationFrame(starsRafId);
            starsRafId = null;
            window.resizeCanvas('m');
            window.drawStars();
        }
        if (roomAVisible) window.resizeCanvas('a');
    }, 300);
});

window.addEventListener('orientationchange', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (roomMVisible) {
            if (starsRafId) cancelAnimationFrame(starsRafId);
            starsRafId = null;
            window.resizeCanvas('m');
            window.drawStars();
        }
        if (roomAVisible) window.resizeCanvas('a');
    }, 300);
});
  
window.addEventListener('empath:language-changed', () => {
    if (roomMVisible) {
        if (starsRafId) cancelAnimationFrame(starsRafId);
        starsRafId = null;
        window.resizeCanvas('m');
        window.drawStars();
    }
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
    const summary = roomMStars.getSummary(globalCounts.m);
    document.getElementById('m-count').textContent = summary.total;
    document.getElementById('m-brightest').textContent = summary.brightest;
}

function drawSparkle(ctx, x, y, radius, r, g, b, alpha) { ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.moveTo(0, -radius); ctx.quadraticCurveTo(0, 0, radius, 0); ctx.quadraticCurveTo(0, 0, 0, radius); ctx.quadraticCurveTo(0, 0, -radius, 0); ctx.quadraticCurveTo(0, 0, 0, -radius); ctx.closePath(); ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`; ctx.shadowBlur = radius; ctx.shadowColor = `rgba(${r},${g},${b},${alpha})`; ctx.fill(); ctx.restore(); }
window.drawStars = function(){ 
    if(!canvas || !ctx || !roomM || !isAnimating || !roomMVisible) return;
    const ambientMotion = document.body.classList.contains('empath-motion-idle');
    if(!canvas.width || !canvas.height) {
        if(typeof window.resizeCanvas === 'function') window.resizeCanvas('m');
        if(!canvas.width || !canvas.height) return;
    }
    const allStarMessages = roomMStars.getStars();
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
    const starMessages = visibleRoomMStars(allStarMessages, w);
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

    const stageKey = [safeX, safeY, safeW, safeH].map(Math.round).join(':');
    const needsStarLayout = stageKey !== lastMStage || starMessages.some(s => !Number.isFinite(s.x) || !Number.isFinite(s.y));
    if (needsStarLayout) {
        layoutRoomMStars(starMessages, { x:safeX, y:safeY, width:safeW, height:safeH }, uiSafeRects, { mobile:w <= 768 });
        lastMStage = stageKey;
    }

    renderedMStars = starMessages;

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
        const b = Math.min(5, Math.max(1, s.brightness)); const c = STAR_COLORS[s.colorIdx]; const focusScale = s === brightestStar ? pulse : 1; const coreR = (1.5 + (b * 0.4)) * focusScale; const glowR = coreR * 5;
        const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR); 
        grd.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, 0.9)`); grd.addColorStop(0.3, `rgba(${c.r}, ${c.g}, ${c.b}, 0.3)`); grd.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`); 
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(s.x, s.y, glowR, 0, Math.PI*2); ctx.fill(); 
        drawSparkle(ctx, s.x, s.y, coreR * 3 + b * 2.5, c.r, c.g, c.b, 0.95); 
    }); 

    starsRafId = ambientMotion ? requestAnimationFrame(window.drawStars) : null; 
}

window.activeConstellations = window.activeConstellations || [];

roomM?.addEventListener('click', async e => { 
    if (e.target.closest('.m-input-wrap') || e.target.tagName==='TEXTAREA' || e.target.tagName==='BUTTON') return; 
    const rect = canvas.getBoundingClientRect(); 
    const x = e.clientX-rect.left, y = e.clientY-rect.top; 
    const star = findRoomMStarAt(renderedMStars, x, y);
    
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
            const prompt = document.createElement('span');
            prompt.style.cssText = 'font-size:10px;color:var(--gold);margin-top:10px;display:block;';
            prompt.textContent = `✦ ${t('再次點擊以共鳴點亮', 'Click again to resonate', 'もう一度クリックして共鳴', 'Haz clic de nuevo para resonar', 'Cliquez à nouveau pour résonner', 'Klicken Sie erneut, um mitzuschwingen', '再次点击以共鸣点亮')}`;
            const actions = window.EmpathSafety?.createContentActions('stars', star.id, () => {
                roomMStars.remove(star.id);
                window.starMessages = roomMStars.getStars();
                tooltip.classList.remove('active');
                activeStarId = null;
                if (starsRafId) cancelAnimationFrame(starsRafId);
                starsRafId = null;
                window.drawStars();
            });
            tooltip.replaceChildren(
                document.createTextNode(t('思念', 'Memory', '想い', 'Recuerdo', 'Souvenir', 'Erinnerung', '思念')),
                document.createElement('br'),
                document.createTextNode(typeof star.text === 'string' ? star.text : ''),
                document.createElement('br'),
                prompt,
                actions || document.createDocumentFragment()
            ); 
        } else {
            // The backend creates these constellation lines in the same transaction
            // as the accepted star reaction, so a failed or duplicate reaction leaves no lines behind.
            const nearest = nearestRoomMStars(renderedMStars, star.id, x, y);
            let reaction;
            try {
                reaction = await reactToRoomContent('star', star.id, {
                    neighborIds:nearest.map(neighbor => neighbor.id)
                });
            } catch (error) {
                if (isDuplicateRoomReaction(error)) {
                    window.showToast(t('你已經點亮過這顆思念', 'You already resonated with this memory', 'この想いにはすでに共鳴しています', 'Ya resonaste con este recuerdo', 'Vous avez déjà fait résonner ce souvenir', 'Du hast bereits mit dieser Erinnerung mitgeschwungen', '你已经点亮过这颗思念', 'Ви вже відгукнулися на цей спогад', 'Ta myśl już została przez ciebie rozświetlona'));
                } else {
                    console.error('Star resonance failed:', error);
                    window.showToast(t('暫時無法點亮，請稍後再試', 'Could not resonate yet. Please try again.', '今は共鳴できません。後でもう一度お試しください。', 'No se pudo resonar. Inténtalo de nuevo.', 'Impossible de résonner pour le moment. Réessayez.', 'Resonanz fehlgeschlagen. Bitte erneut versuchen.', '暂时无法点亮，请稍后再试', 'Не вдалося відгукнутися. Спробуйте ще раз.', 'Nie udało się rozświetlić. Spróbuj ponownie.'));
                }
                return;
            }

            roomMStars.applyReaction(star.id, reaction);
            window.showToast(t('這顆思念更亮了 ✦', 'Resonated ✦', '星が輝きました ✦', 'Resonó ✦', 'A résonné ✦', 'Hat mitgeschwungen ✦', '这颗思念更亮了 ✦'));
            window.triggerHeartbeat();

            // 🎧 觸發 3D 空間水晶音
            const panValue = (x / window.innerWidth) * 2 - 1;
            if(typeof window.playSpatialChime === 'function') window.playSpatialChime(panValue);

            tooltip.classList.remove('active');
            activeStarId = null;
        } 
    } else { 
        tooltip.classList.remove('active'); activeStarId = null; 
    } 
});
  
window.submitM = async function(){ const input = document.getElementById('m-input'); let text = input.value.trim(); if(!text || !canSubmit()) return; text = prepareSubmittedText(text); try { const origText = document.getElementById('m-submit-btn').innerHTML; await createRoomContent('m', { text }); input.value=''; logJourney('m', text); playRitual('m-submit-btn', origText); window.empathContrastMoment?.(); window.showToast(t('你的思念成為了一顆星 ✦', 'Added to the sky ✦', '星になりました ✦', 'Añadido al cielo ✦', 'Ajouté au ciel ✦', 'Zum Himmel hinzugefügt ✦', '你的思念成为了一颗星 ✦')); queueTonightEcho('m'); } catch(error) { showRoomSubmissionError(error); } }

const roomPCanvas = createRoomPCanvas({
    document,
    browserWindow:window,
    getRatio:() => roomPShards.getSummary().ratio
});
window.addEventListener('load', () => roomPCanvas.init());
window.drawKintsugiVessel = () => roomPCanvas.draw();
window.submitP = async function(){ const input = document.getElementById('p-input'); let text = input.value.trim(); if(!text || !canSubmit()) return; text = prepareSubmittedText(text); const origText = document.getElementById('p-submit-btn').innerHTML; try { await createRoomContent('p', { text }); input.value = ''; logJourney('p', text); playRitual('p-submit-btn', origText); window.empathContrastMoment?.(); window.showToast(t('碎片已放入', 'Added to vessel', '欠片を入れました', 'Añadido a la vasija', 'Ajouté au récipient', 'Zum Gefäß hinzugefügt', '碎片已放入')); queueTonightEcho('p'); } catch(error) { showRoomSubmissionError(error); } }

let sandParticles = []; const SAND_COLORS = ['#7A9E9F', '#6B9091', '#9AC2C3', '#5D7C7D']; 
function initSandBg(w, h) { sandParticles = []; for(let i=0; i<250; i++){ sandParticles.push({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 1.5 + 0.5, speedY: Math.random() * 1.5 + 0.5, speedX: (Math.random() - 0.5) * 0.5, opacity: Math.random() * 0.4 + 0.1, color: SAND_COLORS[Math.floor(Math.random()*SAND_COLORS.length)], swirlOffset: Math.random() * Math.PI * 2 }); } }

