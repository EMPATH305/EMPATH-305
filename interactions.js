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

  function setupRoomCurtain() {
    const curtain = document.createElement('div');
    curtain.className = 'lux-room-curtain';
    curtain.setAttribute('aria-hidden','true');
    document.body.appendChild(curtain);
    let transitioning = false;
    document.querySelectorAll('nav a[href^="#room-"]').forEach(link => {
      link.addEventListener('click', event => {
        const hash = link.getAttribute('href');
        const target = hash && document.querySelector(hash);
        if (!target || reducedMotion.matches || transitioning) return;
        event.preventDefault();
        transitioning = true;
        curtain.classList.remove('is-leaving');
        curtain.classList.add('is-entering');
        window.setTimeout(() => {
          const oldBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = 'auto';
          target.scrollIntoView({block:'start',behavior:'auto'});
          history.replaceState(null,'',hash);
          document.documentElement.style.scrollBehavior = oldBehavior;
          requestAnimationFrame(() => {
            curtain.classList.remove('is-entering');
            curtain.classList.add('is-leaving');
          });
          window.setTimeout(() => {
            curtain.classList.remove('is-leaving');
            transitioning = false;
          },320);
        },110);
      },true);
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
    setupRoomCurtain();
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
        window.setTimeout(() => overlay.classList.add('is-dispersing'),2850);
        window.setTimeout(finish,4100);
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

    const enterRoom = (hash,roomKey) => {
      if (active) return;
      const target = document.querySelector(hash);
      if (!target) return;
      active = true;
      const lang = window.currentLang === 'ja' ? 'ja' : (window.currentLang === 'zh' || window.currentLang === 'zh-cn' ? 'zh' : 'en');
      const text = roomLines[roomKey]?.[lang] || roomLines[roomKey].en;
      overlay.style.setProperty('--ritual-color',roomColors[roomKey]);
      splitAtmosphericText(line,text,'empath-ritual-char','--ritual-index','ritual');
      overlay.className = 'empath-room-ritual is-active';
      document.body.classList.remove('empath-room-arrived');
      requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('is-speaking')));
      window.setTimeout(() => {
        const previous = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        target.scrollIntoView({block:'start',behavior:'auto'});
        history.replaceState(null,'',hash);
        document.documentElement.style.scrollBehavior = previous;
      },420);
      window.setTimeout(() => overlay.classList.add('is-dispersing'),1500);
      window.setTimeout(() => {
        overlay.classList.add('is-releasing');
        document.body.classList.add('empath-room-arrived');
      },1900);
      window.setTimeout(() => {
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
    let refreshTimer = 0;

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
      const cards = Array.from(board.querySelectorAll(':scope > .shard'));
      if (!cards.length) {
        loading.hidden = false;
        controls.hidden = true;
        return;
      }
      loading.hidden = true;
      if (visibleCount < 1) visibleCount = Math.min(PAGE_SIZE,cards.length);
      visibleCount = Math.min(visibleCount,cards.length);
      cards.forEach((card,index) => {
        card.classList.toggle('is-pagination-hidden',index >= visibleCount);
        addExpandControl(card);
      });
      const remaining = Math.max(0,cards.length-visibleCount);
      controls.hidden = false;
      more.hidden = remaining === 0;
      more.textContent = copy(
        remaining ? '再拾起一些碎片' : '所有碎片都已被看見',
        remaining ? 'REVEAL MORE FRAGMENTS' : 'ALL FRAGMENTS SEEN',
        remaining ? 'もう少しかけらを拾う' : 'すべてのかけらを見ました'
      );
      status.textContent = copy(
        '已看見 ' + visibleCount + '／' + cards.length + ' 片',
        visibleCount + ' of ' + cards.length + ' fragments',
        visibleCount + '／' + cards.length + ' 個'
      );
    }

    more.addEventListener('click',() => {
      const total = board.querySelectorAll(':scope > .shard').length;
      if (!total) return;
      visibleCount = Math.min(total,Math.max(PAGE_SIZE,visibleCount)+STEP);
      refresh();
    });

    new MutationObserver(() => {
      clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(refresh,60);
    }).observe(board,{childList:true});
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
    const height = Math.round(window.visualViewport?.height || window.innerHeight || 0);
    if (height > 0) document.documentElement.style.setProperty('--empath-vh',`${height}px`);
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
