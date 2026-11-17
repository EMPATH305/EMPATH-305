/* ===== INLINE BLOCK 5 ===== */
(() => {
  'use strict';
  if (window.__EMPATH_MOTION_DIRECTION__) return;
  window.__EMPATH_MOTION_DIRECTION__ = true;

  const IDLE_DELAY = 3000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion:reduce)');
  let idleTimer = 0;

  const enterIdle = () => {
    idleTimer = 0;
    if (reduceMotion.matches || document.hidden) return;
    document.body.classList.add('empath-motion-idle');
    document.dispatchEvent(new CustomEvent('empath:motion-idle'));
    if (typeof window.drawStars === 'function') window.drawStars();
    if (typeof window.drawSand === 'function') window.drawSand();
  };

  const registerActivity = () => {
    document.body.classList.remove('empath-motion-idle');
    document.dispatchEvent(new CustomEvent('empath:motion-active'));
    window.clearTimeout(idleTimer);
    if (!reduceMotion.matches && !document.hidden) idleTimer = window.setTimeout(enterIdle,IDLE_DELAY);
  };

  ['pointerdown','pointermove','keydown','touchstart','wheel','scroll','input'].forEach(type => {
    window.addEventListener(type,registerActivity,{passive:true});
  });
  document.addEventListener('visibilitychange',registerActivity,{passive:true});
  reduceMotion.addEventListener?.('change',registerActivity);

  window.empathContrastMoment = () => {
    if (reduceMotion.matches) return;
    let flash = document.querySelector('.empath-contrast-flash');
    if (!flash) {
      flash = document.createElement('div');
      flash.className = 'empath-contrast-flash';
      flash.setAttribute('aria-hidden','true');
      document.body.appendChild(flash);
    }
    flash.classList.remove('is-active');
    void flash.offsetWidth;
    flash.classList.add('is-active');
    window.setTimeout(() => flash.classList.remove('is-active'),320);
  };

  registerActivity();
})();

;

