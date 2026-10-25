/* ===== INLINE BLOCK 1 ===== */
/* ===== EMPATH CINEMATIC INTERACTION SYSTEM ===== */
(() => {
  'use strict';
  if (window.__EMPATH_CINEMATIC_SYSTEM__) return;
  window.__EMPATH_CINEMATIC_SYSTEM__ = true;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function setupNoise() {
    if (document.querySelector('.aw-site-noise')) return;
    const noise = document.createElement('div');
    noise.className = 'aw-site-noise';
    noise.setAttribute('aria-hidden', 'true');
    document.body.appendChild(noise);
  }

  function setupRoomStages() {
    const selector = [
      '.room-tag', '.room-title-wrap', '.desc-wrap', '.e-mode-toggle',
      '.input-area', '#e-draw-wrap', '.m-input-wrap', '.step-wrapper',
      '.a-warning-mask', '.t-layout', '.h-journey'
    ].join(',');
    const items = qsa(selector);
    items.forEach((element, index) => {
      element.classList.add('aw-stage');
      element.style.setProperty('--aw-delay', Math.min(index * 110, 660) + 'ms');
    });
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach(element => element.classList.add('aw-in'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('aw-in');
        else if (Math.abs(entry.boundingClientRect.top) > window.innerHeight * 1.25) {
          entry.target.classList.remove('aw-in');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    items.forEach(element => observer.observe(element));
  }

  function setupHeroParallax() {
    const hero = document.querySelector('#hero');
    const backgroundText = document.querySelector('.hero-bg-text');
    if (!hero || !backgroundText) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const disabled = reduceMotion.matches || window.innerWidth < 768;
      const offset = disabled ? 0 : Math.min(window.scrollY * 0.3, window.innerHeight * 0.35);
      backgroundText.style.setProperty('--hero-parallax-y', offset.toFixed(2) + 'px');
    };
    const requestUpdate = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    reduceMotion.addEventListener?.('change', requestUpdate);
    update();
  }

  function setupMagneticButtons() {
    if (!finePointer.matches || reduceMotion.matches) return;
    qsa('.send-btn, .door-btn').forEach(button => {
      button.classList.add('is-magnetic');
      button.addEventListener('pointermove', event => {
        const rect = button.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 16;
        button.style.setProperty('--magnetic-x', Math.max(-8, Math.min(8, x)).toFixed(2) + 'px');
        button.style.setProperty('--magnetic-y', Math.max(-8, Math.min(8, y)).toFixed(2) + 'px');
      });
      button.addEventListener('pointerleave', () => {
        button.style.setProperty('--magnetic-x', '0px');
        button.style.setProperty('--magnetic-y', '0px');
      });
    });
  }

  function setupSplitTitles() {
    const processedText = new WeakMap();
    const split = title => {
      const text = title.textContent || '';
      if (processedText.get(title) === text && title.querySelector('.aw-title-char')) return;
      processedText.set(title, text);
      title.setAttribute('aria-label', text);
      title.replaceChildren(...Array.from(text).map((character, index) => {
        const span = document.createElement('span');
        span.className = 'aw-title-char';
        span.setAttribute('aria-hidden', 'true');
        span.style.setProperty('--char-index', index);
        span.textContent = character === ' ' ? '\u00a0' : character;
        return span;
      }));
    };
    const titles = qsa('.room-title');
    titles.forEach(split);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('aw-title-in', entry.isIntersecting));
    }, { threshold: 0.35 });
    titles.forEach(title => observer.observe(title));
    const mutations = new MutationObserver(records => {
      records.forEach(record => {
        const title = record.target.nodeType === Node.TEXT_NODE
          ? record.target.parentElement?.closest('.room-title')
          : record.target.closest?.('.room-title');
        if (title && !title.querySelector('.aw-title-char')) {
          split(title);
          observer.observe(title);
        }
      });
    });
    titles.forEach(title => mutations.observe(title, { childList: true, characterData: true, subtree: true }));
  }

  function setupCursorStates() {
    document.documentElement.classList.remove('aw-custom-cursor');
    const cursor = document.querySelector('#cursor-glow');
    if (cursor) cursor.hidden = true;
  }

  function init() {
    document.body.classList.add('aw-ready');
    setupNoise();
    setupRoomStages();
    setupHeroParallax();
    setupMagneticButtons();
    setupSplitTitles();
    setupCursorStates();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

/* v17 — private daily check-in and seven-day emotional sky */
(() => {
  const STORAGE_KEY = 'empath_daily_checkins_v1';
  const MOODS = {
    heavy: { icon: '🌧️', label: '很沉重', room: 'e', title: 'E 房 · 情緒黑洞', copy: '不必整理好才開口。先把重量放在這裡。' },
    confused: { icon: '🌫️', label: '有點混亂', room: 'p', title: 'P 房 · 金繼之室', copy: '裂痕不等於結束，也可能是重新理解自己的入口。' },
    missing: { icon: '🌙', label: '想念某個人', room: 'm', title: 'M 房 · 思念星海', copy: '讓沒有寄出的思念，成為一顆可以安放的星。' },
    stuck: { icon: '🩹', label: '有件事過不去', room: 'a', title: 'A 房 · 流沙之境', copy: '有些事不必帶到永遠。看著它慢慢離開。' },
    company: { icon: '🕯️', label: '想被陪一下', room: 'h', title: 'H 房 · 回家', copy: '不需要做任何事。先回到一個不必偽裝的地方。' },
    okay: { icon: '✦', label: '今天還不錯', room: 't', title: 'T 房 · 溫度交換所', copy: '把此刻多出來的一點光，留給另一個夜晚。' }
  };
  const ECHO_COPY = {
    e: '你不需要現在就整理好它。能說出來，已經讓重量有了出口。',
    m: '思念沒有消失，但它已經有了一顆可以安放的星。',
    p: '裂痕還在，但你已經開始決定，它不只代表破碎。',
    a: '你不需要再替這段重量保管到永遠。',
    t: '你交出去的溫暖，會在某個陌生人的夜裡留下光。'
  };
  let echoReturnFocus = null;

  // 留在同步載入的互動層，避免社群內建瀏覽器延遲 Firebase 時失去回聲。
  window.showTonightEcho = function(room) {
    if (window.empathSkipNextEcho || !document.getElementById('crisis-support-notice')?.hidden) {
      window.empathSkipNextEcho = false;
      return;
    }
    const dialog = document.getElementById('tonight-echo');
    const copy = document.getElementById('tonight-echo-copy');
    if (!dialog || !copy) return;
    echoReturnFocus = document.activeElement;
    copy.textContent = ECHO_COPY[room] || '能在這裡停一下，本身就是一種照顧。';
    dialog.classList.add('show');
    dialog.setAttribute('aria-hidden', 'false');
    document.body.classList.add('empath-dialog-open');
    window.setTimeout(() => document.getElementById('tonight-echo-close')?.focus({ preventScroll: true }), 40);
  };

  window.closeTonightEcho = function() {
    const dialog = document.getElementById('tonight-echo');
    if (!dialog) return;
    dialog.classList.remove('show');
    dialog.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.share-modal.show, #breathe-overlay.show, #nebula-overlay.show, #fortune-display.show, #onboarding-box.is-open, #crisis-support-notice:not([hidden])')) {
      document.body.classList.remove('empath-dialog-open');
    }
    if (echoReturnFocus?.isConnected) echoReturnFocus.focus({ preventScroll: true });
    echoReturnFocus = null;
  };

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.getElementById('tonight-echo')?.classList.contains('show')) {
      window.closeTonightEcho();
    }
  });

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function readEntries() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(value)) return [];
      return value.filter(item => item && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && MOODS[item.mood]);
    } catch (error) {
      return [];
    }
  }

  function writeEntry(mood) {
    const meta = MOODS[mood];
    if (!meta) return;
    const today = localDateKey();
    const entries = readEntries().filter(item => item.date !== today);
    entries.push({ date: today, mood, room: meta.room, at: Date.now() });
    entries.sort((a, b) => a.date.localeCompare(b.date));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-30))); } catch (error) {}
    window.dispatchEvent(new CustomEvent('empath:checkin-updated', { detail: { mood, room: meta.room } }));
  }

  function showRecommendation(mood) {
    const meta = MOODS[mood];
    const result = document.getElementById('daily-checkin-result');
    if (!meta || !result) return;
    document.querySelectorAll('.daily-mood').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.mood === mood));
    });
    const title = document.getElementById('daily-result-title');
    const copy = document.getElementById('daily-result-copy');
    const link = document.getElementById('daily-result-link');
    if (title) title.textContent = meta.title;
    if (copy) copy.textContent = meta.copy;
    if (link) {
      link.href = `room-${meta.room}.html`;
      link.setAttribute('aria-label', `走進${meta.title}`);
    }
    result.hidden = false;
  }

  function renderWeek() {
    const grid = document.getElementById('emotion-week-grid');
    const insight = document.getElementById('emotion-week-insight');
    if (!grid || !insight) return;
    const entries = readEntries();
    const byDate = new Map(entries.map(item => [item.date, item]));
    const days = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      days.push({ date, key: localDateKey(date), entry: byDate.get(localDateKey(date)) });
    }

    grid.replaceChildren();
    const counts = {};
    days.forEach(({ date, key, entry }) => {
      const meta = entry ? MOODS[entry.mood] : null;
      if (entry) counts[entry.mood] = (counts[entry.mood] || 0) + 1;
      const item = document.createElement('div');
      item.className = `emotion-day${key === localDateKey() ? ' is-today' : ''}${meta ? '' : ' is-empty'}`;
      item.setAttribute('aria-label', `${date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}，${meta ? meta.label : '尚未記錄'}`);
      const weekday = document.createElement('span');
      weekday.className = 'emotion-day-name';
      weekday.textContent = key === localDateKey() ? '今天' : date.toLocaleDateString('zh-TW', { weekday: 'short' });
      const icon = document.createElement('span');
      icon.className = 'emotion-day-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = meta ? meta.icon : '·';
      const label = document.createElement('span');
      label.className = 'emotion-day-label';
      label.textContent = meta ? meta.label : '留白';
      const room = document.createElement('span');
      room.className = 'emotion-day-room';
      room.textContent = meta ? `${meta.room.toUpperCase()} ROOM` : '—';
      item.append(weekday, icon, label, room);
      grid.appendChild(item);
    });

    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    if (total === 0) {
      insight.textContent = '你的七日星圖會在每天停下來看見自己後，慢慢亮起。';
    } else if (total === 1) {
      insight.textContent = '你已經留下第一個座標。看見感受，本身就是一種回來。';
    } else {
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      insight.textContent = `這七天，你最常為「${MOODS[dominant].label}」停下來。這不是評分，只是你曾經照顧自己的證明。`;
    }
  }

  function initDailyCheckin() {
    const buttons = document.querySelectorAll('.daily-mood');
    if (!buttons.length) return;
    buttons.forEach(button => button.addEventListener('click', () => {
      const mood = button.dataset.mood;
      writeEntry(mood);
      showRecommendation(mood);
    }));
    const today = readEntries().find(item => item.date === localDateKey());
    if (today) showRecommendation(today.mood);
    renderWeek();
    window.addEventListener('empath:checkin-updated', renderWeek);
    window.addEventListener('storage', event => { if (event.key === STORAGE_KEY) renderWeek(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDailyCheckin, { once: true });
  else initDailyCheckin();
})();

;

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
      '#m-count','#p-healed-count','#t-echo-count',
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

/* ===== INLINE BLOCK 3 ===== */
/* ===== EMPATH CONCEPTUAL EXPERIENCE · LEVEL 3 ===== */
(() => {
  'use strict';
  if (window.__EMPATH_CONCEPTUAL_LEVEL_3__) return;
  window.__EMPATH_CONCEPTUAL_LEVEL_3__ = true;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)');
  const ENTRY_KEY = 'empath_concept_entry_seen';

  function splitAtmosphericText(element,text,className,indexVariable,seedName) {
    element.setAttribute('aria-label',text);
    element.replaceChildren(...Array.from(text).map((character,index) => {
      const span = document.createElement('span');
      span.className = className;
      span.setAttribute('aria-hidden','true');
      span.style.setProperty(indexVariable,index);
      const drift = ((index * 17) % 25) - 12;
      if (seedName === 'entry') {
        span.style.setProperty('--entry-drift-x',drift + 'px');
        span.style.setProperty('--entry-drift-y',((index * 11) % 15) + 'px');
        span.style.setProperty('--entry-rotate',((((index * 7) % 9) - 4) * .7) + 'deg');
      } else {
        span.style.setProperty('--ritual-drift',(drift * .7) + 'px');
      }
      span.textContent = character === ' ' ? '\u00a0' : character;
      return span;
    }));
  }

  function setupConceptEntry() {
    if (document.documentElement.classList.contains('empath-room-page')) {
      document.documentElement.classList.remove('empath-entry-pending');
      return Promise.resolve(false);
    }
    let hasSeen = false;
    try { hasSeen = sessionStorage.getItem(ENTRY_KEY) === 'true'; } catch (error) {}
    if (hasSeen) {
      document.documentElement.classList.remove('empath-entry-pending');
      return Promise.resolve(false);
    }

    const overlay = document.createElement('div');
    overlay.className = 'empath-entry-overlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','EMPATH 進場');
    const question = document.createElement('div');
    question.className = 'empath-entry-question';
    splitAtmosphericText(question,'今晚，你帶著什麼走進來？','empath-entry-char','--entry-char-index','entry');
    const skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'empath-entry-skip';
    skip.textContent = '略過動畫';
    skip.setAttribute('aria-label','跳過進場動畫');
    skip.title = '略過進場動畫';
    overlay.append(question,skip);
    document.body.appendChild(overlay);
    window.setTimeout(() => skip.focus({ preventScroll: true }), 80);

    return new Promise(resolve => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        try { sessionStorage.setItem(ENTRY_KEY,'true'); } catch (error) {}
        overlay.classList.add('is-finished');
        document.documentElement.classList.remove('empath-entry-pending');
        document.body.classList.add('empath-world-open');
        window.setTimeout(() => overlay.remove(),850);
        resolve(true);
      };
      skip.addEventListener('click',finish,{once:true});
      requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('is-visible')));
      if (reduceMotion.matches) {
        window.setTimeout(finish,900);
      } else {
        window.setTimeout(() => overlay.classList.add('is-dispersing'),1200);
        window.setTimeout(finish,1850);
      }
    });
  }

  function setupLivingParticleField() {
    const hero = document.getElementById('hero');
    if (!hero || reduceMotion.matches) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'empath-living-field';
    canvas.setAttribute('aria-hidden','true');
    const opening = hero.querySelector('.hero-opening');
    hero.insertBefore(canvas,opening);
    const context = canvas.getContext('2d',{alpha:true});
    if (!context) return;

    const colors = ['201,168,76','232,230,225','168,184,200'];
    const pointer = {x:-9999,y:-9999,active:false};
    let width = 0,height = 0,dpr = 1,raf = 0,visible = true;
    let particles = [];

    const createParticle = index => {
      const x = Math.random() * width;
      const y = Math.random() * height;
      return {
        x,y,homeX:x,homeY:y,vx:0,vy:0,
        radius:.65 + Math.random() * 1.35,
        alpha:.16 + Math.random() * .44,
        color:colors[index % colors.length],
        phase:Math.random() * Math.PI * 2,
        drift:.0025 + Math.random() * .004
      };
    };
    const resize = () => {
      const rect = hero.getBoundingClientRect();
      const oldWidth = width || rect.width;
      const oldHeight = height || rect.height;
      width = Math.max(1,rect.width);
      height = Math.max(1,rect.height);
      dpr = Math.min(window.devicePixelRatio || 1,1.75);
      canvas.width = Math.round(width*dpr);
      canvas.height = Math.round(height*dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      context.setTransform(dpr,0,0,dpr,0,0);
      if (!particles.length) particles = Array.from({length:80},(_,index) => createParticle(index));
      else particles.forEach(particle => {
        particle.x = particle.x / oldWidth * width;
        particle.y = particle.y / oldHeight * height;
        particle.homeX = particle.homeX / oldWidth * width;
        particle.homeY = particle.homeY / oldHeight * height;
      });
    };
    const frame = time => {
      context.clearRect(0,0,width,height);
      particles.forEach(particle => {
        const floatX = Math.sin(time*particle.drift + particle.phase) * 7;
        const floatY = Math.cos(time*particle.drift*.72 + particle.phase) * 5;
        let targetX = particle.homeX + floatX;
        let targetY = particle.homeY + floatY;
        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx,dy) || 1;
          const radius = 118;
          if (distance < radius) {
            const force = Math.pow((radius-distance)/radius,2) * 1.35;
            particle.vx += dx/distance*force;
            particle.vy += dy/distance*force;
          }
        }
        particle.vx += (targetX-particle.x)*.0028;
        particle.vy += (targetY-particle.y)*.0028;
        particle.vx *= .94;
        particle.vy *= .94;
        particle.x += particle.vx;
        particle.y += particle.vy;
        context.beginPath();
        context.arc(particle.x,particle.y,particle.radius,0,Math.PI*2);
        context.fillStyle = 'rgba(' + particle.color + ',' + particle.alpha + ')';
        context.shadowColor = 'rgba(' + particle.color + ',.28)';
        context.shadowBlur = particle.radius > 1.35 ? 7 : 3;
        context.fill();
      });
      if (visible && !document.hidden && !document.body.classList.contains('hsp-mode') && document.body.classList.contains('empath-motion-idle')) {
        raf = requestAnimationFrame(frame);
      } else raf = 0;
    };
    const start = () => { if (!raf && visible && !document.hidden && !document.body.classList.contains('hsp-mode') && document.body.classList.contains('empath-motion-idle')) raf=requestAnimationFrame(frame); };
    hero.addEventListener('pointermove',event => {
      if (!finePointer.matches) return;
      const rect = hero.getBoundingClientRect();
      pointer.x = event.clientX-rect.left;
      pointer.y = event.clientY-rect.top;
      pointer.active = true;
    },{passive:true});
    hero.addEventListener('pointerleave',() => { pointer.active=false; },{passive:true});
    new ResizeObserver(resize).observe(hero);
    new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) start();
      else if (raf) { cancelAnimationFrame(raf); raf=0; }
    },{threshold:.01}).observe(hero);
    document.addEventListener('visibilitychange',start,{passive:true});
    document.addEventListener('empath:motion-idle',start,{passive:true});
    document.getElementById('hsp-btn')?.addEventListener('click',() => window.setTimeout(start,1550),{passive:true});
    resize();
    start();
  }

  const roomLines = {
    e:{zh:'這裡沒有評斷。',en:'There is no judgment here.',ja:'ここには、評価も批判もありません。'},
    m:{zh:'有些思念，只需要一片夜空。',en:'Some longing only needs a night sky.',ja:'ある想いには、夜空だけでいい。'},
    p:{zh:'破碎不是你的缺陷。',en:'Brokenness is not your flaw.',ja:'壊れたことは、あなたの欠点ではない。'},
    a:{zh:'你可以把重量留在這裡。',en:'You may leave the weight here.',ja:'その重さを、ここに置いていい。'},
    t:{zh:'溫暖會找到需要它的人。',en:'Warmth will find the one who needs it.',ja:'温もりは、必要とする人に届く。'},
    h:{zh:'你不必證明，這裡就是回家的地方。',en:'You need not prove anything. This is home.',ja:'証明しなくていい。ここが帰る場所です。'}
  };
  const roomColors = {e:'#7B8FA1',m:'#A8B8C8',p:'#C9A84C',a:'#7A9E9F',t:'#E8A87C',h:'#F2E8D9'};

  function setupRoomRituals() {
    const overlay = document.createElement('div');
    overlay.className = 'empath-room-ritual';
    overlay.setAttribute('aria-live','polite');
    overlay.setAttribute('aria-atomic','true');
    const line = document.createElement('div');
    line.className = 'empath-room-ritual-line';
    overlay.appendChild(line);
    document.body.appendChild(overlay);
    let active = false;
    let transitionId = 0;

    const enterRoom = (hash,roomKey) => {
      const target = document.querySelector(hash);
      if (!target) return;
      const currentTransition = ++transitionId;
      active = true;
      const lang = window.currentLang === 'ja' ? 'ja' : (window.currentLang === 'zh' || window.currentLang === 'zh-cn' ? 'zh' : 'en');
      const text = roomLines[roomKey]?.[lang] || roomLines[roomKey].en;
      overlay.style.setProperty('--ritual-color',roomColors[roomKey]);
      splitAtmosphericText(line,text,'empath-ritual-char','--ritual-index','ritual');
      overlay.className = 'empath-room-ritual is-active';
      document.body.classList.remove('empath-room-arrived');
      requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('is-speaking')));
      window.setTimeout(() => {
        if (currentTransition !== transitionId) return;
        const previous = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        target.scrollIntoView({block:'start',behavior:'auto'});
        history.replaceState(null,'',hash);
        document.documentElement.style.scrollBehavior = previous;
      },420);
      window.setTimeout(() => {
        if (currentTransition !== transitionId) return;
        overlay.classList.add('is-dispersing');
      },1500);
      window.setTimeout(() => {
        if (currentTransition !== transitionId) return;
        overlay.classList.add('is-releasing');
        document.body.classList.add('empath-room-arrived');
      },1900);
      window.setTimeout(() => {
        if (currentTransition !== transitionId) return;
        overlay.className = 'empath-room-ritual';
        active = false;
      },2600);
    };

    document.addEventListener('click',event => {
      const link = event.target.closest?.('a[href^="#room-"]');
      if (!link) return;
      const hash = link.getAttribute('href');
      const match = hash?.match(/^#room-([empath])$/);
      if (!match) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      window.closeMobileNav?.();
      enterRoom(hash,match[1]);
    },true);
  }

  async function initConceptualExperience() {
    await setupConceptEntry();
    setupLivingParticleField();
    setupRoomRituals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',initConceptualExperience,{once:true});
  } else {
    initConceptualExperience();
  }
})();

