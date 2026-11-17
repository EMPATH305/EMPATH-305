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
    activateEmpathDialog(overlay);
    
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
    deactivateEmpathDialog(overlay);
    clearInterval(breatheInterval);
};

const SUPPORTED_LANGUAGES = new Set(['zh','zh-cn','en','en-uk','ja','es','fr','de','uk','pl']);
let savedLanguage = 'zh';
try {
    const storedLanguage = safeLocalStorage.getItem('empath_language');
    if (SUPPORTED_LANGUAGES.has(storedLanguage)) savedLanguage = storedLanguage;
} catch (error) {}
window.currentLang = savedLanguage;
