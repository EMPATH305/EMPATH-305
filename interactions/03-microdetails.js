/* ===== INLINE BLOCK 2 ===== */
/* ===== EMPATH LUXURY MICRODETAILS · LEVEL 2 ===== */
(() => {
  'use strict';
  if (window.__EMPATH_LUXURY_LEVEL_2__) return;
  window.__EMPATH_LUXURY_LEVEL_2__ = true;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function setupLiquidRipples() {
    document.querySelectorAll('.send-btn').forEach(button => {
      button.addEventListener('pointerdown', event => {
        if (reducedMotion.matches) return;
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const ripple = document.createElement('span');
        ripple.className = 'lux-btn-ripple';
        ripple.setAttribute('aria-hidden', 'true');
        const room = button.closest('.room');
        const color = getComputedStyle(button).borderTopColor || getComputedStyle(room || button).color;
        const diameter = Math.hypot(Math.max(x,rect.width-x),Math.max(y,rect.height-y)) * 2;
        ripple.style.setProperty('--ripple-x', x + 'px');
        ripple.style.setProperty('--ripple-y', y + 'px');
        ripple.style.setProperty('--ripple-color', color);
        ripple.style.setProperty('--ripple-scale', Math.max(12, diameter / 12));
        button.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove(), { once:true });
        window.setTimeout(() => ripple.remove(), 750);
      }, { passive:true });
    });
  }

  function setupFeedRhythm() {
    const seen = new Map();
    const feeds = ['e-feed','t-feed','a-feed']
      .map(id => document.getElementById(id))
      .filter(Boolean);
    feeds.forEach(feed => seen.set(feed,new Set()));
    const animateChildren = feed => {
      const known = seen.get(feed);
      Array.from(feed.children).forEach((card,index) => {
        if (card.classList.contains('lux-feed-item') || card.classList.contains('lux-feed-steady')) return;
        const signature = (card.textContent || '').replace(/\s+/g,' ').trim();
        if (signature && known.has(signature)) {
          card.classList.add('lux-feed-steady');
          return;
        }
        if (signature) known.add(signature);
        card.style.setProperty('--feed-delay', Math.min(index * 80, 640) + 'ms');
        card.classList.add('lux-feed-item');
      });
    };
    const observer = new MutationObserver(records => {
      const changed = new Set(records.map(record => record.target.closest?.('#e-feed,#t-feed,#a-feed')).filter(Boolean));
      changed.forEach(animateChildren);
    });
    feeds.forEach(feed => {
      observer.observe(feed,{childList:true});
      animateChildren(feed);
    });
  }

  function setupInputEnergy() {
    const syncSpark = textarea => {
      const host = textarea.parentElement;
      const spark = host.querySelector(':scope > .lux-input-spark[data-for="' + textarea.id + '"]');
      if (!spark) return;
      host.classList.toggle('has-input-energy', textarea.value.trim().length > 0);
      spark.style.setProperty('--spark-left', textarea.offsetLeft + 'px');
      spark.style.setProperty('--spark-top', (textarea.offsetTop + textarea.offsetHeight - 1) + 'px');
      spark.style.setProperty('--spark-width', textarea.offsetWidth + 'px');
      const roomColor = getComputedStyle(textarea.closest('.room')?.querySelector('.room-tag') || textarea).color;
      spark.style.setProperty('--input-energy', roomColor);
    };
    document.querySelectorAll('textarea').forEach((textarea,index) => {
      if (!textarea.id) textarea.id = 'lux-textarea-' + index;
      const host = textarea.parentElement;
      host.classList.add('lux-input-host');
      const spark = document.createElement('span');
      spark.className = 'lux-input-spark';
      spark.dataset.for = textarea.id;
      spark.setAttribute('aria-hidden','true');
      host.appendChild(spark);
      const update = () => syncSpark(textarea);
      textarea.addEventListener('input',update,{passive:true});
      new ResizeObserver(update).observe(textarea);
      update();
    });
  }

  function setupRollingCounters() {
    const selector = [
      '#m-count',
      '#g-v-count','#g-e-count','#g-m-count','#g-p-count','#g-t-count',
      '#h-e-count','#h-m-count','#h-p-count','#h-a-count','#h-t-count'
    ].join(',');
    const counters = Array.from(document.querySelectorAll(selector));
    const values = new WeakMap();
    const internal = new WeakSet();
    const animations = new WeakMap();
    const numericValue = element => {
      const match = (element.textContent || '').replace(/,/g,'').match(/-?\d+/);
      return match ? Number(match[0]) : null;
    };
    counters.forEach(counter => {
      counter.classList.add('lux-counter');
      values.set(counter,numericValue(counter) ?? 0);
    });
    const roll = (counter,to) => {
      const from = values.get(counter) ?? 0;
      if (!Number.isFinite(to) || to === from) return;
      animations.get(counter)?.cancel?.();
      const duration = reducedMotion.matches ? 0 : Math.min(1100,420 + Math.abs(to-from) * 8);
      const started = performance.now();
      const token = {cancelled:false,cancel(){this.cancelled=true;}};
      animations.set(counter,token);
      const frame = now => {
        if (token.cancelled) return;
        const progress = duration ? Math.min(1,(now-started)/duration) : 1;
        const eased = 1 - Math.pow(1-progress,3);
        const value = Math.round(from + (to-from)*eased);
        internal.add(counter);
        counter.textContent = value.toLocaleString();
        queueMicrotask(() => internal.delete(counter));
        if (progress < 1) requestAnimationFrame(frame);
        else {
          values.set(counter,to);
          counter.classList.remove('is-rolling');
          void counter.offsetWidth;
          counter.classList.add('is-rolling');
        }
      };
      requestAnimationFrame(frame);
    };
    const observer = new MutationObserver(records => {
      records.forEach(record => {
        const counter = record.target.nodeType === Node.TEXT_NODE
          ? record.target.parentElement?.closest(selector)
          : record.target.closest?.(selector);
        if (!counter || internal.has(counter)) return;
        const next = numericValue(counter);
        if (next !== null) roll(counter,next);
      });
    });
    counters.forEach(counter => observer.observe(counter,{childList:true,characterData:true,subtree:true}));
  }

  function setupRoomBoundaries() {
    document.querySelectorAll('.room').forEach(room => {
      if (room.querySelector(':scope > .lux-room-boundary')) return;
      const line = document.createElement('div');
      line.className = 'lux-room-boundary';
      line.setAttribute('aria-hidden','true');
      room.prepend(line);
    });
  }

  function setupHSPTransition() {
    if (!document.querySelector('.lux-hsp-veil')) {
      const veil = document.createElement('div');
      veil.className = 'lux-hsp-veil';
      veil.setAttribute('aria-hidden','true');
      document.body.appendChild(veil);
    }
    const originalToggle = window.toggleHSP;
    if (typeof originalToggle !== 'function' || originalToggle.__luxWrapped) return;
    const wrapped = function(...args) {
      document.body.classList.add('hsp-transitioning');
      const result = originalToggle.apply(this,args);
      window.setTimeout(() => document.body.classList.remove('hsp-transitioning'),1500);
      return result;
    };
    wrapped.__luxWrapped = true;
    window.toggleHSP = wrapped;
  }

  function initLuxuryLevel2() {
    setupLiquidRipples();
    setupFeedRhythm();
    setupInputEnergy();
    setupRollingCounters();
    setupRoomBoundaries();
    setupHSPTransition();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',initLuxuryLevel2,{once:true});
  } else {
    initLuxuryLevel2();
  }
})();

;

