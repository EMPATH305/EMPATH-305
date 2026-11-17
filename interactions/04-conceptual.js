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