;

/* ===== INLINE BLOCK 4 ===== */
/* ===== EDITORIAL CONTENT RHYTHM · INTERACTIONS ===== */
(() => {
  'use strict';
  if (window.__EMPATH_EDITORIAL_RHYTHM__) return;
  window.__EMPATH_EDITORIAL_RHYTHM__ = true;

  const language = () => window.currentLang || 'zh';
  const copy = (zh,en,ja) => language() === 'ja' ? ja : (language().startsWith('en') ? en : zh);

  function setupKintsugiPagination() {
    const board = document.getElementById('p-board');
    if (!board || board.dataset.paginationReady) return;
    board.dataset.paginationReady = 'true';

    const PAGE_SIZE = 12;
    const STEP = 8;
    let visibleCount = PAGE_SIZE;

    const loading = document.createElement('p');
    loading.className = 'kintsugi-loading';
    loading.textContent = copy('正在接住這些碎片……','Receiving these fragments…','かけらを受け止めています…');

    const controls = document.createElement('div');
    controls.className = 'kintsugi-pagination';
    controls.hidden = true;

    const status = document.createElement('p');
    status.className = 'kintsugi-page-status';
    status.setAttribute('aria-live','polite');

    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'kintsugi-load-more';
    more.textContent = copy('再拾起一些碎片','REVEAL MORE FRAGMENTS','もう少しかけらを拾う');
    controls.append(more,status);
    board.before(loading);
    board.after(controls);

    function addExpandControl(card) {
      if (card.querySelector('.shard-expand')) return;
      const text = card.querySelector('.shard-text');
      if (!text) return;
      requestAnimationFrame(() => {
        if (text.scrollHeight <= text.clientHeight + 3 || card.querySelector('.shard-expand')) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'shard-expand';
        button.textContent = copy('展開文字','READ MORE','続きを読む');
        button.addEventListener('click',event => {
          event.preventDefault();
          event.stopPropagation();
          const expanded = card.classList.toggle('is-text-expanded');
          button.textContent = expanded
            ? copy('收起文字','CLOSE','閉じる')
            : copy('展開文字','READ MORE','続きを読む');
          button.setAttribute('aria-expanded',String(expanded));
        });
        text.after(button);
      });
    }

    function refresh() {
      if (!window.pShardDataReady || typeof window.renderPShards !== 'function') {
        loading.hidden = false;
        controls.hidden = true;
        return;
      }

      const total = Array.isArray(window.pShardRecords) ? window.pShardRecords.length : 0;
      loading.hidden = true;
      if (!total) {
        board.replaceChildren();
        controls.hidden = true;
        return;
      }

      visibleCount = Math.min(Math.max(PAGE_SIZE,visibleCount),total);
      const result = window.renderPShards(visibleCount);
      Array.from(board.querySelectorAll(':scope > .shard')).forEach(addExpandControl);
      const remaining = Math.max(0,total-result.rendered);
      controls.hidden = false;
      more.hidden = remaining === 0;
      more.textContent = copy(
        remaining ? '再拾起一些碎片' : '所有碎片都已被看見',
        remaining ? 'REVEAL MORE FRAGMENTS' : 'ALL FRAGMENTS SEEN',
        remaining ? 'もう少しかけらを拾う' : 'すべてのかけらを見ました'
      );
      status.textContent = copy(
        '已看見 ' + result.rendered + '／' + total + ' 片',
        result.rendered + ' of ' + total + ' fragments',
        result.rendered + '／' + total + ' 個'
      );
    }

    more.addEventListener('click',() => {
      const total = Array.isArray(window.pShardRecords) ? window.pShardRecords.length : 0;
      if (!total) return;
      visibleCount = Math.min(total,Math.max(PAGE_SIZE,visibleCount)+STEP);
      refresh();
    });

    document.addEventListener('empath:p-shards-updated',refresh);
    refresh();
  }

  function setupHomeEditorialCut() {
    const manifesto = document.querySelector('#hero .hero-manifesto');
    if (manifesto) manifesto.setAttribute('aria-hidden','true');
  }

  function setupHomeLayering() {
    const journey = document.querySelector('#room-h .h-journey');
    const summary = document.getElementById('g-summary');
    if (!journey || !summary || journey.dataset.layered) return;
    journey.dataset.layered = 'true';

    const secondary = document.createElement('div');
    secondary.className = 'h-secondary-summary';
    Array.from(summary.querySelectorAll('.g-card:not(.visitor-card)')).forEach(card => secondary.appendChild(card));

    const panel = document.createElement('div');
    panel.className = 'h-detail-panel';
    panel.id = 'h-detail-panel';
    panel.hidden = true;
    panel.appendChild(secondary);

    let next = summary.nextSibling;
    const remaining = [];
    while (next) {
      const current = next;
      next = next.nextSibling;
      if (current.nodeType === 1 && current.classList.contains('share-action-box')) continue;
      remaining.push(current);
    }
    remaining.forEach(node => panel.appendChild(node));

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'h-details-toggle';
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-controls',panel.id);
    toggle.textContent = copy('查看完整靈魂旅程','VIEW THE FULL JOURNEY','魂の旅をすべて見る');

    summary.after(toggle,panel);
    toggle.addEventListener('click',() => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      panel.classList.toggle('is-open',open);
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded',String(open));
      toggle.textContent = open
        ? copy('收起完整旅程','CLOSE THE JOURNEY','旅を閉じる')
        : copy('查看完整靈魂旅程','VIEW THE FULL JOURNEY','魂の旅をすべて見る');
      if (open) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          panel.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth',
            block: 'start'
          });
        }));
      }
    });
  }

  function initEditorialRhythm() {
    setupHomeEditorialCut();
    setupKintsugiPagination();
    setupHomeLayering();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',initEditorialRhythm,{once:true});
  } else {
    initEditorialRhythm();
  }
})();

