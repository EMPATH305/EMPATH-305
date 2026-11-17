/* ===== INLINE BLOCK 7 ===== */
(() => {
  'use strict';
  const syncViewport = () => {
    const viewport = window.visualViewport;
    const height = Math.round(viewport?.height || window.innerHeight || 0);
    const offsetTop = Math.max(0,Math.round(viewport?.offsetTop || 0));
    const obscuredBottom = Math.max(0,Math.round((window.innerHeight || height) - height - offsetTop));
    if (height > 0) document.documentElement.style.setProperty('--empath-vh',`${height}px`);
    document.documentElement.style.setProperty('--empath-vv-top',`${offsetTop}px`);
    document.documentElement.style.setProperty('--empath-vv-bottom',`${obscuredBottom}px`);
  };
  let viewportTimer = 0;
  const scheduleSync = () => {
    clearTimeout(viewportTimer);
    viewportTimer = window.setTimeout(syncViewport,60);
  };
  syncViewport();
  window.addEventListener('orientationchange',scheduleSync,{passive:true});
  window.addEventListener('resize',scheduleSync,{passive:true});
  window.visualViewport?.addEventListener('resize',scheduleSync,{passive:true});
  window.visualViewport?.addEventListener('scroll',scheduleSync,{passive:true});
})();

;