;

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

/* ===== INLINE BLOCK 6 ===== */
window.toggleUtilityPanel = function(forceState) {
  const panel = document.getElementById('nav-controls');
  const trigger = document.getElementById('nav-utility-toggle');
  if (!panel || !trigger) return;
  const shouldOpen = typeof forceState === 'boolean' ? forceState : !panel.classList.contains('is-open');
  panel.classList.toggle('is-open', shouldOpen);
  trigger.setAttribute('aria-expanded', String(shouldOpen));
};
document.addEventListener('click', function(event) {
  const panel = document.getElementById('nav-controls');
  const trigger = document.getElementById('nav-utility-toggle');
  if (!panel || !trigger || !panel.classList.contains('is-open')) return;
  if (!panel.contains(event.target) && !trigger.contains(event.target)) window.toggleUtilityPanel(false);
});
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') window.toggleUtilityPanel(false);
});

;

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

/* ===== SOCIAL IN-APP BROWSER · PLATFORM-SPECIFIC UX ===== */
(() => {
  'use strict';
  const root = document.documentElement;
  const platform = root.dataset.inapp;
  if (!platform) return;

  const platformCopy = {
    line: {
      label: 'LINE VIEW',
      title: '你正在 LINE 裡閱讀',
      body: '已為 LINE 的上下工具列保留空間並放大觸控範圍。想看完整動畫，可從選單選擇「用預設瀏覽器開啟」。'
    },
    instagram: {
      label: 'INSTAGRAM VIEW',
      title: '你正在 Instagram 裡閱讀',
      body: '已降低模糊與動畫負載，避免底部工具列和返回手勢遮住內容。完整體驗可改用 Safari 或 Chrome。'
    },
    facebook: {
      label: 'FACEBOOK VIEW',
      title: '你正在 Facebook 裡閱讀',
      body: '已改用更穩定的文字縮放與直向版面，減少 Facebook 內建瀏覽器的左右裁切。也可從選單改用外部瀏覽器。'
    },
    x: {
      label: 'X VIEW',
      title: '你正在 X 裡閱讀',
      body: '已加大操作區並限制水平滑動，避免與 X 的返回手勢互相干擾。完整動畫可改用 Safari 或 Chrome。'
    }
  };
  const copy = platformCopy[platform];
  if (!copy) return;
  const storageKey = `empath_inapp_tip_${platform}_dismissed`;
  try { if (sessionStorage.getItem(storageKey) === 'true') return; } catch (error) {}

  const tip = document.createElement('aside');
  tip.className = `empath-inapp-tip empath-inapp-tip-${platform}`;
  tip.setAttribute('role','region');
  tip.setAttribute('aria-label',`${copy.title}提示`);
  tip.innerHTML = `
    <div class="empath-inapp-tip-copy">
      <span class="empath-inapp-tip-label">${copy.label}</span>
      <strong>${copy.title}</strong>
      <p>${copy.body}</p>
    </div>
    <div class="empath-inapp-tip-actions">
      <button type="button" class="empath-inapp-copy-link">複製網址</button>
      <button type="button" class="empath-inapp-dismiss">繼續瀏覽</button>
    </div>`;

  const dismiss = () => {
    tip.classList.remove('is-visible');
    document.body.classList.remove('empath-inapp-tip-open');
    try { sessionStorage.setItem(storageKey,'true'); } catch (error) {}
    window.setTimeout(() => tip.remove(),420);
  };
  tip.querySelector('.empath-inapp-dismiss')?.addEventListener('click',dismiss);
  tip.querySelector('.empath-inapp-copy-link')?.addEventListener('click',async event => {
    const button = event.currentTarget;
    const original = button.textContent;
    let copied = false;
    try {
      await navigator.clipboard.writeText(location.href);
      copied = true;
    } catch (error) {
      const helper = document.createElement('textarea');
      helper.value = location.href;
      helper.setAttribute('readonly','');
      helper.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(helper);
      helper.select();
      try { copied = document.execCommand('copy'); } catch (copyError) {}
      helper.remove();
    }
    button.textContent = copied ? '已複製 ✓' : '請長按網址列複製';
    window.setTimeout(() => { if (button.isConnected) button.textContent = original; },1800);
  });

  document.body.appendChild(tip);
  const reveal = () => {
    window.setTimeout(() => {
      if (!tip.isConnected) return;
      document.body.classList.add('empath-inapp-tip-open');
      tip.classList.add('is-visible');
    },650);
  };
  if (root.classList.contains('empath-entry-pending')) {
    const observer = new MutationObserver(() => {
      if (root.classList.contains('empath-entry-pending')) return;
      observer.disconnect();
      reveal();
    });
    observer.observe(root,{attributes:true,attributeFilter:['class']});
  } else {
    reveal();
  }
})();
